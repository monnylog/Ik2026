import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone,
  X,
  ExternalLink,
  AlertCircle,
  PartyPopper,
  CalendarCheck,
  XCircle,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";
import { getBannerEntries, type EventType, type EventEntry } from "../notification-data";
import { useUserData } from "../../lib/use-user-data";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformAnnouncement } from "../../lib/notion-transforms";

const bodyFont = { fontFamily: "'Inter', sans-serif" };

const typeConfig: Record<
  EventType,
  {
    icon: typeof Megaphone;
    bg: string;
    border: string;
    iconColor: string;
  }
> = {
  info: {
    icon: Megaphone,
    bg: "rgba(107,158,194,0.05)",
    border: "rgba(107,158,194,0.10)",
    iconColor: "#6B9EC2",
  },
  celebration: {
    icon: PartyPopper,
    bg: "rgba(93,160,107,0.05)",
    border: "rgba(93,160,107,0.10)",
    iconColor: "#5DA06B",
  },
  urgent: {
    icon: AlertCircle,
    bg: "rgba(212,184,150,0.05)",
    border: "rgba(212,184,150,0.12)",
    iconColor: "#D4B896",
  },
  reminder: {
    icon: CalendarCheck,
    bg: "rgba(206,180,122,0.05)",
    border: "rgba(206,180,122,0.10)",
    iconColor: "#CEB47A",
  },
  action: {
    icon: AlertCircle,
    bg: "rgba(212,184,150,0.05)",
    border: "rgba(212,184,150,0.12)",
    iconColor: "#D4B896",
  },
  update: {
    icon: Megaphone,
    bg: "rgba(212,184,150,0.05)",
    border: "rgba(212,184,150,0.12)",
    iconColor: "#D4B896",
  },
};

interface AnnouncementsBannerProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function AnnouncementsBanner({ role, onNavigate }: AnnouncementsBannerProps) {
  // Per-user dismissed state — synced to KV
  const [dismissed, setDismissed] = useUserData<string[]>("dismissed-banners", []);

  // Notion announcements — live from IK26 workspace
  const { items: notionAnnouncements } = useNotionDatabase("announcements");

  const hardcodedBanners = getBannerEntries(role);

  // Transform Notion announcements into EventEntry-compatible shape and filter by role
  const notionBanners: EventEntry[] = notionAnnouncements
    .map((raw) => transformAnnouncement(raw))
    .filter((ann) => {
      // Filter by role visibility
      if (role === "chef" && !ann.chefVisible) return false;
      if (role === "team" && !ann.chefVisible && !ann.teamVisible) return false;
      // Must have displayable text
      return ann.title || ann.body;
    })
    .map((ann) => ({
      id: ann.id,
      bannerText: ann.body || ann.title,
      bannerActionLabel: ann.actionLabel,
      bannerActionUrl: ann.actionUrl,
      bannerActionNavigate: ann.actionNavigate,
      bannerDismissible: ann.dismissible,
      type: ann.type,
      chefVisible: ann.chefVisible,
      teamVisible: ann.teamVisible,
      surfaces: "banner" as const,
    }));

  // Merge: Notion announcements first (fresh), then hardcoded
  const allBannerEntries = [...notionBanners, ...hardcodedBanners];

  const visibleAnnouncements = allBannerEntries.filter((a) => {
    if (a.bannerDismissible && dismissed.includes(a.id)) return false;
    return true;
  });

  const dismissAnnouncement = (id: string) => {
    setDismissed((prev) => [...prev, id]);
  };

  const dismissAll = () => {
    const allDismissibleIds = allBannerEntries
      .filter((a) => a.bannerDismissible)
      .map((a) => a.id);
    setDismissed((prev) => [...new Set([...prev, ...allDismissibleIds])]);
  };

  const dismissibleVisible = visibleAnnouncements.filter((a) => a.bannerDismissible);

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Clear all — leadership only, when multiple dismissible banners exist */}
      {role === "leadership" && dismissibleVisible.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={dismissAll}
            className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-secondary/50"
            style={bodyFont}
          >
            <XCircle className="w-3 h-3" />
            Clear all
          </button>
        </div>
      )}
      <AnimatePresence>
        {visibleAnnouncements.map((ann, idx) => {
          const cfg = typeConfig[ann.type] || typeConfig.info;
          const Icon = cfg.icon;

          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.3 }}
              className="rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
              style={{
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.border}`,
              }}
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.iconColor }} />
              <p className="flex-1 text-[0.8125rem] text-foreground" style={bodyFont}>
                {ann.bannerText}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {ann.bannerActionUrl && (
                  <a
                    href={ann.bannerActionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors hover:opacity-80"
                    style={{
                      backgroundColor: `${cfg.iconColor}15`,
                      color: cfg.iconColor,
                      border: `1px solid ${cfg.iconColor}30`,
                      ...bodyFont,
                    }}
                  >
                    {ann.bannerActionLabel}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {ann.bannerActionNavigate && onNavigate && (
                  <button
                    onClick={() => onNavigate(ann.bannerActionNavigate!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors hover:opacity-80 cursor-pointer"
                    style={{
                      backgroundColor: `${cfg.iconColor}15`,
                      color: cfg.iconColor,
                      border: `1px solid ${cfg.iconColor}30`,
                      ...bodyFont,
                    }}
                  >
                    {ann.bannerActionLabel}
                  </button>
                )}
                {ann.bannerDismissible && (
                  <button
                    onClick={() => dismissAnnouncement(ann.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" style={{ color: cfg.iconColor }} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}