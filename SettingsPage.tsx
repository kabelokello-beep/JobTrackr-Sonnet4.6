import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { db } from '../db/database';
import type { JobRecord } from '../db/database';
import {
  Moon, Sun, User, Download, Upload, Shield,
  Database, Info, CheckCircle2, AlertTriangle, ExternalLink
} from 'lucide-react';
import { exportToCSV, exportToJSON } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, darkMode, toggleDarkMode, logout } = useStore();
  const [importLoading, setImportLoading] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = async () => {
    const jobs = await db.jobs.toArray();
    if (jobs.length === 0) { toast.error('No jobs to export'); return; }
    exportToCSV(jobs);
    toast.success(`Exported ${jobs.length} jobs as CSV`);
  };

  const handleExportJSON = async () => {
    const jobs = await db.jobs.toArray();
    if (jobs.length === 0) { toast.error('No jobs to export'); return; }
    exportToJSON(jobs);
    toast.success(`Exported ${jobs.length} jobs as JSON backup`);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as JobRecord[];
      if (!Array.isArray(data)) throw new Error('Invalid format');
      const count = data.length;
      for (const job of data) {
        const { id, ...rest } = job;
        await db.jobs.add({ ...rest, uuid: rest.uuid || crypto.randomUUID() } as JobRecord);
      }
      toast.success(`Imported ${count} jobs successfully!`);
    } catch {
      toast.error('Import failed. Please use a valid JobTrackr JSON backup.');
    }
    setImportLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = async () => {
    if (!clearConfirm) { setClearConfirm(true); return; }
    await db.jobs.clear();
    toast.success('All job records cleared');
    setClearConfirm(false);
  };

  const addSampleData = async () => {
    const samples: Omit<JobRecord, 'id'>[] = [
      {
        uuid: crypto.randomUUID(), jobTitle: 'Senior Software Engineer', company: 'TechCorp SA',
        industry: 'Technology', location: 'Cape Town, South Africa', website: 'https://techcorp.co.za',
        sourceType: 'LinkedIn', salary: 'R65,000/month', contactPerson: 'Sarah Johnson',
        applicationMethod: 'Online portal', qualificationsRequired: 'BSc Computer Science or related',
        experienceRequired: '5+ years React/Node.js', keyResponsibilities: 'Lead frontend development team',
        closingDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        applicationDate: new Date().toISOString().split('T')[0],
        status: 'applied', isFavorite: true, isArchived: false, tags: ['React', 'Senior', 'Remote'],
        notes: 'Great company culture. Know someone internally.',
        reminders: [], checklist: [{ id: '1', text: 'Update CV', done: true }, { id: '2', text: 'Write Cover Letter', done: false }],
        lessonsLearned: { whatWentWell: 'Strong technical interview', whatWentWrong: 'Forgot to mention team leadership experience' },
        outcomeComparison: {}, sourceText: undefined, sourceImage: undefined, sourceImageName: undefined,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        uuid: crypto.randomUUID(), jobTitle: 'Product Manager', company: 'StartupXYZ',
        industry: 'Technology', location: 'Johannesburg, South Africa', website: 'https://startupxyz.io',
        sourceType: 'Company Site', salary: 'R55,000/month', contactPerson: 'Mike Chen',
        applicationMethod: 'Email: careers@startupxyz.io', qualificationsRequired: 'Business degree or equivalent',
        experienceRequired: '3+ years product management', keyResponsibilities: 'Define product roadmap and strategy',
        closingDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        applicationDate: '', status: 'wishlist', isFavorite: false, isArchived: false,
        tags: ['Product', 'Startup', 'Growth'], notes: 'Interesting startup. Good growth potential.',
        reminders: [{ id: '1', timing: '1_day', triggered: false }], checklist: [],
        lessonsLearned: {}, outcomeComparison: {},
        sourceText: undefined, sourceImage: undefined, sourceImageName: undefined,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        uuid: crypto.randomUUID(), jobTitle: 'Data Analyst', company: 'Analytics Pro',
        industry: 'Finance', location: 'Pretoria, South Africa', website: '',
        sourceType: 'Indeed', salary: 'R35,000/month', contactPerson: '',
        applicationMethod: 'Indeed Apply', qualificationsRequired: 'Statistics, Mathematics or Computer Science',
        experienceRequired: '2+ years data analysis, SQL, Python', keyResponsibilities: 'Analyze business data and produce reports',
        closingDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
        applicationDate: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
        status: 'rejected', isFavorite: false, isArchived: false, tags: ['Data', 'SQL', 'Python'],
        notes: 'Application rejected via email.',
        reminders: [], checklist: [],
        lessonsLearned: {
          whatWentWrong: 'Lacked advanced Python skills they required',
          improvementsNextTime: 'Complete Python for Data Science course',
          weaknessesGaps: 'Machine learning experience, Tableau',
        },
        outcomeComparison: {
          whoGotHired: 'Found on LinkedIn - John M.',
          skillsTheyHad: 'Machine Learning, Tableau, Advanced Python, MBA',
        },
        sourceText: undefined, sourceImage: undefined, sourceImageName: undefined,
        createdAt: new Date(Date.now() - 7 * 86400000).toISOString(), updatedAt: new Date().toISOString(),
      },
    ];
    for (const sample of samples) {
      await db.jobs.add(sample as JobRecord);
    }
    toast.success('Sample data added! Check My Jobs 📋');
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your account and preferences</p>

      <div className="space-y-4">
        {/* Profile */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500" /> Profile
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {user?.avatarInitials || 'G'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name || 'Guest User'}</p>
              <p className="text-sm text-gray-400">{user?.isGuest ? 'Guest Mode — no account' : user?.email}</p>
              {user?.isGuest && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Create an account to preserve data across devices
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 text-indigo-500" /> : <Sun className="w-4 h-4 text-yellow-500" />}
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-xs text-gray-400">Switch between light and dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                darkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-gray-700'
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" /> Data Management
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export to CSV</p>
                <p className="text-xs text-gray-400">Download all jobs as spreadsheet</p>
              </div>
              <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Export JSON Backup</p>
                <p className="text-xs text-gray-400">Full backup with all fields</p>
              </div>
              <button onClick={handleExportJSON} className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors">
                <Download className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Import JSON Backup</p>
                <p className="text-xs text-gray-400">Restore from a previous backup</p>
              </div>
              <label className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {importLoading ? 'Importing...' : 'Import'}
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* Sample Data */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> Demo & Testing
          </h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Add Sample Jobs</p>
              <p className="text-xs text-gray-400">Load demo data to explore the app</p>
            </div>
            <button
              onClick={addSampleData}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Load Samples
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900 shadow-sm p-5">
          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-100 dark:border-red-900">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Clear All Data</p>
                <p className="text-xs text-red-500">Permanently delete all job records</p>
              </div>
              <button
                onClick={handleClearAll}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  clearConfirm
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200'
                }`}
              >
                {clearConfirm ? '⚠️ Confirm Delete' : 'Clear All'}
              </button>
            </div>
            {clearConfirm && (
              <button onClick={() => setClearConfirm(false)} className="text-xs text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            )}
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/50 rounded-xl border border-red-100 dark:border-red-900">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Sign Out</p>
                <p className="text-xs text-red-500">Return to login screen</p>
              </div>
              <button onClick={logout} className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 text-xs font-semibold rounded-xl transition-colors">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> About JobTrackr
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              All data stored locally on your device
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              Works offline — no internet required
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              OCR powered by Tesseract.js
            </p>
            <p className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              Export to CSV or JSON for backup
            </p>
            <div className="pt-3 border-t border-slate-100 dark:border-gray-800">
              <p className="font-semibold text-gray-900 dark:text-white text-sm">JobTrackr v1.0.0</p>
              <p className="text-xs text-gray-400 mt-1">Built with React + Vite + Tailwind + Dexie</p>
              <a
                href="https://github.com/your-username/jobtrackr"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
              >
                🐙 View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
