import json
from typing import List, Tuple, Optional
from app.models.student import StudentProfile
from app.models.drive import EligibilityCriteria

class EligibilityEngine:
    @staticmethod
    def evaluate(student: StudentProfile, criteria: Optional[EligibilityCriteria]) -> Tuple[bool, List[str]]:
        """
        Evaluates a student profile against drive eligibility criteria.
        Returns: (is_eligible: bool, reasons: List[str])
        If not eligible, reasons contains detailed human-readable explanation strings.
        """
        if not criteria:
            return True, ["No criteria restrictions specified for this drive"]

        reasons: List[str] = []

        min_cgpa = criteria.min_cgpa or 0.0
        min_tenth = criteria.min_tenth_percentage or 0.0
        min_twelfth = criteria.min_twelfth_percentage or 0.0
        max_active_bl = criteria.max_active_backlogs if criteria.max_active_backlogs is not None else 0
        max_hist_bl = criteria.max_history_backlogs if criteria.max_history_backlogs is not None else 0
        min_att = criteria.min_attendance or 0.0

        student_cgpa = student.cgpa or 0.0
        student_tenth = student.tenth_percentage or 0.0
        student_twelfth = student.twelfth_percentage or 0.0
        student_active_bl = student.active_backlogs or 0
        student_hist_bl = student.history_backlogs or 0
        student_att = student.attendance_percentage or 85.0

        # 1. CGPA Check
        if min_cgpa > 0 and student_cgpa < min_cgpa:
            reasons.append(
                f"CGPA is {student_cgpa:.2f}; minimum required is {min_cgpa:.2f}"
            )

        # 2. 10th Percentage Check
        if min_tenth > 0 and student_tenth < min_tenth:
            reasons.append(
                f"10th standard score is {student_tenth:.1f}%; minimum required is {min_tenth:.1f}%"
            )

        # 3. 12th/Diploma Percentage Check
        if min_twelfth > 0 and student_twelfth < min_twelfth:
            reasons.append(
                f"12th/Diploma score is {student_twelfth:.1f}%; minimum required is {min_twelfth:.1f}%"
            )

        # 4. Active Backlogs Check
        if student_active_bl > max_active_bl:
            reasons.append(
                f"{student_active_bl} active backlog(s) detected; maximum allowed is {max_active_bl}"
            )

        # 5. History of Backlogs Check
        if student_hist_bl > max_hist_bl:
            reasons.append(
                f"Historical backlog count is {student_hist_bl}; maximum permitted is {max_hist_bl}"
            )

        # 6. Department / Branch Check
        if criteria.allowed_departments:
            try:
                allowed_depts = json.loads(criteria.allowed_departments)
            except Exception:
                allowed_depts = [d.strip() for d in criteria.allowed_departments.split(",") if d.strip()]
            
            dept_code = student.department.code if student.department else ""
            if allowed_depts and dept_code not in allowed_depts:
                reasons.append(
                    f"Department '{dept_code}' is not in the permitted departments: {', '.join(allowed_depts)}"
                )

        # 7. Graduation Year Check
        if criteria.allowed_graduation_years:
            try:
                allowed_years = json.loads(criteria.allowed_graduation_years)
            except Exception:
                allowed_years = [int(y.strip()) for y in criteria.allowed_graduation_years.split(",") if y.strip().isdigit()]
            
            if allowed_years and student.graduation_year not in allowed_years:
                reasons.append(
                    f"Graduation year {student.graduation_year} is not eligible. Eligible batch: {', '.join(map(str, allowed_years))}"
                )

        # 8. Minimum Attendance Check
        if min_att > 0 and student_att < min_att:
            reasons.append(
                f"Current attendance is {student_att:.1f}%; required minimum is {min_att:.1f}%"
            )

        # 9. Gender Preference Check
        if criteria.gender_preference and criteria.gender_preference != "Any":
            if student.gender and student.gender.lower() != criteria.gender_preference.lower():
                reasons.append(
                    f"Drive eligibility requires gender to be '{criteria.gender_preference}'; student profile specifies '{student.gender}'"
                )

        # 10. Required Skills Check (case-insensitive search, preserving original display case)
        if criteria.required_skills:
            try:
                parsed = json.loads(criteria.required_skills)
                if isinstance(parsed, list):
                    req_skills = parsed
                else:
                    req_skills = [s.strip() for s in str(parsed).split(",") if s.strip()]
            except Exception:
                req_skills = [s.strip() for s in criteria.required_skills.split(",") if s.strip()]
            
            student_skills_str = (student.skills or "").lower()
            missing_skills = []
            for skill in req_skills:
                skill_clean = skill.strip().lower()
                if skill_clean and skill_clean not in student_skills_str:
                    missing_skills.append(skill)
            
            if missing_skills:
                reasons.append(
                    f"Missing required skill(s): {', '.join(missing_skills)}"
                )

        is_eligible = len(reasons) == 0
        return is_eligible, reasons
