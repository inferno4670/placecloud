import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StudentProfile } from '../../types';
import { Badge } from '../../components/Badge';
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  Upload,
  FileText,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [skills, setSkills] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?.student_profile) {
      setProfile(user.student_profile);
      setSkills(user.student_profile.skills || '');
      setPhone(user.student_profile.phone || '');
      setAddress(user.student_profile.address || '');
      setGithubUrl(user.student_profile.github_url || '');
      setLinkedinUrl(user.student_profile.linkedin_url || '');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.patch(`/students/${profile.id}`, {
        skills,
        phone,
        address,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !profile) return;
    const file = e.target.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF resumes are supported');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);

    try {
      await api.post(`/students/${profile.id}/resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await refreshUser();
      alert('Resume updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Resume upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Student Profile & Academic Record
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal contact details, technical skills, and resume.
          </p>
        </div>

        <Badge variant={profile?.placement_status === 'PLACED' ? 'green' : 'blue'} size="md">
          {profile?.placement_status || 'UNPLACED'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Academic Verification Overview (Read-Only) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Verified Academic Record
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Enrollment / Roll No.</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{profile?.enrollment_no}</p>
              </div>

              <div>
                <span className="text-slate-400">Department</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {profile?.department_name} ({profile?.department_code})
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Current CGPA</span>
                  <p className="text-base font-extrabold text-blue-700 mt-0.5">
                    {profile?.cgpa ? profile.cgpa.toFixed(2) : '0.00'}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Graduation Year</span>
                  <p className="text-base font-extrabold text-slate-800 mt-0.5">
                    {profile?.graduation_year}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400">10th Std. Score</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{profile?.tenth_percentage}%</p>
                </div>
                <div>
                  <span className="text-slate-400">12th / Diploma Score</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{profile?.twelfth_percentage}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400">Active Backlogs</span>
                  <p className="font-bold text-rose-600 mt-0.5">{profile?.active_backlogs}</p>
                </div>
                <div>
                  <span className="text-slate-400">Historical Backlogs</span>
                  <p className="font-semibold text-slate-700 mt-0.5">{profile?.history_backlogs}</p>
                </div>
              </div>
            </div>

            <p className="rounded-xl bg-blue-50/70 p-3 text-[11px] text-blue-800 leading-normal">
              <strong>Note:</strong> Academic scores are verified by the college registrar. If any score requires correction, please contact your department placement coordinator.
            </p>
          </div>

          {/* Resume Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Resume (PDF)
                </h3>
              </div>
              {profile?.resume_url && (
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                >
                  View <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-blue-500 cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all">
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700">
                {isUploading ? 'Uploading...' : 'Upload New Resume'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">PDF format (Max 10MB)</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Right Col: Editable Profile & Skills */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Profile Details & Social Links
              </h3>
              {saveSuccess && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Changes Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.full_name || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address / City</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Bangalore, Karnataka"
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Technical Skills & Tools (Comma separated)
              </label>
              <textarea
                rows={3}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Python, React, TypeScript, FastApi, SQL, Docker, Algorithms"
                className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                The eligibility engine searches these skills when companies mandate required competencies.
              </p>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full rounded-xl border border-slate-300 py-2.5 px-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
