from typing import Literal
from pydantic import BaseModel, Field
from app.schemas.tracker import TrackerInfo

PermissionSetting = Literal["allow", "block", "ask", "unknown"]

class NetworkRequest(BaseModel):
    domain: str
    request_count: int = Field(ge=0)

class CookieAnalysis(BaseModel):
    first_party_count: int | None = Field(default=None, ge=0)
    third_party_domain_count: int | None = Field(default=None, ge=0)
    secure_count: int | None = Field(default=None, ge=0)
    http_only_count: int | None = Field(default=None, ge=0)
    session_count: int | None = Field(default=None, ge=0)
    persistent_count: int | None = Field(default=None, ge=0)
    same_site_none_count: int | None = Field(default=None, ge=0)
    partitioned_count: int | None = Field(default=None, ge=0)
    examined_count: int | None = Field(default=None, ge=0)
    third_party_domains_checked: int = Field(default=0, ge=0)
    incomplete: bool = True

class PermissionAnalysis(BaseModel):
    location: PermissionSetting = "unknown"
    notifications: PermissionSetting = "unknown"
    camera: PermissionSetting = "unknown"
    microphone: PermissionSetting = "unknown"

class CookieSummary(BaseModel):
    total: int = Field(ge=0)
    third_party: int | None = Field(default=None, ge=0)
    analysis: CookieAnalysis | None = None

class ScanRequest(BaseModel):
    website: str
    requests: list[NetworkRequest]
    cookies: CookieSummary
    permission_count: int | None = Field(default=None, ge=0)
    permissions: PermissionAnalysis | None = None

class ScanResponse(BaseModel):
    website: str
    tracker_count: int
    third_party_requests: int
    cookie_count: int
    permission_count: int
    trackers: list[TrackerInfo]
    category_counts: dict[str, int]
    cookie_analysis: CookieAnalysis | None = None
    permissions: PermissionAnalysis | None = None

class ObservedDomain(BaseModel):
    domain: str
    request_count: int = Field(default=1, ge=0)
    resource_types: list[str] = Field(default_factory=list)
    cookie_count: int = Field(default=0, ge=0)
    max_cookie_lifetime_days: float | None = None
    is_third_party: bool = True