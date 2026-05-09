import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import toast from 'react-hot-toast';
import {
  X, Upload, Image, Scan, FileText, Plus, Trash2,
  Star, Loader2, AlertCircle, CheckSquare, Square,
  Link, Tag, Bell, Users, UserPlus, Mail, Phone,
  Clock, Zap, ExternalLink,
} from 'lucide-react';
import { db } from '../db/database';
import type {
  JobRecord, JobStatus, SourceType, ChecklistItem,
  Reminder, Contact, ContactRole, ApplicationEffort,
} from '../db/database';
import { createEmptyJob, ALL_INDUSTRIES } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  job?: JobRecord;
  onClose: () => void;
  onSave: () => void;
}

const SOURCE_TYPES: SourceType[] = [
  'LinkedIn', 'Company Site', 'Flyer', 'WhatsApp',
  'Email', 'Instagram', 'Facebook', 'Indeed', 'Glassdoor', 'Other',
];

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: 'wishlist', label: '⭐ Wishlist' },
  { value: 'applied', label: '📤 Applied' },
  { value: 'interview_scheduled', label: '📅 Interview Scheduled' },
  { value: 'interview_completed', label: '✅ Interview Done' },
  { value: 'offer', label: '🎉 Offer Received' },
  { value: 'rejected', label: '❌ Rejected' },
  { value: 'hired', label: '🏆 Hired' },
  { value: 'no_response', label: '🔕 No Response' },
];

const CONTACT_ROLES: ContactRole[] = [
  'Hiring Manager', 'Recruiter', 'Internal Contact', 'Referral', 'Other',
];

const EFFORT_OPTIONS: { value: ApplicationEffort; label: string; desc: string }[] = [
  { value: 'bespoke', label: '🎯 Bespoke', desc: 'Fully tailored application' },
  { value: 'template', label: '📋 Template', desc: 'Adapted from a base template' },
  { value: 'quick_apply', label: '⚡ Quick Apply', desc: 'Minimal customisation' },
];

type TabId = 'details' | 'jd' | 'tracking' | 'lessons' | 'comparison' | 'contacts' | 'reminders';

const TABS: { id: TabId; label: string }[] = [
  { id: 'details', label: 'Job Details' },
  { id: 'jd', label: 'JD & Source' },
  { id: 'tracking', label: 'Tracking' },
  { id: 'lessons', label: 'Lessons' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'reminders', label: 'Reminders' },
];

const EMPTY_CONTACT: Omit<Contact, 'id'> = {
  name: '', role: 'Other', email: '', phone: '', linkedin: '', notes: '',
};

// Filters out short/garbled OCR lines (noise from image scanning)
const cleanOCRText = (raw: string): string => {
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => {
      if (l.length < 4) return false;
      const alphaCount = (l.match(/[a-zA-Z]/g) || []).length;
      return alphaCount / l.length >= 0.35;
    })
    .join('\n');
};

export default function JobFormModal({ job, onClose, onSave }: Props) {
  const isEdit = !!job;
  const [activeTab, setActiveTab] = useState<TabId>('details');

  // Merge new field defaults so old records without them don't crash
  const [form, setForm] = useState<Omit<JobRecord, 'id'>>(
    job
      ? { contacts: [], hoursSpent: 0, applicationEffort: '', ...job }
      : { ...createEmptyJob(), contacts: [], hoursSpent: 0, applicationEffort: '' }
  );

  const [saving, setSaving] = useState(false);
  const [ocring, setOcring] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [pasteText, setPasteText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [imgPreview, setImgPreview] = useState<string | null>(job?.sourceImage || null);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id'>>(EMPTY_CONTACT);
  const [showContactForm, setShowContactForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof Omit<JobRecord, 'id'>, v: unknown) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setLessons = (k: string, v: string) =>
    setForm((p) => ({ ...p, lessonsLearned: { ...p.lessonsLearned, [k]: v } }));

  const setOutcome = (k: string, v: string) =>
    setForm((p) => ({ ...p, outcomeComparison: { ...p.outcomeComparison, [k]: v } }));

  // ── OCR ──────────────────────────────────────────────────────────────────
  const extractFieldsFromOCR = (rawText: string) => {
    const text = rawText;
    const cleaned = cleanOCRText(rawText);
    const lines = cleaned.split('\n').filter(Boolean);
    const lower = cleaned.toLowerCase();

    // Job title
    const titlePatterns = [
      /(?:position|job title|role|vacancy)[:\s]+([^\n]+)/i,
      /(?:we are hiring|hiring for|looking for)[:\s]+([^\n]+)/i,
    ];
    for (const pattern of titlePatterns) {
      const m = text.match(pattern);
      if (m) { setForm((p) => ({ ...p, jobTitle: p.jobTitle || m[1].trim().slice(0, 80) })); break; }
    }
    if (lines[0]) {
      setForm((p) => ({ ...p, jobTitle: p.jobTitle || lines[0].slice(0, 80) }));
    }

    // Company
    const companyMatch = text.match(/(?:company|organisation|organization|employer)[:\s]+([^\n]+)/i);
    if (companyMatch) setForm((p) => ({ ...p, company: p.company || companyMatch[1].trim().slice(0, 80) }));

    // Location
    const locationMatch = text.match(/(?:location|based in|city|address)[:\s]+([^\n]+)/i);
    if (locationMatch) setForm((p) => ({ ...p, location: p.location || locationMatch[1].trim().slice(0, 80) }));

    // Salary
    const salaryMatch =
      text.match(/(?:salary|package|remuneration|ctc|compensation)[:\s]+([^\n]+)/i) ||
      text.match(/(?:r\s*[\d,]+\s*(?:k|000)?|\$[\d,]+|£[\d,]+)\s*(?:per\s+(?:month|annum|year))?/i);
    if (salaryMatch)
      setForm((p) => ({ ...p, salary: p.salary || (salaryMatch[1] || salaryMatch[0]).trim().slice(0, 100) }));

    // Closing date
    const deadlineMatch = text.match(
      /(?:closing date|deadline|apply by|applications close|close on)[:\s]+([^\n]+)/i
    );
    if (deadlineMatch) {
      const dateObj = new Date(deadlineMatch[1].trim());
      if (!isNaN(dateObj.getTime()))
        setForm((p) => ({ ...p, closingDate: p.closingDate || dateObj.toISOString().split('T')[0] }));
    }

    // Email
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) setForm((p) => ({ ...p, contactPerson: p.contactPerson || emailMatch[0] }));

    // Website
    const urlMatch = text.match(/(?:https?:\/\/|www\.)[^\s\n]+/);
    if (urlMatch) setForm((p) => ({ ...p, website: p.website || urlMatch[0] }));

    // Qualifications
    const qualMatch = text.match(/(?:qualifications?|requirements?|education|degree)[:\s]+([^\n]{10,200})/i);
    if (qualMatch) setForm((p) => ({ ...p, qualificationsRequired: p.qualificationsRequired || qualMatch[1].trim() }));

    // Experience
    const expMatch =
      text.match(/(?:experience)[:\s]+([^\n]{5,100})/i) ||
      text.match(/(\d+[\+]?\s*(?:years?|yrs?)\s+(?:of\s+)?experience)/i);
    if (expMatch)
      setForm((p) => ({ ...p, experienceRequired: p.experienceRequired || (expMatch[1] || expMatch[0]).trim() }));

    // Responsibilities — only from clean text
    const respMatch = cleaned.match(
      /(?:responsibilities|duties|key responsibilities|role overview|job description)[:\s]+([\s\S]{20,500}?)(?:\n\n|qualifications?|requirements?|$)/i
    );
    if (respMatch)
      setForm((p) => ({ ...p, keyResponsibilities: p.keyResponsibilities || respMatch[1].trim() }));

    // Application method
    const applyMatch = text.match(/(?:apply|send cv|submit)[:\s]+([^\n]+)/i);
    if (applyMatch)
      setForm((p) => ({ ...p, applicationMethod: p.applicationMethod || applyMatch[1].trim().slice(0, 200) }));

    // Industry detection
    const industryKeywords: Record<string, string> = {
      'software|developer|engineer|tech|it|programming': 'Technology',
      'nurse|doctor|hospital|health|medical|clinical': 'Healthcare',
      'finance|bank|accounting|audit|insurance': 'Finance',
      'teacher|school|education|lecturer|tutor': 'Education',
      'marketing|brand|social media|digital': 'Marketing',
      'sales|business development|account manager': 'Sales',
      'hr|human resources|recruitment|talent': 'Human Resources',
      'legal|law|attorney|advocate': 'Legal',
      'civil|mechanical|electrical|construction': 'Engineering',
    };
    for (const [pattern, industry] of Object.entries(industryKeywords)) {
      if (new RegExp(pattern, 'i').test(lower)) {
        setForm((p) => ({ ...p, industry: p.industry || industry }));
        break;
      }
    }

    // Fallback: only use cleaned text if there's enough of it to be meaningful
    const cleanedLines = lines.filter((l) => l.length > 10);
    if (cleanedLines.length > 3) {
      setForm((p) => ({
        ...p,
        keyResponsibilities: p.keyResponsibilities || cleanedLines.join('\n').slice(0, 1000),
      }));
    }
  };

  const processImage = async (file: File) => {
    setOcring(true);
    setOcrProgress(0);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setImgPreview(base64);
      set('sourceImage', base64);
      set('sourceImageName', file.name);
      try {
        const result = await Tesseract.recognize(base64, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text')
              setOcrProgress(Math.round(m.progress * 100));
          },
        });
        const text = result.data.text;
        set('sourceText', text);
        extractFieldsFromOCR(text);
        toast.success('OCR complete — review and clean up extracted fields');
      } catch {
        toast.error('OCR failed — paste the job text manually instead');
      }
      setOcring(false);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) processImage(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  const handlePasteExtract = () => {
    if (!pasteText.trim()) return;
    set('sourceText', pasteText);
    extractFieldsFromOCR(pasteText);
    toast.success('Fields extracted from text!');
  };

  // ── Tags ─────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = newTag.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setNewTag('');
  };
  const removeTag = (t: string) => set('tags', form.tags.filter((x) => x !== t));

  // ── Checklist ────────────────────────────────────────────────────────────
  const addCheckItem = () => {
    const t = newCheckItem.trim();
    if (t) {
      const item: ChecklistItem = { id: uuidv4(), text: t, done: false };
      set('checklist', [...form.checklist, item]);
      setNewCheckItem('');
    }
  };
  const toggleCheck = (id: string) =>
    set('checklist', form.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  const removeCheck = (id: string) =>
    set('checklist', form.checklist.filter((c) => c.id !== id));

  // ── Contacts ─────────────────────────────────────────────────────────────
  const contacts = form.contacts ?? [];

  const addContact = () => {
    if (!newContact.name.trim()) {
      toast.error('Contact name is required');
      return;
    }
    const contact: Contact = { id: uuidv4(), ...newContact };
    set('contacts', [...contacts, contact]);
    setNewContact(EMPTY_CONTACT);
    setShowContactForm(false);
  };

  const removeContact = (id: string) =>
    set('contacts', contacts.filter((c) => c.id !== id));

  // ── Reminders ────────────────────────────────────────────────────────────
  const addReminder = (timing: Reminder['timing']) => {
    const r: Reminder = { id: uuidv4(), timing, triggered: false };
    set('reminders', [...form.reminders, r]);
  };
  const removeReminder = (id: string) =>
    set('reminders', form.reminders.filter((r) => r.id !== id));

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.jobTitle && !form.company) {
      toast.error('Please enter at least a job title or company');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && job?.id) {
        await db.jobs.update(job.id, { ...form, updatedAt: new Date().toISOString() });
        toast.success('Job updated!');
      } else {
        await db.jobs.add({ ...form, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        toast.success('Job saved! 🎉');
      }
      onSave();
    } catch {
      toast.error('Failed to save. Please try again.');
    }
    setSaving(false);
  };

  // ── Styles ───────────────────────────────────────────────────────────────
  const inputCls =
    'w-full px-3 py-2 text-sm bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400';
  const labelCls =
    'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide';
  const textAreaCls = inputCls + ' resize-none';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Job' : 'Add New Job'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isEdit ? 'Update your job application details' : 'Capture a new opportunity'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => set('isFavorite', !form.isFavorite)}
              className={`p-2 rounded-xl transition-colors ${form.isFavorite ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950' : 'text-gray-400 hover:text-yellow-500'}`}
            >
              <Star className={`w-5 h-5 ${form.isFavorite ? 'fill-yellow-500' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 dark:border-gray-800 flex-shrink-0 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'contacts' && contacts.length > 0 && (
                <span className="ml-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs px-1.5 rounded-full">
                  {contacts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── DETAILS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={labelCls}>Job Title *</label>
                  <input className={inputCls} placeholder="e.g. Marketing Officer" value={form.jobTitle}
                    onChange={(e) => set('jobTitle', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Company / Organisation *</label>
                  <input className={inputCls} placeholder="Company name" value={form.company}
                    onChange={(e) => set('company', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Industry</label>
                  <select className={inputCls} value={form.industry} onChange={(e) => set('industry', e.target.value)}>
                    <option value="">Select industry</option>
                    {ALL_INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Location</label>
                  <input className={inputCls} placeholder="City or Remote" value={form.location}
                    onChange={(e) => set('location', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Salary / Package</label>
                  <input className={inputCls} placeholder="e.g. P8,000/month" value={form.salary}
                    onChange={(e) => set('salary', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Website / URL</label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className={inputCls + ' pl-9'} placeholder="https://" value={form.website}
                      onChange={(e) => set('website', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Source Type</label>
                  <select className={inputCls} value={form.sourceType} onChange={(e) => set('sourceType', e.target.value as SourceType)}>
                    {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as JobStatus)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Closing Date</label>
                  <input type="date" className={inputCls} value={form.closingDate}
                    onChange={(e) => set('closingDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Application Date</label>
                  <input type="date" className={inputCls} value={form.applicationDate}
                    onChange={(e) => set('applicationDate', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Contact Person / Recruiter</label>
                  <input className={inputCls} placeholder="Name or email" value={form.contactPerson}
                    onChange={(e) => set('contactPerson', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Application Method</label>
                  <input className={inputCls} placeholder="e.g. Email, Online portal" value={form.applicationMethod}
                    onChange={(e) => set('applicationMethod', e.target.value)} />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className={labelCls}><Tag className="w-3 h-3 inline mr-1" />Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                      {t}
                      <button onClick={() => removeTag(t)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="Add a tag..." value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()} />
                  <button onClick={addTag} className="px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={labelCls}>Notes</label>
                <textarea className={textAreaCls} rows={3} placeholder="Any additional notes..."
                  value={form.notes} onChange={(e) => set('notes', e.target.value)} />
              </div>
            </>
          )}

          {/* ── JD & SOURCE TAB ─────────────────────────────────────────── */}
          {activeTab === 'jd' && (
            <>
              <div>
                <label className={labelCls}><Image className="w-3 h-3 inline mr-1" />Upload Job Flyer / Screenshot (OCR)</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    isDragActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950'
                      : 'border-slate-200 dark:border-gray-700 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/50'
                  }`}
                >
                  <input {...getInputProps()} ref={fileInputRef} />
                  {ocring ? (
                    <div className="space-y-2">
                      <Loader2 className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
                      <p className="text-sm text-indigo-600 font-medium">Reading image with OCR...</p>
                      <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${ocrProgress}%` }} />
                      </div>
                      <p className="text-xs text-gray-400">{ocrProgress}% complete</p>
                    </div>
                  ) : imgPreview ? (
                    <div className="space-y-3">
                      <img src={imgPreview} alt="Job flyer" className="max-h-40 mx-auto rounded-lg object-contain" />
                      <p className="text-xs text-gray-500">{form.sourceImageName}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImgPreview(null);
                          set('sourceImage', undefined);
                          set('sourceImageName', undefined);
                        }}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"
                      >
                        <Trash2 className="w-3 h-3" /> Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drop job flyer / screenshot here</p>
                      <p className="text-xs text-gray-400">PNG, JPG, JPEG, WebP • OCR auto-fills fields</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Tip: For best OCR results, use a direct screenshot of the advert text, not a photo of a screen
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700"
                      >
                        <Scan className="w-3 h-3 inline mr-1" />Choose File & Scan
                      </button>
                    </div>
                  )}
                </div>
                {imgPreview && !ocring && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    OCR complete — review and edit the extracted fields in other tabs
                  </p>
                )}
              </div>

              {/* Paste Text */}
              <div>
                <label className={labelCls}><FileText className="w-3 h-3 inline mr-1" />Paste Job Advert / JD Text</label>
                <textarea className={textAreaCls} rows={6}
                  placeholder="Paste the full job description or advert here..."
                  value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
                <button
                  onClick={handlePasteExtract}
                  disabled={!pasteText.trim()}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs rounded-xl font-medium"
                >
                  <Scan className="w-3 h-3" /> Extract Fields from Text
                </button>
              </div>

              {/* JD Fields */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Job Description Fields</h4>
                <div>
                  <label className={labelCls}>Qualifications Required</label>
                  <textarea className={textAreaCls} rows={3} placeholder="Degrees, certifications, skills required..."
                    value={form.qualificationsRequired} onChange={(e) => set('qualificationsRequired', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Experience Required</label>
                  <textarea className={textAreaCls} rows={2} placeholder="Years and type of experience needed..."
                    value={form.experienceRequired} onChange={(e) => set('experienceRequired', e.target.value)} />
                </div>
                <div>
                  <label className={labelCls}>Key Responsibilities / JD Summary</label>
                  <textarea className={textAreaCls} rows={6}
                    placeholder="Main duties and role overview..."
                    value={form.keyResponsibilities} onChange={(e) => set('keyResponsibilities', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── TRACKING TAB ────────────────────────────────────────────── */}
          {activeTab === 'tracking' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Application Status</label>
                  <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as JobStatus)}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Application Date</label>
                  <input type="date" className={inputCls} value={form.applicationDate}
                    onChange={(e) => set('applicationDate', e.target.value)} />
                </div>
              </div>

              {/* Status Pipeline */}
              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Pipeline Stages</p>
                <div className="flex flex-col gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => set('status', s.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        form.status === s.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950'
                      }`}
                    >
                      <span className="text-base">{s.label.split(' ')[0]}</span>
                      <span>{s.label.split(' ').slice(1).join(' ')}</span>
                      {form.status === s.value && (
                        <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Current</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Application Energy / ROI */}
              <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Application Energy & ROI
                </p>
                <div>
                  <label className={labelCls}>Effort Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EFFORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => set('applicationEffort', opt.value as ApplicationEffort)}
                        className={`p-2 rounded-xl text-xs font-medium border transition-all text-center ${
                          form.applicationEffort === opt.value
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-slate-200 dark:border-gray-600 hover:border-indigo-400'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className={`text-xs mt-0.5 ${form.applicationEffort === opt.value ? 'text-indigo-200' : 'text-gray-400'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}><Clock className="w-3 h-3 inline mr-1" />Hours Spent on Application</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      className={inputCls + ' w-28'}
                      placeholder="0"
                      value={form.hoursSpent || ''}
                      onChange={(e) => set('hoursSpent', parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-xs text-gray-500">hours — tracked for ROI analytics</span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label className={labelCls}>Application Checklist</label>
                <div className="space-y-2 mb-3">
                  {form.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                      <button onClick={() => toggleCheck(item.id)}>
                        {item.done
                          ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                          : <Square className="w-4 h-4 text-gray-400" />}
                      </button>
                      <span className={`text-sm flex-1 ${item.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.text}
                      </span>
                      <button onClick={() => removeCheck(item.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="Add checklist item..." value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} />
                  <button onClick={addCheckItem} className="px-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {['Update CV', 'Write Cover Letter', 'Research Company', 'Prepare Portfolio', 'Follow Up Email'].map((s) => (
                    <button key={s} onClick={() => setNewCheckItem(s)}
                      className="text-xs px-2 py-1 bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── LESSONS TAB ─────────────────────────────────────────────── */}
          {activeTab === 'lessons' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  📝 Reflect on each application and grow from every experience
                </p>
              </div>
              {[
                { key: 'whatWentWell', label: 'What Went Well', placeholder: 'What aspects of this application were strong?' },
                { key: 'whatWentWrong', label: 'What Went Wrong', placeholder: 'What challenges or mistakes occurred?' },
                { key: 'improvementsNextTime', label: 'Improvements for Next Time', placeholder: 'What would you do differently?' },
                { key: 'strengthsShown', label: 'Strengths I Showed', placeholder: 'What skills/qualities did you demonstrate?' },
                { key: 'weaknessesGaps', label: 'Weaknesses / Skill Gaps Identified', placeholder: 'What skills do you need to develop?' },
                { key: 'followUpActions', label: 'Follow-up Actions', placeholder: 'What do you need to do next?' },
                { key: 'interviewFeedback', label: 'Interview Feedback Notes', placeholder: 'Any feedback received from the interviewer...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <textarea className={textAreaCls} rows={3} placeholder={placeholder}
                    value={(form.lessonsLearned as Record<string, string>)[key] || ''}
                    onChange={(e) => setLessons(key, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* ── COMPARISON TAB ──────────────────────────────────────────── */}
          {activeTab === 'comparison' && (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/50 rounded-xl p-3 border border-amber-100 dark:border-amber-900">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  🔍 Research the successful candidate via LinkedIn or public sources and note your findings here
                </p>
              </div>
              {[
                { key: 'whoGotHired', label: 'Who Eventually Got Hired', placeholder: 'Name or description of the successful candidate...' },
                { key: 'theirBackground', label: 'Their Background', placeholder: 'Education, experience, previous roles...' },
                { key: 'whatDifferentiated', label: 'What Differentiated Them', placeholder: 'What stood out about their profile...' },
                { key: 'skillsTheyHad', label: 'Skills They Had That I Lacked', placeholder: 'Technical or soft skills they possessed...' },
                { key: 'experienceLevelFit', label: 'Experience Level / Industry Fit', placeholder: 'How their experience aligned better with the role...' },
                { key: 'myComparisonNotes', label: 'My Comparison Notes', placeholder: 'Your full analysis and takeaways...' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <textarea className={textAreaCls} rows={3} placeholder={placeholder}
                    value={(form.outcomeComparison as Record<string, string>)[key] || ''}
                    onChange={(e) => setOutcome(key, e.target.value)} />
                </div>
              ))}
            </div>
          )}

          {/* ── CONTACTS TAB ────────────────────────────────────────────── */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900">
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  🤝 Track the people behind this opportunity — hiring managers, referrals, internal contacts
                </p>
              </div>

              {/* Existing contacts */}
              {contacts.length === 0 && !showContactForm && (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No contacts added yet</p>
                  <p className="text-xs mt-1">Add people you know at this company</p>
                </div>
              )}

              {contacts.map((contact) => (
                <div key={contact.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{contact.name}</p>
                      <span className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                        {contact.role}
                      </span>
                    </div>
                    <button onClick={() => removeContact(contact.id)} className="text-gray-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        <Mail className="w-3 h-3" />{contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        <Phone className="w-3 h-3" />{contact.phone}
                      </a>
                    )}
                    {contact.linkedin && (
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                        <ExternalLink className="w-3 h-3" />LinkedIn
                      </a>
                    )}
                  </div>
                  {contact.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">{contact.notes}</p>
                  )}
                </div>
              ))}

              {/* Add Contact Form */}
              {showContactForm ? (
                <div className="bg-slate-50 dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4 space-y-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Contact</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className={labelCls}>Name *</label>
                      <input className={inputCls} placeholder="Full name"
                        value={newContact.name}
                        onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Role</label>
                      <select className={inputCls} value={newContact.role}
                        onChange={(e) => setNewContact((p) => ({ ...p, role: e.target.value as ContactRole }))}>
                        {CONTACT_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Email</label>
                      <input className={inputCls} placeholder="email@company.com" type="email"
                        value={newContact.email || ''}
                        onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input className={inputCls} placeholder="+267 7x xxx xxx"
                        value={newContact.phone || ''}
                        onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>LinkedIn URL</label>
                      <input className={inputCls} placeholder="https://linkedin.com/in/..."
                        value={newContact.linkedin || ''}
                        onChange={(e) => setNewContact((p) => ({ ...p, linkedin: e.target.value }))} />
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Notes</label>
                      <textarea className={textAreaCls} rows={2}
                        placeholder="How you know them, context, conversation notes..."
                        value={newContact.notes || ''}
                        onChange={(e) => setNewContact((p) => ({ ...p, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addContact}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl">
                      <Plus className="w-4 h-4 inline mr-1" />Add Contact
                    </button>
                    <button onClick={() => { setShowContactForm(false); setNewContact(EMPTY_CONTACT); }}
                      className="px-4 py-2 bg-slate-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded-xl hover:bg-slate-300">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowContactForm(true)}
                  className="w-full py-3 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950 flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Add Contact
                </button>
              )}
            </div>
          )}

          {/* ── REMINDERS TAB ───────────────────────────────────────────── */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}><Bell className="w-3 h-3 inline mr-1" />Set Reminder</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { timing: '1_day' as const, label: '1 Day Before Deadline' },
                    { timing: '3_days' as const, label: '3 Days Before Deadline' },
                    { timing: '1_week' as const, label: '1 Week Before Deadline' },
                    { timing: 'apply_by' as const, label: '📌 Remind Me to Apply' },
                    { timing: 'custom' as const, label: 'Custom Date / Time' },
                  ].map(({ timing, label }) => (
                    <button
                      key={timing}
                      onClick={() => addReminder(timing)}
                      className="px-3 py-2.5 bg-slate-100 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-sm text-gray-700 dark:text-gray-300 rounded-xl border border-slate-200 dark:border-gray-700 flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-left text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {form.reminders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Reminders</p>
                  {form.reminders.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded-xl border border-indigo-100 dark:border-indigo-900">
                      <Bell className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="text-sm text-indigo-700 dark:text-indigo-300 flex-1">
                        {r.timing === '1_day' ? '1 Day Before Deadline'
                          : r.timing === '3_days' ? '3 Days Before Deadline'
                          : r.timing === '1_week' ? '1 Week Before Deadline'
                          : r.timing === 'apply_by' ? '📌 Remind Me to Apply'
                          : 'Custom Reminder'}
                      </span>
                      {(r.timing === 'custom' || r.timing === 'apply_by') && (
                        <input
                          type="datetime-local"
                          className="text-xs bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-2 py-1"
                          value={r.customDate || ''}
                          onChange={(e) =>
                            set('reminders', form.reminders.map((x) =>
                              x.id === r.id ? { ...x, customDate: e.target.value } : x
                            ))
                          }
                        />
                      )}
                      <button onClick={() => removeReminder(r.id)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.status === 'wishlist' && (
                <div className="bg-blue-50 dark:bg-blue-950/50 rounded-xl p-3 border border-blue-100 dark:border-blue-900">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 This job is in your Wishlist — use <strong>Remind Me to Apply</strong> above to set a date to take action on it
                  </p>
                </div>
              )}

              {form.closingDate && (
                <div className="bg-orange-50 dark:bg-orange-950/50 rounded-xl p-3 border border-orange-100 dark:border-orange-900">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    📅 Closing date: <strong>{form.closingDate}</strong> — deadline-relative reminders calculate from this date
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900 rounded-b-2xl flex-shrink-0">
          <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            <input type="checkbox" checked={form.isArchived}
              onChange={(e) => set('isArchived', e.target.checked)} className="w-3 h-3 rounded" />
            Archive
          </label>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-gray-800 rounded-xl transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Update Job' : 'Save Job'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
  }
