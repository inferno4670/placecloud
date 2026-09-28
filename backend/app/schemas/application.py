from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class ApplicationCreate(BaseModel):
    drive_id: int

class ApplicationStageUpdate(BaseModel):
    stage: str
    status: str  # APPLIED, UNDER_REVIEW, SHORTLISTED, IN_PROCESS, SELECTED, REJECTED, WITHDRAWN
    notes: Optional[str] = None

class ApplicationStatusHistoryOut(BaseModel):
    id: int
    stage: str
    status: str
    notes: Optional[str] = None
    updated_by_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationOut(BaseModel):
    id: int
    student_id: int
    drive_id: int
    current_stage: str
    status: str
    applied_at: datetime
    updated_at: datetime

    # Denormalized / helper fields
    drive_title: Optional[str] = None
    company_id: Optional[int] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    job_location: Optional[str] = None
    ctc_lpa: Optional[float] = None
    selection_stages: Optional[List[str]] = []
    
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    enrollment_no: Optional[str] = None
    department_code: Optional[str] = None
    cgpa: Optional[float] = None
    resume_url: Optional[str] = None
    
    history: List[ApplicationStatusHistoryOut] = []

    class Config:
        from_attributes = True
