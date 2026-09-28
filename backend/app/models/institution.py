from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)  # e.g., CSE, IT, ECE, ME, CE
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    students = relationship("StudentProfile", back_populates="department")
