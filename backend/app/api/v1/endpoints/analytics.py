from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.analytics import (
    OverviewStats,
    DepartmentPlacementStat,
    CompanyRecruitmentStat
)
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/overview", response_model=OverviewStats)
def get_overview_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_overview(db)

@router.get("/departments", response_model=List[DepartmentPlacementStat])
def get_department_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_department_stats(db)

@router.get("/companies", response_model=List[CompanyRecruitmentStat])
def get_company_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_company_stats(db)

@router.get("/academic")
def get_academic_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return AnalyticsService.get_academic_correlation(db)
