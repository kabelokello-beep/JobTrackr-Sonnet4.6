import { useEffect, useState } from 'react';
import { db } from '../db/database';
import type { JobRecord } from '../db/database';
import { useStore } from '../store/useStore';
import {
  Briefcase, TrendingUp, Clock, CheckCircle2, XCircle,
  Trophy, AlertTriangle, Plus, Star, Calendar, ChevronRight
} from 'lucide-react';
import { statusLabel, statusColor, formatDate, isOverdue, daysUntil } from '../utils/helpers';
import JobFormModal from '../components/JobFormModal';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export default function DashboardPage() {
  const { user, setActiveTab } = useStore();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    const all = await db.jobs.toArray();
    setJobs(all);
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const total = jobs.length;
  const applied = jobs.filter((j) => ['applied', 'interview_scheduled', 'interview_completed', 'offer', 'hired', 'rejected'].includes(j.status)).length;
  const interviews = jobs.filter((j) => ['interview_scheduled', 'interview_completed'].includes(j.status)).length;
  const rejected = jobs.filter((j) => j.status === 'rejected').length;
  const hired = jobs.filter((j) => j.status === 'hired' || j.status === 'offer').length;
  const successRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;

  const recent = [...jobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcoming = jobs
    .filter((j) => j.closingDate && !isOverdue(j.closingDate) && j.status !== 'rejected' && j.status !== 'hired')
    .sort((a, b) => daysUntil(a.closingDate) - daysUntil(b.closingDate))
    .slice(0, 4);

  const overdue = jobs.filter((j) =>
    j.closingDate && isOverdue(j.closingDate) && !['rejected', 'hired', 'no_response'].includes(j.status)
  );

  const favorites = jobs.filter((j) => j.isFavorite).slice(0, 3);

  const stats: StatCard[] = [
    { label: 'Total Saved', value: total, icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
    { label: 'Applied', value: applied, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Interviews', value: interviews, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950' },
    { label: 'Offers/Hired', value: hired, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
    { label: 'Rejected', value: rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
    { label: 'Success Rate', value: `${successRate}%`, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
            {user?.name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Here's your job search overview
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950"
        >
          <Plus className="w-4 h-4" /> Add Job
        </button>
      </div>

      {/* Overdue Alert */}
      {overdue.length > 0 && (
        <div className="mb-5 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              {overdue.length} Overdue Application{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
              {overdue.map((j) => j.jobTitle || j.company).join(', ')} — deadline passed
            </p>
          </div>
          <button onClick={() => setActiveTab('jobs')} className="ml-auto text-red-500 hover:text-red-700 text-xs font-medium">
            View →
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-100 dark:border-gray-800 shadow-sm">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Progress */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-slate-100 dark:border-gray-800 shadow-sm mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" /> Application Pipeline
        </h3>
        <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-800">
          {[
            { status: 'wishlist', color: 'bg-slate-400' },
            { status: 'applied', color: 'bg-blue-500' },
            { status: 'interview_scheduled', color: 'bg-yellow-500' },
            { status: 'interview_completed', color: 'bg-purple-500' },
            { status: 'offer', color: 'bg-emerald-500' },
            { status: 'hired', color: 'bg-green-500' },
            { status: 'rejected', color: 'bg-red-500' },
            { status: 'no_response', color: 'bg-gray-400' },
          ].map(({ status, color }) => {
            const count = jobs.filter((j) => j.status === status).length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return pct > 0 ? (
              <div
                key={status}
                className={`${color} h-full transition-all`}
                style={{ width: `${pct}%` }}
                title={`${statusLabel(status as any)}: ${count}`}
              />
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-3">
          {[
            { label: 'Wishlist', color: 'bg-slate-400', status: 'wishlist' },
            { label: 'Applied', color: 'bg-blue-500', status: 'applied' },
            { label: 'Interview', color: 'bg-yellow-500', status: 'interview_scheduled' },
            { label: 'Offer', color: 'bg-emerald-500', status: 'offer' },
            { label: 'Hired', color: 'bg-green-500', status: 'hired' },
            { label: 'Rejected', color: 'bg-red-500', status: 'rejected' },
          ].map(({ label, color, status }) => {
            const count = jobs.filter((j) => j.status === status).length;
            return (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                {label} ({count})
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500" /> Recent Jobs
            </h3>
            <button onClick={() => setActiveTab('jobs')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-gray-800">
            {recent.length === 0 ? (
              <div className="p-8 text-center">
                <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No jobs yet. Add your first one!</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-3 text-indigo-600 text-sm font-medium hover:text-indigo-700"
                >
                  + Add Job
                </button>
              </div>
            ) : (
              recent.map((job) => (
                <div key={job.uuid} className="p-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                        {job.jobTitle || 'Untitled Job'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {job.company} {job.location ? `• ${job.location}` : ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColor(job.status)}`}>
                      {statusLabel(job.status)}
                    </span>
                  </div>
                  {job.closingDate && (
                    <p className={`text-xs mt-1 ${isOverdue(job.closingDate) ? 'text-red-500' : 'text-gray-400'}`}>
                      Deadline: {formatDate(job.closingDate)}
                      {isOverdue(job.closingDate) ? ' ⚠️ Overdue' : ''}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" /> Upcoming Deadlines
              </h3>
            </div>
            <div className="p-2">
              {upcoming.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No upcoming deadlines</p>
              ) : (
                upcoming.map((job) => {
                  const days = daysUntil(job.closingDate);
                  return (
                    <div key={job.uuid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center ${
                        days <= 3 ? 'bg-red-100 dark:bg-red-950' : days <= 7 ? 'bg-orange-100 dark:bg-orange-950' : 'bg-blue-100 dark:bg-blue-950'
                      }`}>
                        <span className={`text-xs font-bold leading-none ${
                          days <= 3 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                          {days}
                        </span>
                        <span className={`text-[9px] ${days <= 3 ? 'text-red-500' : days <= 7 ? 'text-orange-500' : 'text-blue-500'}`}>
                          days
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {job.jobTitle || job.company}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(job.closingDate)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Favorites */}
          {favorites.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" /> Priority Jobs
                </h3>
              </div>
              <div className="p-2">
                {favorites.map((job) => (
                  <div key={job.uuid} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {job.jobTitle || 'Untitled'}
                      </p>
                      <p className="text-xs text-gray-400">{job.company}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(job.status)}`}>
                      {statusLabel(job.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <JobFormModal
          onClose={() => setShowAddModal(false)}
          onSave={() => { fetchJobs(); setShowAddModal(false); }}
        />
      )}
    </div>
  );
}
