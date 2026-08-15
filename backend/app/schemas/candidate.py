import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.event import EventStatus


class CredibilityChoiceCandidateResponse(BaseModel):
    id: uuid.UUID
    choice_text: str

    # STRICT SECURITY: Choice score is omitted by design to guarantee server-side secrecy
    model_config = ConfigDict(from_attributes=True)


class CredibilityQuestionCandidateResponse(BaseModel):
    id: uuid.UUID
    question_text: str
    order_index: int
    choices: List[CredibilityChoiceCandidateResponse]

    model_config = ConfigDict(from_attributes=True)


class EventOptionCandidateResponse(BaseModel):
    id: uuid.UUID
    option_text: str

    model_config = ConfigDict(from_attributes=True)


class CandidateEventSummaryResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    max_voters: int
    current_participants: int
    remaining_slots: int
    status: EventStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CandidateEventDetailResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str]
    max_voters: int
    current_participants: int
    remaining_slots: int
    status: EventStatus
    has_joined: bool
    options: List[EventOptionCandidateResponse]
    credibility_questions: List[CredibilityQuestionCandidateResponse]

    model_config = ConfigDict(from_attributes=True)


class ParticipantResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    candidate_id: uuid.UUID
    joined_at: datetime
    remaining_slots: int

    model_config = ConfigDict(from_attributes=True)


class AssessmentAnswerItem(BaseModel):
    question_id: uuid.UUID = Field(..., description="UUID of the credibility question")
    selected_choice_id: uuid.UUID = Field(..., description="UUID of the selected choice")


class VoteSubmitRequest(BaseModel):
    selected_option_id: uuid.UUID = Field(..., description="UUID of the chosen voting option")
    answers: List[AssessmentAnswerItem] = Field(..., description="Answers for all credibility questions")


class VoteResponse(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    candidate_id: uuid.UUID
    selected_option_id: uuid.UUID
    credibility_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MyVoteStatusResponse(BaseModel):
    has_voted: bool
    vote: Optional[VoteResponse] = None

    model_config = ConfigDict(from_attributes=True)
