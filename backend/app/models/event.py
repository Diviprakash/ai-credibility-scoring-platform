import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.participant import AssessmentResponse, EventParticipant
    from app.models.user import User
    from app.models.vote import Vote


class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    RESULT_PUBLISHED = "RESULT_PUBLISHED"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    conductor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    max_voters: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status", native_enum=True),
        default=EventStatus.DRAFT,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    conductor: Mapped["User"] = relationship(
        "User",
        back_populates="created_events",
    )
    options: Mapped[List["EventOption"]] = relationship(
        "EventOption",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    credibility_questions: Mapped[List["CredibilityQuestion"]] = relationship(
        "CredibilityQuestion",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="CredibilityQuestion.order_index",
    )
    participants: Mapped[List["EventParticipant"]] = relationship(
        "EventParticipant",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    # Votes are historical records; do NOT cascade delete votes when an event is deleted.
    # The database RESTRICT constraint ensures events with votes cannot be deleted.
    votes: Mapped[List["Vote"]] = relationship(
        "Vote",
        back_populates="event",
    )
    result: Mapped[Optional["Result"]] = relationship(
        "Result",
        back_populates="event",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class EventOption(Base):
    __tablename__ = "event_options"

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
    option_text: Mapped[str] = mapped_column(String(255), nullable=False)

    # Relationships
    event: Mapped["Event"] = relationship(
        "Event",
        back_populates="options",
    )
    votes: Mapped[List["Vote"]] = relationship(
        "Vote",
        back_populates="selected_option",
    )


class CredibilityQuestion(Base):
    __tablename__ = "credibility_questions"

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
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    event: Mapped["Event"] = relationship(
        "Event",
        back_populates="credibility_questions",
    )
    choices: Mapped[List["CredibilityChoice"]] = relationship(
        "CredibilityChoice",
        back_populates="question",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    responses: Mapped[List["AssessmentResponse"]] = relationship(
        "AssessmentResponse",
        back_populates="question",
    )


class CredibilityChoice(Base):
    __tablename__ = "credibility_choices"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("credibility_questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    choice_text: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)

    # Relationships
    question: Mapped["CredibilityQuestion"] = relationship(
        "CredibilityQuestion",
        back_populates="choices",
    )
    responses: Mapped[List["AssessmentResponse"]] = relationship(
        "AssessmentResponse",
        back_populates="selected_choice",
    )


class Result(Base):
    __tablename__ = "results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    raw_results: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    weighted_results: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        server_default=text("'{}'::jsonb"),
    )
    winning_option_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("event_options.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    total_voters: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_weight: Mapped[float] = mapped_column(
        Numeric(12, 4),
        nullable=False,
        default=0.0,
    )
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    event: Mapped["Event"] = relationship(
        "Event",
        back_populates="result",
    )
    winning_option: Mapped[Optional["EventOption"]] = relationship("EventOption")
