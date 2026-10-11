from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.ai import RiskLevel

class WebsiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    domain: str
    name: str | None = None


class ScanHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    website_id: int
    user_id: str
    privacy_score: int | None = Field(default=None, ge=0, le=100)
    tracker_count: int = Field(ge=0)
    cookie_count: int = Field(ge=0)
    permission_count: int = Field(ge=0)
    request_count: int = Field(ge=0)
    third_party_request_count: int = Field(ge=0)
    summary: str | None = None
    created_at: datetime
    website: WebsiteResponse | None = None


# ---------- saving ----------

class SavedTracker(BaseModel):
    domain: str = Field(min_length=1, max_length=255)
    name: str | None = None
    category: str | None = Field(default=None, max_length=50)
    risk_level: RiskLevel | None = None
    is_third_party: bool = True


class ScanSaveRequest(BaseModel):
    domain: str = Field(min_length=1, max_length=255)
    website_name: str | None = None
    privacy_score: int | None = Field(default=None, ge=0, le=100)
    cookie_count: int = Field(default=0, ge=0)
    permission_count: int = Field(default=0, ge=0)
    request_count: int = Field(default=0, ge=0)
    third_party_request_count: int = Field(default=0, ge=0)
    summary: str | None = None
    trackers: list[SavedTracker] = Field(default_factory=list)


class ScanSaveResult(BaseModel):
    saved: bool
    reason: str | None = None
    scan: ScanHistoryResponse | None = None


class ScoreTrendPoint(BaseModel):
    day: str
    average_score: float | None
    scans: int


class TopTracker(BaseModel):
    domain: str | None
    category: str | None
    sites: int            # how many different sites it appeared on
    appearances: int


class SiteSummary(BaseModel):
    domain: str
    average_score: float | None
    scans: int


class InsightsResponse(BaseModel):
    days: int
    total_scans: int
    average_score: float | None
    score_trend: list[ScoreTrendPoint]
    top_trackers: list[TopTracker]
    category_counts: dict[str, int]
    lowest_scoring_sites: list[SiteSummary]