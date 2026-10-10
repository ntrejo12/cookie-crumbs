from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ScanCreate(BaseModel):
    domain: str = Field(min_length=1, max_length=255)
    privacy_score: int | None = Field(default=None, ge=0, le=100)
    tracker_count: int = Field(default=0, ge=0)
    cookie_count: int = Field(default=0, ge=0)
    permission_count: int = Field(default=0, ge=0)
    request_count: int = Field(default=0, ge=0)
    third_party_request_count: int = Field(default=0, ge=0)
    summary: str | None = None


class WebsiteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    domain: str
    name: str | None = None


class ScanResponse(BaseModel):
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

class ObservedDomain(BaseModel):
    domain: str
    request_count: int = Field(default=1, ge=0)
    resource_types: list[str] = Field(default_factory=list)
    cookie_count: int = Field(default=0, ge=0)
    max_cookie_lifetime_days: float | None = None
    is_third_party: bool = True