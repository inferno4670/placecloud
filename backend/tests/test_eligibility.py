import json
import pytest
from app.models.student import StudentProfile
from app.models.institution import Department
from app.models.drive import EligibilityCriteria
from app.services.eligibility_engine import EligibilityEngine

def test_student_meets_all_criteria():
    dept = Department(code="CSE", name="Computer Science")
    student = StudentProfile(
        enrollment_no="TEST001",
        cgpa=8.5,
        tenth_percentage=85.0,
        twelfth_percentage=82.0,
        active_backlogs=0,
        history_backlogs=0,
        graduation_year=2026,
        attendance_percentage=88.0,
        gender="Male",
        skills="Python, SQL, React"
    )
    student.department = dept

    criteria = EligibilityCriteria(
        min_cgpa=7.5,
        min_tenth_percentage=75.0,
        min_twelfth_percentage=75.0,
        max_active_backlogs=0,
        max_history_backlogs=0,
        allowed_departments=json.dumps(["CSE", "IT"]),
        allowed_graduation_years=json.dumps([2026]),
        required_skills="Python, SQL",
        gender_preference="Any",
        min_attendance=75.0
    )

    is_eligible, reasons = EligibilityEngine.evaluate(student, criteria)
    assert is_eligible is True
    assert len(reasons) == 0

def test_student_fails_cgpa_and_backlogs():
    dept = Department(code="CSE", name="Computer Science")
    student = StudentProfile(
        enrollment_no="TEST002",
        cgpa=6.8,  # Below 7.5
        tenth_percentage=80.0,
        twelfth_percentage=80.0,
        active_backlogs=1,  # Above 0
        history_backlogs=1,
        graduation_year=2026,
        attendance_percentage=85.0,
        gender="Male",
        skills="Python"
    )
    student.department = dept

    criteria = EligibilityCriteria(
        min_cgpa=7.5,
        min_tenth_percentage=70.0,
        min_twelfth_percentage=70.0,
        max_active_backlogs=0,
        max_history_backlogs=0,
        allowed_departments=json.dumps(["CSE"]),
        allowed_graduation_years=json.dumps([2026]),
        required_skills=None,
        gender_preference="Any",
        min_attendance=75.0
    )

    is_eligible, reasons = EligibilityEngine.evaluate(student, criteria)
    assert is_eligible is False
    assert len(reasons) >= 2
    assert any("CGPA is 6.80" in r for r in reasons)
    assert any("1 active backlog(s) detected" in r for r in reasons)

def test_student_department_restriction():
    dept = Department(code="ME", name="Mechanical Engineering")
    student = StudentProfile(
        enrollment_no="TEST003",
        cgpa=9.0,
        tenth_percentage=90.0,
        twelfth_percentage=90.0,
        active_backlogs=0,
        history_backlogs=0,
        graduation_year=2026,
        attendance_percentage=90.0,
        gender="Male",
        skills="Python, CAD"
    )
    student.department = dept

    criteria = EligibilityCriteria(
        min_cgpa=7.0,
        min_tenth_percentage=60.0,
        min_twelfth_percentage=60.0,
        max_active_backlogs=0,
        max_history_backlogs=0,
        allowed_departments=json.dumps(["CSE", "IT"]),  # ME is excluded
        allowed_graduation_years=json.dumps([2026])
    )

    is_eligible, reasons = EligibilityEngine.evaluate(student, criteria)
    assert is_eligible is False
    assert any("Department 'ME' is not in the permitted departments" in r for r in reasons)

def test_student_missing_required_skill():
    dept = Department(code="CSE", name="Computer Science")
    student = StudentProfile(
        enrollment_no="TEST004",
        cgpa=8.0,
        tenth_percentage=80.0,
        twelfth_percentage=80.0,
        active_backlogs=0,
        history_backlogs=0,
        graduation_year=2026,
        attendance_percentage=80.0,
        gender="Female",
        skills="HTML, CSS, JavaScript"  # Missing Docker
    )
    student.department = dept

    criteria = EligibilityCriteria(
        min_cgpa=7.0,
        min_tenth_percentage=60.0,
        min_twelfth_percentage=60.0,
        max_active_backlogs=0,
        max_history_backlogs=0,
        allowed_departments=json.dumps(["CSE"]),
        allowed_graduation_years=json.dumps([2026]),
        required_skills="Docker"
    )

    is_eligible, reasons = EligibilityEngine.evaluate(student, criteria)
    assert is_eligible is False
    assert any("Missing required skill(s): Docker" in r for r in reasons)
