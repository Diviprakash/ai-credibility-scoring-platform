import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.event import Event, EventStatus
from app.models.user import User, UserRole
from app.schemas.results import EventResultsResponse
from app.services.results_service import calculate_event_results

router = APIRouter()


@router.get(
    "/{event_id}/results",
    response_model=EventResultsResponse,
    summary="Retrieve raw and credibility-weighted election results",
)
def get_event_results(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventResultsResponse:
    """Retrieve deterministic raw and credibility-weighted election outcomes based on lifecycle visibility rules."""
    event = (
        db.query(Event)
        .options(
            joinedload(Event.options),
            joinedload(Event.votes),
        )
        .filter(Event.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found.",
        )

    # Role-based visibility enforcement
    is_owner_conductor = (
        current_user.role == UserRole.CONDUCTOR
        and event.conductor_id == current_user.id
    )

    if is_owner_conductor:
        # Event owner can inspect results once CLOSED or RESULT_PUBLISHED
        if event.status not in (EventStatus.CLOSED, EventStatus.RESULT_PUBLISHED):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Results are not available while event is in '{event.status.value}' state. Event must be CLOSED or RESULT_PUBLISHED.",
            )
    else:
        # Candidates and unrelated users can only access results once RESULT_PUBLISHED
        if event.status != EventStatus.RESULT_PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Election results have not yet been published for this event.",
            )

    # Calculate deterministic results from stored votes and immutable credibility snapshots
    results_data = calculate_event_results(
        event_id=event.id,
        event_title=event.title,
        status_val=event.status.value,
        options=event.options,
        votes=event.votes,
    )

    return EventResultsResponse.model_validate(results_data)
