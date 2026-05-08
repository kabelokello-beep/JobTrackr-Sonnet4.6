import { useEffect, useState } from 'react';
import { db } from '../db/database';
import type { JobRecord } from '../db/database';
import {
  ChevronLeft, ChevronRight, Calendar, Clock, AlertTriangle
} from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from 'date-fns';
import { statusColor, statusLabel, isOverdue } from '../utils/helpers';

export default function CalendarPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    db.jobs.toArray().then(setJobs);
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let d = calStart;
  while (d <= calEnd) { days.push(d); d = addDays(d, 1); }

  const getJobsForDay = (day: Date) =>
    jobs.filter((j) => {
      const closingMatch = j.closingDate && isSameDay(new Date(j.closingDate), day);
      const appMatch = j.applicationDate && isSameDay(new Date(j.applicationDate), day);
      return closingMatch || appMatch;
    });

  const selectedJobs = selectedDay ? getJobsForDay(selectedDay) : [];

  const upcoming = jobs
    .filter((j) => {
      if (!j.closingDate) return false;
      const d = new Date(j.closingDate);
      const now = new Date();
      const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
      return diff >= 0 && diff <= 14;
    })
    .sort((a, b) => new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime());

  const overdue = jobs.filter((j) =>
    j.closingDate && isOverdue(j.closingDate) && !['rejected', 'hired', 'no_response'].includes(j.status)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Calendar</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Deadlines and interview schedule</p>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Month Nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-800">
            <button
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="p-2 rounded-xl text-gray-500 hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-900 dark:text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="p-2 rounded-xl text-gray-500 hover:bg-slate-100 dark:hover:bg-gray-800"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-gray-800">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const dayJobs = getJobsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const today = isToday(day);

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[60px] p-1.5 border-r border-b border-slate-50 dark:border-gray-800 text-left transition-colors relative ${
                    !isCurrentMonth ? 'opacity-30' : ''
                  } ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950' : 'hover:bg-slate-50 dark:hover:bg-gray-800'}`}
                >
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    today ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayJobs.slice(0, 2).map((j, k) => {
                      const isDeadline = j.closingDate && isSameDay(new Date(j.closingDate), day);
                      return (
                        <div
                          key={k}
                          className={`text-[9px] font-medium px-1 py-0.5 rounded truncate ${
                            isDeadline
                              ? isOverdue(j.closingDate) ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          }`}
                        >
                          {j.jobTitle || j.company}
                        </div>
                      );
                    })}
                    {dayJobs.length > 2 && (
                      <div className="text-[9px] text-gray-400">+{dayJobs.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 px-5 py-3 border-t border-slate-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 bg-orange-200 rounded" /> Deadline
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 bg-red-200 rounded" /> Overdue
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 bg-blue-200 rounded" /> Applied
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Selected Day */}
          {selectedDay && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                {format(selectedDay, 'EEEE, MMM d')}
              </h4>
              {selectedJobs.length === 0 ? (
                <p className="text-sm text-gray-400">No events this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedJobs.map((j) => {
                    const isDeadline = j.closingDate && isSameDay(new Date(j.closingDate), selectedDay);
                    return (
                      <div key={j.uuid} className="p-3 bg-slate-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{j.jobTitle}</p>
                        <p className="text-xs text-gray-400">{j.company}</p>
                        <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${isDeadline ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>
                          {isDeadline ? '📅 Deadline' : '📤 Application Date'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/50 rounded-2xl border border-red-100 dark:border-red-900 p-4">
              <h4 className="font-semibold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4" /> Overdue ({overdue.length})
              </h4>
              <div className="space-y-2">
                {overdue.slice(0, 4).map((j) => (
                  <div key={j.uuid} className="p-2 bg-white/60 dark:bg-red-900/30 rounded-lg">
                    <p className="text-xs font-medium text-red-800 dark:text-red-200 truncate">{j.jobTitle || j.company}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">{format(new Date(j.closingDate), 'dd MMM')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" /> Next 14 Days
            </h4>
            {upcoming.length === 0 ? (
              <p className="text-xs text-gray-400">No upcoming deadlines</p>
            ) : (
              <div className="space-y-2">
                {upcoming.map((j) => {
                  const diff = Math.ceil((new Date(j.closingDate).getTime() - new Date().getTime()) / 86400000);
                  return (
                    <div key={j.uuid} className="flex items-start gap-2 p-2 bg-slate-50 dark:bg-gray-800 rounded-xl">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${
                        diff <= 3 ? 'bg-red-100 dark:bg-red-950' : diff <= 7 ? 'bg-orange-100 dark:bg-orange-950' : 'bg-blue-100 dark:bg-blue-950'
                      }`}>
                        <span className={`text-sm font-bold leading-none ${diff <= 3 ? 'text-red-600' : diff <= 7 ? 'text-orange-600' : 'text-blue-600'}`}>{diff}</span>
                        <span className={`text-[9px] ${diff <= 3 ? 'text-red-500' : diff <= 7 ? 'text-orange-500' : 'text-blue-500'}`}>days</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{j.jobTitle || j.company}</p>
                        <p className="text-xs text-gray-400">{j.company}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusColor(j.status)}`}>
                          {statusLabel(j.status)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
