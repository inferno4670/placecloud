import io
import pandas as pd
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_staff_user
from app.models.user import User
from app.models.student import StudentProfile
from app.schemas.import_export import (
    ImportPreviewReport,
    ImportCommitPayload,
    ImportResultSummary
)
from app.services.excel_importer import ExcelStudentImporter
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/preview", response_model=ImportPreviewReport)
async def preview_student_import(
    file: UploadFile = File(...),
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload an Excel (.xlsx/.xls) or CSV (.csv) file."
        )

    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")

    try:
        df = ExcelStudentImporter.parse_file(file_bytes, file.filename.lower())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File parse error: {str(e)}")

    report = ExcelStudentImporter.validate_dataframe(df, db)
    return report

@router.post("/commit", response_model=ImportResultSummary)
def commit_student_import(
    payload: ImportCommitPayload,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    if not payload.records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No student records provided to commit")

    summary = ExcelStudentImporter.commit_records(
        records=payload.records,
        db=db,
        update_existing=payload.update_existing
    )

    AuditService.log(
        db=db,
        action="IMPORT_STUDENTS",
        resource="student_import",
        resource_id=None,
        details=f"Imported {summary.successfully_imported} new students, updated {summary.successfully_updated} students, {summary.failed_records} failed",
        user=current_user
    )

    return summary

@router.get("/template")
def download_student_template():
    sample_data = {
        "enrollment_no": ["2026CS101", "2026IT102", "2026EC103"],
        "full_name": ["Aarav Sharma", "Priya Patel", "Rohan Verma"],
        "email": ["aarav.sharma@example.edu", "priya.patel@example.edu", "rohan.verma@example.edu"],
        "department": ["CSE", "IT", "ECE"],
        "graduation_year": [2026, 2026, 2026],
        "semester": [7, 7, 7],
        "cgpa": [8.75, 7.92, 8.10],
        "tenth_percentage": [92.5, 88.0, 85.5],
        "twelfth_percentage": [89.0, 84.5, 82.0],
        "active_backlogs": [0, 0, 1],
        "history_backlogs": [0, 0, 1],
        "gender": ["Male", "Female", "Male"],
        "phone": ["9876543210", "9876543211", "9876543212"],
        "skills": ["Python, React, FastApi", "Java, Spring Boot, SQL", "C++, Embedded Systems, IoT"]
    }
    df = pd.DataFrame(sample_data)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=student_import_template.csv"
    return response

@router.get("/export")
def export_students_csv(
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    students = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id).all()
    rows = []
    for s in students:
        rows.append({
            "enrollment_no": s.enrollment_no,
            "full_name": s.user.full_name,
            "email": s.user.email,
            "department": s.department.code if s.department else "",
            "cgpa": s.cgpa,
            "10th_%": s.tenth_percentage,
            "12th_%": s.twelfth_percentage,
            "active_backlogs": s.active_backlogs,
            "history_backlogs": s.history_backlogs,
            "placement_status": s.placement_status,
            "selected_company": s.selected_company or "",
            "package_ctc": s.package_ctc or "",
            "phone": s.phone or "",
            "gender": s.gender or "",
            "skills": s.skills or ""
        })
    df = pd.DataFrame(rows)
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=placecloud_students_export.csv"
    return response
