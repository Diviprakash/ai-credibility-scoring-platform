import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.event import CredibilityChoice, CredibilityQuestion, Event
    from app.models.user import User


class EventParticipant(Base):
    __tablename__ = "event_participants"
    __table_args__ = (
        UniqueConstraint("event_id", "candidate_id", name="uq_event_participant"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    event: Mapped["Event"] = relationship(
        "Event",
        back_populates="participants",
    )
    candidate: Mapped["User"] = relationship(
        "User",
        back_populates="participations",
    )
    assessment_responses: Mapped[List["AssessmentResponse"]] = relationship(
        "AssessmentResponse",
        back_populates="participant",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class AssessmentResponse(Base):
    __tablename__ = "assessment_responses"
    __table_args__ = (
        UniqueConstraint(
            "participant_id",
            "question_id",
            name="uq_participant_question_response",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("event_participants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("credibility_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    selected_choice_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("credibility_choices.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    answered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    participant: Mapped["EventParticipant"] = relationship(
        "EventParticipant",
        back_populates="assessment_responses",
    )
    question: Mapped["CredibilityQuestion"] = relationship(
        "CredibilityQuestion",
        back_populates="responses",
    )
    selected_choice: Mapped["CredibilityChoice"] = relationship(
        "CredibilityChoice",
        back_populates="responses",
    )
