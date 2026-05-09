import { v4 as uuidv4 } from 'uuid';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';
import type { JobRecord, JobStatus } from '../db/database';

export const generateUUID = (): string => uuidv4();

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, HH:mm');
  } catch {
    return dateStr;
  }
};

export const isOverdue = (dateStr: string): boolean => {
  if (!dateStr) return false;
  try {
    return isBefore(new Date(dateStr), new Date());
  } catch {
    return false;
  }
};

export const daysUntil = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  try {
    return differenceInDays(new Date(dateStr), new Date());
  } catch {
    return Infinity;
  }
};

export const isUpcoming = (dateStr: string, days: number): boolean => {
  if (!dateStr) return false;
  const d = daysUntil(dateStr);
  return d >= 0 && d <= days;
};

export const statusLabel = (status: JobStatus): string => {
  const map: Record<JobStatus, string> = {
    wishlist: 'Wishlist',
    applied: 'Applied',
    interview_scheduled: 'Interview Scheduled',
    interview_completed: 'Interview Done',
    offer: 'Offer Received',
    rejected: 'Rejected',
    hired: 'Hired',
    no_response: 'No Response',
  };
  return map[status] || status;
};

export const statusColor = (status: JobStatus): string => {
  const map: Record<JobStatus, string> = {
    wishlist: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    applied: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    interview_scheduled: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
    interview_completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
    offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
    hired: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    no_response: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

export const statusDotColor = (status: JobStatus): string => {
  const map: Record<JobStatus, string> = {
    wishlist: 'bg-slate-400',
    applied: 'bg-blue-500',
    interview_scheduled: 'bg-yellow-500',
    interview_completed: 'bg-purple-500',
    offer: 'bg-emerald-500',
    rejected: 'bg-red-500',
    hired: 'bg-green-500',
    no_response: 'bg-gray-400',
  };
  return map[status] || 'bg-gray-400';
};

export const createEmptyJob = (): Omit<JobRecord, 'id'> => ({
  uuid: generateUUID(),
  jobTitle: '',
  company: '',
  industry: '',
  location: '',
  website: '',
  sourceType: 'Other',
  sourceImage: undefined,
  sourceImageName: undefined,
  sourceText: undefined,
  qualificationsRequired: '',
  experienceRequired: '',
  keyResponsibilities: '',
  salary: '',
  contactPerson: '',
  applicationMethod: '',
  closingDate: '',
  applicationDate: '',
  status: 'wishlist',
  isFavorite: false,
  isArchived: false,
  tags: [],
  notes: '',
  reminders: [],
  checklist: [],
  contacts: [],
  hoursSpent: 0,
  applicationEffort: '',
  lessonsLearned: {},
  outcomeComparison: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const exportToCSV = (jobs: JobRecord[]): void => {
  const headers = [
    'Job Title', 'Company', 'Industry', 'Location', 'Status', 'Source',
    'Salary', 'Closing Date', 'Application Date', 'Contact', 'Notes', 'Tags',
    'Hours Spent', 'Effort Level',
  ];
  const rows = jobs.map((j) => [
    j.jobTitle, j.company, j.industry, j.location, statusLabel(j.status), j.sourceType,
    j.salary, j.closingDate, j.applicationDate, j.contactPerson, j.notes, j.tags.join(';'),
    j.hoursSpent ?? 0, j.applicationEffort ?? '',
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobtrackr_export_${format(new Date(), 'yyyyMMdd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export const exportToJSON = (jobs: JobRecord[]): void => {
  const json = JSON.stringify(jobs, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jobtrackr_backup_${format(new Date(), 'yyyyMMdd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const ALL_INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Engineering',
  'Marketing', 'Sales', 'Human Resources', 'Legal', 'Consulting',
  'Retail', 'Manufacturing', 'Construction', 'Transportation', 'Media',
  'Non-Profit', 'Government', 'Hospitality', 'Real Estate', 'Other',
];

export const ALL_STATUSES: JobStatus[] = [
  'wishlist', 'applied', 'interview_scheduled', 'interview_completed',
  'offer', 'rejected', 'hired', 'no_response',
];
