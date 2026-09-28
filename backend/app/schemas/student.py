from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int

    class Config:
        from_attributes = True

class StudentProfileBase(BaseModel):
    enrollment_no: str
    dob: Optional[str] = None
    gender: Optional[str] = "Male"
    phone: Optional[str] = None
    address: Optional[str] = None
    
    department_id: int
    branch: Optional[str] = None
    graduation_year: int
    semester: int = 7
    cgpa: float = Field(ge=0.0, le=10.0, default=0.0)
    tenth_percentage: float = Field(ge=0.0, le=100.0, default=0.0)
    twelfth_percentage: float = Field(ge=0.0, le=100.0, default=0.0)
    active_backlogs: int = Field(ge=0, default=0)
    history_backlogs: int = Field(ge=0, default=0)
    attendance_percentage: float = Field(ge=0.0, le=100.0, default=85.0)
    
    skills: Optional[str] = None
    certifications: Optional[str] = None
    projects: Optional[str] = None
    internship_experience: Optional[str] = None
    resume_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    
    placement_status: Optional[str] = "UNPLACED"
    selected_company: Optional[str] = None
    package_ctc: Optional[float] = None
    joining_status: Optional[str] = None

class StudentProfileCreate(StudentProfileBase):
    email: EmailStr
    full_name: str
    password: Optional[str] = "Student@123"

class StudentProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[int] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    semester: Optional[int] = None
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    tenth_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    twelfth_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    active_backlogs: Optional[int] = Field(None, ge=0)
    history_backlogs: Optional[int] = Field(None, ge=0)
    attendance_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    skills: Optional[str] = None
    certifications: Optional[str] = None
    projects: Optional[str] = None
    internship_experience: Optional[str] = None
    resume_url: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    placement_status: Optional[str] = None
    selected_company: Optional[str] = None
    package_ctc: Optional[float] = None
    joining_status: Optional[str] = None

class StudentProfileOut(StudentProfileBase):
    id: int
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    department_code: Optional[str] = None
    department_name: Optional[str] = None
    application_count: Optional[int] = 0
    offer_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
