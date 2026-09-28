from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class PlacementRecord(Base):
    __tablename__ = "placement_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    drive_id = Column(Integer, ForeignKey("placement_drives.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    job_title = Column(String(255), nullable=False)
    ctc_lpa = Column(Float, nullable=False)
    offer_date = Column(Date, default=date.today, nullable=False)
    joining_date = Column(Date, nullable=True)
    offer_letter_url = Column(String(500), nullable=True)
    status = Column(String(50), default="OFFERED", nullable=False)  # OFFERED, ACCEPTED, DECLINED, JOINED
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    student = relationship("StudentProfile", back_populates="placement_records")
    drive = relationship("PlacementDrive", back_populates="placement_records")
    company = relationship("Company", back_populates="placement_records")
