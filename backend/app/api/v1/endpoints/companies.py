from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, get_staff_user
from app.models.user import User
from app.models.company import Company
from app.models.drive import PlacementDrive
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/", response_model=List[CompanyOut])
def list_companies(
    is_active: Optional[bool] = None,
    industry: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Company)
    if is_active is not None:
        query = query.filter(Company.is_active == is_active)
    if industry:
        query = query.filter(Company.industry == industry)
    
    companies = query.order_by(Company.name).all()
    results = []
    for c in companies:
        active_count = db.query(PlacementDrive).filter(
            PlacementDrive.company_id == c.id,
            PlacementDrive.status == "ACTIVE"
        ).count()
        
        c_out = CompanyOut(
            id=c.id,
            name=c.name,
            industry=c.industry,
            website=c.website,
            description=c.description,
            location=c.location,
            hr_name=c.hr_name,
            hr_email=c.hr_email,
            hr_phone=c.hr_phone,
            logo_url=c.logo_url,
            company_type=c.company_type,
            is_active=c.is_active,
            created_at=c.created_at,
            updated_at=c.updated_at,
            active_drives_count=active_count
        )
        results.append(c_out)
    return results

@router.get("/{id}", response_model=CompanyOut)
def get_company(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    c = db.query(Company).filter(Company.id == id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    
    active_count = db.query(PlacementDrive).filter(
        PlacementDrive.company_id == c.id,
        PlacementDrive.status == "ACTIVE"
    ).count()

    return CompanyOut(
        id=c.id,
        name=c.name,
        industry=c.industry,
        website=c.website,
        description=c.description,
        location=c.location,
        hr_name=c.hr_name,
        hr_email=c.hr_email,
        hr_phone=c.hr_phone,
        logo_url=c.logo_url,
        company_type=c.company_type,
        is_active=c.is_active,
        created_at=c.created_at,
        updated_at=c.updated_at,
        active_drives_count=active_count
    )

@router.post("/", response_model=CompanyOut)
def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Company).filter(Company.name.ilike(payload.name.strip())).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company name already exists")

    company = Company(
        name=payload.name.strip(),
        industry=payload.industry,
        website=payload.website,
        description=payload.description,
        location=payload.location,
        hr_name=payload.hr_name,
        hr_email=payload.hr_email,
        hr_phone=payload.hr_phone,
        logo_url=payload.logo_url,
        company_type=payload.company_type,
        is_active=payload.is_active
    )
    db.add(company)
    db.commit()
    db.refresh(company)

    AuditService.log(
        db=db,
        action="CREATE_COMPANY",
        resource="company",
        resource_id=str(company.id),
        details=f"Created company {company.name}",
        user=current_user
    )

    return get_company(company.id, current_user, db)

@router.patch("/{id}", response_model=CompanyOut)
def update_company(
    id: int,
    payload: CompanyUpdate,
    current_user: User = Depends(get_staff_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")

    for field, val in payload.dict(exclude_unset=True).items():
        setattr(company, field, val)

    db.commit()
    db.refresh(company)

    AuditService.log(
        db=db,
        action="UPDATE_COMPANY",
        resource="company",
        resource_id=str(company.id),
        details=f"Updated company {company.name}",
        user=current_user
    )

    return get_company(company.id, current_user, db)
