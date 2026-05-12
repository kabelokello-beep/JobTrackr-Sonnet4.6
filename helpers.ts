import { v4 as uuidv4 } from 'uuid';
import { format, isBefore, differenceInDays } from 'date-fns';
import type { JobRecord, JobStatus } from '../db/database';

export const generateUUID = (): string => uuidv4();

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy'); } catch { return dateStr; }
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '—';
  try { return format(new Date(dateStr), 'dd MMM yyyy, HH:mm'); } catch { return dateStr; }
};

export const isOverdue = (dateStr: string): boolean => {
  if (!dateStr) return false;
  try { return isBefore(new Date(dateStr), new Date()); } catch { return false; }
};

export const daysUntil = (dateStr: string): number => {
  if (!dateStr) return Infinity;
  try { return differenceInDays(new Date(dateStr), new Date()); } catch { return Infinity; }
};

export const isUpcoming = (dateStr: string, days: number): boolean => {
  if (!dateStr) return false;
  const d = daysUntil(dateStr);
  return d >= 0 && d <= days;
};

export const statusLabel = (status: JobStatus): string => {
  const map: Record<JobStatus, string> = {
    wishlist: 'Wishlist', applied: 'Applied',
    interview_scheduled: 'Interview Scheduled', interview_completed: 'Interview Done',
    offer: 'Offer Received', rejected: 'Rejected', hired: 'Hired', no_response: 'No Response',
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
    wishlist: 'bg-slate-400', applied: 'bg-blue-500',
    interview_scheduled: 'bg-yellow-500', interview_completed: 'bg-purple-500',
    offer: 'bg-emerald-500', rejected: 'bg-red-500', hired: 'bg-green-500', no_response: 'bg-gray-400',
  };
  return map[status] || 'bg-gray-400';
};

export const createEmptyJob = (): Omit<JobRecord, 'id'> => ({
  uuid: generateUUID(),
  jobTitle: '', company: '', industry: '', location: '', website: '',
  sourceType: 'Other', sourceImage: undefined, sourceImageName: undefined, sourceText: undefined,
  qualificationsRequired: '', experienceRequired: '', keyResponsibilities: '',
  salary: '', contactPerson: '', applicationMethod: '',
  closingDate: '', applicationDate: '',
  status: 'wishlist', isFavorite: false, isArchived: false,
  tags: [], notes: '', reminders: [], checklist: [],
  contacts: [], hoursSpent: 0, applicationEffort: '',
  lessonsLearned: {}, outcomeComparison: {},
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
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

// ── Gamification ──────────────────────────────────────────────────

export const getWeekKey = (date: Date = new Date()): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
};

export const getPrevWeekKey = (weekKey: string): string => {
  const [year, weekStr] = weekKey.split('-W');
  const week = parseInt(weekStr);
  const y = parseInt(year);
  return week <= 1 ? `${y - 1}-W52` : `${y}-W${(week - 1).toString().padStart(2, '0')}`;
};

export const calculateStreakFromWeeks = (activeWeeks: string[]): number => {
  const current = getWeekKey();
  const prev = getPrevWeekKey(current);
  const start = activeWeeks.includes(current) ? current : activeWeeks.includes(prev) ? prev : null;
  if (!start) return 0;
  let streak = 0;
  let check = start;
  while (activeWeeks.includes(check)) { streak++; check = getPrevWeekKey(check); }
  return streak;
};

export interface LevelInfo {
  level: number; title: string; minXP: number; maxXP: number; emoji: string;
}

export const LEVEL_TABLE: LevelInfo[] = [
  { level: 1, title: 'Explorer',    minXP: 0,    maxXP: 99,    emoji: '🔭' },
  { level: 2, title: 'Applicant',   minXP: 100,  maxXP: 299,   emoji: '📄' },
  { level: 3, title: 'Networker',   minXP: 300,  maxXP: 599,   emoji: '🤝' },
  { level: 4, title: 'Strategist',  minXP: 600,  maxXP: 999,   emoji: '🎯' },
  { level: 5, title: 'Operator',    minXP: 1000, maxXP: 1499,  emoji: '⚙️' },
  { level: 6, title: 'Closer',      minXP: 1500, maxXP: 2499,  emoji: '🔑' },
  { level: 7, title: 'Momentum',    minXP: 2500, maxXP: 3999,  emoji: '🚀' },
  { level: 8, title: 'Unstoppable', minXP: 4000, maxXP: 99999, emoji: '⚡' },
];

export const getLevel = (xp: number): LevelInfo => {
  for (let i = LEVEL_TABLE.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_TABLE[i].minXP) return LEVEL_TABLE[i];
  }
  return LEVEL_TABLE[0];
};

export const calculateXP = (jobs: JobRecord[], missionXP: number = 0): number => {
  let xp = missionXP;
  for (const job of jobs) {
    xp += 5;
    if (job.status !== 'wishlist') xp += 20;
    if (['interview_scheduled', 'interview_completed'].includes(job.status)) xp += 30;
    if (['offer', 'hired'].includes(job.status)) xp += 50;
    if (job.lessonsLearned?.whatWentWell || job.lessonsLearned?.whatWentWrong) xp += 10;
    if ((job.contacts?.length || 0) > 0) xp += 8;
    if (job.keyResponsibilities && job.qualificationsRequired) xp += 5;
    if ((job.reminders?.length || 0) > 0) xp += 3;
    xp += Math.min((job.checklist?.filter(c => c.done).length || 0) * 2, 10);
  }
  return xp;
};

export interface BadgeDef {
  id: string; name: string; emoji: string; desc: string; earned: boolean;
}

export const calculateBadges = (jobs: JobRecord[]): BadgeDef[] => {
  const applied = jobs.filter(j => j.status !== 'wishlist');
  const totalContacts = jobs.reduce((sum, j) => sum + (j.contacts?.length || 0), 0);
  return [
    { id: 'first_save',      name: 'First Steps',      emoji: '🎯', desc: 'Saved your first job',                        earned: jobs.length >= 1 },
    { id: 'first_apply',     name: 'First Application', emoji: '📤', desc: 'Submitted your first application',            earned: applied.length >= 1 },
    { id: 'pipeline_5',      name: 'Pipeline Builder',  emoji: '💼', desc: 'Tracking 5 or more jobs',                     earned: jobs.length >= 5 },
    { id: 'first_interview', name: 'Interview Ready',   emoji: '📅', desc: 'Scheduled your first interview',              earned: jobs.some(j => ['interview_scheduled','interview_completed'].includes(j.status)) },
    { id: 'connector',       name: 'Connector',         emoji: '🤝', desc: 'Added your first contact',                   earned: totalContacts >= 1 },
    { id: 'reflector',       name: 'Reflector',         emoji: '🎓', desc: 'Filled in Lessons Learned on a job',          earned: jobs.some(j => !!(j.lessonsLearned?.whatWentWell || j.lessonsLearned?.whatWentWrong)) },
    { id: 'tenacious',       name: 'Tenacious',         emoji: '💪', desc: '10 applications submitted',                  earned: applied.length >= 10 },
    { id: 'super_connector', name: 'Super Connector',   emoji: '🌟', desc: '5 contacts added across jobs',               earned: totalContacts >= 5 },
    { id: 'closer',          name: 'Closer',            emoji: '🏆', desc: 'Received an offer or got hired',             earned: jobs.some(j => ['offer','hired'].includes(j.status)) },
    { id: 'thorough',        name: 'Thorough',          emoji: '📋', desc: 'Completed all key fields on a job',           earned: jobs.some(j => !!(j.jobTitle && j.company && j.keyResponsibilities && j.qualificationsRequired)) },
  ];
};

export interface Mission {
  id: string;
  pillar: 'hunt' | 'connect' | 'build' | 'reflect';
  day: string;
  title: string;
  desc: string;
  microDesc: string;
  xp: number;
}

export const WEEKLY_MISSIONS: Mission[] = [
  { id: 'h1', pillar: 'hunt',    day: 'Mon', xp: 10, title: 'Target Companies',    desc: 'Identify 3 companies from Jobs4BW, Botswajob.com, or LinkedIn and save their roles',           microDesc: 'Save 1 interesting job posting from any board' },
  { id: 'h2', pillar: 'hunt',    day: 'Tue', xp: 20, title: 'Tailored Application', desc: 'Submit 1 tailored application with a customised cover message — quality beats quantity',       microDesc: 'Open 1 job posting and read the full JD carefully' },
  { id: 'h3', pillar: 'hunt',    day: 'Fri', xp: 20, title: 'Apply or Follow Up',   desc: 'Submit 1 more application OR send a polite follow-up on a pending one (7–10 days old)',       microDesc: 'Send 1 brief follow-up on a pending application' },
  { id: 'c1', pillar: 'connect', day: 'Wed', xp: 15, title: 'Network Outreach',     desc: 'Send 1 personalised message to a UB alumni, LinkedIn contact, or hiring manager at Mascom, BBS Bank, or Debswana', microDesc: 'Comment thoughtfully on 1 industry post on LinkedIn' },
  { id: 'c2', pillar: 'connect', day: 'Thu', xp: 25, title: 'Human Touchpoint',     desc: 'Attend 1 event (Botswana Innovation Hub, BOBS talks, CBD mixer) OR have a 15-min informational call', microDesc: 'Join 1 LinkedIn group in your target industry' },
  { id: 'b1', pillar: 'build',   day: 'Wed', xp: 15, title: 'Skill Session',        desc: 'Spend 30 mins on a targeted skill — Coursera cert, Power BI, stakeholder writing, or bilingual interview prep (Setswana + English)', microDesc: 'Watch 1 ten-minute career skills video' },
  { id: 'b2', pillar: 'build',   day: 'Thu', xp: 10, title: 'Profile Update',       desc: 'Refresh your CV, LinkedIn headline, or portfolio with one concrete measurable addition',     microDesc: 'Update 1 CV bullet to include a metric or outcome' },
  { id: 'r1', pillar: 'reflect', day: 'Mon', xp: 10, title: 'Set Week Targets',     desc: 'Define your 3 priorities for the week — which roles, companies, and skills you are targeting', microDesc: 'Write down 1 thing you want to achieve this week' },
  { id: 'r2', pillar: 'reflect', day: 'Sat', xp: 10, title: 'Numbers Review',       desc: 'Check applications sent, responses received, interviews booked. If response rate is under 10% for 2 weeks, revisit keywords', microDesc: 'Count how many jobs you applied to this week' },
  { id: 'r3', pillar: 'reflect', day: 'Sun', xp: 5,  title: 'Rest & Reset',         desc: 'Note 1 win and 1 lesson from this week. No job applications today — rest sustains momentum', microDesc: 'Write 1 sentence about what went well this week' },
];

export const PILLAR_CONFIG: Record<string, { label: string; emoji: string; colorClass: string; desc: string }> = {
  hunt:    { label: 'Hunt',    emoji: '🎯', colorClass: 'indigo', desc: 'Applications & targeting' },
  connect: { label: 'Connect', emoji: '🤝', colorClass: 'blue',   desc: 'Networking & relationships' },
  build:   { label: 'Build',   emoji: '🛠️', colorClass: 'emerald', desc: 'Skills & portfolio' },
  reflect: { label: 'Reflect', emoji: '🧠', colorClass: 'purple', desc: 'Strategy & rest' },
};

export const MISSION_TOTAL_XP = WEEKLY_MISSIONS.reduce((s, m) => s + m.xp, 0);
