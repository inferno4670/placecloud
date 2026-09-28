from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.student import StudentProfile
from app.models.drive import PlacementDrive
from app.models.application import Application, ApplicationStatusHistory, ApplicationStatus
from app.models.notification import Notification
from app.services.eligibility_engine import EligibilityEngine

class ApplicationService:
    @staticmethod
    def apply_to_drive(db: Session, student_id: int, drive_id: int) -> Application:
        # 1. Fetch Student Profile
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )
        if not student.user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account is deactivated. Contact placement cell."
            )

        # 2. Fetch Drive
        drive = db.query(PlacementDrive).filter(PlacementDrive.id == drive_id).first()
        if not drive:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Placement drive not found"
            )
        if drive.status not in ["ACTIVE", "UPCOMING"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This placement drive is {drive.status.lower()} and no longer accepting applications"
            )

        # 3. Check Deadline
        # Ensure timezone comparison works properly
        current_time = datetime.now(timezone.utc)
        deadline = drive.application_deadline
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if current_time > deadline:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The application deadline for this placement drive has passed"
            )

        # 4. Check Duplicate Application
        existing_app = db.query(Application).filter(
            Application.student_id == student_id,
            Application.drive_id == drive_id
        ).first()
        if existing_app:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted an application for this drive"
            )

        # 5. Check Eligibility
        is_eligible, reasons = EligibilityEngine.evaluate(student, drive.eligibility_criteria)
        if not is_eligible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"You do not meet the eligibility requirements for this drive: {'; '.join(reasons)}"
            )

        # 6. Check Placement Policy (if student is already placed, allow only if CTC is higher)
        if student.placement_status == "PLACED" and student.package_ctc:
            if drive.ctc_lpa <= student.package_ctc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Placement policy: Already placed with package ₹{student.package_ctc} LPA. You can only apply to Dream offers exceeding this CTC."
                )

        # 7. Create Application atomically
        initial_stage = "Applied"
        app = Application(
            student_id=student_id,
            drive_id=drive_id,
            current_stage=initial_stage,
            status=ApplicationStatus.APPLIED,
            applied_at=datetime.now(timezone.utc)
        )
        db.add(app)
        
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Concurrent duplicate application detected"
            )

        # 8. Create Status History Record
        history_entry = ApplicationStatusHistory(
            application_id=app.id,
            stage=initial_stage,
            status=ApplicationStatus.APPLIED,
            notes="Application submitted by student",
            updated_by_id=student.user_id
        )
        db.add(history_entry)

        # 9. Create in-app notification
        notification = Notification(
            user_id=student.user_id,
            title="Application Submitted",
            message=f"Your application for {drive.title} at {drive.company.name} was successfully submitted.",
            type="APPLICATION",
            link=f"/student/applications"
        )
        db.add(notification)

        db.commit()
        db.refresh(app)
        return app

    @staticmethod
    def update_stage(
        db: Session,
        application_id: int,
        stage: str,
        status_val: str,
        notes: Optional[str],
        updater_id: int
    ) -> Application:
        app = db.query(Application).filter(Application.id == application_id).first()
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )

        app.current_stage = stage
        app.status = status_val
        app.updated_at = datetime.now(timezone.utc)

        history_entry = ApplicationStatusHistory(
            application_id=app.id,
            stage=stage,
            status=status_val,
            notes=notes or f"Application moved to {stage} ({status_val})",
            updated_by_id=updater_id
        )
        db.add(history_entry)

        # Notify student
        student = app.student
        notification = Notification(
            user_id=student.user_id,
            title=f"Application Update: {app.drive.company.name}",
            message=f"Your application status for {app.drive.title} is now: {stage} ({status_val}).",
            type="APPLICATION",
            link="/student/applications"
        )
        db.add(notification)

        db.commit()
        db.refresh(app)
        return app
