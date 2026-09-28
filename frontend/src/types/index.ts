export type Role = 'SUPER_ADMIN' | 'TPO_ADMIN' | 'PLACEMENT_COORDINATOR' | 'STUDENT' | 'RECRUITER';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  student_profile?: StudentProfile;
}

export interface Department {
  id: number;
  code: string;
  name: string;
  description?: string;
}

export interface StudentProfile {
  id: number;
  user_id: number;
  enrollment_no: string;
  full_name?: string;
  email?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  address?: string;
  department_id: number;
  department_code?: string;
  department_name?: string;
  branch?: string;
  graduation_year: number;
  semester: number;
  cgpa: number;
  tenth_percentage: number;
  twelfth_percentage: number;
  active_backlogs: number;
  history_backlogs: number;
  attendance_percentage: number;
  skills?: string;
  certifications?: string;
  projects?: string;
  internship_experience?: string;
  resume_url?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  placement_status: 'UNPLACED' | 'PLACED' | 'OPTED_OUT';
  selected_company?: string;
  package_ctc?: number;
  joining_status?: string;
  application_count?: number;
  offer_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Company {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  location?: string;
  hr_name?: string;
  hr_email?: string;
  hr_phone?: string;
  logo_url?: string;
  company_type?: string;
  is_active: boolean;
  active_drives_count?: number;
  created_at?: string;
}

export interface EligibilityCriteria {
  id?: number;
  drive_id?: number;
  min_cgpa: number;
  min_tenth_percentage: number;
  min_twelfth_percentage: number;
  max_active_backlogs: number;
  max_history_backlogs: number;
  allowed_departments: string[];
  allowed_graduation_years: number[];
  required_skills?: string;
  gender_preference?: string;
  min_attendance: number;
}

export interface PlacementDrive {
  id: number;
  company_id: number;
  company_name?: string;
  company_logo?: string;
  title: string;
  description?: string;
  employment_type: string;
  work_mode: string;
  job_location?: string;
  ctc_lpa: number;
  stipend_monthly: number;
  application_deadline: string;
  drive_date?: string;
  vacancies: number;
  selection_stages: string[];
  status: 'UPCOMING' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  eligibility_criteria?: EligibilityCriteria;
  total_applications?: number;
  student_eligible?: boolean;
  student_ineligibility_reasons?: string[];
  student_applied?: boolean;
  student_application_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApplicationStatusHistory {
  id: number;
  stage: string;
  status: string;
  notes?: string;
  updated_by_name?: string;
  created_at: string;
}

export interface Application {
  id: number;
  student_id: number;
  drive_id: number;
  current_stage: string;
  status: 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'IN_PROCESS' | 'SELECTED' | 'REJECTED' | 'WITHDRAWN';
  applied_at: string;
  updated_at: string;
  drive_title?: string;
  company_id?: number;
  company_name?: string;
  company_logo?: string;
  job_location?: string;
  ctc_lpa?: number;
  selection_stages?: string[];
  student_name?: string;
  student_email?: string;
  enrollment_no?: string;
  department_code?: string;
  cgpa?: number;
  resume_url?: string;
  history?: ApplicationStatusHistory[];
}

export interface PlacementRecord {
  id: number;
  student_id: number;
  drive_id?: number;
  company_id: number;
  job_title: string;
  ctc_lpa: number;
  offer_date?: string;
  joining_date?: string;
  offer_letter_url?: string;
  status: string;
  student_name?: string;
  enrollment_no?: string;
  department_code?: string;
  company_name?: string;
  company_logo?: string;
  created_at?: string;
}

export interface StudentEligibilityDetail {
  student_id: number;
  user_id: number;
  enrollment_no: string;
  student_name: string;
  email: string;
  department_code: string;
  cgpa: number;
  tenth_percentage: number;
  twelfth_percentage: number;
  active_backlogs: number;
  history_backlogs: number;
  graduation_year: number;
  gender?: string;
  is_eligible: boolean;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE';
  reasons: string[];
  has_applied: boolean;
  application_stage?: string;
}

export interface DriveEligibilitySummary {
  drive_id: number;
  drive_title: string;
  company_name: string;
  total_evaluated: number;
  eligible_count: number;
  ineligible_count: number;
  applied_count: number;
  results: StudentEligibilityDetail[];
}

export interface OverviewStats {
  total_students: number;
  active_students: number;
  placed_students: number;
  unplaced_students: number;
  placement_rate: number;
  total_companies: number;
  active_drives: number;
  total_applications: number;
  total_offers: number;
  average_ctc: number;
  highest_ctc: number;
}

export interface DepartmentPlacementStat {
  department_code: string;
  department_name: string;
  total_students: number;
  placed_students: number;
  placement_rate: number;
  average_ctc: number;
  highest_ctc: number;
}

export interface CompanyRecruitmentStat {
  company_id: number;
  company_name: string;
  total_drives: number;
  total_applications: number;
  shortlisted_count: number;
  selected_count: number;
  selection_rate: number;
  average_ctc: number;
}

export interface AcademicCorrelationStat {
  category: string;
  total_students: number;
  placed_students: number;
  placement_rate: number;
}

export interface BacklogImpactStat {
  category: string;
  total_students: number;
  placed_students: number;
  placement_rate: number;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export interface ImportPreviewReport {
  total_records: number;
  valid_records_count: number;
  invalid_records_count: number;
  duplicate_records_count: number;
  preview_records: any[];
  errors: ImportValidationError[];
}

export interface ImportResultSummary {
  total_records: number;
  successfully_imported: number;
  successfully_updated: number;
  failed_records: number;
  errors: string[];
}
