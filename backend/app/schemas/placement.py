from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel

class PlacementRecordBase(BaseModel):
    student_id: int
    drive_id: Optional[int] = None
    company_id: int
    job_title: str
    ctc_lpa: float
    offer_date: Optional[date] = None
    joining_date: Optional[date] = None
    offer_letter_url: Optional[str] = None
    status: Optional[str] = "OFFERED"  # OFFERED, ACCEPTED, DECLINED, JOINED

class PlacementRecordCreate(PlacementRecordBase):
    pass

class PlacementRecordUpdate(BaseModel):
    job_title: Optional[str] = None
    ctc_lpa: Optional[float] = None
    offer_date: Optional[date] = None
    joining_date: Optional[date] = None
    offer_letter_url: Optional[str] = None
    status: Optional[str] = None

class PlacementRecordOut(PlacementRecordBase):
    id: int
    student_name: Optional[str] = None
    enrollment_no: Optional[str] = None
    department_code: Optional[str] = None
    company_name: Optional[str] = None
    company_logo: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
