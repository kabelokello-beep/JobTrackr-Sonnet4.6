import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile } from '../db/database';

interface AppState {
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
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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

      setUser: (user: UserProfile | null) =>
        set({ user, isAuthenticated: !!user, isGuest: false }),
      loginAsGuest: () =>
        set({
          user: {
            name: 'Guest User',
            email: '',
            avatarInitials: 'GU',
            isGuest: true,
            createdAt: new Date().toISOString(),
          },
          isAuthenticated: true,
          isGuest: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false, isGuest: false }),
      toggleDarkMode: () => set((s: AppState) => ({ darkMode: !s.darkMode })),
      setActiveTab: (tab: string) => set({ activeTab: tab }),
      setSearchQuery: (q: string) => set({ searchQuery: q }),
      setFilterStatus: (s: string) => set({ filterStatus: s }),
      setFilterIndustry: (i: string) => set({ filterIndustry: i }),
      setFilterSource: (s: string) => set({ filterSource: s }),
      setSortBy: (s: string) => set({ sortBy: s }),
    }),
    {
      name: 'jobtrackr-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AppState) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        darkMode: state.darkMode,
      }),
    }
  )
);
