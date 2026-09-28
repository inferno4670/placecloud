from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.student import StudentProfile
from app.models.institution import Department
from app.models.company import Company
from app.models.drive import PlacementDrive
from app.models.application import Application, ApplicationStatus
from app.models.placement_record import PlacementRecord
from app.schemas.analytics import (
    OverviewStats,
    DepartmentPlacementStat,
    CompanyRecruitmentStat,
    AcademicCorrelationStat,
    BacklogImpactStat
)

class AnalyticsService:
    @staticmethod
    def get_overview(db: Session) -> OverviewStats:
        total_students = db.query(StudentProfile).count()
        placed_students = db.query(StudentProfile).filter(StudentProfile.placement_status == "PLACED").count()
        unplaced_students = total_students - placed_students
        placement_rate = round((placed_students / total_students * 100), 1) if total_students > 0 else 0.0

        total_companies = db.query(Company).filter(Company.is_active == True).count()
        active_drives = db.query(PlacementDrive).filter(PlacementDrive.status == "ACTIVE").count()
        total_applications = db.query(Application).count()
        total_offers = db.query(PlacementRecord).count()

        avg_ctc = db.query(func.avg(PlacementRecord.ctc_lpa)).scalar() or 0.0
        max_ctc = db.query(func.max(PlacementRecord.ctc_lpa)).scalar() or 0.0

        return OverviewStats(
            total_students=total_students,
            active_students=total_students,
            placed_students=placed_students,
            unplaced_students=unplaced_students,
            placement_rate=placement_rate,
            total_companies=total_companies,
            active_drives=active_drives,
            total_applications=total_applications,
            total_offers=total_offers,
            average_ctc=round(float(avg_ctc), 2),
            highest_ctc=round(float(max_ctc), 2)
        )

    @staticmethod
    def get_department_stats(db: Session) -> List[DepartmentPlacementStat]:
        departments = db.query(Department).all()
        results: List[DepartmentPlacementStat] = []

        for dept in departments:
            total = db.query(StudentProfile).filter(StudentProfile.department_id == dept.id).count()
            placed = db.query(StudentProfile).filter(
                StudentProfile.department_id == dept.id,
                StudentProfile.placement_status == "PLACED"
            ).count()
            rate = round((placed / total * 100), 1) if total > 0 else 0.0

            # CTC stats for this department
            ctc_query = db.query(
                func.avg(PlacementRecord.ctc_lpa),
                func.max(PlacementRecord.ctc_lpa)
            ).join(StudentProfile, PlacementRecord.student_id == StudentProfile.id)\
             .filter(StudentProfile.department_id == dept.id).first()

            avg_ctc = round(float(ctc_query[0]), 2) if ctc_query and ctc_query[0] is not None else 0.0
            highest_ctc = round(float(ctc_query[1]), 2) if ctc_query and ctc_query[1] is not None else 0.0

            results.append(
                DepartmentPlacementStat(
                    department_code=dept.code,
                    department_name=dept.name,
                    total_students=total,
                    placed_students=placed,
                    placement_rate=rate,
                    average_ctc=avg_ctc,
                    highest_ctc=highest_ctc
                )
            )

        return results

    @staticmethod
    def get_company_stats(db: Session) -> List[CompanyRecruitmentStat]:
        companies = db.query(Company).filter(Company.is_active == True).all()
        results: List[CompanyRecruitmentStat] = []

        for comp in companies:
            drives = db.query(PlacementDrive).filter(PlacementDrive.company_id == comp.id).all()
            drive_ids = [d.id for d in drives]
            total_drives = len(drives)

            if not drive_ids:
                results.append(
                    CompanyRecruitmentStat(
                        company_id=comp.id,
                        company_name=comp.name,
                        total_drives=0,
                        total_applications=0,
                        shortlisted_count=0,
                        selected_count=0,
                        selection_rate=0.0,
                        average_ctc=0.0
                    )
                )
                continue

            total_apps = db.query(Application).filter(Application.drive_id.in_(drive_ids)).count()
            shortlisted = db.query(Application).filter(
                Application.drive_id.in_(drive_ids),
                Application.status.in_([ApplicationStatus.SHORTLISTED, ApplicationStatus.IN_PROCESS, ApplicationStatus.SELECTED])
            ).count()
            selected = db.query(Application).filter(
                Application.drive_id.in_(drive_ids),
                Application.status == ApplicationStatus.SELECTED
            ).count()

            sel_rate = round((selected / total_apps * 100), 1) if total_apps > 0 else 0.0
            avg_ctc = db.query(func.avg(PlacementRecord.ctc_lpa)).filter(PlacementRecord.company_id == comp.id).scalar() or 0.0

            results.append(
                CompanyRecruitmentStat(
                    company_id=comp.id,
                    company_name=comp.name,
                    total_drives=total_drives,
                    total_applications=total_apps,
                    shortlisted_count=shortlisted,
                    selected_count=selected,
                    selection_rate=sel_rate,
                    average_ctc=round(float(avg_ctc), 2)
                )
            )

        return results

    @staticmethod
    def get_academic_correlation(db: Session) -> Dict[str, Any]:
        students = db.query(StudentProfile).all()

        # CGPA Brackets
        brackets = {
            "< 7.0 CGPA": {"total": 0, "placed": 0},
            "7.0 - 8.0 CGPA": {"total": 0, "placed": 0},
            "8.0 - 9.0 CGPA": {"total": 0, "placed": 0},
            "9.0+ CGPA": {"total": 0, "placed": 0},
        }

        # Backlog Brackets
        backlog_groups = {
            "0 Backlogs": {"total": 0, "placed": 0},
            "1 Backlog": {"total": 0, "placed": 0},
            "2+ Backlogs": {"total": 0, "placed": 0},
        }

        for s in students:
            # CGPA classification
            if s.cgpa < 7.0:
                key = "< 7.0 CGPA"
            elif s.cgpa < 8.0:
                key = "7.0 - 8.0 CGPA"
            elif s.cgpa < 9.0:
                key = "8.0 - 9.0 CGPA"
            else:
                key = "9.0+ CGPA"

            brackets[key]["total"] += 1
            if s.placement_status == "PLACED":
                brackets[key]["placed"] += 1

            # Backlog classification
            if s.active_backlogs == 0:
                b_key = "0 Backlogs"
            elif s.active_backlogs == 1:
                b_key = "1 Backlog"
            else:
                b_key = "2+ Backlogs"

            backlog_groups[b_key]["total"] += 1
            if s.placement_status == "PLACED":
                backlog_groups[b_key]["placed"] += 1

        cgpa_stats = [
            AcademicCorrelationStat(
                category=cat,
                total_students=data["total"],
                placed_students=data["placed"],
                placement_rate=round(data["placed"] / data["total"] * 100, 1) if data["total"] > 0 else 0.0
            )
            for cat, data in brackets.items()
        ]

        backlog_stats = [
            BacklogImpactStat(
                category=cat,
                total_students=data["total"],
                placed_students=data["placed"],
                placement_rate=round(data["placed"] / data["total"] * 100, 1) if data["total"] > 0 else 0.0
            )
            for cat, data in backlog_groups.items()
        ]

        return {
            "cgpa_correlation": cgpa_stats,
            "backlog_impact": backlog_stats
        }
