import pandas as pd
from app.models.institution import Department
from app.services.excel_importer import ExcelStudentImporter

def test_importer_validation_and_errors(db):
    dept = Department(code="CSE", name="Computer Science")
    db.add(dept)
    db.commit()

    # Data with valid record, invalid email, out of bounds CGPA, and duplicate
    data = {
        "Roll No": ["2026CS901", "2026CS902", "2026CS903", "2026CS901"],
        "Student Name": ["Valid Student", "Bad Email Student", "Bad CGPA Student", "Duplicate Student"],
        "Email ID": ["valid.student@example.edu", "not-an-email", "badcgpa@example.edu", "dup@example.edu"],
        "Branch": ["CSE", "CSE", "CSE", "CSE"],
        "CGPA": [8.5, 7.5, 14.5, 8.0],  # 14.5 is invalid (> 10.0)
        "10th Percentage": [90.0, 85.0, 80.0, 85.0],
        "12th Percentage": [88.0, 80.0, 78.0, 82.0],
        "Active Backlogs": [0, 0, 0, 0]
    }
    df = pd.DataFrame(data)
    df.columns = [ExcelStudentImporter._normalize_column_name(c) for c in df.columns]

    report = ExcelStudentImporter.validate_dataframe(df, db)
    
    assert report.total_records == 4
    assert report.duplicate_records_count >= 1
    assert report.invalid_records_count >= 2
    assert any("Invalid email format" in err.message for err in report.errors)
    assert any("CGPA must be between 0.0 and 10.0" in err.message for err in report.errors)
