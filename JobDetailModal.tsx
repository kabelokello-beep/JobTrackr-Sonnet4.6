import { useState } from 'react';
import type { JobRecord, JobStatus } from '../db/database';
import {
  X, Edit3, Trash2, Star, MapPin, Calendar, ExternalLink,
  Briefcase, Tag, CheckSquare, Square, Bell, FileText,
  ChevronRight, Image, AlertTriangle, TrendingUp
} from 'lucide-react';
import { statusLabel, statusColor, statusDotColor, formatDate, isOverdue, daysUntil } from '../utils/helpers';
import toast from 'react-hot-toast';
import { db } from '../db/database';

interface Props {
  job: JobRecord;
  onClose: () => void;
  onEdit: (job: JobRecord) => void;
  onDelete: () => void;
  onStatusChange: (status: JobStatus) => void;
}

const PIPELINE_STEPS: { status: JobStatus; label: string; emoji: string }[] = [
  { status: 'wishlist', label: 'Wishlist', emoji: '⭐' },
  { status: 'applied', label: 'Applied', emoji: '📤' },
  { status: 'interview_scheduled', label: 'Interview', emoji: '📅' },
  { status: 'offer', label: 'Offer', emoji: '🎉' },
  { status: 'rejected', label: 'Rejected', emoji: '❌' },
];

type TabId = 'overview' | 'jd' | 'lessons' | 'comparison' | 'source';

export default function JobDetailModal({ job, onClose, onEdit, onDelete, onStatusChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const handleDelete = async () => {
    if (!confirm(`Delete "${job.jobTitle || job.company}"? This cannot be undone.`)) return;
    if (job.id) await db.jobs.delete(job.id);
    toast.success('Job deleted');
    onDelete();
  };

  const stepIndex = PIPELINE_STEPS.findIndex((s) => s.status === job.status);
  const currentStep = Math.max(0, stepIndex);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(job.status)}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor(job.status)}`} />
                  {statusLabel(job.status)}
                </span>
                {job.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                {isOverdue(job.closingDate) && (
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    <AlertTriangle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>
              <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                {job.jobTitle || 'Untitled Job'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {job.company} {job.location ? `• ${job.location}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => onEdit(job)} className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pipeline */}
          <div className="mt-4">
            <div className="flex items-center">
              {PIPELINE_STEPS.map((step, i) => (
                <div key={step.status} className="flex items-center flex-1">
                  <button
                    onClick={() => onStatusChange(step.status)}
                    className={`flex flex-col items-center gap-1 flex-shrink-0 group`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      i < currentStep
                        ? 'bg-indigo-600 text-white'
                        : i === currentStep
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900'
                        : 'bg-slate-100 dark:bg-gray-800 text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                    }`}>
                      {step.emoji}
                    </div>
                    <span className={`text-[9px] font-medium hidden sm:block ${
                      i <= currentStep ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </button>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-gray-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 dark:border-gray-800 flex-shrink-0 px-2">
          {(['overview', 'jd', 'lessons', 'comparison', 'source'] as TabId[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab === 'jd' ? 'Job Description' : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Industry', value: job.industry, icon: Briefcase },
                  { label: 'Location', value: job.location, icon: MapPin },
                  { label: 'Salary', value: job.salary, icon: null },
                  { label: 'Source', value: job.sourceType, icon: null },
                  { label: 'Application Date', value: formatDate(job.applicationDate), icon: Calendar },
                  { label: 'Closing Date', value: formatDate(job.closingDate), icon: Calendar },
                  { label: 'Contact', value: job.contactPerson, icon: null },
                  { label: 'Apply Via', value: job.applicationMethod, icon: null },
                ].filter(item => item.value).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
                      {label === 'Closing Date' && isOverdue(job.closingDate)
                        ? <span className="text-red-500">{value} ⚠️</span>
                        : value}
                    </p>
                  </div>
                ))}
              </div>

              {job.website && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Job Listing URL</p>
                  <a href={job.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline truncate">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" /> {job.website}
                  </a>
                </div>
              )}

              {job.tags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <span key={t} className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {job.checklist.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Checklist</p>
                  <div className="space-y-1.5">
                    {job.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.done
                          ? <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          : <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        <span className={item.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {job.reminders.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Bell className="w-3 h-3" /> Reminders
                  </p>
                  {job.reminders.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Bell className="w-3.5 h-3.5 text-indigo-500" />
                      {r.timing === '1_day' ? '1 Day Before Deadline'
                        : r.timing === '3_days' ? '3 Days Before Deadline'
                        : r.timing === '1_week' ? '1 Week Before Deadline'
                        : `Custom: ${r.customDate || 'Not set'}`}
                    </div>
                  ))}
                </div>
              )}

              {job.notes && (
                <div>
                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Notes
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-3 whitespace-pre-wrap">
                    {job.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* JD */}
          {activeTab === 'jd' && (
            <div className="space-y-4">
              {job.qualificationsRequired && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Qualifications Required</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-3 whitespace-pre-wrap">
                    {job.qualificationsRequired}
                  </p>
                </div>
              )}
              {job.experienceRequired && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Experience Required</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-3 whitespace-pre-wrap">
                    {job.experienceRequired}
                  </p>
                </div>
              )}
              {job.keyResponsibilities && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Key Responsibilities</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-3 whitespace-pre-wrap">
                    {job.keyResponsibilities}
                  </p>
                </div>
              )}
              {!job.qualificationsRequired && !job.experienceRequired && !job.keyResponsibilities && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No job description saved yet.</p>
                  <button onClick={() => onEdit(job)} className="mt-2 text-indigo-600 text-sm hover:text-indigo-700">
                    Add JD Details →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LESSONS */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  Reflect and grow from every application experience
                </p>
              </div>
              {[
                { key: 'whatWentWell', label: 'What Went Well' },
                { key: 'whatWentWrong', label: 'What Went Wrong' },
                { key: 'improvementsNextTime', label: 'Improvements for Next Time' },
                { key: 'strengthsShown', label: 'Strengths Shown' },
                { key: 'weaknessesGaps', label: 'Weaknesses / Skill Gaps' },
                { key: 'followUpActions', label: 'Follow-up Actions' },
                { key: 'interviewFeedback', label: 'Interview Feedback' },
              ].map(({ key, label }) => {
                const value = (job.lessonsLearned as Record<string, string>)[key];
                if (!value) return null;
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-3 whitespace-pre-wrap">
                      {value}
                    </p>
                  </div>
                );
              })}
              {!Object.values(job.lessonsLearned).some(Boolean) && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No lessons recorded yet.</p>
                  <button onClick={() => onEdit(job)} className="mt-2 text-indigo-600 text-sm hover:text-indigo-700">
                    Add Lessons →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              {[
                { key: 'whoGotHired', label: 'Who Got Hired' },
                { key: 'theirBackground', label: 'Their Background' },
                { key: 'whatDifferentiated', label: 'What Differentiated Them' },
                { key: 'skillsTheyHad', label: 'Skills They Had' },
                { key: 'experienceLevelFit', label: 'Experience / Industry Fit' },
                { key: 'myComparisonNotes', label: 'My Analysis Notes' },
              ].map(({ key, label }) => {
                const value = (job.outcomeComparison as Record<string, string>)[key];
                if (!value) return null;
                return (
                  <div key={key}>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-3 whitespace-pre-wrap">
                      {value}
                    </p>
                  </div>
                );
              })}
              {!Object.values(job.outcomeComparison).some(Boolean) && (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">No comparison notes yet.</p>
                  <button onClick={() => onEdit(job)} className="mt-2 text-indigo-600 text-sm hover:text-indigo-700">
                    Add Comparison →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SOURCE */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              {job.sourceImage && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Image className="w-3 h-3" /> Original Flyer / Screenshot
                  </p>
                  <img src={job.sourceImage} alt="Job source" className="rounded-xl border border-slate-200 dark:border-gray-700 max-w-full" />
                  {job.sourceImageName && (
                    <p className="text-xs text-gray-400 mt-1">{job.sourceImageName}</p>
                  )}
                </div>
              )}
              {job.sourceText && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Extracted / Pasted Text
                  </p>
                  <pre className="text-xs text-gray-700 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 rounded-xl p-4 whitespace-pre-wrap overflow-auto max-h-96">
                    {job.sourceText}
                  </pre>
                </div>
              )}
              {!job.sourceImage && !job.sourceText && (
                <div className="text-center py-12 text-gray-400">
                  <Image className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No source file saved.</p>
                  <button onClick={() => onEdit(job)} className="mt-2 text-indigo-600 text-sm hover:text-indigo-700">
                    Upload Source →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50/50 dark:bg-gray-900 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-400">
            Added {formatDate(job.createdAt)}
            {job.updatedAt !== job.createdAt ? ` • Updated ${formatDate(job.updatedAt)}` : ''}
          </p>
          <button
            onClick={() => onEdit(job)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Job
          </button>
        </div>
      </div>
    </div>
  );
}
