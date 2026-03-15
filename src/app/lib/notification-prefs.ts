// Notification preference categories — stored in localStorage
// and used by notification-panel to filter what shows up.

export interface NotificationPrefs {
  taskUpdates: boolean;
  checklistReminders: boolean;
  eventAnnouncements: boolean;
  teamMessages: boolean;
}

const STORAGE_KEY = "ik26-notif-prefs";

const defaults: NotificationPrefs = {
  taskUpdates: true,
  checklistReminders: true,
  eventAnnouncements: true,
  teamMessages: true,
};

export function loadNotifPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveNotifPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

// Map notification types to pref categories
export function isNotifAllowed(
  notifType: string,
  prefs: NotificationPrefs
): boolean {
  // task-related
  if (
    notifType === "action" &&
    !prefs.taskUpdates
  )
    return false;
  // checklist/reminder
  if (notifType === "reminder" && !prefs.checklistReminders) return false;
  // event announcements (celebration, urgent, update)
  if (
    (notifType === "celebration" || notifType === "urgent") &&
    !prefs.eventAnnouncements
  )
    return false;
  // team messages (info)
  if (notifType === "info" && !prefs.teamMessages) return false;
  // updates go through event announcements
  if (notifType === "update" && !prefs.eventAnnouncements) return false;
  return true;
}
