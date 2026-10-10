from typing import Literal

from pydantic import BaseModel, ConfigDict


RiskLevel = Literal["low", "medium", "high", "unknown"]


class TrackerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    domain: str | None = None
    category: str | None = None
    description: str | None = None
    risk_level: RiskLevel | None = None
    is_third_party: bool


class ScanTrackerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: int
    tracker_id: int
    tracker: TrackerResponse | None = None
