import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.event import Event, EventOption
    from app.models.user import User


class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("event_id", "candidate_id", name="uq_event_candidate_vote"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    # RESTRICT prevents deletion of an event if votes have already been cast
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # RESTRICT prevents deletion of a candidate if they have cast votes
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # RESTRICT prevents deletion of an option if votes have been cast for it
    selected_option_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("event_options.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Historical snapshot of the credibility score at the moment of voting
    credibility_at_vote: Mapped[float] = mapped_column(
        Numeric(10, 4),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    event: Mapped["Event"] = relationship(
        "Event",
        back_populates="votes",
    )
    candidate: Mapped["User"] = relationship(
        "User",
        back_populates="votes",
    )
    selected_option: Mapped["EventOption"] = relationship(
        "EventOption",
        back_populates="votes",
    )
