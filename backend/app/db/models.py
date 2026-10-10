from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


class Website(Base):
    __tablename__ = "websites"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)

    scans = relationship("Scan", back_populates="website")


class Scan(Base):
    __tablename__ = "scans"
    __table_args__ = (
        CheckConstraint(
            "privacy_score BETWEEN 0 AND 100", name="ck_scans_privacy_score"
        ),
        CheckConstraint("tracker_count >= 0", name="ck_scans_tracker_count"),
        CheckConstraint("cookie_count >= 0", name="ck_scans_cookie_count"),
        CheckConstraint("permission_count >= 0", name="ck_scans_permission_count"),
        CheckConstraint("request_count >= 0", name="ck_scans_request_count"),
        CheckConstraint(
            "third_party_request_count >= 0",
            name="ck_scans_third_party_request_count",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    website_id = Column(Integer, ForeignKey("websites.id"), nullable=False, index=True)
    user_id = Column(String(255), nullable=False, index=True)
    privacy_score = Column(Integer, nullable=True)
    tracker_count = Column(Integer, nullable=False, default=0)
    cookie_count = Column(Integer, nullable=False, default=0)
    permission_count = Column(Integer, nullable=False, default=0)
    request_count = Column(Integer, nullable=False, default=0)
    third_party_request_count = Column(Integer, nullable=False, default=0)
    summary = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    website = relationship("Website", back_populates="scans")
    scan_trackers = relationship(
        "ScanTracker", back_populates="scan", cascade="all, delete-orphan"
    )


class Tracker(Base):
    __tablename__ = "trackers"
    __table_args__ = (
        CheckConstraint(
            "risk_level IN ('low', 'medium', 'high', 'unknown')",
            name="ck_trackers_risk_level",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True, index=True)
    category = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    risk_level = Column(String(20), nullable=True)
    is_third_party = Column(Boolean, nullable=False, default=False)

    scan_trackers = relationship("ScanTracker", back_populates="tracker")


class ScanTracker(Base):
    __tablename__ = "scan_trackers"
    __table_args__ = (
        UniqueConstraint("scan_id", "tracker_id", name="uq_scan_trackers_scan_tracker"),
    )

    id = Column(Integer, primary_key=True, index=True)
    scan_id = Column(Integer, ForeignKey("scans.id"), nullable=False, index=True)
    tracker_id = Column(Integer, ForeignKey("trackers.id"), nullable=False, index=True)

    scan = relationship("Scan", back_populates="scan_trackers")
    tracker = relationship("Tracker", back_populates="scan_trackers")


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), unique=True, nullable=False, index=True)
    save_scan_history = Column(Boolean, nullable=False, default=False)
    enable_ai_analysis = Column(Boolean, nullable=False, default=False)
    allow_optional_tracking = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
