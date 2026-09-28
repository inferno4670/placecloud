import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, get_staff_user
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.drive import PlacementDrive, EligibilityCriteria
from app.models.application import Application
from app.schemas.drive import (
    PlacementDriveCreate,
    PlacementDriveUpdate,
    PlacementDriveOut,
    EligibilityCriteriaOut
)
from app.services.eligibility_engine import EligibilityEngine
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

router = APIRouter()

def _serialize_drive_out(d: PlacementDrive, student_profile=None) -> PlacementDriveOut:
    stages = []
    if d.selection_stages:
        try:
            stages = json.loads(d.selection_stages)
        except Exception:
            stages = [s.strip() for s in d.selection_stages.split(",") if s.strip()]

    crit_out = None
    if d.eligibility_criteria:
        c = d.eligibility_criteria
        allowed_depts = []
        if c.allowed_departments:
            try:
                allowed_depts = json.loads(c.allowed_departments)
            except Exception:
                allowed_depts = [dept.strip() for dept in c.allowed_departments.split(",") if dept.strip()]

        allowed_years = []
        if c.allowed_graduation_years:
            try:
                allowed_years = json.loads(c.allowed_graduation_years)
            except Exception:
                allowed_years = [int(y.strip()) for y in c.allowed_graduation_years.split(",") if y.strip().isdigit()]

        crit_out = EligibilityCriteriaOut(
            id=c.id,
            drive_id=c.drive_id,
            min_cgpa=c.min_cgpa,
            min_tenth_percentage=c.min_tenth_percentage,
            min_twelfth_percentage=c.min_twelfth_percentage,
            max_active_backlogs=c.max_active_backlogs,
            max_history_backlogs=c.max_history_backlogs,
            allowed_departments=allowed_depts,
            allowed_graduation_years=allowed_years,
            required_skills=c.required_skills,
            gender_preference=c.gender_preference,
            min_attendance=c.min_attendance
        )

    # Student-specific dynamic flags
    student_eligible = None
    student_ineligibility_reasons = []
    student_applied = False
    student_app_status = None

    if student_profile:
        # Check eligibility
        is_eligible, reasons = EligibilityEngine.evaluate(student_profile, d.eligibility_criteria)
        student_eligible = is_eligible
        student_ineligibility_reasons = reasons

        # Check if applied
        for app in d.applications:
            if app.student_id == student_profile.id:
                student_applied = True
                student_app_status = app.status
                break

    return PlacementDriveOut(
        id=d.id,
        company_id=d.company_id,
        company_name=d.company.name if d.company else None,
        company_logo=d.company.logo_url if d.company else None,
        title=d.title,
        description=d.description,
        employment_type=d.employment_type,
        work_mode=d.work_mode,
        job_location=d.job_location,
        ctc_lpa=d.ctc_lpa,
        stipend_monthly=d.stipend_monthly,
        application_deadline=d.application_deadline,
        drive_date=d.drive_date,
        vacancies=d.vacancies,
        selection_stages=stages,
        status=d.status,
        eligibility_criteria=crit_out,
        total_applications=len(d.applications),
        student_eligible=student_eligible,
        student_ineligibility_reasons=student_ineligibility_reasons,
        student_applied=student_applied,
        student_application_status=student_app_status,
        created_at=d.created_at,
        updated_at=d.updated_at
    )

@router.get("/", response_model=List[PlacementDriveOut])
def list_drives(
    status: Optional[str] = None,
    company_id: Optional[int] = None,
    eligible_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(PlacementDrive)
    if status:
        query = query.filter(PlacementDrive.status == status)
    if company_id:
        query = query.filter(PlacementDrive.company_id == company_id)

    drives = query.order_by(PlacementDrive.application_deadline.desc()).all()
    student_profile = current_user.student_profile if current_user.role == UserRole.STUDENT else None

    results = []
    for d in drives:
        serialized = _serialize_drive_out(d, student_profile)
        if eligible_only and student_profile and not serialized.student_eligible:
            continue
        results.append(serialized)

    return results

@router.get("/{id}", response_model=PlacementDriveOut)
def get_drive(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(PlacementDrive).filter(PlacementDrive.id == id).first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")
    
    student_profile = current_user.student_profile if current_user.role == UserRole.STUDENT else None
    return _serialize_drive_out(d, student_profile)

@router.post("/", response_model=PlacementDriveOut)
def create_drive(
    payload: PlacementDriveCreate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    stages_json = json.dumps(payload.selection_stages)
    drive = PlacementDrive(
        company_id=payload.company_id,
        title=payload.title.strip(),
        description=payload.description,
        employment_type=payload.employment_type,
        work_mode=payload.work_mode,
        job_location=payload.job_location,
        ctc_lpa=payload.ctc_lpa,
        stipend_monthly=payload.stipend_monthly,
        application_deadline=payload.application_deadline,
        drive_date=payload.drive_date,
        vacancies=payload.vacancies,
        selection_stages=stages_json,
        status=payload.status
    )
    db.add(drive)
    db.flush()

    if payload.eligibility_criteria:
        c = payload.eligibility_criteria
        criteria = EligibilityCriteria(
            drive_id=drive.id,
            min_cgpa=c.min_cgpa,
            min_tenth_percentage=c.min_tenth_percentage,
            min_twelfth_percentage=c.min_twelfth_percentage,
            max_active_backlogs=c.max_active_backlogs,
            max_history_backlogs=c.max_history_backlogs,
            allowed_departments=json.dumps(c.allowed_departments),
            allowed_graduation_years=json.dumps(c.allowed_graduation_years),
            required_skills=c.required_skills,
            gender_preference=c.gender_preference or "Any",
            min_attendance=c.min_attendance
        )
        db.add(criteria)

    db.commit()
    db.refresh(drive)

    # Broadcast notification to students
    NotificationService.broadcast(
        db=db,
        title=f"New Drive: {company.name}",
        message=f"{company.name} is hiring for '{drive.title}' (CTC: ₹{drive.ctc_lpa} LPA). Check your eligibility and apply!",
        type="DRIVE",
        link=f"/student/drives",
        role=UserRole.STUDENT
    )

    AuditService.log(
        db=db,
        action="CREATE_DRIVE",
        resource="placement_drive",
        resource_id=str(drive.id),
        details=f"Created drive '{drive.title}' for {company.name}",
        user=current_user
    )

    return _serialize_drive_out(drive)

@router.patch("/{id}", response_model=PlacementDriveOut)
def update_drive(
    id: int,
    payload: PlacementDriveUpdate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == id).first()
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")

    update_data = payload.dict(exclude_unset=True)
    
    if "selection_stages" in update_data and update_data["selection_stages"] is not None:
        drive.selection_stages = json.dumps(update_data.pop("selection_stages"))

    crit_payload = update_data.pop("eligibility_criteria", None)
    if crit_payload:
        criteria = drive.eligibility_criteria
        if not criteria:
            criteria = EligibilityCriteria(drive_id=drive.id)
            db.add(criteria)
        
        for k, v in crit_payload.items():
            if k in ["allowed_departments", "allowed_graduation_years"]:
                setattr(criteria, k, json.dumps(v))
            elif hasattr(criteria, k):
                setattr(criteria, k, v)

    for field, val in update_data.items():
        if hasattr(drive, field):
            setattr(drive, field, val)

    db.commit()
    db.refresh(drive)

    AuditService.log(
        db=db,
        action="UPDATE_DRIVE",
        resource="placement_drive",
        resource_id=str(drive.id),
        details=f"Updated drive '{drive.title}'",
        user=current_user
    )

    return _serialize_drive_out(drive)
