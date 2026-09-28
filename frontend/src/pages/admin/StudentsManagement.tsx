import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { StudentProfile, Department } from '../../types';
import { Badge } from '../../components/Badge';
import {
  Search,
  Download,
  Filter,
  Users,
  Eye,
  ExternalLink,
  GraduationCap,
  X,
  FileSpreadsheet
} from 'lucide-react';

export const StudentsManagement: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [placementFilter, setPlacementFilter] = useState<string>('');
  const [minCgpa, setMinCgpa] = useState<string>('');
  const [maxBacklogs, setMaxBacklogs] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      let query = '/students?limit=100';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (selectedDept) query += `&department_id=${selectedDept}`;
      if (placementFilter) query += `&placement_status=${placementFilter}`;
      if (minCgpa) query += `&min_cgpa=${minCgpa}`;
      if (maxBacklogs) query += `&max_backlogs=${maxBacklogs}`;

      const res = await api.get(query);
      setStudents(res.data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/students/departments/list');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedDept, placementFilter, minCgpa, maxBacklogs]);

  const handleExportCsv = () => {
    window.open('/api/v1/students-import/export', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Student Placement Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and review student academic profiles, backlogs, and active placement statuses.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
        >
          <Download className="h-4 w-4 text-slate-500" />
          <span>Export Students (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, or email..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="UNPLACED">Unplaced</option>
            <option value="PLACED">Placed</option>
            <option value="OPTED_OUT">Opted Out</option>
          </select>

          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
            placeholder="Min CGPA (e.g. 7.5)"
            className="rounded-xl border border-slate-300 py-2 px-3 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Students Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Roll No.</th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">CGPA</th>
                <th className="p-3.5">10th / 12th %</th>
                <th className="p-3.5">Backlogs</th>
                <th className="p-3.5">Placement Status</th>
                <th className="p-3.5">Selected Offer</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No students match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{student.enrollment_no}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{student.full_name}</div>
                      <div className="text-[11px] text-slate-400">{student.email}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-700 text-[11px]">
                        {student.department_code}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-blue-700">{student.cgpa.toFixed(2)}</td>
                    <td className="p-3.5 text-slate-600">
                      {student.tenth_percentage}% / {student.twelfth_percentage}%
                    </td>
                    <td className="p-3.5">
                      {student.active_backlogs > 0 ? (
                        <span className="font-bold text-rose-600">{student.active_backlogs} Active</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">0</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={student.placement_status === 'PLACED' ? 'green' : 'slate'}>
                        {student.placement_status}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      {student.selected_company ? (
                        <div>
                          <p className="font-bold text-slate-900">{student.selected_company}</p>
                          <p className="text-[11px] font-semibold text-emerald-600">
                            ₹{student.package_ctc} LPA
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedStudent(student)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="View Full Profile"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Profile Inspection Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedStudent.full_name}</h3>
                <p className="text-xs text-slate-500">
                  {selectedStudent.enrollment_no} • {selectedStudent.department_name} ({selectedStudent.department_code})
                </p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-slate-400">CGPA</span>
                <p className="text-lg font-bold text-blue-700 mt-0.5">{selectedStudent.cgpa.toFixed(2)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-slate-400">Backlogs</span>
                <p className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedStudent.active_backlogs} Active / {selectedStudent.history_backlogs} History
                </p>
              </div>
              <div>
                <span className="text-slate-400">Email Address</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedStudent.email}</p>
              </div>
              <div>
                <span className="text-slate-400">Contact Number</span>
                <p className="font-semibold text-slate-900 mt-0.5">{selectedStudent.phone || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400">Skills</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {selectedStudent.skills || 'No skills listed'}
                </p>
              </div>
            </div>

            {selectedStudent.resume_url && (
              <div className="flex items-center justify-between rounded-xl bg-blue-50/70 p-3 border border-blue-100 text-xs">
                <span className="font-semibold text-blue-900">Student Resume Attached</span>
                <a
                  href={selectedStudent.resume_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 font-bold text-blue-600 hover:underline"
                >
                  Download / View <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
