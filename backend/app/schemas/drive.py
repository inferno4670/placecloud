from datetime import datetime
from typing import Optional, List, Union
from pydantic import BaseModel, Field

class EligibilityCriteriaBase(BaseModel):
    min_cgpa: float = Field(default=0.0, ge=0.0, le=10.0)
    min_tenth_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    min_twelfth_percentage: float = Field(default=0.0, ge=0.0, le=100.0)
    max_active_backlogs: int = Field(default=0, ge=0)
    max_history_backlogs: int = Field(default=0, ge=0)
    allowed_departments: List[str] = Field(default_factory=list)  # e.g., ["CSE", "IT", "ECE"]
    allowed_graduation_years: List[int] = Field(default_factory=list)  # e.g., [2026]
    required_skills: Optional[str] = None
    gender_preference: Optional[str] = "Any"
    min_attendance: float = Field(default=0.0, ge=0.0, le=100.0)

class EligibilityCriteriaCreate(EligibilityCriteriaBase):
    pass

class EligibilityCriteriaOut(EligibilityCriteriaBase):
    id: int
    drive_id: int

    class Config:
        from_attributes = True

class PlacementDriveBase(BaseModel):
    company_id: int
    title: str
    description: Optional[str] = None
    employment_type: str = "Full Time"
    work_mode: str = "Onsite"
    job_location: Optional[str] = None
    ctc_lpa: float = 0.0
    stipend_monthly: float = 0.0
    application_deadline: datetime
    drive_date: Optional[datetime] = None
    vacancies: int = 1
    selection_stages: List[str] = Field(default_factory=lambda: ["Online Assessment", "Technical Interview", "HR Interview", "Final Selection"])
    status: str = "ACTIVE"

class PlacementDriveCreate(PlacementDriveBase):
    eligibility_criteria: Optional[EligibilityCriteriaBase] = None

class PlacementDriveUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    employment_type: Optional[str] = None
    work_mode: Optional[str] = None
    job_location: Optional[str] = None
    ctc_lpa: Optional[float] = None
    stipend_monthly: Optional[float] = None
    application_deadline: Optional[datetime] = None
    drive_date: Optional[datetime] = None
    vacancies: Optional[int] = None
    selection_stages: Optional[List[str]] = None
    status: Optional[str] = None
    eligibility_criteria: Optional[EligibilityCriteriaBase] = None

class PlacementDriveOut(PlacementDriveBase):
    id: int
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    eligibility_criteria: Optional[EligibilityCriteriaOut] = None
    total_applications: Optional[int] = 0
    student_eligible: Optional[bool] = None
    student_ineligibility_reasons: Optional[List[str]] = None
    student_applied: Optional[bool] = None
    student_application_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
