import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_conductor
from app.db.session import get_db
from app.models.event import (
    CredibilityChoice,
    CredibilityQuestion,
    Event,
    EventOption,
    EventStatus,
    Result,
)
from app.models.user import User
from app.schemas.conductor import (
    EventCreateRequest,
    EventDetailResponse,
    EventStatusUpdateRequest,
    EventSummaryResponse,
    EventUpdateRequest,
)
from app.services.results_service import calculate_event_results

router = APIRouter()

# Valid lifecycle state transitions for conductor
VALID_LIFECYCLE_TRANSITIONS = {
    (EventStatus.DRAFT, EventStatus.PUBLISHED),
    (EventStatus.PUBLISHED, EventStatus.OPEN),
    (EventStatus.OPEN, EventStatus.CLOSED),
    (EventStatus.CLOSED, EventStatus.RESULT_PUBLISHED),
}


@router.post(
    "/events",
    response_model=EventDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new event atomically as DRAFT with options and credibility questions",
)
def create_event(
    req: EventCreateRequest,
    current_conductor: User = Depends(require_conductor),
    db: Session = Depends(get_db),
) -> EventDetailResponse:
    """Atomically creates an event in DRAFT status with its options and scored credibility questions."""
    try:
        # Create core event with DRAFT status
        event = Event(
            conductor_id=current_conductor.id,
            title=req.title,
            description=req.description,
            max_voters=req.max_voters,
            status=EventStatus.DRAFT,
        )
        db.add(event)
        db.flush()  # Generate event.id

        # Add voting options
        for opt_in in req.options:
            option = EventOption(
                event_id=event.id,
                option_text=opt_in.option_text,
            )
            event.options.append(option)

        # Add credibility questions and their scored choices
        for q_in in req.questions:
            question = CredibilityQuestion(
                event_id=event.id,
                question_text=q_in.question_text,
                order_index=q_in.order_index,
            )
            for c_in in q_in.choices:
                choice = CredibilityChoice(
                    choice_text=c_in.choice_text,
                    score=c_in.score,
                )
                question.choices.append(choice)
            event.credibility_questions.append(question)

        db.commit()
        db.refresh(event)
        return EventDetailResponse.model_validate(event)

    except Exception as e:
        db.rollback()
        raise e


@router.get(
    "/events",
    response_model=List[EventSummaryResponse],
    summary="List all events created by the authenticated conductor",
)
def list_conductor_events(
    current_conductor: User = Depends(require_conductor),
    db: Session = Depends(get_db),
) -> List[EventSummaryResponse]:
    """Retrieve all events belonging to the current conductor with summary counts."""
    events = (
        db.query(Event)
        .options(
            joinedload(Event.options),
            joinedload(Event.credibility_questions),
        )
        .filter(Event.conductor_id == current_conductor.id)
        .order_by(Event.created_at.desc())
        .all()
    )

    summaries = []
    for e in events:
        summaries.append(
            EventSummaryResponse(
                id=e.id,
                conductor_id=e.conductor_id,
                title=e.title,
                description=e.description,
                max_voters=e.max_voters,
                status=e.status,
                created_at=e.created_at,
                updated_at=e.updated_at,
                options_count=len(e.options),
                questions_count=len(e.credibility_questions),
            )
        )
    return summaries


@router.get(
    "/events/{event_id}",
    response_model=EventDetailResponse,
    summary="Get full details of a specific event owned by the conductor",
)
def get_conductor_event(
    event_id: uuid.UUID,
    current_conductor: User = Depends(require_conductor),
    db: Session = Depends(get_db),
) -> EventDetailResponse:
    """Retrieve full configuration and choices for an event owned by the conductor."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.options),
            joinedload(Event.credibility_questions).joinedload(CredibilityQuestion.choices),
        )
        .filter(
            Event.id == event_id,
            Event.conductor_id == current_conductor.id,
        )
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied.",
        )

    return EventDetailResponse.model_validate(event)


@router.patch(
    "/events/{event_id}",
    response_model=EventDetailResponse,
    summary="Update a draft event's configuration",
)
def update_draft_event(
    event_id: uuid.UUID,
    req: EventUpdateRequest,
    current_conductor: User = Depends(require_conductor),
    db: Session = Depends(get_db),
) -> EventDetailResponse:
    """Update title, description, max_voters, options, or questions while in DRAFT status."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.options),
            joinedload(Event.credibility_questions).joinedload(CredibilityQuestion.choices),
        )
        .filter(
            Event.id == event_id,
            Event.conductor_id == current_conductor.id,
        )
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied.",
        )

    if event.status != EventStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit event in '{event.status.value}' state. Only DRAFT events can be modified.",
        )

    try:
        if req.title is not None:
            event.title = req.title
        if req.description is not None:
            event.description = req.description
        if req.max_voters is not None:
            event.max_voters = req.max_voters

        # Replace options if provided
        if req.options is not None:
            event.options.clear()
            for opt_in in req.options:
                event.options.append(
                    EventOption(
                        event_id=event.id,
                        option_text=opt_in.option_text,
                    )
                )

        # Replace questions if provided
        if req.questions is not None:
            event.credibility_questions.clear()
            for q_in in req.questions:
                question = CredibilityQuestion(
                    event_id=event.id,
                    question_text=q_in.question_text,
                    order_index=q_in.order_index,
                )
                for c_in in q_in.choices:
                    question.choices.append(
                        CredibilityChoice(
                            choice_text=c_in.choice_text,
                            score=c_in.score,
                        )
                    )
                event.credibility_questions.append(question)

        db.commit()
        db.refresh(event)
        return EventDetailResponse.model_validate(event)

    except Exception as e:
        db.rollback()
        raise e


@router.patch(
    "/events/{event_id}/status",
    response_model=EventDetailResponse,
    summary="Update the lifecycle status of an event (DRAFT -> PUBLISHED -> OPEN -> CLOSED -> RESULT_PUBLISHED)",
)
def update_event_status(
    event_id: uuid.UUID,
    req: EventStatusUpdateRequest,
    current_conductor: User = Depends(require_conductor),
    db: Session = Depends(get_db),
) -> EventDetailResponse:
    """Transition event through its lifecycle: DRAFT -> PUBLISHED -> OPEN -> CLOSED -> RESULT_PUBLISHED."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.options),
            joinedload(Event.credibility_questions).joinedload(CredibilityQuestion.choices),
            joinedload(Event.votes),
        )
        .filter(
            Event.id == event_id,
            Event.conductor_id == current_conductor.id,
        )
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found or access denied.",
        )

    transition = (event.status, req.status)
    if transition not in VALID_LIFECYCLE_TRANSITIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Invalid status transition from '{event.status.value}' to '{req.status.value}'. "
                "Allowed transitions: DRAFT -> PUBLISHED, PUBLISHED -> OPEN, OPEN -> CLOSED, CLOSED -> RESULT_PUBLISHED."
            ),
        )

    try:
        # When publishing results, calculate and atomically persist RESULTS record
        if req.status == EventStatus.RESULT_PUBLISHED:
            calc_results = calculate_event_results(
                event_id=event.id,
                event_title=event.title,
                status_val=req.status.value,
                options=event.options,
                votes=event.votes,
            )

            winning_opt_id = None
            if calc_results.get("winning_option"):
                winning_opt_id = uuid.UUID(calc_results["winning_option"]["option_id"])

            # Check if result record exists (upsert)
            result_record = db.query(Result).filter(Result.event_id == event.id).first()
            if not result_record:
                result_record = Result(
                    event_id=event.id,
                    raw_results=calc_results["raw_results"],
                    weighted_results=calc_results["weighted_results"],
                    winning_option_id=winning_opt_id,
                    total_voters=calc_results["total_votes"],
                    total_weight=calc_results["total_weight"],
                )
                db.add(result_record)
            else:
                result_record.raw_results = calc_results["raw_results"]
                result_record.weighted_results = calc_results["weighted_results"]
                result_record.winning_option_id = winning_opt_id
                result_record.total_voters = calc_results["total_votes"]
                result_record.total_weight = calc_results["total_weight"]

        event.status = req.status
        db.commit()
        db.refresh(event)

        return EventDetailResponse.model_validate(event)

    except Exception as e:
        db.rollback()
        raise e
