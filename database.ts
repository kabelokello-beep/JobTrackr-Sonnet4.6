import Dexie, { type Table } from 'dexie';

export type JobStatus =
  | 'wishlist'
  | 'applied'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer'
  | 'rejected'
  | 'hired'
  | 'no_response';

export type SourceType =
  | 'LinkedIn'
  | 'Company Site'
  | 'Flyer'
  | 'WhatsApp'
  | 'Email'
  | 'Instagram'
  | 'Facebook'
  | 'Indeed'
  | 'Glassdoor'
  | 'Other';

export type ReminderTiming = '1_day' | '3_days' | '1_week' | 'apply_by' | 'custom';

export type ContactRole =
  | 'Hiring Manager'
  | 'Recruiter'
  | 'Internal Contact'
  | 'Referral'
  | 'Other';

export type ApplicationEffort = 'bespoke' | 'quick_apply' | 'template' | '';

export interface Contact {
  id: string;
  name: string;
  role: ContactRole;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  timing: ReminderTiming;
  customDate?: string;
  note?: string;
  triggered?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface LessonsLearned {
  whatWentWell?: string;
  whatWentWrong?: string;
  improvementsNextTime?: string;
  strengthsShown?: string;
  weaknessesGaps?: string;
  followUpActions?: string;
  interviewFeedback?: string;
}

export interface OutcomeComparison {
  whoGotHired?: string;
  theirBackground?: string;
  whatDifferentiated?: string;
  skillsTheyHad?: string;
  experienceLevelFit?: string;
  myComparisonNotes?: string;
}

export interface JobRecord {
  id?: number;
  uuid: string;

  // Basic Info
  jobTitle: string;
  company: string;
  industry: string;
  location: string;
  website: string;
  sourceType: SourceType;
  sourceImage?: string;
  sourceImageName?: string;
  sourceText?: string;

  // JD Details
  qualificationsRequired: string;
  experienceRequired: string;
  keyResponsibilities: string;
  salary: string;
  contactPerson: string;
  applicationMethod: string;

  // Dates
  closingDate: string;
  applicationDate: string;

  // Status & Organisation
  status: JobStatus;
  isFavorite: boolean;
  isArchived: boolean;
  tags: string[];
  notes: string;

  // Tracking
  reminders: Reminder[];
  checklist: ChecklistItem[];

  // CRM
  contacts: Contact[];

  // Energy / ROI
  hoursSpent: number;
  applicationEffort: ApplicationEffort;

  // Analysis
  lessonsLearned: LessonsLearned;
  outcomeComparison: OutcomeComparison;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  avatarInitials: string;
  isGuest: boolean;
  createdAt: string;
}

class JobTrackrDB extends Dexie {
  jobs!: Table<JobRecord>;
  users!: Table<UserProfile>;

  constructor() {
    super('JobTrackrDB');
    this.version(1).stores({
      jobs: '++id, uuid, status, company, industry, closingDate, applicationDate, isFavorite, isArchived, createdAt',
      users: '++id, email',
    });
    // Version 2: adds contacts, hoursSpent, applicationEffort (no new indexes needed)
    this.version(2).stores({
      jobs: '++id, uuid, status, company, industry, closingDate, applicationDate, isFavorite, isArchived, createdAt',
      users: '++id, email',
    });
  }
}

export const db = new JobTrackrDB();

export const getAllJobs = async (includeArchived = false): Promise<JobRecord[]> => {
  if (includeArchived) return db.jobs.toArray();
  return db.jobs.where('isArchived').equals(0).toArray();
};

export const addJob = async (job: Omit<JobRecord, 'id'>): Promise<number> => {
  return db.jobs.add(job as JobRecord);
};

export const updateJob = async (id: number, updates: Partial<JobRecord>): Promise<number> => {
  return db.jobs.update(id, { ...updates, updatedAt: new Date().toISOString() });
};

export const deleteJob = async (id: number): Promise<void> => {
  return db.jobs.delete(id);
};

export const getJobByUuid = async (uuid: string): Promise<JobRecord | undefined> => {
  return db.jobs.where('uuid').equals(uuid).first();
};
