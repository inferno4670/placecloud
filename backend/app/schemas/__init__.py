from app.schemas.auth import Token, TokenPayload, LoginRequest, PasswordChangeRequest
from app.schemas.user import UserBase, UserCreate, UserUpdate, UserOut
from app.schemas.student import (
    DepartmentBase, DepartmentCreate, DepartmentOut,
    StudentProfileBase, StudentProfileCreate, StudentProfileUpdate, StudentProfileOut
)
from app.schemas.company import CompanyBase, CompanyCreate, CompanyUpdate, CompanyOut
from app.schemas.drive import (
    EligibilityCriteriaBase, EligibilityCriteriaCreate, EligibilityCriteriaOut,
    PlacementDriveBase, PlacementDriveCreate, PlacementDriveUpdate, PlacementDriveOut
)
from app.schemas.eligibility import StudentEligibilityDetail, DriveEligibilitySummary
from app.schemas.application import ApplicationCreate, ApplicationStageUpdate, ApplicationStatusHistoryOut, ApplicationOut
from app.schemas.placement import PlacementRecordBase, PlacementRecordCreate, PlacementRecordUpdate, PlacementRecordOut
from app.schemas.analytics import OverviewStats, DepartmentPlacementStat, CompanyRecruitmentStat, AcademicCorrelationStat, BacklogImpactStat
from app.schemas.import_export import ImportValidationError, ImportPreviewReport, ImportCommitPayload, ImportResultSummary
from app.schemas.notification import NotificationBase, NotificationCreate, NotificationBroadcast, NotificationOut
from app.schemas.audit import AuditLogOut

__all__ = [
    "Token", "TokenPayload", "LoginRequest", "PasswordChangeRequest",
    "UserBase", "UserCreate", "UserUpdate", "UserOut",
    "DepartmentBase", "DepartmentCreate", "DepartmentOut",
    "StudentProfileBase", "StudentProfileCreate", "StudentProfileUpdate", "StudentProfileOut",
    "CompanyBase", "CompanyCreate", "CompanyUpdate", "CompanyOut",
    "EligibilityCriteriaBase", "EligibilityCriteriaCreate", "EligibilityCriteriaOut",
    "PlacementDriveBase", "PlacementDriveCreate", "PlacementDriveUpdate", "PlacementDriveOut",
    "StudentEligibilityDetail", "DriveEligibilitySummary",
    "ApplicationCreate", "ApplicationStageUpdate", "ApplicationStatusHistoryOut", "ApplicationOut",
    "PlacementRecordBase", "PlacementRecordCreate", "PlacementRecordUpdate", "PlacementRecordOut",
    "OverviewStats", "DepartmentPlacementStat", "CompanyRecruitmentStat", "AcademicCorrelationStat", "BacklogImpactStat",
    "ImportValidationError", "ImportPreviewReport", "ImportCommitPayload", "ImportResultSummary",
    "NotificationBase", "NotificationCreate", "NotificationBroadcast", "NotificationOut",
    "AuditLogOut"
]
