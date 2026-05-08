import { useEffect, useState } from 'react';
import { db } from '../db/database';
import type { JobRecord, JobStatus } from '../db/database';
import { useStore } from '../store/useStore';
import {
  Plus, Filter, SortAsc, Star, Archive, Trash2, Edit3,
  MapPin, Calendar, ExternalLink, ChevronDown, Tag,
  Briefcase, Search, MoreVertical, Copy
} from 'lucide-react';
import {
  statusLabel, statusColor, statusDotColor, formatDate,
  isOverdue, daysUntil, exportToCSV, exportToJSON, ALL_INDUSTRIES
} from '../utils/helpers';
import type { SourceType } from '../db/database';
import JobFormModal from '../components/JobFormModal';
import JobDetailModal from '../components/JobDetailModal';
import toast from 'react-hot-toast';

const SOURCE_TYPES: SourceType[] = ['LinkedIn', 'Company Site', 'Flyer', 'WhatsApp', 'Email', 'Instagram', 'Facebook', 'Indeed', 'Glassdoor', 'Other'];
const STATUSES: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'interview_completed', label: 'Interview Done' },
  { value: 'offer', label: 'Offer Received' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' },
  { value: 'no_response', label: 'No Response' },
];

export default function JobsPage() {
  const {
    searchQuery, filterStatus, filterIndustry, filterSource, sortBy,
    setFilterStatus, setFilterIndustry, setFilterSource, setSortBy,
  } = useStore();

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editJob, setEditJob] = useState<JobRecord | null>(null);
  const [viewJob, setViewJob] = useState<JobRecord | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [menuJob, setMenuJob] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  const fetchJobs = async () => {
    const all = await db.jobs.toArray();
    setJobs(all);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const filtered = jobs
    .filter((j) => {
      if (!showArchived && j.isArchived) return false;
      if (showFavOnly && !j.isFavorite) return false;
      if (filterStatus !== 'all' && j.status !== filterStatus) return false;
      if (filterIndustry !== 'all' && j.industry !== filterIndustry) return false;
      if (filterSource !== 'all' && j.sourceType !== filterSource) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          j.jobTitle?.toLowerCase().includes(q) ||
          j.company?.toLowerCase().includes(q) ||
          j.industry?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          j.tags?.some((t) => t.toLowerCase().includes(q)) ||
          j.notes?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'deadline': return daysUntil(a.closingDate) - daysUntil(b.closingDate);
        case 'company': return a.company.localeCompare(b.company);
        case 'status': return a.status.localeCompare(b.status);
        default: return 0;
      }
    });

  const toggleFavorite = async (job: JobRecord) => {
    if (!job.id) return;
    await db.jobs.update(job.id, { isFavorite: !job.isFavorite });
    fetchJobs();
    toast.success(job.isFavorite ? 'Removed from favourites' : 'Added to favourites ⭐');
  };

  const archiveJob = async (job: JobRecord) => {
    if (!job.id) return;
    await db.jobs.update(job.id, { isArchived: !job.isArchived });
    fetchJobs();
    toast.success(job.isArchived ? 'Restored from archive' : 'Archived');
    setMenuJob(null);
  };

  const deleteJob = async (job: JobRecord) => {
    if (!job.id) return;
    if (!confirm(`Delete "${job.jobTitle || job.company}"? This cannot be undone.`)) return;
    await db.jobs.delete(job.id);
    fetchJobs();
    toast.success('Job deleted');
    setMenuJob(null);
  };

  const duplicateJob = async (job: JobRecord) => {
    const { id, uuid, ...rest } = job;
    await db.jobs.add({
      ...rest,
      uuid: crypto.randomUUID(),
      jobTitle: `${rest.jobTitle} (copy)`,
      status: 'wishlist',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    fetchJobs();
    toast.success('Job duplicated');
    setMenuJob(null);
  };

  const moveStatus = async (job: JobRecord, status: JobStatus) => {
    if (!job.id) return;
    await db.jobs.update(job.id, { status });
    fetchJobs();
    toast.success(`Moved to ${statusLabel(status)}`);
    setMenuJob(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Jobs</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} of {jobs.length} jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300' : 'border-slate-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
            }`}
          >
            <Filter className="w-4 h-4" /> Filter
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="w-4 h-4" /> Add Job
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-4 mb-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <select
              className="text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select
              className="text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
            >
              <option value="all">All Industries</option>
              {ALL_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
            <select
              className="text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-indigo-400"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="deadline">By Deadline</option>
              <option value="company">By Company</option>
              <option value="status">By Status</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showFavOnly} onChange={(e) => setShowFavOnly(e.target.checked)} className="rounded" />
              <Star className="w-3 h-3 text-yellow-500" /> Favourites only
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="rounded" />
              <Archive className="w-3 h-3" /> Show archived
            </label>
            <div className="ml-auto flex gap-2">
              <button onClick={() => exportToCSV(filtered)} className="text-xs px-3 py-1.5 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100">
                Export CSV
              </button>
              <button onClick={() => exportToJSON(filtered)} className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100">
                Export JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-950 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-10 h-10 text-indigo-300 dark:text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">No jobs found</h3>
          <p className="text-sm text-gray-400 mb-6">
            {searchQuery || filterStatus !== 'all' || filterIndustry !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Start tracking your job applications'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Your First Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((job) => (
            <div
              key={job.uuid}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group relative"
            >
              {/* Card Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(job.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(job.status)}`} />
                        {statusLabel(job.status)}
                      </span>
                      {job.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      {job.isArchived && <Archive className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                      {job.jobTitle || 'Untitled Job'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                      {job.company}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setMenuJob(menuJob === job.id ? null : (job.id ?? null))}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuJob === job.id && (
                      <div className="absolute right-0 top-8 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl z-20 w-48 py-1 overflow-hidden">
                        <button onClick={() => { setViewJob(job); setMenuJob(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800">
                          <Search className="w-4 h-4" /> View Details
                        </button>
                        <button onClick={() => { setEditJob(job); setMenuJob(null); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800">
                          <Edit3 className="w-4 h-4" /> Edit Job
                        </button>
                        <button onClick={() => toggleFavorite(job)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800">
                          <Star className="w-4 h-4 text-yellow-500" /> {job.isFavorite ? 'Unfavourite' : 'Favourite'}
                        </button>
                        <button onClick={() => duplicateJob(job)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800">
                          <Copy className="w-4 h-4" /> Duplicate
                        </button>
                        <button onClick={() => archiveJob(job)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800">
                          <Archive className="w-4 h-4" /> {job.isArchived ? 'Restore' : 'Archive'}
                        </button>
                        <div className="border-t border-slate-100 dark:border-gray-800 my-1" />
                        {/* Quick Status Change */}
                        <div className="px-3 py-1">
                          <p className="text-xs text-gray-400 mb-1">Move to...</p>
                          {['wishlist', 'applied', 'interview_scheduled', 'offer', 'rejected'].filter(s => s !== job.status).map((s) => (
                            <button key={s} onClick={() => moveStatus(job, s as JobStatus)} className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 py-1 px-1">
                              → {statusLabel(s as JobStatus)}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 dark:border-gray-800 my-1" />
                        <button onClick={() => deleteJob(job)} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1.5">
                  {job.location && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> {job.location}
                    </p>
                  )}
                  {job.industry && (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <Briefcase className="w-3 h-3 flex-shrink-0" /> {job.industry}
                    </p>
                  )}
                  {job.salary && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">💰 {job.salary}</p>
                  )}
                  {job.closingDate && (
                    <p className={`flex items-center gap-1.5 text-xs font-medium ${
                      isOverdue(job.closingDate)
                        ? 'text-red-500'
                        : daysUntil(job.closingDate) <= 7
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}>
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      {isOverdue(job.closingDate) ? '⚠️ Overdue: ' : 'Deadline: '}
                      {formatDate(job.closingDate)}
                      {!isOverdue(job.closingDate) && daysUntil(job.closingDate) <= 30 && (
                        <span className="ml-1 bg-orange-100 dark:bg-orange-950 text-orange-600 px-1.5 py-0.5 rounded-full text-[10px]">
                          {daysUntil(job.closingDate)}d left
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {job.tags.length > 0 && (
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {job.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full">
                      {t}
                    </span>
                  ))}
                  {job.tags.length > 3 && (
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-gray-800 text-gray-500 rounded-full">
                      +{job.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-50 dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50 rounded-b-2xl">
                <span className="text-xs text-gray-400">
                  {job.sourceType} • {formatDate(job.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  {job.website && (
                    <a href={job.website} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => setViewJob(job)}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                  >
                    View →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <JobFormModal onClose={() => setShowAddModal(false)} onSave={() => { fetchJobs(); setShowAddModal(false); }} />
      )}
      {editJob && (
        <JobFormModal job={editJob} onClose={() => setEditJob(null)} onSave={() => { fetchJobs(); setEditJob(null); }} />
      )}
      {viewJob && (
        <JobDetailModal
          job={viewJob}
          onClose={() => setViewJob(null)}
          onEdit={(j) => { setViewJob(null); setEditJob(j); }}
          onDelete={() => { fetchJobs(); setViewJob(null); }}
          onStatusChange={async (status) => { if (viewJob.id) { await db.jobs.update(viewJob.id, { status }); fetchJobs(); setViewJob({ ...viewJob, status }); } }}
        />
      )}

      {/* Click outside to close menu */}
      {menuJob !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuJob(null)} />
      )}
    </div>
  );
}
