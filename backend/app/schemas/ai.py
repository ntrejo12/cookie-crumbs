from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


RiskLevel = Literal["low", "medium", "high", "unknown"]


class TrackerClassification(BaseModel):
    name: str
    category: str | None = None
    risk_level: RiskLevel | None = None
    explanation: str | None = None


class AIAnalysisRequest(BaseModel):
    scan_id: int | None = Field(default=None, gt=0)
    summary: str | None = None
    trackers: list[TrackerClassification] = Field(default_factory=list)


class AIAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    explanation: str
    risk_summary: str | None = None
    recommendations: list[str] = Field(default_factory=list)
    tracker_classifications: list[TrackerClassification] = Field(default_factory=list)
