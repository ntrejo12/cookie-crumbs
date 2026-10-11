from pydantic import BaseModel, Field
from app.schemas.tracker import TrackerInfo

class NetworkRequest(BaseModel):
    domain: str
    request_count: int = Field(ge=0)

class CookieSummary(BaseModel):
    total: int = Field(ge=0)
    third_party: int = Field(ge=0)

class ScanRequest(BaseModel):
    website: str
    requests: list[NetworkRequest]
    cookies: CookieSummary
    permission_count: int = Field(default=0, ge=0)

class ScanResponse(BaseModel):
    website: str
    tracker_count: int
    third_party_requests: int
    cookie_count: int
    permission_count: int
    trackers: list[TrackerInfo]
    category_counts: dict[str, int]

class ObservedDomain(BaseModel):
    domain: str
    request_count: int = Field(default=1, ge=0)
    resource_types: list[str] = Field(default_factory=list)
    cookie_count: int = Field(default=0, ge=0)
    max_cookie_lifetime_days: float | None = None
    is_third_party: bool = True