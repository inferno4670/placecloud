from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class StudentProfile(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    enrollment_no = Column(String(50), unique=True, index=True, nullable=False)
    
    # Personal Info
    dob = Column(String(20), nullable=True)  # YYYY-MM-DD
    gender = Column(String(20), nullable=True)  # Male, Female, Other
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    
    # Academic Info
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    branch = Column(String(100), nullable=True)
    graduation_year = Column(Integer, nullable=False, index=True)
    semester = Column(Integer, default=7, nullable=False)
    cgpa = Column(Float, default=0.0, nullable=False, index=True)
    tenth_percentage = Column(Float, default=0.0, nullable=False)
    twelfth_percentage = Column(Float, default=0.0, nullable=False)
    active_backlogs = Column(Integer, default=0, nullable=False)
    history_backlogs = Column(Integer, default=0, nullable=False)
    attendance_percentage = Column(Float, default=85.0, nullable=False)
    
    # Professional Info
    skills = Column(Text, nullable=True)  # Comma-separated or JSON list
    certifications = Column(Text, nullable=True)
    projects = Column(Text, nullable=True)
    internship_experience = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    
    # Placement Status
    placement_status = Column(String(50), default="UNPLACED", nullable=False, index=True)  # UNPLACED, PLACED, OPTED_OUT
    selected_company = Column(String(255), nullable=True)
    package_ctc = Column(Float, nullable=True)
    joining_status = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    placement_records = relationship("PlacementRecord", back_populates="student", cascade="all, delete-orphan")
