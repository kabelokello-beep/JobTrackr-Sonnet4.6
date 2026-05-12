import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { db } from '../db/database';
import type { JobRecord } from '../db/database';
import {
  getWeekKey, WEEKLY_MISSIONS, PILLAR_CONFIG, MISSION_TOTAL_XP,
  calculateXP, calculateStreakFromWeeks, Mission,
} from '../utils/helpers';
import { Flame, Shield, Zap, ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react';

const ENERGY_OPTIONS = [
  { value: 'low', label: 'Low Energy', emoji: '🔋', desc: 'Show me the micro versions' },
  { value: 'okay', label: 'Okay', emoji: '⚡', desc: 'Standard missions' },
  { value: 'high', label: 'High Energy', emoji: '🔥', desc: "Let's go hard" },
] as const;

const PILLAR_COLORS: Record<string, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300',
  blue:   'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  emerald:'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  purple: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
};

const PILLAR_BTN: Record<string, string> = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700',
  blue:   'bg-blue-600 hover:bg-blue-700',
  emerald:'bg-emerald-600 hover:bg-emerald-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

export default function WeeklyMissionsPage() {
  const {
    weeklyMissions, energyLevel, lastEnergyDate, activeWeeks,
    completeMission, uncompleteMission, setEnergyLevel, markWeekActive, checkGraceRefill,
    graceTokens, seenBadgeIds,
  } = useStore();
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({
    hunt: true, connect: true, build: true, reflect: true,
  });

  const weekKey = getWeekKey();
  const thisWeekMissions = weeklyMissions[weekKey] || {};
  const completedCount = Object.values(thisWeekMissions).filter(Boolean).length;
  const totalCount = WEEKLY_MISSIONS.length;
  const weekXP = WEEKLY_MISSIONS.filter(m => thisWeekMissions[m.id]).reduce((s, m) => s + m.xp, 0);
  const streak = calculateStreakFromWeeks(activeWeeks);

  // Balanced Hustler bonus: completed at least 1 from each pillar
  const pillars = ['hunt', 'connect', 'build', 'reflect'] as const;
  const balancedHustler = pillars.every(p =>
    WEEKLY_MISSIONS.filter(m => m.pillar === p).some(m => thisWeekMissions[m.id])
  );

  const today = new Date().toISOString().split('T')[0];
  const energyCheckedToday = lastEnergyDate === today;

  useEffect(() => {
    db.jobs.toArray().then(setJobs);
    checkGraceRefill();
  }, []);

  const toggle = (missionId: string) => {
    if (thisWeekMissions[missionId]) {
      uncompleteMission(weekKey, missionId);
    } else {
      completeMission(weekKey, missionId);
      markWeekActive(weekKey);
    }
  };

  const togglePillar = (p: string) =>
    setExpandedPillars(prev => ({ ...prev, [p]: !prev[p] }));

  const getMissionsByPillar = (pillar: string): Mission[] =>
    WEEKLY_MISSIONS.filter(m => m.pillar === pillar);

  const showMicro = energyLevel === 'low';
  const weekLabel = (() => {
    const d = new Date();
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return `${mon.getDate()} – ${sun.getDate()} ${mon.toLocaleString('default', { month: 'short' })}`;
  })();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Weekly Missions</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{weekLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-xl">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak}w</span>
            </div>
          )}
          {graceTokens > 0 && (
            <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl">
              <Shield className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{graceTokens} shield</span>
            </div>
          )}
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            This week — {completedCount}/{totalCount} missions
          </span>
          <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {weekXP} / {MISSION_TOTAL_XP} XP
            {balancedHustler && <span className="ml-1 text-emerald-500">+100 bonus ✓</span>}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(100, (weekXP / MISSION_TOTAL_XP) * 100)}%` }}
          />
        </div>
        {balancedHustler && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            🏅 Balanced Hustler — completed at least 1 from every pillar! +100 bonus XP
          </p>
        )}
        {!balancedHustler && (
          <p className="text-xs text-gray-400 mt-2">
            Complete 1 mission from each pillar for the Balanced Hustler +100 XP bonus
          </p>
        )}
      </div>

      {/* Energy Check-in */}
      {!energyCheckedToday ? (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">
            ⚡ How's your energy today?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ENERGY_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setEnergyLevel(opt.value)}
                className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900 transition-colors">
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{opt.label}</span>
                <span className="text-[10px] text-gray-400 text-center leading-tight">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : energyLevel && (
        <div className="flex items-center justify-between bg-slate-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 mb-5 border border-slate-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Energy today: {ENERGY_OPTIONS.find(o => o.value === energyLevel)?.emoji} {ENERGY_OPTIONS.find(o => o.value === energyLevel)?.label}
            {showMicro && ' — showing micro missions'}
          </span>
          <button onClick={() => setEnergyLevel(energyLevel)} className="text-xs text-indigo-500 underline">change</button>
        </div>
      )}

      {/* Mission Pillars */}
      <div className="space-y-4">
        {pillars.map(pillar => {
          const config = PILLAR_CONFIG[pillar];
          const missions = getMissionsByPillar(pillar);
          const completedInPillar = missions.filter(m => thisWeekMissions[m.id]).length;
          const expanded = expandedPillars[pillar];
          const colorCls = PILLAR_COLORS[config.colorClass];
          const btnCls = PILLAR_BTN[config.colorClass];

          return (
            <div key={pillar} className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <button
                onClick={() => togglePillar(pillar)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${colorCls}`}>
                    {config.emoji}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{config.label}</p>
                    <p className="text-xs text-gray-400">{config.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-500">
                    {completedInPillar}/{missions.length}
                  </span>
                  {completedInPillar === missions.length && missions.length > 0 && (
                    <span className="text-emerald-500 text-xs font-bold">✓</span>
                  )}
                  {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {expanded && (
                <div className="border-t border-slate-100 dark:border-gray-800 divide-y divide-slate-50 dark:divide-gray-800">
                  {missions.map(mission => {
                    const done = !!thisWeekMissions[mission.id];
                    const displayDesc = showMicro ? mission.microDesc : mission.desc;

                    return (
                      <div key={mission.id} className={`p-4 transition-colors ${done ? 'bg-slate-50 dark:bg-gray-800/50' : ''}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggle(mission.id)} className="mt-0.5 flex-shrink-0">
                            {done
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              : <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-indigo-400" />
                            }
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-sm font-semibold ${done ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {mission.title}
                              </p>
                              <span className="text-xs text-gray-400 bg-slate-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                {mission.day}
                              </span>
                              <span className="text-xs font-bold text-indigo-500">+{mission.xp} XP</span>
                            </div>
                            <p className={`text-xs leading-relaxed ${done ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              {showMicro && !done && (
                                <span className="text-amber-500 font-semibold">⚡ Micro: </span>
                              )}
                              {displayDesc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Anti-burnout reminder */}
      <div className="mt-6 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-4 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          🧘 <strong>Sunday is rest day.</strong> No applications — note 1 win and 1 lesson then close the app.
          Burnout kills momentum faster than rejection does.
        </p>
        {graceTokens > 0 && (
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
            🛡️ You have {graceTokens} grace shield — a light week won't break your streak.
          </p>
        )}
      </div>
    </div>
  );
                   }
