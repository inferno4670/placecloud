from datetime import datetime, timezone, date
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.student import StudentProfile
from app.models.company import Company
from app.models.drive import PlacementDrive
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory
from app.models.placement_record import PlacementRecord
from app.models.notification import Notification
from app.models.audit_log import AuditLog

class PlacementService:
    @staticmethod
    def record_placement(
        db: Session,
        student_id: int,
        company_id: int,
        job_title: str,
        ctc_lpa: float,
        drive_id: Optional[int] = None,
        offer_date: Optional[date] = None,
        joining_date: Optional[date] = None,
        offer_letter_url: Optional[str] = None,
        record_status: str = "OFFERED",
        admin_user_id: Optional[int] = None,
        admin_email: Optional[str] = None
    ) -> PlacementRecord:
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )

        # 1. Update Student Profile transactionally
        student.placement_status = "PLACED"
        student.selected_company = company.name
        # If student already had a package, update only if higher or equal
        if not student.package_ctc or ctc_lpa >= student.package_ctc:
            student.package_ctc = ctc_lpa
        student.joining_status = record_status

        # 2. Create Placement Record
        placement = PlacementRecord(
            student_id=student.id,
            drive_id=drive_id,
            company_id=company.id,
            job_title=job_title,
            ctc_lpa=ctc_lpa,
            offer_date=offer_date or date.today(),
            joining_date=joining_date,
            offer_letter_url=offer_letter_url,
            status=record_status
        )
        db.add(placement)

        # 3. If tied to an active application, update application stage to Selected
        if drive_id:
            application = db.query(Application).filter(
                Application.student_id == student.id,
                Application.drive_id == drive_id
            ).first()
            if application:
                application.current_stage = "Selected"
                application.status = ApplicationStatus.SELECTED
                application.updated_at = datetime.now(timezone.utc)
                
                history_entry = ApplicationStatusHistory(
                    application_id=application.id,
                    stage="Final Selection",
                    status=ApplicationStatus.SELECTED,
                    notes=f"Offer received: {job_title} at ₹{ctc_lpa} LPA",
                    updated_by_id=admin_user_id
                )
                db.add(history_entry)

        # 4. Notify Student
        notification = Notification(
            user_id=student.user_id,
            title="Congratulations! Offer Received",
            message=f"You have been selected by {company.name} for the role of '{job_title}' with a CTC of ₹{ctc_lpa} LPA!",
            type="RESULT",
            link="/student/profile"
        )
        db.add(notification)

        # 5. Audit Log
        audit = AuditLog(
            user_id=admin_user_id,
            user_email=admin_email,
            action="RECORD_PLACEMENT",
            resource="placement_record",
            resource_id=str(student.id),
            details=f"Placement recorded for {student.user.full_name} ({student.enrollment_no}) at {company.name} (CTC: ₹{ctc_lpa} LPA)"
        )
        db.add(audit)

        db.commit()
        db.refresh(placement)
        return placement
