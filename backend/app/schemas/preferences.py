from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserPreferenceUpdate(BaseModel):
    save_scan_history: bool | None = None
    enable_ai_analysis: bool | None = None
    allow_optional_tracking: bool | None = None


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    save_scan_history: bool
    enable_ai_analysis: bool
    allow_optional_tracking: bool
    created_at: datetime
    updated_at: datetime
