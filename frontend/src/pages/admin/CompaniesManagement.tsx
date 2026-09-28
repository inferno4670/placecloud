import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Company } from '../../types';
import { Badge } from '../../components/Badge';
import {
  Building2,
  PlusCircle,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  X,
  Edit2
} from 'lucide-react';

export const CompaniesManagement: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [hrName, setHrName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  const [companyType, setCompanyType] = useState('Product');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingCompany(null);
    setName('');
    setIndustry('Software & IT');
    setWebsite('');
    setLocation('Bangalore / Hyderabad');
    setHrName('');
    setHrEmail('');
    setHrPhone('');
    setCompanyType('Product');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Company) => {
    setEditingCompany(c);
    setName(c.name);
    setIndustry(c.industry || '');
    setWebsite(c.website || '');
    setLocation(c.location || '');
    setHrName(c.hr_name || '');
    setHrEmail(c.hr_email || '');
    setHrPhone(c.hr_phone || '');
    setCompanyType(c.company_type || 'Product');
    setDescription(c.description || '');
    setIsModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name,
      industry,
      website,
      location,
      hr_name: hrName,
      hr_email: hrEmail,
      hr_phone: hrPhone,
      company_type: companyType,
      description,
    };

    try {
      if (editingCompany) {
        await api.patch(`/companies/${editingCompany.id}`, payload);
      } else {
        await api.post('/companies', payload);
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save company profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Corporate Partners & Recruiting Companies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain recruiter relationships, contact details, and company profiles for campus hiring.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Add New Company</span>
        </button>
      </div>

      {/* Companies Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 font-bold text-slate-800 border border-slate-200">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                      {c.company_type}
                    </span>
                    <button
                      onClick={() => openEditModal(c)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 font-medium">{c.industry}</p>

                {c.description && (
                  <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {c.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{c.location}</span>
                    </div>
                  )}
                  {c.hr_name && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {c.hr_name} ({c.hr_email || 'No email'})
                      </span>
                    </div>
                  )}
                  {c.website && (
                    <div className="flex items-center gap-1.5">
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {c.website.replace('https://', '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Active Placement Drives:</span>
                <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                  {c.active_drives_count || 0} Drives
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCompany ? 'Edit Company Profile' : 'Add New Corporate Partner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Google, Infosys"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Type</label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Product">Product</option>
                    <option value="Service">Service</option>
                    <option value="Startup">Startup</option>
                    <option value="MNC">MNC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Software, FinTech, Core"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Bangalore, Hyderabad, Remote"
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HR Recruiter Name</label>
                  <input
                    type="text"
                    value={hrName}
                    onChange={(e) => setHrName(e.target.value)}
                    placeholder="HR Lead"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HR Email</label>
                  <input
                    type="email"
                    value={hrEmail}
                    onChange={(e) => setHrEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">HR Phone</label>
                  <input
                    type="text"
                    value={hrPhone}
                    onChange={(e) => setHrPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Overview</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief company background..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
