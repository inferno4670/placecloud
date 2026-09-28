import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.deps import get_current_user, get_staff_user, get_admin_user
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.models.institution import Department
from app.models.placement_record import PlacementRecord
from app.schemas.student import (
    StudentProfileCreate,
    StudentProfileUpdate,
    StudentProfileOut,
    DepartmentOut
)
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/departments/list", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.name).all()

@router.get("/", response_model=List[StudentProfileOut])
def list_students(
    search: Optional[str] = Query(None, description="Search by name, email, or enrollment no"),
    department_id: Optional[int] = None,
    min_cgpa: Optional[float] = None,
    max_cgpa: Optional[float] = None,
    max_backlogs: Optional[int] = None,
    placement_status: Optional[str] = None,
    graduation_year: Optional[int] = None,
    skills: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile).join(User, StudentProfile.user_id == User.id)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term),
                StudentProfile.enrollment_no.ilike(search_term)
            )
        )

    if department_id:
        query = query.filter(StudentProfile.department_id == department_id)
    if min_cgpa is not None:
        query = query.filter(StudentProfile.cgpa >= min_cgpa)
    if max_cgpa is not None:
        query = query.filter(StudentProfile.cgpa <= max_cgpa)
    if max_backlogs is not None:
        query = query.filter(StudentProfile.active_backlogs <= max_backlogs)
    if placement_status:
        query = query.filter(StudentProfile.placement_status == placement_status)
    if graduation_year:
        query = query.filter(StudentProfile.graduation_year == graduation_year)
    if skills:
        for skill in skills.split(","):
            skill_clean = skill.strip()
            if skill_clean:
                query = query.filter(StudentProfile.skills.ilike(f"%{skill_clean}%"))

    students = query.order_by(StudentProfile.cgpa.desc()).offset(offset).limit(limit).all()

    # Hydrate schemas
    results = []
    for s in students:
        s_out = StudentProfileOut(
            id=s.id,
            user_id=s.user_id,
            enrollment_no=s.enrollment_no,
            full_name=s.user.full_name,
            email=s.user.email,
            dob=s.dob,
            gender=s.gender,
            phone=s.phone,
            address=s.address,
            department_id=s.department_id,
            department_code=s.department.code if s.department else None,
            department_name=s.department.name if s.department else None,
            branch=s.branch,
            graduation_year=s.graduation_year,
            semester=s.semester,
            cgpa=s.cgpa,
            tenth_percentage=s.tenth_percentage,
            twelfth_percentage=s.twelfth_percentage,
            active_backlogs=s.active_backlogs,
            history_backlogs=s.history_backlogs,
            attendance_percentage=s.attendance_percentage,
            skills=s.skills,
            certifications=s.certifications,
            projects=s.projects,
            internship_experience=s.internship_experience,
            resume_url=s.resume_url,
            github_url=s.github_url,
            linkedin_url=s.linkedin_url,
            portfolio_url=s.portfolio_url,
            placement_status=s.placement_status,
            selected_company=s.selected_company,
            package_ctc=s.package_ctc,
            joining_status=s.joining_status,
            application_count=len(s.applications),
            offer_count=len(s.placement_records),
            created_at=s.created_at,
            updated_at=s.updated_at
        )
        results.append(s_out)

    return results

@router.get("/{id}", response_model=StudentProfileOut)
def get_student(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(StudentProfile).filter(StudentProfile.id == id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Access control: students can only view their own profile; staff can view any
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view another student's profile")

    return StudentProfileOut(
        id=student.id,
        user_id=student.user_id,
        enrollment_no=student.enrollment_no,
        full_name=student.user.full_name,
        email=student.user.email,
        dob=student.dob,
        gender=student.gender,
        phone=student.phone,
        address=student.address,
        department_id=student.department_id,
        department_code=student.department.code if student.department else None,
        department_name=student.department.name if student.department else None,
        branch=student.branch,
        graduation_year=student.graduation_year,
        semester=student.semester,
        cgpa=student.cgpa,
        tenth_percentage=student.tenth_percentage,
        twelfth_percentage=student.twelfth_percentage,
        active_backlogs=student.active_backlogs,
        history_backlogs=student.history_backlogs,
        attendance_percentage=student.attendance_percentage,
        skills=student.skills,
        certifications=student.certifications,
        projects=student.projects,
        internship_experience=student.internship_experience,
        resume_url=student.resume_url,
        github_url=student.github_url,
        linkedin_url=student.linkedin_url,
        portfolio_url=student.portfolio_url,
        placement_status=student.placement_status,
        selected_company=student.selected_company,
        package_ctc=student.package_ctc,
        joining_status=student.joining_status,
        application_count=len(student.applications),
        offer_count=len(student.placement_records),
        created_at=student.created_at,
        updated_at=student.updated_at
    )

@router.post("/", response_model=StudentProfileOut)
def create_student(
    payload: StudentProfileCreate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    # Check duplicate email
    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    # Check duplicate enrollment
    if db.query(StudentProfile).filter(StudentProfile.enrollment_no == payload.enrollment_no).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enrollment number already exists")

    user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        hashed_password=get_password_hash(payload.password or "Student@123"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.flush()

    student = StudentProfile(
        user_id=user.id,
        enrollment_no=payload.enrollment_no.strip(),
        dob=payload.dob,
        gender=payload.gender,
        phone=payload.phone,
        address=payload.address,
        department_id=payload.department_id,
        branch=payload.branch,
        graduation_year=payload.graduation_year,
        semester=payload.semester,
        cgpa=payload.cgpa,
        tenth_percentage=payload.tenth_percentage,
        twelfth_percentage=payload.twelfth_percentage,
        active_backlogs=payload.active_backlogs,
        history_backlogs=payload.history_backlogs,
        attendance_percentage=payload.attendance_percentage,
        skills=payload.skills,
        certifications=payload.certifications,
        projects=payload.projects,
        internship_experience=payload.internship_experience,
        resume_url=payload.resume_url,
        github_url=payload.github_url,
        linkedin_url=payload.linkedin_url,
        portfolio_url=payload.portfolio_url,
        placement_status="UNPLACED"
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    AuditService.log(
        db=db,
        action="CREATE_STUDENT",
        resource="student",
        resource_id=str(student.id),
        details=f"Created student {payload.full_name} ({payload.enrollment_no})",
        user=current_user
    )

    return get_student(student.id, current_user, db)

@router.patch("/{id}", response_model=StudentProfileOut)
def update_student(
    id: int,
    payload: StudentProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.id == id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    # Students can only update their own profile; staff can update any
    is_staff = current_user.role in [UserRole.SUPER_ADMIN, UserRole.TPO_ADMIN, UserRole.PLACEMENT_COORDINATOR]
    if not is_staff and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot edit another student's profile")

    # Update User fields if provided
    if payload.full_name:
        student.user.full_name = payload.full_name.strip()

    # Students cannot change placement_status or academic marks if not staff
    update_data = payload.dict(exclude_unset=True)
    if not is_staff:
        # Prevent students from arbitrarily altering their CGPA / backlogs
        forbidden_student_keys = ["cgpa", "tenth_percentage", "twelfth_percentage", "active_backlogs", "history_backlogs", "placement_status", "selected_company", "package_ctc"]
        for key in forbidden_student_keys:
            update_data.pop(key, None)

    for field, val in update_data.items():
        if hasattr(student, field) and field != "full_name":
            setattr(student, field, val)

    db.commit()
    db.refresh(student)

    AuditService.log(
        db=db,
        action="UPDATE_STUDENT",
        resource="student",
        resource_id=str(student.id),
        details=f"Updated student {student.user.full_name} ({student.enrollment_no})",
        user=current_user
    )

    return get_student(student.id, current_user, db)

@router.post("/{id}/resume")
def upload_resume(
    id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(StudentProfile).filter(StudentProfile.id == id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    is_staff = current_user.role in [UserRole.SUPER_ADMIN, UserRole.TPO_ADMIN, UserRole.PLACEMENT_COORDINATOR]
    if not is_staff and student.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF resumes are supported")

    resumes_dir = os.path.join(settings.UPLOAD_DIR, "resumes")
    os.makedirs(resumes_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"resume_{student.enrollment_no}_{uuid.uuid4().hex[:8]}{file_ext}"
    dest_path = os.path.join(resumes_dir, unique_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_url = f"/uploads/resumes/{unique_filename}"
    student.resume_url = relative_url
    db.commit()

    return {"message": "Resume uploaded successfully", "resume_url": relative_url}
