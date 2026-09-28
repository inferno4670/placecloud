from datetime import datetime
from typing import Optional
from pydantic import BaseModel, HttpUrl

class CompanyBase(BaseModel):
    name: str
    industry: Optional[str] = "Software & IT"
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    hr_name: Optional[str] = None
    hr_email: Optional[str] = None
    hr_phone: Optional[str] = None
    logo_url: Optional[str] = None
    company_type: Optional[str] = "Product"
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    hr_name: Optional[str] = None
    hr_email: Optional[str] = None
    hr_phone: Optional[str] = None
    logo_url: Optional[str] = None
    company_type: Optional[str] = None
    is_active: Optional[bool] = None

class CompanyOut(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    active_drives_count: Optional[int] = 0

    class Config:
        from_attributes = True
