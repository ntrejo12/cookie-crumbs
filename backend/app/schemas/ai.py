from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

RiskLevel = Literal["low", "medium", "high", "unknown"]
Source = Literal["known_list", "model", "heuristic"]


class ObservedDomain(BaseModel):
    domain: str
    request_count: int = Field(default=1, ge=0)
    resource_types: list[str] = Field(default_factory=list)
    cookie_count: int = Field(default=0, ge=0)
    max_cookie_lifetime_days: float | None = None
    is_third_party: bool = True


class TrackerClassification(BaseModel):
    name: str
    company: str | None = None
    category: str | None = None
    risk_level: RiskLevel | None = None
    confidence: float | None = Field(default=None, ge=0, le=1)
    source: Source | None = None
    verified: bool = False
    request_count: int = Field(default=0, ge=0)
    explanation: str | None = None


class ClassifyRequest(BaseModel):
    domains: list[ObservedDomain]


class AIAnalysisRequest(BaseModel):
    scan_id: int | None = Field(default=None, gt=0)
    website: str | None = None
    summary: str | None = None
    cookie_count: int = Field(default=0, ge=0)
    third_party_request_count: int = Field(default=0, ge=0)
    permissions: list[str] = Field(default_factory=list)
    trackers: list[TrackerClassification] = Field(default_factory=list)


class AIAnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    explanation: str
    risk_summary: str | None = None
    data_collected: list[str] = Field(default_factory=list)
    possible_uses: list[str] = Field(default_factory=list)
    protections: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)  # same as protections, kept for compatibility
    uncertainty_note: str | None = None
    tracker_classifications: list[TrackerClassification] = Field(default_factory=list)
    generated_by: Literal["model", "template"] = "template"

class ScanAnalysisRequest(BaseModel):
    website: str | None = None
    domains: list[ObservedDomain]
    cookie_count: int = Field(default=0, ge=0)
    permissions: list[str] = Field(default_factory=list)