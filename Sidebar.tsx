import { useStore } from '../store/useStore';
import {
  LayoutDashboard, Briefcase, BarChart3, Calendar,
  Settings, LogOut, Star, Archive, ChevronRight, Zap
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'jobs',      label: 'My Jobs',   icon: Briefcase },
  { id: 'missions',  label: 'Missions',  icon: Zap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calendar',  label: 'Calendar',  icon: Calendar },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function Sidebar() {
  const { activeTab, setActiveTab, user, logout } = useStore();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-800 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-base leading-tight">JobTrackr</h1>
            <p className="text-xs text-gray-400">Career Tracker</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${activeTab === id ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
            {label}
            {id === 'missions' && activeTab !== 'missions' && (
              <span className="ml-auto text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold">
                XP
              </span>
            )}
            {activeTab === id && (
              <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />
            )}
          </button>
        ))}

        <div className="pt-2 border-t border-slate-100 dark:border-gray-800 mt-2">
          <button
            onClick={() => setActiveTab('jobs')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
          >
            <Star className="w-5 h-5 text-yellow-500" />
            Favourites
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all"
          >
            <Archive className="w-5 h-5 text-gray-400" />
            Archive
          </button>
        </div>
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.avatarInitials || 'G'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {user?.name || 'Guest'}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {user?.isGuest ? 'Guest Mode' : user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
