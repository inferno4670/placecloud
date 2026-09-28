from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    students,
    companies,
    drives,
    eligibility,
    applications,
    import_export,
    placements,
    analytics,
    notifications,
    audit_logs
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(drives.router, prefix="/drives", tags=["Placement Drives"])
api_router.include_router(eligibility.router, prefix="", tags=["Eligibility Engine"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications"])
api_router.include_router(import_export.router, prefix="/students-import", tags=["Excel/CSV Import"])
api_router.include_router(placements.router, prefix="/placements", tags=["Placement Results"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics & Reports"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["Audit Logging"])
