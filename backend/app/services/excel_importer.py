import io
import re
from typing import List, Dict, Any, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.institution import Department
from app.models.student import StudentProfile
from app.core.security import get_password_hash
from app.schemas.import_export import (
    ImportValidationError,
    ImportPreviewReport,
    ImportResultSummary
)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

class ExcelStudentImporter:
    REQUIRED_COLUMNS = ["enrollment_no", "full_name", "email", "department"]

    @staticmethod
    def _normalize_column_name(col: str) -> str:
        col = str(col).strip().lower()
        col = re.sub(r"[^a-z0-9]+", "_", col)
        col = col.strip("_")
        
        # Aliases
        mapping = {
            "roll_no": "enrollment_no",
            "roll_number": "enrollment_no",
            "enrollment_number": "enrollment_no",
            "student_id": "enrollment_no",
            "name": "full_name",
            "student_name": "full_name",
            "email_id": "email",
            "dept": "department",
            "branch": "department",
            "department_code": "department",
            "grad_year": "graduation_year",
            "batch": "graduation_year",
            "tenth_pct": "tenth_percentage",
            "10th_percentage": "tenth_percentage",
            "twelfth_pct": "twelfth_percentage",
            "12th_percentage": "twelfth_percentage",
            "backlogs": "active_backlogs",
            "current_backlogs": "active_backlogs",
            "history_of_backlogs": "history_backlogs",
            "contact": "phone",
            "mobile": "phone",
            "phone_number": "phone",
        }
        return mapping.get(col, col)

    @classmethod
    def parse_file(cls, file_bytes: bytes, filename: str) -> pd.DataFrame:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_bytes))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            raise ValueError("Unsupported file format. Please upload a .xlsx, .xls, or .csv file.")
        
        # Rename columns using normalized names
        df.columns = [cls._normalize_column_name(c) for c in df.columns]
        return df

    @classmethod
    def validate_dataframe(cls, df: pd.DataFrame, db: Session) -> ImportPreviewReport:
        errors: List[ImportValidationError] = []
        preview_records: List[Dict[str, Any]] = []

        # Check required columns
        missing_required = [col for col in cls.REQUIRED_COLUMNS if col not in df.columns]
        if missing_required:
            errors.append(
                ImportValidationError(
                    row=0,
                    field="columns",
                    message=f"Missing mandatory column(s): {', '.join(missing_required)}"
                )
            )
            return ImportPreviewReport(
                total_records=len(df),
                valid_records_count=0,
                invalid_records_count=len(df),
                duplicate_records_count=0,
                preview_records=[],
                errors=errors
            )

        # Pre-fetch existing emails, enrollments, and departments
        existing_users = {u.email.lower(): u.id for u in db.query(User.email, User.id).all()}
        existing_students = {s.enrollment_no.lower(): s.id for s in db.query(StudentProfile.enrollment_no, StudentProfile.id).all()}
        departments = {d.code.upper(): d.id for d in db.query(Department).all()}
        departments.update({d.name.lower(): d.id for d in db.query(Department).all()})

        seen_file_enrollments = set()
        seen_file_emails = set()
        duplicate_count = 0
        valid_count = 0
        invalid_count = 0

        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-indexed header + data row
            row_errors: List[str] = []
            row_data = {}

            # Enrollment No
            enrollment_raw = str(row.get("enrollment_no", "")).strip()
            if not enrollment_raw or enrollment_raw.lower() == "nan":
                row_errors.append("Enrollment number is required")
            else:
                if enrollment_raw.lower() in seen_file_enrollments:
                    duplicate_count += 1
                    row_errors.append(f"Duplicate enrollment '{enrollment_raw}' within uploaded file")
                else:
                    seen_file_enrollments.add(enrollment_raw.lower())
                row_data["enrollment_no"] = enrollment_raw

            # Full Name
            name_raw = str(row.get("full_name", "")).strip()
            if not name_raw or name_raw.lower() == "nan":
                row_errors.append("Student full name is required")
            else:
                row_data["full_name"] = name_raw

            # Email
            email_raw = str(row.get("email", "")).strip().lower()
            if not email_raw or email_raw.lower() == "nan":
                row_errors.append("Email address is required")
            elif not EMAIL_REGEX.match(email_raw):
                row_errors.append(f"Invalid email format: '{email_raw}'")
            else:
                if email_raw in seen_file_emails:
                    duplicate_count += 1
                    row_errors.append(f"Duplicate email '{email_raw}' within uploaded file")
                else:
                    seen_file_emails.add(email_raw)
                row_data["email"] = email_raw

            # Department
            dept_raw = str(row.get("department", "")).strip().upper()
            if not dept_raw or dept_raw.lower() == "nan":
                row_errors.append("Department is required")
            elif dept_raw not in departments and dept_raw.lower() not in departments:
                valid_dept_codes = [d.code for d in db.query(Department).all()]
                row_errors.append(f"Unknown department '{dept_raw}'. Available: {', '.join(valid_dept_codes)}")
            else:
                dept_id = departments.get(dept_raw) or departments.get(dept_raw.lower())
                row_data["department"] = dept_raw
                row_data["department_id"] = dept_id

            # CGPA
            cgpa_val = row.get("cgpa", 0.0)
            try:
                cgpa_float = float(cgpa_val) if pd.notna(cgpa_val) else 0.0
                if cgpa_float < 0.0 or cgpa_float > 10.0:
                    row_errors.append(f"CGPA must be between 0.0 and 10.0 (got {cgpa_float})")
                row_data["cgpa"] = cgpa_float
            except Exception:
                row_errors.append(f"Invalid CGPA value: '{cgpa_val}'")

            # 10th Percentage
            tenth_val = row.get("tenth_percentage", 0.0)
            try:
                tenth_float = float(tenth_val) if pd.notna(tenth_val) else 0.0
                if tenth_float < 0.0 or tenth_float > 100.0:
                    row_errors.append(f"10th percentage must be between 0 and 100 (got {tenth_float})")
                row_data["tenth_percentage"] = tenth_float
            except Exception:
                row_errors.append(f"Invalid 10th percentage: '{tenth_val}'")

            # 12th Percentage
            twelfth_val = row.get("twelfth_percentage", 0.0)
            try:
                twelfth_float = float(twelfth_val) if pd.notna(twelfth_val) else 0.0
                if twelfth_float < 0.0 or twelfth_float > 100.0:
                    row_errors.append(f"12th percentage must be between 0 and 100 (got {twelfth_float})")
                row_data["twelfth_percentage"] = twelfth_float
            except Exception:
                row_errors.append(f"Invalid 12th percentage: '{twelfth_val}'")

            # Active Backlogs
            backlog_val = row.get("active_backlogs", 0)
            try:
                backlog_int = int(backlog_val) if pd.notna(backlog_val) else 0
                if backlog_int < 0:
                    row_errors.append("Active backlogs cannot be negative")
                row_data["active_backlogs"] = backlog_int
            except Exception:
                row_errors.append(f"Invalid active backlogs count: '{backlog_val}'")

            # History Backlogs
            hist_val = row.get("history_backlogs", 0)
            try:
                hist_int = int(hist_val) if pd.notna(hist_val) else 0
                row_data["history_backlogs"] = max(0, hist_int)
            except Exception:
                row_data["history_backlogs"] = 0

            # Graduation Year
            grad_val = row.get("graduation_year", 2026)
            try:
                row_data["graduation_year"] = int(grad_val) if pd.notna(grad_val) else 2026
            except Exception:
                row_data["graduation_year"] = 2026

            # Semester
            sem_val = row.get("semester", 7)
            try:
                row_data["semester"] = int(sem_val) if pd.notna(sem_val) else 7
            except Exception:
                row_data["semester"] = 7

            # Optional string fields
            row_data["phone"] = str(row.get("phone", "")).strip() if pd.notna(row.get("phone")) else None
            row_data["gender"] = str(row.get("gender", "Male")).strip().capitalize() if pd.notna(row.get("gender")) else "Male"
            row_data["skills"] = str(row.get("skills", "")).strip() if pd.notna(row.get("skills")) else ""

            # Check if existing in DB
            is_in_db = (
                enrollment_raw.lower() in existing_students or
                email_raw in existing_users
            )
            row_data["exists_in_database"] = is_in_db

            if row_errors:
                invalid_count += 1
                for err in row_errors:
                    errors.append(
                        ImportValidationError(
                            row=row_num,
                            field="row_validation",
                            message=err,
                            value=enrollment_raw
                        )
                    )
            else:
                valid_count += 1

            row_data["is_valid"] = len(row_errors) == 0
            row_data["row_number"] = row_num
            preview_records.append(row_data)

        return ImportPreviewReport(
            total_records=len(df),
            valid_records_count=valid_count,
            invalid_records_count=invalid_count,
            duplicate_records_count=duplicate_count,
            preview_records=preview_records[:50],  # Return first 50 rows for preview
            errors=errors[:100]
        )

    @classmethod
    def commit_records(
        cls,
        records: List[Dict[str, Any]],
        db: Session,
        update_existing: bool = True
    ) -> ImportResultSummary:
        created_count = 0
        updated_count = 0
        failed_count = 0
        summary_errors: List[str] = []

        default_hashed_pwd = get_password_hash("Student@123")

        for record in records:
            if not record.get("is_valid", True):
                failed_count += 1
                continue

            try:
                email = str(record["email"]).strip().lower()
                enrollment = str(record["enrollment_no"]).strip()
                full_name = str(record["full_name"]).strip()
                department_id = record["department_id"]
                
                # Check user
                user = db.query(User).filter(User.email == email).first()
                if not user:
                    user = User(
                        email=email,
                        full_name=full_name,
                        hashed_password=default_hashed_pwd,
                        role=UserRole.STUDENT,
                        is_active=True
                    )
                    db.add(user)
                    db.flush()
                else:
                    user.full_name = full_name

                # Check student profile
                student = db.query(StudentProfile).filter(
                    (StudentProfile.user_id == user.id) |
                    (StudentProfile.enrollment_no == enrollment)
                ).first()

                if student:
                    if update_existing:
                        student.enrollment_no = enrollment
                        student.department_id = department_id
                        student.cgpa = float(record.get("cgpa", student.cgpa))
                        student.tenth_percentage = float(record.get("tenth_percentage", student.tenth_percentage))
                        student.twelfth_percentage = float(record.get("twelfth_percentage", student.twelfth_percentage))
                        student.active_backlogs = int(record.get("active_backlogs", student.active_backlogs))
                        student.history_backlogs = int(record.get("history_backlogs", student.history_backlogs))
                        student.graduation_year = int(record.get("graduation_year", student.graduation_year))
                        student.semester = int(record.get("semester", student.semester))
                        student.gender = str(record.get("gender", student.gender or "Male"))
                        if record.get("phone"):
                            student.phone = str(record.get("phone"))
                        if record.get("skills"):
                            student.skills = str(record.get("skills"))
                        updated_count += 1
                else:
                    student = StudentProfile(
                        user_id=user.id,
                        enrollment_no=enrollment,
                        department_id=department_id,
                        cgpa=float(record.get("cgpa", 0.0)),
                        tenth_percentage=float(record.get("tenth_percentage", 0.0)),
                        twelfth_percentage=float(record.get("twelfth_percentage", 0.0)),
                        active_backlogs=int(record.get("active_backlogs", 0)),
                        history_backlogs=int(record.get("history_backlogs", 0)),
                        graduation_year=int(record.get("graduation_year", 2026)),
                        semester=int(record.get("semester", 7)),
                        gender=str(record.get("gender", "Male")),
                        phone=str(record.get("phone", "")) if record.get("phone") else None,
                        skills=str(record.get("skills", "")) if record.get("skills") else None,
                        placement_status="UNPLACED"
                    )
                    db.add(student)
                    created_count += 1

                db.commit()
            except Exception as e:
                db.rollback()
                failed_count += 1
                summary_errors.append(f"Failed to save record '{record.get('enrollment_no')}': {str(e)}")

        return ImportResultSummary(
            total_records=len(records),
            successfully_imported=created_count,
            successfully_updated=updated_count,
            failed_records=failed_count,
            errors=summary_errors
        )
