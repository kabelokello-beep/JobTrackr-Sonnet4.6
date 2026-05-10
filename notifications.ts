import { LocalNotifications } from '@capacitor/local-notifications';
import type { JobRecord, Reminder } from '../db/database';
import { db } from '../db/database';

const getNotifId = (reminderId: string): number =>
  Math.abs(parseInt(reminderId.replace(/-/g, '').slice(0, 8), 16)) % 2_000_000_000;

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
};

const resolveScheduleAt = (reminder: Reminder, closingDate: string): Date | null => {
  if (reminder.timing === 'custom' || reminder.timing === 'apply_by') {
    if (!reminder.customDate) return null;
    return new Date(reminder.customDate);
  }
  if (!closingDate) return null;
  const base = new Date(closingDate);
  base.setHours(9, 0, 0, 0);
  if (reminder.timing === '1_day') base.setDate(base.getDate() - 1);
  else if (reminder.timing === '3_days') base.setDate(base.getDate() - 3);
  else if (reminder.timing === '1_week') base.setDate(base.getDate() - 7);
  return base;
};

export const scheduleJobReminders = async (job: JobRecord): Promise<void> => {
  if (!job.reminders?.length) return;
  const toSchedule = [];
  for (const r of job.reminders) {
    if (r.triggered) continue;
    const at = resolveScheduleAt(r, job.closingDate);
    if (!at || at <= new Date()) continue;
    toSchedule.push({
      id: getNotifId(r.id),
      title: r.timing === 'apply_by'
        ? `📌 Apply Now — ${job.jobTitle}`
        : `⏰ Deadline Soon — ${job.jobTitle}`,
      body: r.timing === 'apply_by'
        ? `You set a reminder to apply to ${job.company}`
        : `${job.company} closing date is coming up`,
      schedule: { at },
      sound: undefined,
      attachments: undefined,
      actionTypeId: '',
      extra: null,
    });
  }
  if (toSchedule.length > 0) {
    await LocalNotifications.schedule({ notifications: toSchedule });
  }
};

export const cancelJobReminders = async (job: JobRecord): Promise<void> => {
  if (!job.reminders?.length) return;
  try {
    await LocalNotifications.cancel({
      notifications: job.reminders.map((r) => ({ id: getNotifId(r.id) })),
    });
  } catch {}
};

export const rescheduleAllReminders = async (): Promise<void> => {
  try {
    const jobs = await db.jobs.toArray();
    for (const job of jobs) {
      if (job.reminders?.length) {
        await cancelJobReminders(job);
        await scheduleJobReminders(job);
      }
    }
  } catch (e) {
    console.error('rescheduleAllReminders failed:', e);
  }
};
