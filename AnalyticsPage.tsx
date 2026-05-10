import { useEffect, useState } from 'react';
import { db } from '../db/database';
import type { JobRecord } from '../db/database';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Target, Award, Zap, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { statusLabel } from '../utils/helpers';
import {
  format, subMonths, parseISO, isAfter,
  startOfDay, startOfWeek, startOfMonth
} from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  wishlist: '#94a3b8',
  applied: '#3b82f6',
  interview_scheduled: '#f59e0b',
  interview_completed: '#8b5cf6',
  offer: '#10b981',
  hired: '#22c55e',
  rejected: '#ef4444',
  no_response: '#6b7280',
};

const SOURCE_PALETTE = [
  '#6366f1','#3b82f6','#f59e0b','#10b981',
  '#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16',
];

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.jobs.toArray().then((j) => { setJobs(j); setLoading(false); });
  }, []);

  const total = jobs.length;
  const applied = jobs.filter((j) => !['wishlist', 'no_response'].includes(j.status)).length;
  const interviews = jobs.filter((j) =>
    ['interview_scheduled', 'interview_completed', 'offer', 'hired'].includes(j.status)
  ).length;
  const offers = jobs.filter((j) => ['offer', 'hired'].includes(j.status)).length;
  const rejections = jobs.filter((j) => j.status === 'rejected').length;
  const hired = jobs.filter((j) => j.status === 'hired').length;
  const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0;
  const offerRate = interviews > 0 ? Math.round((offers / interviews) * 100) : 0;
  const successRate = applied > 0 ? Math.round(((interviews + offers) / applied) * 100) : 0;

  // ── Activity counters ────────────────────────────────────────────
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const monthStart = startOfMonth(now);

  const safeDate = (str: string | undefined): Date | null => {
    if (!str) return null;
    try { return parseISO(str); } catch { return null; }
  };

  const appliedToday = jobs.filter((j) => {
    const d = safeDate(j.applicationDate) || safeDate(j.createdAt);
    return d && isAfter(d, dayStart) && j.status !== 'wishlist';
  }).length;

  const appliedThisWeek = jobs.filter((j) => {
    const d = safeDate(j.applicationDate) || safeDate(j.createdAt);
    return d && isAfter(d, weekStart) && j.status !== 'wishlist';
  }).length;

  const appliedThisMonth = jobs.filter((j) => {
    const d = safeDate(j.applicationDate) || safeDate(j.createdAt);
    return d && isAfter(d, monthStart) && j.status !== 'wishlist';
  }).length;

  const savedToday = jobs.filter((j) => {
    const d = safeDate(j.createdAt);
    return d && isAfter(d, dayStart);
  }).length;

  const savedThisWeek = jobs.filter((j) => {
    const d = safeDate(j.createdAt);
    return d && isAfter(d, weekStart);
  }).length;

  const savedThisMonth = jobs.filter((j) => {
    const d = safeDate(j.createdAt);
    return d && isAfter(d, monthStart);
  }).length;

  // ── Chart data ───────────────────────────────────────────────────
  const statusData = Object.entries(
    jobs.reduce((acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: statusLabel(status as any),
    value: count,
    fill: STATUS_COLORS[status] || '#6b7280',
  }));

  const industryData = Object.entries(
    jobs.reduce((acc, j) => {
      if (j.industry) acc[j.industry] = (acc[j.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      name: name.length > 12 ? name.slice(0, 12) + '…' : name,
      count,
    }));

  const sourceData = Object.entries(
    jobs.reduce((acc, j) => {
      acc[j.sourceType] = (acc[j.sourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = subMonths(now, 5 - i);
    const monthStr = format(month, 'MMM');
    const monthFull = format(month, 'yyyy-MM');
    const monthJobs = jobs.filter((j) => j.createdAt?.startsWith(monthFull));
    return {
      month: monthStr,
      saved: monthJobs.length,
      applied: monthJobs.filter((j) => j.applicationDate?.startsWith(monthFull)).length,
      interviews: monthJobs.filter((j) =>
        ['interview_scheduled', 'interview_completed', 'offer', 'hired'].includes(j.status)
      ).length,
    };
  });

  const skillsGaps = jobs
    .filter((j) => j.lessonsLearned?.weaknessesGaps)
    .map((j) => j.lessonsLearned.weaknessesGaps)
    .slice(0, 3);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Analytics</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Your job search performance at a glance</p>

      {/* ── Activity: Day / Week / Month ─────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-indigo-500" /> Application Activity
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              period: 'Today',
              icon: Calendar,
              applied: appliedToday,
              saved: savedToday,
              color: 'indigo',
            },
            {
              period: 'This Week',
              icon: CalendarDays,
              applied: appliedThisWeek,
              saved: savedThisWeek,
              color: 'purple',
            },
            {
              period: 'This Month',
              icon: CalendarRange,
              applied: appliedThisMonth,
              saved: savedThisMonth,
              color: 'blue',
            },
          ].map(({ period, icon: Icon, applied: a, saved: s, color }) => (
            <div key={period}
              className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 text-${color}-500`} />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{period}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{a}</p>
                <p className="text-xs text-gray-400">applied</p>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{s}</p>
                <p className="text-xs text-gray-400">saved</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Saved', value: total, sub: 'job records', color: 'indigo', icon: Target },
          { label: 'Response Rate', value: `${responseRate}%`, sub: `${interviews} interviews`, color: 'yellow', icon: Zap },
          { label: 'Offer Rate', value: `${offerRate}%`, sub: `${offers} offers`, color: 'emerald', icon: Award },
          { label: 'Success Rate', value: `${successRate}%`, sub: 'applied → response', color: 'purple', icon: TrendingUp },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-slate-100 dark:border-gray-800 shadow-sm">
            <div className={`w-9 h-9 bg-${color}-50 dark:bg-${color}-950 rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Summary Bar ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5 mb-6">
        <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-slate-100 dark:divide-gray-800 text-center">
          {[
            { label: 'Saved', value: total },
            { label: 'Applied', value: applied },
            { label: 'Interviews', value: interviews },
            { label: 'Offers', value: offers },
            { label: 'Rejected', value: rejections },
            { label: 'Hired', value: hired },
          ].map(({ label, value }) => (
            <div key={label} className="px-3 py-2">
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row 1 ─────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Application Status</h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.fill }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="saved" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Saved" />
              <Line type="monotone" dataKey="applied" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Applied" />
              <Line type="monotone" dataKey="interviews" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Interviews" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ─────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Applications by Industry</h3>
          {industryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={industryData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Jobs" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Jobs by Source</h3>
          {sourceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                    {sourceData.map((_, i) => <Cell key={i} fill={SOURCE_PALETTE[i % 10]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2 justify-center">
                {sourceData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: SOURCE_PALETTE[i % 10] }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* ── Skills Gaps ──────────────────────────────────────────── */}
      {skillsGaps.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Identified Skills Gaps
          </h3>
          <div className="space-y-2">
            {skillsGaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-xl border border-yellow-100 dark:border-yellow-900">
                <span className="text-yellow-600 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">{gap}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {total === 0 && (
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl border border-indigo-100 dark:border-indigo-900 p-6 text-center">
          <TrendingUp className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">No data yet</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            Start adding jobs to see your analytics.
          </p>
        </div>
      )}
    </div>
  );
  }
