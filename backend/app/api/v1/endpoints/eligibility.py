from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, get_staff_user
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.drive import PlacementDrive
from app.models.application import Application
from app.schemas.eligibility import StudentEligibilityDetail, DriveEligibilitySummary
from app.services.eligibility_engine import EligibilityEngine

router = APIRouter()

@router.get("/drives/{drive_id}/evaluate", response_model=DriveEligibilitySummary)
def evaluate_drive_eligibility(
    drive_id: int,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")

    students = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)\
                 .filter(User.is_active == True).all()

    # Pre-fetch applications for this drive
    applications_by_student = {
        app.student_id: app
        for app in db.query(Application).filter(Application.drive_id == drive_id).all()
    }

    results: List[StudentEligibilityDetail] = []
    eligible_count = 0
    ineligible_count = 0
    applied_count = 0

    for s in students:
        is_eligible, reasons = EligibilityEngine.evaluate(s, drive.eligibility_criteria)
        app = applications_by_student.get(s.id)
        has_applied = app is not None
        if has_applied:
            applied_count += 1

        if is_eligible:
            eligible_count += 1
        else:
            ineligible_count += 1

        results.append(
            StudentEligibilityDetail(
                student_id=s.id,
                user_id=s.user_id,
                enrollment_no=s.enrollment_no,
                student_name=s.user.full_name,
                email=s.user.email,
                department_code=s.department.code if s.department else "N/A",
                cgpa=s.cgpa,
                tenth_percentage=s.tenth_percentage,
                twelfth_percentage=s.twelfth_percentage,
                active_backlogs=s.active_backlogs,
                history_backlogs=s.history_backlogs,
                graduation_year=s.graduation_year,
                gender=s.gender,
                is_eligible=is_eligible,
                status="ELIGIBLE" if is_eligible else "NOT_ELIGIBLE",
                reasons=reasons,
                has_applied=has_applied,
                application_stage=app.current_stage if app else None
            )
        )

    # Sort results so eligible students appear first, ordered by CGPA descending
    results.sort(key=lambda r: (r.is_eligible, r.cgpa), reverse=True)

    return DriveEligibilitySummary(
        drive_id=drive.id,
        drive_title=drive.title,
        company_name=drive.company.name if drive.company else "",
        total_evaluated=len(students),
        eligible_count=eligible_count,
        ineligible_count=ineligible_count,
        applied_count=applied_count,
        results=results
    )

@router.get("/drives/{drive_id}/student/{student_id}", response_model=StudentEligibilityDetail)
def evaluate_single_student(
    drive_id: int,
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
    if not drive:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement drive not found")

    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    is_eligible, reasons = EligibilityEngine.evaluate(student, drive.eligibility_criteria)
    app = db.query(Application).filter(
        Application.drive_id == drive_id,
        Application.student_id == student_id
    ).first()

    return StudentEligibilityDetail(
        student_id=student.id,
        user_id=student.user_id,
        enrollment_no=student.enrollment_no,
        student_name=student.user.full_name,
        email=student.user.email,
        department_code=student.department.code if student.department else "N/A",
        cgpa=student.cgpa,
        tenth_percentage=student.tenth_percentage,
        twelfth_percentage=student.twelfth_percentage,
        active_backlogs=student.active_backlogs,
        history_backlogs=student.history_backlogs,
        graduation_year=student.graduation_year,
        gender=student.gender,
        is_eligible=is_eligible,
        status="ELIGIBLE" if is_eligible else "NOT_ELIGIBLE",
        reasons=reasons,
        has_applied=app is not None,
        application_stage=app.current_stage if app else None
    )
