import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base

if TYPE_CHECKING:
    from app.models.event import Event
    from app.models.participant import EventParticipant
    from app.models.vote import Vote


class UserRole(str, enum.Enum):
    CONDUCTOR = "CONDUCTOR"
    CANDIDATE = "CANDIDATE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    created_events: Mapped[List["Event"]] = relationship(
        "Event",
        back_populates="conductor",
    )
    participations: Mapped[List["EventParticipant"]] = relationship(
        "EventParticipant",
        back_populates="candidate",
    )
    votes: Mapped[List["Vote"]] = relationship(
        "Vote",
        back_populates="candidate",
    )
