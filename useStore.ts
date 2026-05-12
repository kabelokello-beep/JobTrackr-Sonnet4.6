import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '../db/database';
import { getWeekKey } from '../utils/helpers';

interface AppState {
  // Auth & UI
  user: UserProfile | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  darkMode: boolean;
  activeTab: string;
  searchQuery: string;
  filterStatus: string;
  filterIndustry: string;
  filterSource: string;
  sortBy: string;

  // Gamification
  activeWeeks: string[];
  seenBadgeIds: string[];
  weeklyMissions: Record<string, Record<string, boolean>>;
  energyLevel: 'low' | 'okay' | 'high' | null;
  lastEnergyDate: string;
  graceTokens: number;
  lastGraceRefillMonth: string;

  // Auth actions
  setUser: (user: UserProfile | null) => void;
  loginAsGuest: () => void;
  logout: () => void;
  toggleDarkMode: () => void;
  setActiveTab: (tab: string) => void;
  setSearchQuery: (q: string) => void;
  setFilterStatus: (s: string) => void;
  setFilterIndustry: (i: string) => void;
  setFilterSource: (s: string) => void;
  setSortBy: (s: string) => void;

  // Gamification actions
  completeMission: (weekKey: string, missionId: string) => void;
  uncompleteMission: (weekKey: string, missionId: string) => void;
  markBadgesSeen: (ids: string[]) => void;
  setEnergyLevel: (level: 'low' | 'okay' | 'high') => void;
  markWeekActive: (weekKey: string) => void;
  checkGraceRefill: () => void;
}

const currentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Auth & UI ───────────────────────────────────────────────
      user: null,
      isAuthenticated: false,
      isGuest: false,
      darkMode: false,
      activeTab: 'dashboard',
      searchQuery: '',
      filterStatus: 'all',
      filterIndustry: 'all',
      filterSource: 'all',
      sortBy: 'newest',

      // ── Gamification defaults ───────────────────────────────────
      activeWeeks: [],
      seenBadgeIds: [],
      weeklyMissions: {},
      energyLevel: null,
      lastEnergyDate: '',
      graceTokens: 1,
      lastGraceRefillMonth: '',

      // ── Auth actions ────────────────────────────────────────────
      setUser: (user) => set({ user, isAuthenticated: !!user, isGuest: false }),
      loginAsGuest: () => set({
        user: { name: 'Guest User', email: '', avatarInitials: 'GU', isGuest: true, createdAt: new Date().toISOString() },
        isAuthenticated: true, isGuest: true,
      }),
      logout: () => set({ user: null, isAuthenticated: false, isGuest: false }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterStatus: (s) => set({ filterStatus: s }),
      setFilterIndustry: (i) => set({ filterIndustry: i }),
      setFilterSource: (s) => set({ filterSource: s }),
      setSortBy: (s) => set({ sortBy: s }),

      // ── Gamification actions ────────────────────────────────────
      completeMission: (weekKey, missionId) => set((s) => {
        const week = s.weeklyMissions[weekKey] || {};
        const updated = { ...s.weeklyMissions, [weekKey]: { ...week, [missionId]: true } };
        const newActiveWeeks = [...new Set([...s.activeWeeks, weekKey])].slice(-52);
        return { weeklyMissions: updated, activeWeeks: newActiveWeeks };
      }),

      uncompleteMission: (weekKey, missionId) => set((s) => {
        const week = s.weeklyMissions[weekKey] || {};
        const { [missionId]: _, ...rest } = week;
        return { weeklyMissions: { ...s.weeklyMissions, [weekKey]: rest } };
      }),

      markBadgesSeen: (ids) => set((s) => ({
        seenBadgeIds: [...new Set([...s.seenBadgeIds, ...ids])],
      })),

      setEnergyLevel: (level) => set({
        energyLevel: level,
        lastEnergyDate: new Date().toISOString().split('T')[0],
      }),

      markWeekActive: (weekKey) => set((s) => ({
        activeWeeks: [...new Set([...s.activeWeeks, weekKey])].slice(-52),
      })),

      checkGraceRefill: () => {
        const month = currentMonth();
        const { lastGraceRefillMonth, graceTokens } = get();
        if (lastGraceRefillMonth !== month) {
          set({ graceTokens: Math.min(1, graceTokens + 1), lastGraceRefillMonth: month });
        }
      },
    }),
    {
      name: 'jobtrackr-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        darkMode: state.darkMode,
        activeWeeks: state.activeWeeks,
        seenBadgeIds: state.seenBadgeIds,
        weeklyMissions: state.weeklyMissions,
        energyLevel: state.energyLevel,
        lastEnergyDate: state.lastEnergyDate,
        graceTokens: state.graceTokens,
        lastGraceRefillMonth: state.lastGraceRefillMonth,
      }),
    }
  )
);
