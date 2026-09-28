from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.models.student import StudentProfile
from app.schemas.auth import Token, LoginRequest, PasswordChangeRequest
from app.schemas.user import UserOut
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated. Contact placement department."
        )

    # If student, find student_id
    student_id = None
    if user.role == UserRole.STUDENT and user.student_profile:
        student_id = user.student_profile.id

    access_token = create_access_token(subject=user.id, role=user.role)
    
    # Audit log
    AuditService.log(
        db=db,
        action="USER_LOGIN",
        resource="user",
        resource_id=str(user.id),
        details=f"User {user.email} logged in with role {user.role}",
        user=user
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        student_id=student_id
    )

@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
    }
    if current_user.role == UserRole.STUDENT and current_user.student_profile:
        profile = current_user.student_profile
        data["student_profile"] = {
            "id": profile.id,
            "enrollment_no": profile.enrollment_no,
            "department_id": profile.department_id,
            "department_code": profile.department.code if profile.department else None,
            "department_name": profile.department.name if profile.department else None,
            "graduation_year": profile.graduation_year,
            "semester": profile.semester,
            "cgpa": profile.cgpa,
            "tenth_percentage": profile.tenth_percentage,
            "twelfth_percentage": profile.twelfth_percentage,
            "active_backlogs": profile.active_backlogs,
            "history_backlogs": profile.history_backlogs,
            "skills": profile.skills,
            "resume_url": profile.resume_url,
            "placement_status": profile.placement_status,
            "selected_company": profile.selected_company,
            "package_ctc": profile.package_ctc,
        }
    return data

@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
