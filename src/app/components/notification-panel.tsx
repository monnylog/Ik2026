import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Wifi,
  Zap,
  Bell,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import {
  getNotificationEntries,
  type EventEntry,
} from "./notification-data";
import { useUserData } from "../lib/use-user-data";
import { useNotion, getCriticalMilestones } from "../lib/notion-context";
import { useAnnouncement } from "../lib/use-announcement";
import { loadNotifPrefs, isNotifAllowed } from "../lib/notification-prefs";

import { bodyFont, headingFont } from "../lib/fonts";

// Time grouping helpers
function getNotifTimeGroup(timestamp: string): string {
  const lower = timestamp.toLowerCase();
  if (
    lower.includes("just now") ||
    lower.includes("min ago") ||
    lower.includes("hour ago") ||
    lower === "today" ||
    lower.includes("30 min")
  ) {
    return "Today";
  }
  if (lower.includes("yesterday") || lower === "1 day ago") {
    return "Yesterday";
  }
  if (
    lower.includes("2 day") ||
    lower.includes("3 day") ||
    lower.includes("4 day") ||
    lower.includes("2 hours") ||
    lower.includes("3 hours") ||
    lower.includes("4 hours") ||
    lower.includes("5 hours")
  ) {
    return "Today";
  }
  if (lower.includes("day ago") || lower.includes("days ago")) {
    const match = lower.match(/(\d+)\s*day/);
    if (match) {
      const days = parseInt(match[1]);
      if (days <= 1) return "Yesterday";
      if (days <= 6) return "Earlier This Week";
    }
    return "Earlier This Week";
  }
  return "Older";
}

const timeGroupOrder = ["Today", "Yesterday", "Earlier This Week", "Older"];

const timeGroupStyles: Record<string, { color: string; bg: string }> = {
  "Today": { color: "#C9A96E", bg: "rgba(201,169,110,0.06)" },
  "Yesterday": { color: "#7E9E78", bg: "rgba(126,158,120,0.05)" },
  "Earlier This Week": { color: "#6B7F8E", bg: "rgba(107,127,142,0.05)" },
  "Older": { color: "#CDA88A", bg: "rgba(205,168,138,0.04)" },
};

const typeConfig: Record<string, { color: string; bg: string; icon: typeof AlertCircle }> = {
  action: { color: "#CDA88A", bg: "rgba(205,168,138,0.08)", icon: AlertCircle },
  urgent: { color: "#CDA88A", bg: "rgba(205,168,138,0.08)", icon: AlertCircle },
  update: { color: "#7E9E78", bg: "rgba(126,158,120,0.08)", icon: CheckCircle2 },
  celebration: { color: "#1A5C38", bg: "rgba(26,92,56,0.08)", icon: CheckCircle2 },
  reminder: { color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  info: { color: "#4A7FB5", bg: "rgba(74,127,181,0.08)", icon: CheckCircle2 },
};

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  role: UserRole;
  onNavigate: (page: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function NotificationPanel({
  open,
  onClose,
  role,
  onNavigate,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const staticVisible = getNotificationEntries(role);
  const { milestones, isLive: notionLive } = useNotion();

  // Build Notion-sourced urgent notifications for leadership
  const notionNotifs: EventEntry[] = [];
  if (notionLive && role !== "chef") {
    const criticals = getCriticalMilestones(milestones).slice(0, 5);
    for (const m of criticals) {
      const statusLabel = m.status?.includes("CRITICAL") ? "CRITICAL" : "Overdue";
      notionNotifs.push({
        id: `notion-notif-${m.id}`,
        notifTitle: `${m.milestone} — ${statusLabel}`,
        notifBody: m.blocksAndDeps || (m.owner ? `Owner: ${m.owner}` : "Needs immediate attention"),
        notifTimestamp: m.division || "IK26 Path",
        notifNavigateTo: "Event Timeline",
        type: "urgent",
        chefVisible: false,
        surfaces: "notification",
      });
    }
  }

  const visible = [...notionNotifs, ...staticVisible];

  // Apply content notification preferences filter
  const notifPrefs = loadNotifPrefs();
  const filteredVisible = visible.filter((n) => isNotifAllowed(n.type, notifPrefs));

  // Per-user read state — synced to KV
  const [readIdsList, setReadIdsList] = useUserData<string[]>("read-notifs", []);
  const readIds = new Set(readIdsList);

  const unreadCount = filteredVisible.filter((n) => !readIds.has(n.id)).length;

  // Screen reader announcements
  const { message: srMessage, announce } = useAnnouncement();

  // Category badge counts for unread
  const unreadByCategory = filteredVisible
    .filter((n) => !readIds.has(n.id))
    .reduce<Record<string, number>>((acc, n) => {
      const cat = n.type === "urgent" || n.type === "action" ? "critical" : n.type;
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadCountChange?.(unreadCount);
  }, [unreadCount, onUnreadCountChange]);

  const updateReadIds = (newIds: Set<string>) => {
    setReadIdsList([...newIds]);
  };

  const markAllRead = () => {
    updateReadIds(new Set([...readIds, ...filteredVisible.map((n) => n.id)]));
    announce(`All ${unreadCount} notifications marked as read`);
  };

  const handleClick = (n: EventEntry) => {
    if (!readIds.has(n.id)) {
      announce(`Notification "${n.notifTitle}" marked as read`);
    }
    updateReadIds(new Set([...readIds, n.id]));
    if (n.notifNavigateTo) {
      onNavigate(n.notifNavigateTo);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            {/* Screen reader live region */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {srMessage}
            </div>

            {/* Header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      className="text-[0.5625rem] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(201,169,110,0.15)",
                        color: "#C9A96E",
                        ...bodyFont,
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[0.6875rem] text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                      style={bodyFont}
                      aria-label="Mark all notifications as read"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                    aria-label="Close notification panel"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              {/* Category badges */}
              {unreadCount > 0 && Object.keys(unreadByCategory).length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {unreadByCategory.critical && unreadByCategory.critical > 0 && (
                    <span
                      className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(205,168,138,0.12)", color: "#CDA88A", ...bodyFont }}
                    >
                      <Zap className="w-2 h-2" />
                      {unreadByCategory.critical} Critical
                    </span>
                  )}
                  {unreadByCategory.reminder && unreadByCategory.reminder > 0 && (
                    <span
                      className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", ...bodyFont }}
                    >
                      <Clock className="w-2 h-2" />
                      {unreadByCategory.reminder} Reminders
                    </span>
                  )}
                  {unreadByCategory.update && unreadByCategory.update > 0 && (
                    <span
                      className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(126,158,120,0.1)", color: "#7E9E78", ...bodyFont }}
                    >
                      <CheckCircle2 className="w-2 h-2" />
                      {unreadByCategory.update} Updates
                    </span>
                  )}
                  {unreadByCategory.info && unreadByCategory.info > 0 && (
                    <span
                      className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(74,127,181,0.08)", color: "#4A7FB5", ...bodyFont }}
                    >
                      <Bell className="w-2 h-2" />
                      {unreadByCategory.info} Info
                    </span>
                  )}
                  {unreadByCategory.celebration && unreadByCategory.celebration > 0 && (
                    <span
                      className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(26,92,56,0.08)", color: "#1A5C38", ...bodyFont }}
                    >
                      <CheckCircle2 className="w-2 h-2" />
                      {unreadByCategory.celebration} New
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Notifications list — grouped by time */}
            <div className="max-h-80 overflow-y-auto">
              {(() => {
                // Group notifications by time period
                const grouped = new Map<string, EventEntry[]>();
                for (const n of filteredVisible) {
                  const group = getNotifTimeGroup(n.notifTimestamp || "");
                  if (!grouped.has(group)) grouped.set(group, []);
                  grouped.get(group)!.push(n);
                }

                return timeGroupOrder.map((groupLabel) => {
                  const items = grouped.get(groupLabel);
                  if (!items || items.length === 0) return null;
                  const groupStyle = timeGroupStyles[groupLabel];

                  return (
                    <div key={groupLabel}>
                      {/* Group header */}
                      <div
                        className="px-4 py-1.5 sticky top-0 z-10 flex items-center gap-2"
                        style={{ backgroundColor: groupStyle.bg, borderBottom: "1px solid var(--border)" }}
                      >
                        <span
                          className="text-[0.5625rem] uppercase tracking-[0.1em]"
                          style={{ color: groupStyle.color, ...bodyFont, fontWeight: 600 }}
                        >
                          {groupLabel}
                        </span>
                        <span
                          className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: `${groupStyle.color}15`, color: groupStyle.color, ...bodyFont }}
                        >
                          {items.filter((n) => !readIds.has(n.id)).length > 0
                            ? `${items.filter((n) => !readIds.has(n.id)).length} new`
                            : `${items.length}`}
                        </span>
                      </div>

                      {/* Items in group */}
                      <div className="divide-y divide-border/30">
                        {items.map((n) => {
                          const cfg = typeConfig[n.type] || typeConfig.info;
                          const Icon = cfg.icon;
                          const isRead = readIds.has(n.id);
                          const isClickable = !!n.notifNavigateTo;

                          return (
                            <button
                              key={n.id}
                              onClick={() => handleClick(n)}
                              className={`w-full text-left px-4 py-3 transition-colors ${
                                isClickable ? "cursor-pointer hover:bg-secondary/50" : "cursor-default"
                              } ${isRead ? "opacity-60" : ""}`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                                  style={{ backgroundColor: cfg.bg }}
                                >
                                  <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-foreground text-[0.8125rem] truncate" style={bodyFont}>
                                      {n.notifTitle}
                                    </span>
                                    {!isRead && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                        style={{ backgroundColor: "#C9A96E" }}
                                      />
                                    )}
                                  </div>
                                  <p className="text-muted-foreground text-[0.6875rem] mt-0.5" style={bodyFont}>
                                    {n.notifBody}
                                  </p>
                                  <span className="text-muted-foreground/50 text-[0.625rem] mt-1 block" style={bodyFont}>
                                    {n.notifTimestamp}
                                  </span>
                                </div>
                                {isClickable && (
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-1" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                    All notifications from the last 7 days
                  </p>
                  {notionLive && role !== "chef" && notionNotifs.length > 0 && (
                    <span
                      className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(93,160,107,0.1)", color: "#5DA06B", ...bodyFont }}
                    >
                      <Wifi className="w-2 h-2" />
                      +{notionNotifs.length} live
                    </span>
                  )}
                </div>
                <button
                  onClick={() => { onNavigate("Settings"); onClose(); }}
                  className="text-[0.625rem] text-muted-foreground/50 hover:text-gold transition-colors cursor-pointer"
                  style={bodyFont}
                >
                  Notification Preferences
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}