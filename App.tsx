import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { Toaster } from 'react-hot-toast';
import AuthPage from './pages/AuthPage';
import MainLayout from './layouts/MainLayout';
import { requestNotificationPermission, rescheduleAllReminders } from './utils/notifications';

export default function App() {
  const { isAuthenticated, darkMode } = useStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const initNotifications = async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        await rescheduleAllReminders();
      }
    };
    initNotifications();
  }, []);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-inter transition-colors duration-300">
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 3000,
          }}
        />
        {!isAuthenticated ? <AuthPage /> : <MainLayout />}
      </div>
    </div>
  );
}
