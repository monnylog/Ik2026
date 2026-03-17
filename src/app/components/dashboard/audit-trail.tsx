import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScrollText,
  RefreshCw,
  Filter,
  AlertTriangle,
  AlertCircle,
  Info,
  User,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  Wallet,
  MessageCircle,
  Database,
  Globe,
  Settings,
  Plane,
  X,
  ArrowRight,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = {
  fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif",
};

const API = `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6`;
const headers = {
  Authorization: `Bearer ${publicAnonKey}`,
  "Content-Type": "application/json",
};

interface AuditEntry {
  id: string;
  action: string;
  category: string;
  actor: string;
  actorName?: string;
  actorRole?: string;
  target?: string;
  targetName?: string;
  details?: string;
  metadata?: Record<string, any>;
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

interface AuditSummary {
  totalEvents: number;
  todayCount: number;
  byCategory: Record<string, number>;
  bySeverity: { info: number; warning: number; critical: number };
  lastEvent: { action: string; category: string; actor: string; timestamp: string } | null;
  recentAlerts: AuditEntry[];
}

const CATEGORIES = [
  { id: "all", label: "All", icon: ScrollText },
  { id: "auth", label: "Auth", icon: Shield },
  { id: "expense", label: "Expenses", icon: Wallet },
  { id: "notion", label: "Notion", icon: Database },
  { id: "engagement", label: "Engagement", icon: MessageCircle },
  { id: "travel", label: "Travel", icon: Plane },
  { id: "portal", label: "Portal", icon: Globe },
  { id: "system", label: "System", icon: Settings },
];

const SEVERITY_CONFIG = {
  info: { color: "#7E9E78", bg: "rgba(126,158,120,0.1)", border: "rgba(126,158,120,0.2)", icon: Info, label: "Info" },
  warning: { color: "#D4AA7C", bg: "rgba(212,170,124,0.1)", border: "rgba(212,170,124,0.2)", icon: AlertTriangle, label: "Warning" },
  critical: { color: "#C27B6B", bg: "rgba(194,123,107,0.1)", border: "rgba(194,123,107,0.2)", icon: AlertCircle, label: "Critical" },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AuditTrail({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (severityFilter) params.set("severity", severityFilter);

      const [summaryRes, entriesRes] = await Promise.all([
        fetch(`${API}/audit/summary`, { headers }),
        fetch(`${API}/audit/log?${params}`, { headers }),
      ]);

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Error fetching audit data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, severityFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : Settings;
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: "rgba(201,169,110,0.1)",
              border: "1px solid rgba(201,169,110,0.15)",
            }}
          >
            <ScrollText className="w-4 h-4" style={{ color: "#C9A96E" }} />
          </div>
          <div>
            <h3
              className="text-[0.875rem] text-foreground font-semibold leading-tight"
              style={headingFont}
            >
              Audit Trail
            </h3>
            <p
              className="text-[0.6875rem] text-muted-foreground"
              style={bodyFont}
            >
              {summary
                ? `${summary.totalEvents} total events \u00b7 ${summary.todayCount} today`
                : "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: "rgba(126,158,120,0.08)",
              border: "1px solid rgba(126,158,120,0.15)",
            }}
            aria-label="Refresh audit log"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
              style={{ color: "#7E9E78" }}
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              backgroundColor: "rgba(201,169,110,0.08)",
              border: "1px solid rgba(201,169,110,0.15)",
            }}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Summary pills */}
      {summary && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {(["info", "warning", "critical"] as const).map((sev) => {
            const config = SEVERITY_CONFIG[sev];
            const count = summary.bySeverity[sev] || 0;
            const isActive = severityFilter === sev;
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(isActive ? null : sev)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] cursor-pointer transition-all"
                style={{
                  backgroundColor: isActive ? config.bg : "transparent",
                  border: `1px solid ${isActive ? config.border : "var(--border)"}`,
                  color: isActive ? config.color : "var(--muted-foreground)",
                  ...bodyFont,
                }}
              >
                <config.icon className="w-2.5 h-2.5" />
                {count} {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Recent alerts (always visible) */}
      {summary?.recentAlerts && summary.recentAlerts.length > 0 && !expanded && (
        <div className="px-4 pb-3">
          <div className="space-y-1.5">
            {summary.recentAlerts.slice(0, 2).map((alert) => {
              const sev = SEVERITY_CONFIG[alert.severity];
              return (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.6875rem]"
                  style={{
                    backgroundColor: sev.bg,
                    border: `1px solid ${sev.border}`,
                    ...bodyFont,
                  }}
                >
                  <sev.icon className="w-3 h-3 shrink-0" style={{ color: sev.color }} />
                  <span className="truncate" style={{ color: sev.color }}>
                    {alert.details || alert.action}
                  </span>
                  <span className="text-[0.5625rem] shrink-0 opacity-60" style={{ color: sev.color }}>
                    {timeAgo(alert.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {/* Category filter */}
            <div className="px-4 pb-2 flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => {
                const isActive = categoryFilter === cat.id;
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.625rem] cursor-pointer transition-all"
                    style={{
                      backgroundColor: isActive
                        ? "rgba(201,169,110,0.12)"
                        : "transparent",
                      border: isActive
                        ? "1px solid rgba(201,169,110,0.25)"
                        : "1px solid transparent",
                      color: isActive ? "#C9A96E" : "var(--muted-foreground)",
                      fontWeight: isActive ? 600 : 400,
                      ...bodyFont,
                    }}
                  >
                    <CatIcon className="w-2.5 h-2.5" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Entries list */}
            <div className="px-4 pb-3 max-h-80 overflow-y-auto space-y-1">
              {loading ? (
                <div className="py-6 text-center">
                  <div
                    className="w-5 h-5 rounded-full animate-spin mx-auto mb-2"
                    style={{
                      border: "2px solid rgba(201,169,110,0.15)",
                      borderTopColor: "rgba(201,169,110,0.6)",
                    }}
                  />
                  <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                    Loading audit log...
                  </span>
                </div>
              ) : entries.length === 0 ? (
                <div className="py-6 text-center">
                  <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
                    No audit events recorded yet.
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground/60 mt-0.5" style={bodyFont}>
                    Actions will be logged as users interact with the platform.
                  </p>
                </div>
              ) : (
                entries.map((entry, i) => {
                  const sev = SEVERITY_CONFIG[entry.severity];
                  const CatIcon = getCategoryIcon(entry.category);
                  return (
                    <motion.button
                      key={entry.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                      className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          selectedEntry?.id === entry.id
                            ? "rgba(201,169,110,0.06)"
                            : "transparent",
                        border:
                          selectedEntry?.id === entry.id
                            ? "1px solid rgba(201,169,110,0.15)"
                            : "1px solid transparent",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: sev.bg }}
                      >
                        <CatIcon className="w-2.5 h-2.5" style={{ color: sev.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[0.6875rem] font-medium text-foreground truncate"
                            style={bodyFont}
                          >
                            {entry.action}
                          </span>
                          <span
                            className="text-[0.5625rem] px-1 py-0 rounded"
                            style={{
                              backgroundColor: sev.bg,
                              color: sev.color,
                              ...bodyFont,
                            }}
                          >
                            {entry.severity}
                          </span>
                        </div>
                        {entry.details && (
                          <p
                            className="text-[0.625rem] text-muted-foreground truncate mt-0.5"
                            style={bodyFont}
                          >
                            {entry.details}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {entry.actorName && (
                            <span className="flex items-center gap-0.5 text-[0.5625rem] text-muted-foreground/70" style={bodyFont}>
                              <User className="w-2 h-2" />
                              {entry.actorName}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[0.5625rem] text-muted-foreground/50" style={bodyFont}>
                            <Clock className="w-2 h-2" />
                            {timeAgo(entry.timestamp)}
                          </span>
                        </div>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {selectedEntry?.id === entry.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="mt-1.5 pt-1.5 overflow-hidden"
                              style={{ borderTop: "1px solid var(--border)" }}
                            >
                              <div className="grid grid-cols-2 gap-1 text-[0.5625rem]" style={bodyFont}>
                                <div>
                                  <span className="text-muted-foreground/60">Category:</span>{" "}
                                  <span className="text-foreground">{entry.category}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground/60">Actor:</span>{" "}
                                  <span className="text-foreground">{entry.actorName || entry.actor}</span>
                                </div>
                                {entry.target && (
                                  <div>
                                    <span className="text-muted-foreground/60">Target:</span>{" "}
                                    <span className="text-foreground">{entry.targetName || entry.target}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground/60">Time:</span>{" "}
                                  <span className="text-foreground">
                                    {new Date(entry.timestamp).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                                <div className="mt-1 p-1.5 rounded bg-secondary/40 text-[0.5625rem] text-muted-foreground font-mono">
                                  {JSON.stringify(entry.metadata, null, 1)}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View full log link */}
      {onNavigate && (
        <div className="px-4 pb-3">
          <button
            onClick={() => onNavigate("System Audit")}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg cursor-pointer hover:bg-secondary/20 transition-colors"
            style={bodyFont}
          >
            <span className="text-muted-foreground/60 text-[0.6875rem]">
              View full audit log
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground/40" />
          </button>
        </div>
      )}
    </div>
  );
}