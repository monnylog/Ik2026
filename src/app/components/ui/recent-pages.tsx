import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  LayoutDashboard,
  MessageCircle,
  Mic,
  CalendarDays,
  Users,
  UserCheck,
  Heart,
  Shield,
  Plane,
  UtensilsCrossed,
  DollarSign,
  BookOpen,
  Link2,
  Settings,
  Sparkles,
  Share2,
  ListChecks,
  Tag,
  CalendarClock,
  ClipboardList,
  Database,
  Handshake,
} from "lucide-react";

const STORAGE_KEY = "ik26_recent_pages";
const MAX_RECENT = 5;

export interface RecentPage {
  page: string;
  timestamp: number;
}

const pageIconMap: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Comms: MessageCircle,
  "Our Istoryas": Mic,
  "Event Timeline": CalendarDays,
  "Chef Roster": Users,
  "Team Deploy": UserCheck,
  Community: Heart,
  Members: Shield,
  "Travel & Lodging": Plane,
  "Menu & Courses": UtensilsCrossed,
  "Submit Menu": UtensilsCrossed,
  "Budget & COGS": DollarSign,
  "Research & Story": BookOpen,
  "Links & Resources": Link2,
  Settings: Settings,
  Portal: Sparkles,
  "Share Invite": Share2,
  "Pre-Event Checklist": ListChecks,
  "Task Board": Tag,
  "Event Schedule": CalendarClock,
  "Activity Log": ClipboardList,
  "Notion Admin": Database,
  "Sponsors & Partners": Handshake,
};

export function getPageIcon(page: string) {
  return pageIconMap[page] || LayoutDashboard;
}

function loadRecentPages(): RecentPage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function saveRecentPages(pages: RecentPage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
  } catch {}
}

/**
 * Hook to track recently visited pages.
 * Returns [recentPages, trackPage]
 */
export function useRecentPages() {
  const [recentPages, setRecentPages] = useState<RecentPage[]>(() => loadRecentPages());

  const trackPage = useCallback((page: string) => {
    if (page === "Dashboard") return; // Dashboard is always accessible, skip
    setRecentPages((prev) => {
      const filtered = prev.filter((p) => p.page !== page);
      const updated = [{ page, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      saveRecentPages(updated);
      return updated;
    });
  }, []);

  return { recentPages, trackPage };
}

/**
 * Format relative time for recent page visits.
 */
export function formatRecentTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}