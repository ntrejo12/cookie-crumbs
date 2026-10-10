from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.scan import WebsiteResponse


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
