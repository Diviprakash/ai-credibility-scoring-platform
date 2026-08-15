import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.models.event import EventStatus


class RawOptionResult(BaseModel):
    option_id: uuid.UUID
    option_text: str
    count: int
    percentage: float

    model_config = ConfigDict(from_attributes=True)


class WeightedOptionResult(BaseModel):
    option_id: uuid.UUID
    option_text: str
    weighted_sum: float
    percentage: float

    model_config = ConfigDict(from_attributes=True)


class WinnerOptionInfo(BaseModel):
    option_id: uuid.UUID
    option_text: str

    model_config = ConfigDict(from_attributes=True)


class EventResultsResponse(BaseModel):
    event_id: uuid.UUID
    event_title: str
    status: EventStatus
    total_votes: int
    total_weight: float
    raw_results: List[RawOptionResult]
    weighted_results: List[WeightedOptionResult]
    raw_winner: Optional[WinnerOptionInfo] = None
    winning_option: Optional[WinnerOptionInfo] = None
    decision_status: str
    calculated_at: datetime

    model_config = ConfigDict(from_attributes=True)
