import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.event import EventStatus


class CredibilityChoiceCreate(BaseModel):
    choice_text: str = Field(..., min_length=1, max_length=255, description="Choice text")
    score: float = Field(..., ge=0.0, description="Numerical credibility score (non-negative)")

    @field_validator("choice_text")
    @classmethod
    def validate_choice_text(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Choice text cannot be empty or whitespace only")
        return stripped


class CredibilityChoiceResponse(BaseModel):
    id: uuid.UUID
    choice_text: str
    score: float

    model_config = ConfigDict(from_attributes=True)


class CredibilityQuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=1, description="Question text")
    order_index: int = Field(..., ge=0, description="Deterministic ordering index")
    choices: List[CredibilityChoiceCreate] = Field(..., min_length=2, description="At least 2 choices per question")

    @field_validator("question_text")
    @classmethod
    def validate_question_text(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Question text cannot be empty or whitespace only")
        return stripped

    @field_validator("choices")
    @classmethod
    def validate_distinct_choices(cls, v: List[CredibilityChoiceCreate]) -> List[CredibilityChoiceCreate]:
        if len(v) < 2:
            raise ValueError("Each credibility question must have at least 2 choices")
        seen = set()
        for choice in v:
            normalized = choice.choice_text.lower()
            if normalized in seen:
                raise ValueError(f"Duplicate choice '{choice.choice_text}' found in the same question")
            seen.add(normalized)
        return v


class CredibilityQuestionResponse(BaseModel):
    id: uuid.UUID
    question_text: str
    order_index: int
    choices: List[CredibilityChoiceResponse]

    model_config = ConfigDict(from_attributes=True)


class EventOptionCreate(BaseModel):
    option_text: str = Field(..., min_length=1, max_length=255, description="Voting option text")

    @field_validator("option_text")
    @classmethod
    def validate_option_text(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Voting option text cannot be empty or whitespace only")
        return stripped


class EventOptionResponse(BaseModel):
    id: uuid.UUID
    option_text: str

    model_config = ConfigDict(from_attributes=True)


class EventCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=255, description="Event title")
    description: Optional[str] = Field(None, description="Optional event description")
    max_voters: int = Field(..., gt=0, description="Maximum number of voters (must be > 0)")
    options: List[EventOptionCreate] = Field(..., min_length=2, description="At least 2 voting options required")
    questions: List[CredibilityQuestionCreate] = Field(..., min_length=1, description="At least 1 credibility question required")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Event title cannot be empty or whitespace only")
        return stripped

    @field_validator("options")
    @classmethod
    def validate_distinct_options(cls, v: List[EventOptionCreate]) -> List[EventOptionCreate]:
        if len(v) < 2:
            raise ValueError("At least 2 voting options are required")
        seen = set()
        for opt in v:
            normalized = opt.option_text.lower()
            if normalized in seen:
                raise ValueError(f"Duplicate voting option '{opt.option_text}' detected")
            seen.add(normalized)
        return v

    @field_validator("questions")
    @classmethod
    def validate_distinct_question_orders(cls, v: List[CredibilityQuestionCreate]) -> List[CredibilityQuestionCreate]:
        if len(v) < 1:
            raise ValueError("At least 1 credibility question is required")
        orders = [q.order_index for q in v]
        if len(orders) != len(set(orders)):
            raise ValueError("Question order_index values must be unique")
        return v


class EventUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    max_voters: Optional[int] = Field(None, gt=0)
    options: Optional[List[EventOptionCreate]] = Field(None, min_length=2)
    questions: Optional[List[CredibilityQuestionCreate]] = Field(None, min_length=1)

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            stripped = v.strip()
            if not stripped:
                raise ValueError("Event title cannot be empty or whitespace only")
            return stripped
        return v

    @field_validator("options")
    @classmethod
    def validate_distinct_options(cls, v: Optional[List[EventOptionCreate]]) -> Optional[List[EventOptionCreate]]:
        if v is not None:
            if len(v) < 2:
                raise ValueError("At least 2 voting options are required")
            seen = set()
            for opt in v:
                normalized = opt.option_text.lower()
                if normalized in seen:
                    raise ValueError(f"Duplicate voting option '{opt.option_text}' detected")
                seen.add(normalized)
        return v

    @field_validator("questions")
    @classmethod
    def validate_distinct_question_orders(cls, v: Optional[List[CredibilityQuestionCreate]]) -> Optional[List[CredibilityQuestionCreate]]:
        if v is not None:
            if len(v) < 1:
                raise ValueError("At least 1 credibility question is required")
            orders = [q.order_index for q in v]
            if len(orders) != len(set(orders)):
                raise ValueError("Question order_index values must be unique")
        return v


class EventStatusUpdateRequest(BaseModel):
    status: EventStatus = Field(..., description="Target status: PUBLISHED, OPEN, or CLOSED")


class EventDetailResponse(BaseModel):
    id: uuid.UUID
    conductor_id: uuid.UUID
    title: str
    description: Optional[str]
    max_voters: int
    status: EventStatus
    created_at: datetime
    updated_at: datetime
    options: List[EventOptionResponse]
    credibility_questions: List[CredibilityQuestionResponse]

    model_config = ConfigDict(from_attributes=True)


class EventSummaryResponse(BaseModel):
    id: uuid.UUID
    conductor_id: uuid.UUID
    title: str
    description: Optional[str]
    max_voters: int
    status: EventStatus
    created_at: datetime
    updated_at: datetime
    options_count: int
    questions_count: int

    model_config = ConfigDict(from_attributes=True)
