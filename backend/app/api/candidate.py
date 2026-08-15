import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_candidate
from app.db.session import get_db
from app.models.event import (
    CredibilityQuestion,
    Event,
    EventOption,
    EventStatus,
)
from app.models.participant import AssessmentResponse, EventParticipant
from app.models.user import User
from app.models.vote import Vote
from app.schemas.candidate import (
    CandidateEventDetailResponse,
    CandidateEventSummaryResponse,
    MyVoteStatusResponse,
    ParticipantResponse,
    VoteResponse,
    VoteSubmitRequest,
)

router = APIRouter()


@router.get(
    "/events",
    response_model=List[CandidateEventSummaryResponse],
    summary="List all OPEN events available to candidates",
)
def list_available_events(
    current_candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> List[CandidateEventSummaryResponse]:
    """Retrieve only OPEN events with accurate voter counts and remaining slot calculations."""
    events = (
        db.query(Event)
        .options(joinedload(Event.participants))
        .filter(Event.status == EventStatus.OPEN)
        .order_by(Event.created_at.desc())
        .all()
    )

    summaries = []
    for e in events:
        count = len(e.participants)
        remaining = max(0, e.max_voters - count)
        summaries.append(
            CandidateEventSummaryResponse(
                id=e.id,
                title=e.title,
                description=e.description,
                max_voters=e.max_voters,
                current_participants=count,
                remaining_slots=remaining,
                status=e.status,
                created_at=e.created_at,
            )
        )
    return summaries


@router.get(
    "/events/{event_id}",
    response_model=CandidateEventDetailResponse,
    summary="Get OPEN event details with questions (scores completely omitted)",
)
def get_candidate_event_detail(
    event_id: uuid.UUID,
    current_candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> CandidateEventDetailResponse:
    """Retrieve full options and credibility questions for an OPEN event without choice scores."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.options),
            joinedload(Event.credibility_questions).joinedload(CredibilityQuestion.choices),
            joinedload(Event.participants),
        )
        .filter(
            Event.id == event_id,
            Event.status == EventStatus.OPEN,
        )
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or is not currently open.",
        )

    current_count = len(event.participants)
    remaining = max(0, event.max_voters - current_count)
    has_joined = any(p.candidate_id == current_candidate.id for p in event.participants)

    return CandidateEventDetailResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        max_voters=event.max_voters,
        current_participants=current_count,
        remaining_slots=remaining,
        status=event.status,
        has_joined=has_joined,
        options=event.options,
        credibility_questions=event.credibility_questions,
    )


@router.post(
    "/events/{event_id}/join",
    response_model=ParticipantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Atomically join an OPEN event with row-level lock concurrency protection",
)
def join_event(
    event_id: uuid.UUID,
    current_candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> ParticipantResponse:
    """Atomically join an event using SELECT ... FOR UPDATE to strictly enforce max_voters under concurrency."""
    try:
        # Acquire row-level lock on the event to serialize concurrent join attempts
        event = (
            db.query(Event)
            .filter(Event.id == event_id)
            .with_for_update()
            .first()
        )

        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found.",
            )

        if event.status != EventStatus.OPEN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot join event with status '{event.status.value}'. Only OPEN events can be joined.",
            )

        # Check if the candidate is already participating
        existing = (
            db.query(EventParticipant)
            .filter(
                EventParticipant.event_id == event.id,
                EventParticipant.candidate_id == current_candidate.id,
            )
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already joined this event.",
            )

        # Evaluate capacity inside the locked transaction
        current_count = (
            db.query(EventParticipant)
            .filter(EventParticipant.event_id == event.id)
            .count()
        )
        if current_count >= event.max_voters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event has reached its maximum voter capacity.",
            )

        # Create and persist participation record
        participant = EventParticipant(
            event_id=event.id,
            candidate_id=current_candidate.id,
        )
        db.add(participant)
        db.commit()
        db.refresh(participant)

        remaining_slots = max(0, event.max_voters - (current_count + 1))

        return ParticipantResponse(
            id=participant.id,
            event_id=participant.event_id,
            candidate_id=participant.candidate_id,
            joined_at=participant.joined_at,
            remaining_slots=remaining_slots,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise e


@router.post(
    "/events/{event_id}/vote",
    response_model=VoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit credibility MCQ answers and cast final vote with server-side score calculation",
)
def submit_vote(
    event_id: uuid.UUID,
    req: VoteSubmitRequest,
    current_candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> VoteResponse:
    """Validate answers, compute credibility score server-side, and record assessment responses and vote atomically."""
    # Verify event exists and is OPEN
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    if event.status != EventStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot vote in event with status '{event.status.value}'. Only OPEN events accept votes.",
        )

    # Verify candidate is an accepted participant
    participant = (
        db.query(EventParticipant)
        .filter(
            EventParticipant.event_id == event.id,
            EventParticipant.candidate_id == current_candidate.id,
        )
        .first()
    )
    if not participant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must join this event before voting.",
        )

    # Check if candidate has already voted
    existing_vote = (
        db.query(Vote)
        .filter(
            Vote.event_id == event.id,
            Vote.candidate_id == current_candidate.id,
        )
        .first()
    )
    if existing_vote:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already cast your vote for this event.",
        )

    # Validate selected voting option
    option = (
        db.query(EventOption)
        .filter(
            EventOption.id == req.selected_option_id,
            EventOption.event_id == event.id,
        )
        .first()
    )
    if not option:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected voting option does not belong to this event.",
        )

    # Load all credibility questions and choices for this event
    questions = (
        db.query(CredibilityQuestion)
        .options(joinedload(CredibilityQuestion.choices))
        .filter(CredibilityQuestion.event_id == event.id)
        .all()
    )
    q_map = {q.id: q for q in questions}

    # Verify all questions are answered without duplicates or extraneous questions
    answered_q_ids = set()
    for ans in req.answers:
        if ans.question_id not in q_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Question ID '{ans.question_id}' does not belong to this event.",
            )
        if ans.question_id in answered_q_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate answer provided for question ID '{ans.question_id}'.",
            )
        answered_q_ids.add(ans.question_id)

    if len(answered_q_ids) != len(q_map):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All {len(q_map)} credibility questions must be answered. Received {len(answered_q_ids)} answers.",
        )

    # Validate choices and calculate credibility score percentage
    total_max_score = 0.0
    total_earned_score = 0.0

    for ans in req.answers:
        q = q_map[ans.question_id]
        choice_map = {c.id: c for c in q.choices}
        if ans.selected_choice_id not in choice_map:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Selected choice ID '{ans.selected_choice_id}' does not belong to question ID '{ans.question_id}'.",
            )

        selected_choice = choice_map[ans.selected_choice_id]
        max_choice_score = max(float(c.score) for c in q.choices)
        total_max_score += max_choice_score
        total_earned_score += float(selected_choice.score)

    if total_max_score > 0:
        credibility_percentage = round((total_earned_score / total_max_score) * 100.0, 4)
    else:
        credibility_percentage = 100.0

    # Atomic transaction: Insert assessment responses and create final immutable vote record
    try:
        for ans in req.answers:
            response_record = AssessmentResponse(
                participant_id=participant.id,
                question_id=ans.question_id,
                selected_choice_id=ans.selected_choice_id,
            )
            db.add(response_record)

        vote = Vote(
            event_id=event.id,
            candidate_id=current_candidate.id,
            selected_option_id=req.selected_option_id,
            credibility_at_vote=credibility_percentage,
        )
        db.add(vote)
        db.commit()
        db.refresh(vote)

        return VoteResponse(
            id=vote.id,
            event_id=vote.event_id,
            candidate_id=vote.candidate_id,
            selected_option_id=vote.selected_option_id,
            credibility_score=float(vote.credibility_at_vote),
            created_at=vote.created_at,
        )

    except Exception as e:
        db.rollback()
        raise e


@router.get(
    "/events/{event_id}/my-vote",
    response_model=MyVoteStatusResponse,
    summary="Retrieve candidate's cast vote and credibility score for an event",
)
def get_my_vote(
    event_id: uuid.UUID,
    current_candidate: User = Depends(require_candidate),
    db: Session = Depends(get_db),
) -> MyVoteStatusResponse:
    """Retrieve the candidate's recorded vote and computed credibility percentage if cast."""
    vote = (
        db.query(Vote)
        .filter(
            Vote.event_id == event_id,
            Vote.candidate_id == current_candidate.id,
        )
        .first()
    )

    if not vote:
        return MyVoteStatusResponse(has_voted=False, vote=None)

    return MyVoteStatusResponse(
        has_voted=True,
        vote=VoteResponse(
            id=vote.id,
            event_id=vote.event_id,
            candidate_id=vote.candidate_id,
            selected_option_id=vote.selected_option_id,
            credibility_score=float(vote.credibility_at_vote),
            created_at=vote.created_at,
        ),
    )
