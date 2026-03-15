import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Share2,
  Users,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Inbox,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

// Friendly event labels
const eventLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sectionEnter: { label: "Section Views", icon: Eye, color: "#C9A96E" },
  chefFlip: { label: "Chef Flips", icon: MousePointerClick, color: "#7E9E78" },
  chapterEnter: { label: "Chapter Views", icon: Eye, color: "#8B96C4" },
  shareCopy: { label: "Share Copies", icon: Share2, color: "#CDA88A" },
  shareNative: { label: "Native Shares", icon: Share2, color: "#EDCBC8" },
  personaSelect: { label: "Persona Picks", icon: Users, color: "#C49370" },
  navClick: { label: "Nav Clicks", icon: MousePointerClick, color: "#A8B89F" },
  calmToggle: { label: "Calm Toggles", icon: Eye, color: "#9EAEC4" },
  ctaClick: { label: "CTA Clicks", icon: TrendingUp, color: "#C9A96E" },
  resetExperience: { label: "Resets", icon: RefreshCw, color: "#EDCBC8" },
};

interface AnalyticsSummary {
  total: number;
  byEvent: Record<string, number>;
  byDay: Record<string, number>;
  recent: Array<{ event: string; data: any; timestamp: string }>;
}

interface InquiryCount {
  total: number;
  new: number;
}

export function LandingAnalytics({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [inquiryCount, setInquiryCount] = useState<InquiryCount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, inquiryRes] = await Promise.all([
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/analytics/summary`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          ),
          fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/portal-inquiries/count`,
            { headers: { Authorization: `Bearer ${publicAnonKey}` } }
          ),
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }
        if (inquiryRes.ok) {
          setInquiryCount(await inquiryRes.json());
        }
      } catch (err) {
        console.error("Failed to load landing analytics:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Sort events by count
  const sortedEvents = data
    ? Object.entries(data.byEvent)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  const maxCount = sortedEvents.length > 0 ? sortedEvents[0][1] : 1;

  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(201,169,110,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "rgba(201,169,110,0.08)",
              border: "1px solid rgba(201,169,110,0.15)",
            }}
          >
            <BarChart3 className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
          </div>
          <h3 className="text-sm font-semibold" style={{ ...headingFont, color: "rgba(244,237,228,0.85)" }}>
            Landing Page
          </h3>
        </div>
        <a
          href="/welcome"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[0.625rem] px-2 py-1 rounded-md"
          style={{
            color: "rgba(244,237,228,0.4)",
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(244,237,228,0.06)",
          }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          View
        </a>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-14 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-6 rounded" style={{ backgroundColor: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div
              className="p-2.5 rounded-xl text-center"
              style={{
                backgroundColor: "rgba(201,169,110,0.06)",
                border: "1px solid rgba(201,169,110,0.1)",
              }}
            >
              <div className="text-base font-bold" style={{ color: "#C9A96E" }}>
                {data?.total ?? 0}
              </div>
              <div className="text-[0.5625rem] uppercase tracking-wider mt-0.5" style={{ color: "rgba(244,237,228,0.35)" }}>
                Events
              </div>
            </div>
            <div
              className="p-2.5 rounded-xl text-center"
              style={{
                backgroundColor: "rgba(126,158,120,0.06)",
                border: "1px solid rgba(126,158,120,0.1)",
              }}
            >
              <div className="text-base font-bold" style={{ color: "#7E9E78" }}>
                {Object.keys(data?.byDay ?? {}).length}
              </div>
              <div className="text-[0.5625rem] uppercase tracking-wider mt-0.5" style={{ color: "rgba(244,237,228,0.35)" }}>
                Active Days
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate("Inquiries")}
              className="p-2.5 rounded-xl text-center cursor-pointer"
              style={{
                backgroundColor: "rgba(139,150,196,0.06)",
                border: "1px solid rgba(139,150,196,0.1)",
              }}
            >
              <div className="text-base font-bold flex items-center justify-center gap-1" style={{ color: "#8B96C4" }}>
                {inquiryCount?.total ?? 0}
                {(inquiryCount?.new ?? 0) > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#C9A96E" }}
                  />
                )}
              </div>
              <div className="text-[0.5625rem] uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1" style={{ color: "rgba(244,237,228,0.35)" }}>
                <Inbox className="w-2.5 h-2.5" />
                Inquiries
              </div>
            </motion.button>
          </div>

          {/* Event breakdown mini bar chart */}
          {sortedEvents.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[0.5625rem] uppercase tracking-wider" style={{ color: "rgba(244,237,228,0.25)" }}>
                Top Events
              </div>
              {sortedEvents.map(([event, count]) => {
                const info = eventLabels[event] || { label: event, icon: Eye, color: "#CDA88A" };
                const pct = Math.max(8, (count / maxCount) * 100);
                return (
                  <div key={event} className="flex items-center gap-2">
                    <info.icon className="w-3 h-3 shrink-0" style={{ color: info.color, opacity: 0.6 }} />
                    <span className="text-[0.625rem] w-20 truncate" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
                      {info.label}
                    </span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: `${info.color}33` }}
                      />
                    </div>
                    <span className="text-[0.5625rem] tabular-nums w-6 text-right" style={{ color: info.color }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* No data state */}
          {!data || data.total === 0 ? (
            <div className="text-center py-3">
              <p className="text-[0.6875rem]" style={{ color: "rgba(244,237,228,0.3)" }}>
                No landing page events tracked yet.
                <br />
                Share <strong>/welcome</strong> to start collecting data.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
