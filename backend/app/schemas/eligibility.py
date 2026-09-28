from typing import List, Optional
from pydantic import BaseModel

class StudentEligibilityDetail(BaseModel):
    student_id: int
    user_id: int
    enrollment_no: str
    student_name: str
    email: str
    department_code: str
    cgpa: float
    tenth_percentage: float
    twelfth_percentage: float
    active_backlogs: int
    history_backlogs: int
    graduation_year: int
    gender: Optional[str] = None
    is_eligible: bool
    status: str  # "ELIGIBLE" or "NOT_ELIGIBLE"
    reasons: List[str] = []
    has_applied: bool = False
    application_stage: Optional[str] = None

class DriveEligibilitySummary(BaseModel):
    drive_id: int
    drive_title: str
    company_name: str
    total_evaluated: int
    eligible_count: int
    ineligible_count: int
    applied_count: int
    results: List[StudentEligibilityDetail]
