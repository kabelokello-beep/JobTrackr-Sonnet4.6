import { useStore } from '../store/useStore';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import DashboardPage from '../pages/DashboardPage';
import JobsPage from '../pages/JobsPage';
import AnalyticsPage from '../pages/AnalyticsPage';
import CalendarPage from '../pages/CalendarPage';
import SettingsPage from '../pages/SettingsPage';

export default function MainLayout() {
  const { activeTab } = useStore();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'jobs': return <JobsPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'calendar': return <CalendarPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
