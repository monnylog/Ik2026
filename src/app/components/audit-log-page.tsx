import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ScrollText,
  RefreshCw,
  Search,
  Filter,
  Download,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Info,
  User,
  Clock,
  Shield,
  Wallet,
  MessageCircle,
  Database,
  Globe,
  Settings,
  Plane,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Eye,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { bodyFont, headingFont } from "../lib/fonts";

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
  lastEvent: {
    action: string;
    category: string;
    actor: string;
    timestamp: string;
  } | null;
  recentAlerts: AuditEntry[];
}

const CATEGORIES = [
  { id: "all", label: "All", icon: ScrollText, color: "#C9A96E" },
  { id: "auth", label: "Auth", icon: Shield, color: "#8B7EC8" },
  { id: "expense", label: "Expenses", icon: Wallet, color: "#D4AA7C" },
  { id: "notion", label: "Notion", icon: Database, color: "#4A7FB5" },
  { id: "engagement", label: "Engagement", icon: MessageCircle, color: "#7E9E78" },
  { id: "travel", label: "Travel", icon: Plane, color: "#5EAAA8" },
  { id: "portal", label: "Portal", icon: Globe, color: "#C27B6B" },
  { id: "system", label: "System", icon: Settings, color: "#8A857F" },
  { id: "profile", label: "Profile", icon: User, color: "#B8A9C9" },
];

const SEVERITY_CONFIG = {
  info: {
    color: "#7E9E78",
    bg: "rgba(126,158,120,0.1)",
    border: "rgba(126,158,120,0.2)",
    icon: Info,
    label: "Info",
  },
  warning: {
    color: "#D4AA7C",
    bg: "rgba(212,170,124,0.1)",
    border: "rgba(212,170,124,0.2)",
    icon: AlertTriangle,
    label: "Warning",
  },
  critical: {
    color: "#C27B6B",
    bg: "rgba(194,123,107,0.1)",
    border: "rgba(194,123,107,0.2)",
    icon: AlertCircle,
    label: "Critical",
  },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface AuditLogPageProps {
  onNavigate: (page: string) => void;
}

export function AuditLogPage({ onNavigate }: AuditLogPageProps) {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleaningUp, setCleaning] = useState(false);
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);
  const [dateRange, setDateRange] = useState<"all" | "today" | "7d" | "30d">("all");

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (severityFilter) params.set("severity", severityFilter);

      if (dateRange !== "all") {
        const now = new Date();
        let since: Date;
        if (dateRange === "today") {
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (dateRange === "7d") {
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else {
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        params.set("since", since.toISOString());
      }

      const [summaryRes, entriesRes] = await Promise.all([
        fetch(`${API}/audit/summary`, { headers }),
        fetch(`${API}/audit/log?${params}`, { headers }),
      ]);

      if (summaryRes.ok) {
        setSummary(await summaryRes.json());
      }
      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.entries || []);
      }
    } catch (err) {
      console.error("Error fetching audit data:", err);
      toast.error("Failed to load audit log");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, severityFilter, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await fetch(
        `${API}/audit/log/cleanup?days=${cleanupDays}`,
        { method: "DELETE", headers }
      );
      if (res.ok) {
        const data = await res.json();
        toast.success(`Cleaned up ${data.deleted} entries older than ${cleanupDays} days`);
        setShowCleanupConfirm(false);
        fetchData();
      } else {
        toast.error("Cleanup failed");
      }
    } catch (err) {
      console.error("Cleanup error:", err);
      toast.error("Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    const csvHeaders = [
      "ID",
      "Timestamp",
      "Action",
      "Category",
      "Severity",
      "Actor",
      "Actor Name",
      "Actor Role",
      "Target",
      "Target Name",
      "Details",
    ];
    const csvRows = filteredEntries.map((e) => [
      e.id,
      e.timestamp,
      e.action,
      e.category,
      e.severity,
      e.actor,
      e.actorName || "",
      e.actorRole || "",
      e.target || "",
      e.targetName || "",
      (e.details || "").replace(/,/g, ";"),
    ]);

    const csv = [csvHeaders.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ik26-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredEntries.length} entries to CSV`);
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.action.toLowerCase().includes(q) ||
        (e.details || "").toLowerCase().includes(q) ||
        (e.actorName || "").toLowerCase().includes(q) ||
        (e.targetName || "").toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : Settings;
  };

  const getCategoryColor = (cat: string) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.color : "#8A857F";
  };

  // Compute category distribution for stats
  const categoryDistribution = useMemo(() => {
    if (!summary?.byCategory) return [];
    return Object.entries(summary.byCategory)
      .map(([cat, count]) => ({
        category: cat,
        count: count as number,
        color: getCategoryColor(cat),
        icon: getCategoryIcon(cat),
      }))
      .sort((a, b) => b.count - a.count);
  }, [summary]);

  const totalFromCategories = categoryDistribution.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.05))",
              border: "1px solid rgba(201,169,110,0.2)",
            }}
          >
            <ScrollText className="w-5 h-5" style={{ color: "#C9A96E" }} />
          </div>
          <div>
            <h2 className="text-foreground text-[1.125rem] font-bold" style={headingFont}>
              System Audit Log
            </h2>
            <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              {summary
                ? `${summary.totalEvents} total events \u00b7 ${summary.todayCount} today`
                : "Loading..."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{
              backgroundColor: showStats ? "rgba(201,169,110,0.12)" : "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.2)",
              color: "#C9A96E",
              ...bodyFont,
            }}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            {showStats ? "Hide" : "Show"} Stats
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{
              backgroundColor: "rgba(126,158,120,0.08)",
              border: "1px solid rgba(126,158,120,0.2)",
              color: "#7E9E78",
              ...bodyFont,
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{
              backgroundColor: "rgba(74,127,181,0.08)",
              border: "1px solid rgba(74,127,181,0.2)",
              color: "#4A7FB5",
              ...bodyFont,
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCleanupConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{
              backgroundColor: "rgba(194,123,107,0.08)",
              border: "1px solid rgba(194,123,107,0.2)",
              color: "#C27B6B",
              ...bodyFont,
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Cleanup
          </motion.button>
        </div>
      </div>

      {/* Stats cards */}
      <AnimatePresence>
        {showStats && summary && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Total events */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4" style={{ color: "#C9A96E" }} />
                  <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                    Total Events
                  </span>
                </div>
                <p className="text-foreground text-[1.5rem] font-bold" style={headingFont}>
                  {summary.totalEvents.toLocaleString()}
                </p>
              </div>

              {/* Today */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: "#7E9E78" }} />
                  <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                    Today
                  </span>
                </div>
                <p className="text-foreground text-[1.5rem] font-bold" style={headingFont}>
                  {summary.todayCount}
                </p>
              </div>

              {/* Warnings */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: "#D4AA7C" }} />
                  <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                    Warnings
                  </span>
                </div>
                <p className="text-foreground text-[1.5rem] font-bold" style={headingFont}>
                  {summary.bySeverity.warning}
                </p>
              </div>

              {/* Critical */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" style={{ color: "#C27B6B" }} />
                  <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                    Critical
                  </span>
                </div>
                <p className="text-foreground text-[1.5rem] font-bold" style={headingFont}>
                  {summary.bySeverity.critical}
                </p>
              </div>
            </div>

            {/* Category breakdown bar */}
            {categoryDistribution.length > 0 && (
              <div
                className="mt-3 rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h4
                  className="text-[0.8125rem] text-foreground font-semibold mb-3"
                  style={headingFont}
                >
                  Event Distribution by Category
                </h4>
                {/* Horizontal bar */}
                <div className="flex h-3 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "var(--secondary)" }}>
                  {categoryDistribution.map((cat) => (
                    <div
                      key={cat.category}
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${totalFromCategories > 0 ? (cat.count / totalFromCategories) * 100 : 0}%`,
                        backgroundColor: cat.color,
                        minWidth: cat.count > 0 ? "4px" : "0",
                      }}
                      title={`${cat.category}: ${cat.count}`}
                    />
                  ))}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {categoryDistribution.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <div key={cat.category} className="flex items-center gap-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        <CatIcon className="w-3 h-3" style={{ color: cat.color }} />
                        <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>
                          {cat.category}{" "}
                          <span className="text-foreground font-medium">{cat.count}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent alerts */}
            {summary.recentAlerts && summary.recentAlerts.length > 0 && (
              <div
                className="mt-3 rounded-xl p-4"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <h4
                  className="text-[0.8125rem] text-foreground font-semibold mb-2"
                  style={headingFont}
                >
                  Recent Alerts
                </h4>
                <div className="space-y-1.5">
                  {summary.recentAlerts.map((alert) => {
                    const sev = SEVERITY_CONFIG[alert.severity];
                    return (
                      <div
                        key={alert.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: sev.bg,
                          border: `1px solid ${sev.border}`,
                        }}
                      >
                        <sev.icon className="w-3.5 h-3.5 shrink-0" style={{ color: sev.color }} />
                        <span
                          className="text-[0.75rem] truncate flex-1"
                          style={{ color: sev.color, ...bodyFont }}
                        >
                          {alert.details || alert.action}
                        </span>
                        <span
                          className="text-[0.625rem] shrink-0 opacity-70"
                          style={{ color: sev.color, ...bodyFont }}
                        >
                          {timeAgo(alert.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters row */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--muted-foreground)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search actions, details, actors..."
              className="w-full pl-9 pr-8 py-2 rounded-lg text-[0.8125rem] text-foreground outline-none"
              style={{
                backgroundColor: "var(--secondary)",
                border: "1px solid var(--border)",
                ...bodyFont,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Date range selector */}
          <div className="flex items-center gap-1.5">
            {(["all", "today", "7d", "30d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-all"
                style={{
                  backgroundColor:
                    dateRange === range ? "rgba(201,169,110,0.12)" : "transparent",
                  border:
                    dateRange === range
                      ? "1px solid rgba(201,169,110,0.25)"
                      : "1px solid var(--border)",
                  color: dateRange === range ? "#C9A96E" : "var(--muted-foreground)",
                  fontWeight: dateRange === range ? 600 : 400,
                  ...bodyFont,
                }}
              >
                {range === "all" ? "All Time" : range === "today" ? "Today" : range === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORIES.map((cat) => {
            const isActive = categoryFilter === cat.id;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer transition-all"
                style={{
                  backgroundColor: isActive ? `${cat.color}18` : "transparent",
                  border: isActive ? `1px solid ${cat.color}40` : "1px solid transparent",
                  color: isActive ? cat.color : "var(--muted-foreground)",
                  fontWeight: isActive ? 600 : 400,
                  ...bodyFont,
                }}
              >
                <CatIcon className="w-3 h-3" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Severity pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {(["info", "warning", "critical"] as const).map((sev) => {
            const config = SEVERITY_CONFIG[sev];
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
                {config.label}
              </button>
            );
          })}
          {(severityFilter || categoryFilter !== "all" || searchQuery || dateRange !== "all") && (
            <button
              onClick={() => {
                setSeverityFilter(null);
                setCategoryFilter("all");
                setSearchQuery("");
                setDateRange("all");
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.625rem] cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              style={{ border: "1px solid var(--border)", ...bodyFont }}
            >
              <X className="w-2.5 h-2.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
          Showing <span className="text-foreground font-medium">{filteredEntries.length}</span>{" "}
          {filteredEntries.length === 1 ? "event" : "events"}
          {searchQuery && (
            <span>
              {" "}
              matching &ldquo;
              <span className="text-foreground">{searchQuery}</span>&rdquo;
            </span>
          )}
        </p>
      </div>

      {/* Entries list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        {loading ? (
          <div className="py-12 text-center">
            <div
              className="w-6 h-6 rounded-full animate-spin mx-auto mb-3"
              style={{
                border: "2px solid rgba(201,169,110,0.15)",
                borderTopColor: "rgba(201,169,110,0.6)",
              }}
            />
            <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>
              Loading audit log...
            </span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-12 text-center">
            <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-[0.875rem] text-muted-foreground" style={bodyFont}>
              No audit events found.
            </p>
            <p className="text-[0.75rem] text-muted-foreground/60 mt-1" style={bodyFont}>
              {searchQuery
                ? "Try adjusting your search or filters."
                : "Actions will be logged as users interact with the platform."}
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredEntries.map((entry, i) => {
              const sev = SEVERITY_CONFIG[entry.severity];
              const CatIcon = getCategoryIcon(entry.category);
              const catColor = getCategoryColor(entry.category);
              const isSelected = selectedEntry?.id === entry.id;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.5) }}
                >
                  <button
                    onClick={() => setSelectedEntry(isSelected ? null : entry)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-secondary/30"
                    style={{
                      backgroundColor: isSelected ? "rgba(201,169,110,0.04)" : undefined,
                    }}
                  >
                    {/* Category icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${catColor}15`,
                        border: `1px solid ${catColor}25`,
                      }}
                    >
                      <CatIcon className="w-3.5 h-3.5" style={{ color: catColor }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[0.8125rem] font-medium text-foreground truncate"
                          style={bodyFont}
                        >
                          {entry.action}
                        </span>
                        <span
                          className="text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: sev.bg,
                            color: sev.color,
                            border: `1px solid ${sev.border}`,
                            ...bodyFont,
                          }}
                        >
                          {entry.severity}
                        </span>
                        <span
                          className="text-[0.5625rem] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: `${catColor}10`,
                            color: catColor,
                            border: `1px solid ${catColor}25`,
                            ...bodyFont,
                          }}
                        >
                          {entry.category}
                        </span>
                      </div>

                      {entry.details && (
                        <p
                          className="text-[0.75rem] text-muted-foreground line-clamp-1 mb-1"
                          style={bodyFont}
                        >
                          {entry.details}
                        </p>
                      )}

                      <div className="flex items-center gap-3">
                        {entry.actorName && (
                          <span
                            className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground/70"
                            style={bodyFont}
                          >
                            <User className="w-3 h-3" />
                            {entry.actorName}
                            {entry.actorRole && (
                              <span className="text-[0.5625rem] opacity-60">
                                ({entry.actorRole})
                              </span>
                            )}
                          </span>
                        )}
                        {entry.targetName && (
                          <span
                            className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground/60"
                            style={bodyFont}
                          >
                            <Eye className="w-3 h-3" />
                            {entry.targetName}
                          </span>
                        )}
                        <span
                          className="flex items-center gap-1 text-[0.625rem] text-muted-foreground/50 ml-auto shrink-0"
                          style={bodyFont}
                        >
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>

                      {/* Expanded details */}
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="mt-2.5 pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2"
                              style={{ borderTop: "1px solid var(--border)" }}
                            >
                              <DetailRow label="Event ID" value={entry.id} />
                              <DetailRow label="Category" value={entry.category} />
                              <DetailRow label="Actor ID" value={entry.actor} />
                              <DetailRow label="Actor Name" value={entry.actorName || "—"} />
                              <DetailRow label="Actor Role" value={entry.actorRole || "—"} />
                              <DetailRow label="Severity" value={entry.severity} />
                              {entry.target && (
                                <DetailRow label="Target" value={entry.target} />
                              )}
                              {entry.targetName && (
                                <DetailRow label="Target Name" value={entry.targetName} />
                              )}
                              <DetailRow
                                label="Timestamp"
                                value={new Date(entry.timestamp).toLocaleString()}
                              />
                              {entry.details && (
                                <div className="sm:col-span-2">
                                  <DetailRow label="Details" value={entry.details} />
                                </div>
                              )}
                              {entry.metadata &&
                                Object.keys(entry.metadata).length > 0 && (
                                  <div className="sm:col-span-2">
                                    <span
                                      className="text-[0.5625rem] text-muted-foreground/60 uppercase tracking-wider"
                                      style={bodyFont}
                                    >
                                      Metadata
                                    </span>
                                    <pre
                                      className="mt-1 p-2 rounded-lg text-[0.625rem] text-muted-foreground font-mono overflow-x-auto"
                                      style={{
                                        backgroundColor: "var(--secondary)",
                                        border: "1px solid var(--border)",
                                      }}
                                    >
                                      {JSON.stringify(entry.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Expand indicator */}
                    <ChevronRight
                      className={`w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 transition-transform ${
                        isSelected ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cleanup confirmation dialog */}
      <AnimatePresence>
        {showCleanupConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCleanupConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm mx-4"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(194,123,107,0.1)",
                    border: "1px solid rgba(194,123,107,0.2)",
                  }}
                >
                  <Trash2 className="w-5 h-5" style={{ color: "#C27B6B" }} />
                </div>
                <div>
                  <h3 className="text-foreground font-semibold text-[0.9375rem]" style={headingFont}>
                    Cleanup Audit Log
                  </h3>
                  <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                    Remove old entries
                  </p>
                </div>
              </div>

              <p className="text-[0.8125rem] text-muted-foreground mb-4" style={bodyFont}>
                Delete audit entries older than:
              </p>

              <div className="flex items-center gap-2 mb-4">
                {[7, 14, 30, 60, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setCleanupDays(days)}
                    className="px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-all"
                    style={{
                      backgroundColor:
                        cleanupDays === days ? "rgba(194,123,107,0.12)" : "transparent",
                      border:
                        cleanupDays === days
                          ? "1px solid rgba(194,123,107,0.3)"
                          : "1px solid var(--border)",
                      color: cleanupDays === days ? "#C27B6B" : "var(--muted-foreground)",
                      fontWeight: cleanupDays === days ? 600 : 400,
                      ...bodyFont,
                    }}
                  >
                    {days}d
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowCleanupConfirm(false)}
                  className="px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer transition-colors text-muted-foreground"
                  style={{
                    border: "1px solid var(--border)",
                    ...bodyFont,
                  }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCleanup}
                  disabled={cleaningUp}
                  className="px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: "rgba(194,123,107,0.15)",
                    border: "1px solid rgba(194,123,107,0.3)",
                    color: "#C27B6B",
                    opacity: cleaningUp ? 0.6 : 1,
                    ...bodyFont,
                  }}
                >
                  {cleaningUp ? "Cleaning..." : `Delete entries > ${cleanupDays} days`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span
        className="text-[0.5625rem] text-muted-foreground/60 uppercase tracking-wider block"
        style={bodyFont}
      >
        {label}
      </span>
      <span
        className="text-[0.6875rem] text-foreground break-all"
        style={bodyFont}
      >
        {value}
      </span>
    </div>
  );
}