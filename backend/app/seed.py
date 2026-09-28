import json
from datetime import datetime, timezone, timedelta, date
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
import app.models
from app.models.user import User, UserRole
from app.models.institution import Department
from app.models.student import StudentProfile
from app.models.company import Company
from app.models.drive import PlacementDrive, EligibilityCriteria
from app.models.application import Application, ApplicationStatus, ApplicationStatusHistory
from app.models.placement_record import PlacementRecord
from app.models.audit_log import AuditLog
from app.models.notification import Notification

def seed():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "tpo@placecloud.edu").first():
            print("Database already seeded with demo data.")
            return

        print("Seeding database with PlaceCloud demo dataset...")

        # 1. Seed Departments
        depts_data = [
            ("CSE", "Computer Science & Engineering", "Computing, Algorithms, AI and Systems"),
            ("IT", "Information Technology", "Software Engineering, Cloud Computing, Networks"),
            ("ECE", "Electronics & Communication", "VLSI, Embedded Systems, Signal Processing"),
            ("ME", "Mechanical Engineering", "Thermodynamics, Robotics, CAD/CAM"),
            ("CE", "Civil Engineering", "Structures, Geotech, Infrastructure"),
        ]
        dept_map = {}
        for code, name, desc in depts_data:
            dept = Department(code=code, name=name, description=desc)
            db.add(dept)
            db.flush()
            dept_map[code] = dept

        # 2. Seed Administrative Users
        admin_pwd = get_password_hash("Admin@123")
        tpo_pwd = get_password_hash("Tpo@123")
        coord_pwd = get_password_hash("Coord@123")
        student_pwd = get_password_hash("Student@123")

        superadmin = User(
            email="superadmin@placecloud.edu",
            full_name="Dr. Alok Verma (Super Admin)",
            hashed_password=admin_pwd,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        tpo_admin = User(
            email="tpo@placecloud.edu",
            full_name="Prof. Rajesh K. Nair (TPO Head)",
            hashed_password=tpo_pwd,
            role=UserRole.TPO_ADMIN,
            is_active=True
        )
        coord = User(
            email="coordinator@placecloud.edu",
            full_name="Dr. Shweta Joshi (Placement Coordinator)",
            hashed_password=coord_pwd,
            role=UserRole.PLACEMENT_COORDINATOR,
            is_active=True
        )
        db.add_all([superadmin, tpo_admin, coord])
        db.flush()

        # 3. Seed Companies
        companies_data = [
            {
                "name": "Google",
                "industry": "Product & Cloud",
                "website": "https://careers.google.com",
                "description": "Global technology leader in search, cloud computing, AI, and consumer electronics.",
                "location": "Bangalore / Hyderabad",
                "hr_name": "Siddharth Sen",
                "hr_email": "university-recruiting@google.com",
                "hr_phone": "+91 80 6721 8000",
                "logo_url": "https://www.google.com/favicon.ico",
                "company_type": "Product"
            },
            {
                "name": "Microsoft",
                "industry": "Software & Cloud",
                "website": "https://careers.microsoft.com",
                "description": "Leading cloud provider, developer tooling, and enterprise software company.",
                "location": "Hyderabad / Bangalore",
                "hr_name": "Natasha Kapoor",
                "hr_email": "indiarecruiting@microsoft.com",
                "hr_phone": "+91 40 6695 0000",
                "logo_url": "https://www.microsoft.com/favicon.ico",
                "company_type": "Product"
            },
            {
                "name": "Amazon",
                "industry": "E-Commerce & AWS",
                "website": "https://amazon.jobs",
                "description": "World's largest e-commerce and cloud infrastructure platform.",
                "location": "Bangalore / Chennai",
                "hr_name": "Karthik Raman",
                "hr_email": "campus-talent@amazon.com",
                "hr_phone": "+91 80 4118 6000",
                "logo_url": "https://www.amazon.in/favicon.ico",
                "company_type": "Product"
            },
            {
                "name": "Infosys",
                "industry": "IT Consulting & Services",
                "website": "https://www.infosys.com",
                "description": "Global leader in next-generation digital services and consulting.",
                "location": "Bangalore / Pune / Mysore",
                "hr_name": "Meera Iyer",
                "hr_email": "careers@infosys.com",
                "hr_phone": "+91 80 2852 0261",
                "logo_url": "https://www.infosys.com/favicon.ico",
                "company_type": "Service"
            },
            {
                "name": "Tata Consultancy Services",
                "industry": "IT Services & Solutions",
                "website": "https://www.tcs.com",
                "description": "Global leader in IT services, consulting, and business solutions.",
                "location": "Mumbai / Delhi / Kolkata",
                "hr_name": "Abhishek Roy",
                "hr_email": "campus.talent@tcs.com",
                "hr_phone": "+91 22 6778 9999",
                "logo_url": "https://www.tcs.com/favicon.ico",
                "company_type": "Service"
            }
        ]

        comp_map = {}
        for cdata in companies_data:
            comp = Company(**cdata)
            db.add(comp)
            db.flush()
            comp_map[comp.name] = comp

        # 4. Seed Placement Drives with Eligibility Criteria
        now = datetime.now(timezone.utc)
        drives_data = [
            {
                "company": comp_map["Google"],
                "title": "Software Development Engineer - Campus 2026",
                "description": "Join Google's core engineering teams working on planetary-scale distributed systems, search infra, and Google Cloud platform.",
                "employment_type": "Full Time",
                "work_mode": "Hybrid",
                "job_location": "Bangalore, India",
                "ctc_lpa": 32.5,
                "stipend_monthly": 100000.0,
                "application_deadline": now + timedelta(days=14),
                "drive_date": now + timedelta(days=21),
                "vacancies": 8,
                "selection_stages": json.dumps(["Online Assessment", "Technical Interview 1", "Technical Interview 2", "Googliness & HR", "Final Selection"]),
                "status": "ACTIVE",
                "criteria": {
                    "min_cgpa": 8.5,
                    "min_tenth_percentage": 80.0,
                    "min_twelfth_percentage": 80.0,
                    "max_active_backlogs": 0,
                    "max_history_backlogs": 0,
                    "allowed_departments": json.dumps(["CSE", "IT"]),
                    "allowed_graduation_years": json.dumps([2026]),
                    "required_skills": "Data Structures, Algorithms, Python, C++, Distributed Systems",
                    "gender_preference": "Any",
                    "min_attendance": 75.0
                }
            },
            {
                "company": comp_map["Microsoft"],
                "title": "Cloud Solution Architect & Dev - 2026",
                "description": "Architect, develop, and scale enterprise customer solutions on Microsoft Azure, AI systems, and cloud native microservices.",
                "employment_type": "Full Time",
                "work_mode": "Hybrid",
                "job_location": "Hyderabad, India",
                "ctc_lpa": 26.0,
                "stipend_monthly": 80000.0,
                "application_deadline": now + timedelta(days=10),
                "drive_date": now + timedelta(days=18),
                "vacancies": 12,
                "selection_stages": json.dumps(["Coding Round", "System Design Interview", "Behavioral Round", "Final Selection"]),
                "status": "ACTIVE",
                "criteria": {
                    "min_cgpa": 8.0,
                    "min_tenth_percentage": 75.0,
                    "min_twelfth_percentage": 75.0,
                    "max_active_backlogs": 0,
                    "max_history_backlogs": 1,
                    "allowed_departments": json.dumps(["CSE", "IT", "ECE"]),
                    "allowed_graduation_years": json.dumps([2026]),
                    "required_skills": "C#, Python, Cloud, SQL",
                    "gender_preference": "Any",
                    "min_attendance": 75.0
                }
            },
            {
                "company": comp_map["Amazon"],
                "title": "Software Development Engineer I (SDE-1)",
                "description": "Design and build software features for millions of Amazon e-commerce customers and high-throughput microservices.",
                "employment_type": "Full Time",
                "work_mode": "Onsite",
                "job_location": "Bangalore / Chennai",
                "ctc_lpa": 22.0,
                "stipend_monthly": 75000.0,
                "application_deadline": now + timedelta(days=7),
                "drive_date": now + timedelta(days=15),
                "vacancies": 15,
                "selection_stages": json.dumps(["Online Assessment (OA)", "Technical Interview 1", "Technical Interview 2", "Bar Raiser Interview", "Final Selection"]),
                "status": "ACTIVE",
                "criteria": {
                    "min_cgpa": 7.5,
                    "min_tenth_percentage": 70.0,
                    "min_twelfth_percentage": 70.0,
                    "max_active_backlogs": 0,
                    "max_history_backlogs": 1,
                    "allowed_departments": json.dumps(["CSE", "IT", "ECE"]),
                    "allowed_graduation_years": json.dumps([2026]),
                    "required_skills": "Java, Python, Algorithms, Problem Solving",
                    "gender_preference": "Any",
                    "min_attendance": 75.0
                }
            },
            {
                "company": comp_map["Infosys"],
                "title": "Systems Engineer Specialist (SES)",
                "description": "Develop full-stack web and cloud applications for Fortune 500 global clients across banking, retail, and manufacturing.",
                "employment_type": "Full Time",
                "work_mode": "Hybrid",
                "job_location": "Pan-India",
                "ctc_lpa": 9.5,
                "stipend_monthly": 25000.0,
                "application_deadline": now + timedelta(days=20),
                "drive_date": now + timedelta(days=28),
                "vacancies": 50,
                "selection_stages": json.dumps(["Aptitude & Coding Test", "Technical Interview", "HR Discussion", "Final Selection"]),
                "status": "ACTIVE",
                "criteria": {
                    "min_cgpa": 6.5,
                    "min_tenth_percentage": 60.0,
                    "min_twelfth_percentage": 60.0,
                    "max_active_backlogs": 1,
                    "max_history_backlogs": 2,
                    "allowed_departments": json.dumps(["CSE", "IT", "ECE", "ME", "CE"]),
                    "allowed_graduation_years": json.dumps([2026]),
                    "required_skills": "Java, Python, Web Development, SQL",
                    "gender_preference": "Any",
                    "min_attendance": 70.0
                }
            },
            {
                "company": comp_map["Tata Consultancy Services"],
                "title": "TCS Digital Cadre Innovator",
                "description": "Work on next-generation digital initiatives: Cloud migration, Cyber Security, DevOps, and Machine Learning.",
                "employment_type": "Full Time",
                "work_mode": "Hybrid",
                "job_location": "Mumbai / Pune / Delhi",
                "ctc_lpa": 7.5,
                "stipend_monthly": 20000.0,
                "application_deadline": now + timedelta(days=25),
                "drive_date": now + timedelta(days=32),
                "vacancies": 40,
                "selection_stages": json.dumps(["TCS NQT Assessment", "Digital Interview", "HR Interview", "Final Selection"]),
                "status": "ACTIVE",
                "criteria": {
                    "min_cgpa": 6.0,
                    "min_tenth_percentage": 60.0,
                    "min_twelfth_percentage": 60.0,
                    "max_active_backlogs": 1,
                    "max_history_backlogs": 2,
                    "allowed_departments": json.dumps(["CSE", "IT", "ECE", "ME", "CE"]),
                    "allowed_graduation_years": json.dumps([2026]),
                    "required_skills": "Programming, Analytical Skills, Cloud",
                    "gender_preference": "Any",
                    "min_attendance": 70.0
                }
            }
        ]

        drive_map = {}
        for ddata in drives_data:
            crit_data = ddata.pop("criteria")
            company_obj = ddata.pop("company")
            drive = PlacementDrive(company_id=company_obj.id, **ddata)
            db.add(drive)
            db.flush()

            crit = EligibilityCriteria(drive_id=drive.id, **crit_data)
            db.add(crit)
            db.flush()
            drive_map[drive.title] = drive

        # 5. Seed Students
        students_info = [
            {
                "email": "student@placecloud.edu",
                "name": "Rahul Sharma",
                "enrollment": "2026CS101",
                "dept": dept_map["CSE"],
                "cgpa": 8.85,
                "tenth": 91.5,
                "twelfth": 89.0,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Male",
                "phone": "+91 98765 43210",
                "skills": "Python, React, FastApi, Data Structures, Algorithms, Docker, PostgreSQL",
                "status": "PLACED",
                "company": "Google",
                "ctc": 32.5
            },
            {
                "email": "sneha.reddy@placecloud.edu",
                "name": "Sneha Reddy",
                "enrollment": "2026CS102",
                "dept": dept_map["CSE"],
                "cgpa": 9.40,
                "tenth": 95.0,
                "twelfth": 93.5,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Female",
                "phone": "+91 98765 43211",
                "skills": "C#, Python, Azure, Algorithms, Cloud Architecture, SQL, Kubernetes",
                "status": "PLACED",
                "company": "Microsoft",
                "ctc": 26.0
            },
            {
                "email": "priya.verma@placecloud.edu",
                "name": "Priya Verma",
                "enrollment": "2026IT103",
                "dept": dept_map["IT"],
                "cgpa": 7.85,
                "tenth": 85.0,
                "twelfth": 82.5,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Female",
                "phone": "+91 98765 43212",
                "skills": "Java, Spring Boot, AWS, Algorithms, Microservices, MongoDB",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "arjun.singh@placecloud.edu",
                "name": "Arjun Singh",
                "enrollment": "2026EC104",
                "dept": dept_map["ECE"],
                "cgpa": 7.20,
                "tenth": 78.0,
                "twelfth": 74.0,
                "backlogs": 1,
                "hist_backlogs": 1,
                "gender": "Male",
                "phone": "+91 98765 43213",
                "skills": "C++, Embedded Systems, IoT, Python, Circuit Design",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "ananya.deshmukh@placecloud.edu",
                "name": "Ananya Deshmukh",
                "enrollment": "2026IT105",
                "dept": dept_map["IT"],
                "cgpa": 8.25,
                "tenth": 88.0,
                "twelfth": 86.0,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Female",
                "phone": "+91 98765 43214",
                "skills": "Python, React, TypeScript, Cloud Native, REST APIs, Git",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "vikram.mehta@placecloud.edu",
                "name": "Vikram Mehta",
                "enrollment": "2026ME106",
                "dept": dept_map["ME"],
                "cgpa": 6.90,
                "tenth": 76.5,
                "twelfth": 71.0,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Male",
                "phone": "+91 98765 43215",
                "skills": "AutoCAD, SolidWorks, Python, Robotics, Automation",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "karan.malhotra@placecloud.edu",
                "name": "Karan Malhotra",
                "enrollment": "2026CS107",
                "dept": dept_map["CSE"],
                "cgpa": 6.45,
                "tenth": 72.0,
                "twelfth": 68.0,
                "backlogs": 2,
                "hist_backlogs": 2,
                "gender": "Male",
                "phone": "+91 98765 43216",
                "skills": "HTML, CSS, JavaScript, Basic Python",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "rohit.kumar@placecloud.edu",
                "name": "Rohit Kumar",
                "enrollment": "2026EC108",
                "dept": dept_map["ECE"],
                "cgpa": 8.55,
                "tenth": 90.0,
                "twelfth": 87.5,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Male",
                "phone": "+91 98765 43217",
                "skills": "Python, C++, Signal Processing, Machine Learning, MATLAB",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "neha.gupta@placecloud.edu",
                "name": "Neha Gupta",
                "enrollment": "2026CE109",
                "dept": dept_map["CE"],
                "cgpa": 7.40,
                "tenth": 81.0,
                "twelfth": 79.0,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Female",
                "phone": "+91 98765 43218",
                "skills": "STAAD Pro, Revit, Project Management, Python",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            },
            {
                "email": "aditya.joshi@placecloud.edu",
                "name": "Aditya Joshi",
                "enrollment": "2026CS110",
                "dept": dept_map["CSE"],
                "cgpa": 8.95,
                "tenth": 93.0,
                "twelfth": 91.0,
                "backlogs": 0,
                "hist_backlogs": 0,
                "gender": "Male",
                "phone": "+91 98765 43219",
                "skills": "Go, Python, Kubernetes, Distributed Systems, Linux",
                "status": "UNPLACED",
                "company": None,
                "ctc": None
            }
        ]

        student_objs = {}
        for sinfo in students_info:
            user = User(
                email=sinfo["email"],
                full_name=sinfo["name"],
                hashed_password=student_pwd,
                role=UserRole.STUDENT,
                is_active=True
            )
            db.add(user)
            db.flush()

            student = StudentProfile(
                user_id=user.id,
                enrollment_no=sinfo["enrollment"],
                department_id=sinfo["dept"].id,
                branch=sinfo["dept"].name,
                graduation_year=2026,
                semester=7,
                cgpa=sinfo["cgpa"],
                tenth_percentage=sinfo["tenth"],
                twelfth_percentage=sinfo["twelfth"],
                active_backlogs=sinfo["backlogs"],
                history_backlogs=sinfo["hist_backlogs"],
                gender=sinfo["gender"],
                phone=sinfo["phone"],
                skills=sinfo["skills"],
                placement_status=sinfo["status"],
                selected_company=sinfo["company"],
                package_ctc=sinfo["ctc"],
                resume_url="/uploads/resumes/sample_resume.pdf"
            )
            db.add(student)
            db.flush()
            student_objs[sinfo["enrollment"]] = student

        # 6. Seed Applications & Placement Records
        google_drive = drive_map["Software Development Engineer - Campus 2026"]
        ms_drive = drive_map["Cloud Solution Architect & Dev - 2026"]
        amazon_drive = drive_map["Software Development Engineer I (SDE-1)"]
        infosys_drive = drive_map["Systems Engineer Specialist (SES)"]
        tcs_drive = drive_map["TCS Digital Cadre Innovator"]

        # Rahul Sharma -> Google (Selected)
        s_rahul = student_objs["2026CS101"]
        app_rahul = Application(
            student_id=s_rahul.id,
            drive_id=google_drive.id,
            current_stage="Selected",
            status=ApplicationStatus.SELECTED,
            applied_at=now - timedelta(days=12)
        )
        db.add(app_rahul)
        db.flush()

        for st, st_stat in [
            ("Applied", ApplicationStatus.APPLIED),
            ("Online Assessment", ApplicationStatus.SHORTLISTED),
            ("Technical Interview 1", ApplicationStatus.IN_PROCESS),
            ("Googliness & HR", ApplicationStatus.IN_PROCESS),
            ("Final Selection", ApplicationStatus.SELECTED)
        ]:
            db.add(ApplicationStatusHistory(
                application_id=app_rahul.id,
                stage=st,
                status=st_stat,
                notes=f"Cleared {st} with excellent feedback",
                updated_by_id=tpo_admin.id
            ))

        pr_rahul = PlacementRecord(
            student_id=s_rahul.id,
            drive_id=google_drive.id,
            company_id=comp_map["Google"].id,
            job_title="Software Development Engineer",
            ctc_lpa=32.5,
            offer_date=date.today() - timedelta(days=2),
            joining_date=date(2026, 7, 1),
            status="OFFERED"
        )
        db.add(pr_rahul)

        # Sneha Reddy -> Microsoft (Selected)
        s_sneha = student_objs["2026CS102"]
        app_sneha = Application(
            student_id=s_sneha.id,
            drive_id=ms_drive.id,
            current_stage="Selected",
            status=ApplicationStatus.SELECTED,
            applied_at=now - timedelta(days=9)
        )
        db.add(app_sneha)
        db.flush()

        for st, st_stat in [
            ("Applied", ApplicationStatus.APPLIED),
            ("Coding Round", ApplicationStatus.SHORTLISTED),
            ("System Design Interview", ApplicationStatus.IN_PROCESS),
            ("Final Selection", ApplicationStatus.SELECTED)
        ]:
            db.add(ApplicationStatusHistory(
                application_id=app_sneha.id,
                stage=st,
                status=st_stat,
                notes=f"Passed {st}",
                updated_by_id=tpo_admin.id
            ))

        pr_sneha = PlacementRecord(
            student_id=s_sneha.id,
            drive_id=ms_drive.id,
            company_id=comp_map["Microsoft"].id,
            job_title="Cloud Solution Architect",
            ctc_lpa=26.0,
            offer_date=date.today() - timedelta(days=3),
            joining_date=date(2026, 7, 15),
            status="OFFERED"
        )
        db.add(pr_sneha)

        # Priya Verma -> Amazon (In Process: Technical Interview)
        s_priya = student_objs["2026IT103"]
        app_priya = Application(
            student_id=s_priya.id,
            drive_id=amazon_drive.id,
            current_stage="Technical Interview 2",
            status=ApplicationStatus.IN_PROCESS,
            applied_at=now - timedelta(days=5)
        )
        db.add(app_priya)
        db.flush()

        db.add(ApplicationStatusHistory(
            application_id=app_priya.id,
            stage="Online Assessment",
            status=ApplicationStatus.SHORTLISTED,
            notes="OA Score: 95/100",
            updated_by_id=coord.id
        ))

        # Arjun Singh -> Infosys (Applied)
        s_arjun = student_objs["2026EC104"]
        app_arjun = Application(
            student_id=s_arjun.id,
            drive_id=infosys_drive.id,
            current_stage="Applied",
            status=ApplicationStatus.APPLIED,
            applied_at=now - timedelta(days=2)
        )
        db.add(app_arjun)

        # Ananya Deshmukh -> Amazon (Shortlisted) & Infosys (Applied)
        s_ananya = student_objs["2026IT105"]
        app_ananya = Application(
            student_id=s_ananya.id,
            drive_id=amazon_drive.id,
            current_stage="Technical Interview 1",
            status=ApplicationStatus.SHORTLISTED,
            applied_at=now - timedelta(days=4)
        )
        db.add(app_ananya)

        # Vikram Mehta -> TCS (Applied)
        s_vikram = student_objs["2026ME106"]
        app_vikram = Application(
            student_id=s_vikram.id,
            drive_id=tcs_drive.id,
            current_stage="Applied",
            status=ApplicationStatus.APPLIED,
            applied_at=now - timedelta(days=1)
        )
        db.add(app_vikram)

        # 7. Seed Initial Notifications
        notif1 = Notification(
            user_id=s_rahul.user_id,
            title="Congratulations! Offer Letter Available",
            message="Google has released the official offer letter for Software Development Engineer (₹32.5 LPA).",
            type="RESULT",
            link="/student/profile",
            is_read=False
        )
        notif2 = Notification(
            user_id=s_priya.user_id,
            title="Interview Scheduled: Amazon SDE-1",
            message="Your Technical Interview 2 with Amazon has been scheduled for tomorrow at 10:00 AM IST.",
            type="APPLICATION",
            link="/student/applications",
            is_read=False
        )
        db.add_all([notif1, notif2])

        # 8. Seed Audit Logs
        db.add(AuditLog(
            user_id=tpo_admin.id,
            user_email=tpo_admin.email,
            action="INITIAL_SYSTEM_SETUP",
            resource="system",
            details="System initialized with core departments, company profiles, and 2026 campus drives."
        ))

        db.commit()
        print("Demo dataset seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
