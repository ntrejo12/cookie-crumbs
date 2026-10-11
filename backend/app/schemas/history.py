from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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