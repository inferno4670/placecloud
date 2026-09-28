from typing import List, Optional
from pydantic import BaseModel

class OverviewStats(BaseModel):
    total_students: int
    active_students: int
    placed_students: int
    unplaced_students: int
    placement_rate: float
    total_companies: int
    active_drives: int
    total_applications: int
    total_offers: int
    average_ctc: float
    highest_ctc: float

class DepartmentPlacementStat(BaseModel):
    department_code: str
    department_name: str
    total_students: int
    placed_students: int
    placement_rate: float
    average_ctc: float
    highest_ctc: float

class CompanyRecruitmentStat(BaseModel):
    company_id: int
    company_name: str
    total_drives: int
    total_applications: int
    shortlisted_count: int
    selected_count: int
    selection_rate: float
    average_ctc: float

class AcademicCorrelationStat(BaseModel):
    category: str  # e.g., "< 7.0 CGPA", "7.0 - 8.0 CGPA", "8.0 - 9.0 CGPA", "9.0+ CGPA"
    total_students: int
    placed_students: int
    placement_rate: float

class BacklogImpactStat(BaseModel):
    category: str  # "0 Backlogs", "1 Backlog", "2+ Backlogs"
    total_students: int
    placed_students: int
    placement_rate: float
