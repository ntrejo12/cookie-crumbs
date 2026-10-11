from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.ai import TrackerClassification


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class ChatScanContext(BaseModel):
    website: str | None = None
    cookie_count: int = Field(default=0, ge=0)
    permissions: list[str] = Field(default_factory=list)
    trackers: list[TrackerClassification] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    current_scan: ChatScanContext | None = None


class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    generated_by: Literal["model", "fallback"] = "fallback"