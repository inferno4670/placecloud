from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    industry = Column(String(100), nullable=True)  # IT Services, Product, Core, FinTech, etc.
    website = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    hr_name = Column(String(255), nullable=True)
    hr_email = Column(String(255), nullable=True)
    hr_phone = Column(String(50), nullable=True)
    logo_url = Column(String(500), nullable=True)
    company_type = Column(String(50), default="Product", nullable=False)  # Product, Service, MNC, Startup
    is_active = Column(Boolean, default=True, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    drives = relationship("PlacementDrive", back_populates="company", cascade="all, delete-orphan")
    placement_records = relationship("PlacementRecord", back_populates="company")
