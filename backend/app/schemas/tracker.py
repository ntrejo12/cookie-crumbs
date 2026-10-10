from enum import Enum
from pydantic import BaseModel, Field

class TrackerCategory(str, Enum):
    ADVERTISING = "advertising"
    ANALYTICS = "analytics"
    SOCIAL = "social"
    FINGERPRINTING = "fingerprinting"
    OTHER = "other"

class TrackerInfo(BaseModel):
    domain: str
    category: TrackerCategory
    request_count: int = Field(ge=0)
    known_tracker: bool
    description: str | None = None
