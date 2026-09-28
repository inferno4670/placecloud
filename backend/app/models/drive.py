from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PlacementDrive(Base):
    __tablename__ = "placement_drives"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    employment_type = Column(String(50), default="Full Time", nullable=False)  # Full Time, Internship, Full Time + Internship
    work_mode = Column(String(50), default="Onsite", nullable=False)  # Onsite, Hybrid, Remote
    job_location = Column(String(255), nullable=True)
    ctc_lpa = Column(Float, default=0.0, nullable=False)
    stipend_monthly = Column(Float, default=0.0, nullable=False)
    application_deadline = Column(DateTime, nullable=False, index=True)
    drive_date = Column(DateTime, nullable=True)
    vacancies = Column(Integer, default=1, nullable=False)
    selection_stages = Column(Text, default='["Online Assessment", "Technical Interview", "HR Interview", "Final Selection"]')
    status = Column(String(50), default="ACTIVE", nullable=False, index=True)  # UPCOMING, ACTIVE, IN_PROGRESS, COMPLETED, CANCELLED
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    company = relationship("Company", back_populates="drives")
    eligibility_criteria = relationship("EligibilityCriteria", back_populates="drive", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="drive", cascade="all, delete-orphan")
    placement_records = relationship("PlacementRecord", back_populates="drive")

class EligibilityCriteria(Base):
    __tablename__ = "eligibility_criteria"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    min_cgpa = Column(Float, default=0.0, nullable=False)
    min_tenth_percentage = Column(Float, default=0.0, nullable=False)
    min_twelfth_percentage = Column(Float, default=0.0, nullable=False)
    max_active_backlogs = Column(Integer, default=0, nullable=False)
    max_history_backlogs = Column(Integer, default=0, nullable=False)
    allowed_departments = Column(Text, default='[]')  # JSON list of department codes, e.g. ["CSE", "IT", "ECE"]
    allowed_graduation_years = Column(Text, default='[]')  # JSON list of years, e.g. [2026]
    required_skills = Column(Text, nullable=True)  # Comma-separated or JSON list
    gender_preference = Column(String(20), default="Any", nullable=False)  # Any, Male, Female
    min_attendance = Column(Float, default=0.0, nullable=False)

    drive = relationship("PlacementDrive", back_populates="eligibility_criteria")
