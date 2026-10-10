from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from backend.app.schemas.scan import ObservedDomain


RiskLevel = Literal["low", "medium", "high", "unknown"]
Source = Literal["known_list", "model", "heuristic"]

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

class TrackerClassification(BaseModel):
    name: str
    company: str | None = None
    category: str | None = None
    risk_level: RiskLevel | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    source: Source | None = None
    verified: bool = False
    explanation: str | None = None

class ClassifyRequest(BaseModel):
    domains: list[ObservedDomain]