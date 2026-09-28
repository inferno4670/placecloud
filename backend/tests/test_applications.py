from datetime import datetime, timezone, timedelta
import json
import pytest
from app.models.institution import Department
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.company import Company
from app.models.drive import PlacementDrive, EligibilityCriteria
from app.models.application import Application, ApplicationStatus
from app.services.application_service import ApplicationService
from app.core.security import get_password_hash
from fastapi import HTTPException

def test_application_lifecycle_and_duplicate_prevention(db):
    dept = Department(code="CSE", name="Computer Science")
    db.add(dept)
    db.flush()

    user = User(
        email="app_test_student@placecloud.edu",
        full_name="App Student",
        hashed_password=get_password_hash("Student@123"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.flush()

    student = StudentProfile(
        user_id=user.id,
        enrollment_no="TEST_APP_001",
        department_id=dept.id,
        graduation_year=2026,
        cgpa=8.5,
        tenth_percentage=85.0,
        twelfth_percentage=85.0,
        active_backlogs=0,
        history_backlogs=0,
        placement_status="UNPLACED"
    )
    db.add(student)

    comp = Company(name="Test Software Corp", industry="IT")
    db.add(comp)
    db.flush()

    drive = PlacementDrive(
        company_id=comp.id,
        title="Software Trainee",
        ctc_lpa=12.0,
        application_deadline=datetime.now(timezone.utc) + timedelta(days=5),
        status="ACTIVE",
        selection_stages=json.dumps(["Applied", "Interview", "Selected"])
    )
    db.add(drive)
    db.flush()

    crit = EligibilityCriteria(
        drive_id=drive.id,
        min_cgpa=7.0,
        max_active_backlogs=0,
        allowed_departments=json.dumps(["CSE"])
    )
    db.add(crit)
    db.commit()

    # 1. Apply to drive - should succeed
    app = ApplicationService.apply_to_drive(db, student_id=student.id, drive_id=drive.id)
    assert app.id is not None
    assert app.status == ApplicationStatus.APPLIED
    assert app.current_stage == "Applied"
    assert len(app.history) == 1

    # 2. Duplicate application attempt - must raise HTTPException 400
    with pytest.raises(HTTPException) as excinfo:
        ApplicationService.apply_to_drive(db, student_id=student.id, drive_id=drive.id)
    assert excinfo.value.status_code == 400
    assert "already submitted an application" in excinfo.value.detail

    # 3. Stage update
    updated_app = ApplicationService.update_stage(
        db=db,
        application_id=app.id,
        stage="Interview",
        status_val=ApplicationStatus.SHORTLISTED,
        notes="Cleared screening test",
        updater_id=user.id
    )
    assert updated_app.current_stage == "Interview"
    assert updated_app.status == ApplicationStatus.SHORTLISTED
    assert len(updated_app.history) == 2
