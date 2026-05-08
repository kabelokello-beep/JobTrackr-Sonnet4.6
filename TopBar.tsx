import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Menu, X, Moon, Sun, Bell, Search, LayoutDashboard,
  Briefcase, BarChart3, Calendar, Settings, LogOut, Star, Archive
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs', label: 'My Jobs', icon: Briefcase },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function TopBar() {
  const { activeTab, setActiveTab, darkMode, toggleDarkMode, user, logout, searchQuery, setSearchQuery } = useStore();
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800"
          onClick={() => setMobileMenu(!mobileMenu)}
        >
          {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Logo */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">JobTrackr</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs, companies, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-gray-800 border border-transparent rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800 relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.avatarInitials || 'G'}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenu(false)} />
          <aside className="relative w-72 h-full bg-white dark:bg-gray-900 flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 dark:border-gray-800 flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">JobTrackr</h1>
                <p className="text-xs text-gray-400">Career Tracker</p>
              </div>
              <button onClick={() => setMobileMenu(false)} className="ml-auto text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            <nav className="flex-1 px-4 space-y-1">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id); setMobileMenu(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === id
                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" /> {label}
                </button>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-gray-800 mt-2">
                <button onClick={() => { setActiveTab('jobs'); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800">
                  <Star className="w-5 h-5 text-yellow-500" /> Favourites
                </button>
                <button onClick={() => { setActiveTab('jobs'); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800">
                  <Archive className="w-5 h-5 text-gray-400" /> Archive
                </button>
              </div>
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.avatarInitials || 'G'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.isGuest ? 'Guest' : user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); setMobileMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
