import { apiFetch, getStoredNotionApiKey, setStoredNotionApiKey, clearStoredNotionApiKey } from "../lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Link2,
  Trash2,
  Plus,
  Activity,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Wifi,
  WifiOff,
  Settings,
  Loader2,
  X,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  // useNotionSync,
  ALL_CONTENT_TYPES,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_DESCRIPTIONS,
  DEFAULT_NOTION_CONFIG,
  IK26_WORKSTREAM_PAGES,
  type NotionContentType,
  type SyncLogEntry,
} from "../lib/notion-sync";
import { bodyFont, headingFont } from "../lib/fonts";
const monoFont = { fontFamily: "'JetBrains Mono', monospace" };

// ─── Workstream groupings for the IK26 Notion workspace ─────────

const WORKSTREAM_GROUPS: { label: string; emoji: string; types: NotionContentType[]; pageId?: string }[] = [
  {
    label: "🍽️ Chefs, Menu & Beverage",
    emoji: "🍽️",
    types: ["roster", "courses"],
    pageId: IK26_WORKSTREAM_PAGES.chefsMenu,
  },
  {
    label: "👥 Team & Operations",
    emoji: "👥",
    types: ["team"],
    pageId: IK26_WORKSTREAM_PAGES.teamDeploy,
  },
  {
    label: "📋 Event Day & FOH",
    emoji: "📋",
    types: ["schedule"],
    pageId: IK26_WORKSTREAM_PAGES.eventDayFOH,
  },
  {
    label: "💰 Money & Sponsors",
    emoji: "💰",
    types: ["budget", "sponsors"],
    pageId: IK26_WORKSTREAM_PAGES.money,
  },
  {
    label: "⚠️ Risk & Decisions",
    emoji: "⚠️",
    types: ["decisions"],
    pageId: IK26_WORKSTREAM_PAGES.riskRegister,
  },
  {
    label: "🔥 Mission Control",
    emoji: "🔥",
    types: ["warroom"],
    pageId: IK26_WORKSTREAM_PAGES.warRoom,
  },
  {
    label: "📡 Main Page (Comms, Milestones, Announcements)",
    emoji: "📡",
    types: ["comms", "milestones", "announcements"],
    pageId: IK26_WORKSTREAM_PAGES.mainPage,
  },
];

// ─── Sub-components ─────────────────────────────────────────────

function StatusDot({ status }: { status: "connected" | "stale" | "disconnected" | "syncing" }) {
  const colors = {
    connected: "rgba(126,158,120,0.9)",
    stale: "rgba(206,180,122,0.9)",
    disconnected: "rgba(140,130,120,0.4)",
    syncing: "rgba(74,127,181,0.9)",
  };
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
      style={{
        backgroundColor: colors[status],
        boxShadow: status === "syncing" ? `0 0 6px ${colors[status]}` : undefined,
      }}
    />
  );
}

function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return "Never";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─── Configure Dialog ───────────────────────────────────────────

function ConfigureDialog({
  type,
  onConfigure,
  onClose,
}: {
  type: NotionContentType;
  onConfigure: (databaseId: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const defaultConfig = DEFAULT_NOTION_CONFIG[type];
  const [dbId, setDbId] = useState(defaultConfig?.databaseId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!dbId.trim()) return;
    setLoading(true);
    setError(null);
    const success = await onConfigure(dbId.trim());
    setLoading(false);
    if (success) {
      toast.success(`Connected ${CONTENT_TYPE_LABELS[type]} to Notion`);
      onClose();
    } else {
      setError("Failed to connect. Check the database ID and ensure the Notion integration has access.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "#FFFFFF", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold" style={{ ...headingFont, color: "#3D524D" }}>
              Connect {CONTENT_TYPE_LABELS[type]}
            </h3>
            <p className="text-[0.75rem] mt-1" style={{ ...bodyFont, color: "#8A857F" }}>
              {CONTENT_TYPE_DESCRIPTIONS[type]}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg cursor-pointer" style={{ color: "#8A857F" }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-[0.75rem] font-medium" style={{ ...bodyFont, color: "#5A554F" }}>
            Notion Database / Page ID
          </label>
          <input
            type="text"
            value={dbId}
            onChange={(e) => setDbId(e.target.value)}
            placeholder="e.g. b60f493a780e4c5ca053f14b3ca5ad23"
            className="w-full px-3 py-2.5 rounded-xl text-[0.8125rem] outline-none"
            style={{
              ...monoFont,
              backgroundColor: "#F8F4EE",
              border: "1px solid rgba(0,0,0,0.08)",
              color: "#3D524D",
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          {defaultConfig && (
            <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: "rgba(126,158,120,0.06)", border: "1px solid rgba(126,158,120,0.12)" }}>
              <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#7E9E78" }} />
              <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "#7E9E78" }}>
                Pre-filled with IK26 default: <strong>{defaultConfig.label}</strong>
                {defaultConfig.isPageId && <span className="ml-1 opacity-70">(page ID — inline DBs will be auto-discovered)</span>}
              </p>
            </div>
          )}
          <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "#A09A94" }}>
            Find this in your Notion database URL: notion.so/[workspace]/[database-id]?v=...
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: "rgba(200,80,80,0.06)", border: "1px solid rgba(200,80,80,0.15)" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C85050" }} />
            <p className="text-[0.75rem]" style={{ ...bodyFont, color: "#C85050" }}>{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.8125rem] cursor-pointer"
            style={{ ...bodyFont, color: "#8A857F" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !dbId.trim()}
            className="px-5 py-2 rounded-xl text-[0.8125rem] font-medium cursor-pointer flex items-center gap-2 disabled:opacity-50"
            style={{
              ...bodyFont,
              backgroundColor: "#C9A96E",
              color: "#FFFDF5",
            }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
            {loading ? "Connecting..." : "Connect"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Source Card ─────────────────────────────────────────────────

function SourceCard({
  type,
  source,
  isSyncing,
  onSync,
  onConfigure,
  onRemove,
}: {
  type: NotionContentType;
  source: any;
  isSyncing: boolean;
  onSync: () => void;
  onConfigure: () => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const status = isSyncing
    ? "syncing"
    : source.configured
      ? source.isStale ? "stale" : "connected"
      : "disconnected";

  const handleCopyId = () => {
    if (source.databaseId) {
      navigator.clipboard.writeText(source.databaseId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <motion.div
      layout="position"
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        border: source.configured ? "1px solid rgba(0,0,0,0.06)" : "1px dashed rgba(0,0,0,0.12)",
        boxShadow: source.configured ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
      }}
    >
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => source.configured && setExpanded(!expanded)}
      >
        <StatusDot status={status} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[0.8125rem] font-semibold truncate" style={{ ...bodyFont, color: "#3D524D" }}>
              {CONTENT_TYPE_LABELS[type]}
            </span>
            {source.configured && (
              <span
                className="text-[0.625rem] px-1.5 py-0.5 rounded-full"
                style={{ ...monoFont, backgroundColor: "rgba(126,158,120,0.1)", color: "#7E9E78" }}
              >
                {source.itemCount} items
              </span>
            )}
          </div>
          <p className="text-[0.6875rem] mt-0.5 truncate" style={{ ...bodyFont, color: "#A09A94" }}>
            {source.configured
              ? `Last synced: ${formatRelativeTime(source.lastPulled)}`
              : CONTENT_TYPE_DESCRIPTIONS[type]
            }
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {source.configured ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onSync(); }}
                disabled={isSyncing}
                className="p-2 rounded-xl cursor-pointer"
                style={{ backgroundColor: "rgba(206,180,122,0.08)", color: "#C9A96E" }}
                title="Sync now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              </button>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                style={{ color: "#A09A94" }}
              />
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onConfigure(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] cursor-pointer"
              style={{ ...bodyFont, backgroundColor: "rgba(206,180,122,0.1)", color: "#C9A96E" }}
            >
              <Plus className="w-3 h-3" />
              Connect
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && source.configured && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
              {/* Database ID */}
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#8A857F" }}>
                  Database:
                </span>
                <code
                  className="text-[0.625rem] px-2 py-1 rounded-lg flex-1 truncate"
                  style={{ ...monoFont, backgroundColor: "#F8F4EE", color: "#5A554F" }}
                >
                  {source.databaseId}
                </code>
                <button
                  onClick={handleCopyId}
                  className="p-1 rounded cursor-pointer"
                  style={{ color: "#A09A94" }}
                  title="Copy ID"
                >
                  {copied ? <Check className="w-3 h-3" style={{ color: "#7E9E78" }} /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              {/* Label */}
              {source.label && (
                <div className="flex items-center gap-2">
                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#8A857F" }}>
                    Label:
                  </span>
                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#5A554F" }}>
                    {source.label}
                  </span>
                </div>
              )}

              {/* Configured at */}
              {source.configuredAt && (
                <div className="flex items-center gap-2">
                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#8A857F" }}>
                    Connected:
                  </span>
                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#5A554F" }}>
                    {new Date(source.configuredAt).toLocaleDateString()} at{" "}
                    {new Date(source.configuredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onRemove}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] cursor-pointer"
                  style={{ ...bodyFont, backgroundColor: "rgba(200,80,80,0.06)", color: "#C85050" }}
                >
                  <Trash2 className="w-3 h-3" />
                  Disconnect
                </button>
                <button
                  onClick={onConfigure}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.6875rem] cursor-pointer"
                  style={{ ...bodyFont, backgroundColor: "rgba(206,180,122,0.08)", color: "#C9A96E" }}
                >
                  <Settings className="w-3 h-3" />
                  Reconfigure
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sync Log Panel ─────────────────────────────────────────────

function SyncLogPanel({ log }: { log: SyncLogEntry[] }) {
  const actionColors: Record<string, string> = {
    configured: "#7E9E78",
    pulled: "#4A7FB5",
    pushed: "#C9A96E",
    removed: "#C85050",
    "sync-all-pulled": "#7E9E78",
    "sync-all-error": "#C85050",
  };

  if (log.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: "#CCC7BF" }} />
        <p className="text-[0.8125rem]" style={{ ...bodyFont, color: "#A09A94" }}>
          No sync activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto">
      {log.slice(0, 50).map((entry, i) => (
        <div
          key={`${entry.timestamp}-${i}`}
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: i % 2 === 0 ? "rgba(0,0,0,0.02)" : "rgba(0,0,0,0)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: actionColors[entry.action] || "#A09A94" }}
          />
          <span className="text-[0.6875rem] font-medium" style={{ ...bodyFont, color: "#5A554F" }}>
            {CONTENT_TYPE_LABELS[entry.type as NotionContentType] || entry.type}
          </span>
          <span className="text-[0.625rem] px-1.5 py-0.5 rounded" style={{ ...monoFont, backgroundColor: "rgba(0,0,0,0.04)", color: "#8A857F" }}>
            {entry.action}
          </span>
          {entry.itemCount !== undefined && (
            <span className="text-[0.625rem]" style={{ ...bodyFont, color: "#A09A94" }}>
              {entry.itemCount} items
            </span>
          )}
          {entry.error && (
            <span className="text-[0.625rem] truncate" style={{ ...bodyFont, color: "#C85050" }}>
              {entry.error}
            </span>
          )}
          <span className="text-[0.625rem] ml-auto shrink-0" style={{ ...monoFont, color: "#CCC7BF" }}>
            {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function NotionAdmin() {
  const {
    sources,
    isSyncing,
    syncingTypes,
    lastGlobalSync,
    syncLog,
    errors,
    loadSources,
    syncType,
    syncAll,
    configureType,
    removeType,
    loadSyncLog,
  } = {} as any; // useNotionSync();

  const [configureTarget, setConfigureTarget] = useState<NotionContentType | null>(null);
  const [activeTab, setActiveTab] = useState<"connections" | "log" | "settings">("connections");

  // Notion API key state
  const [apiKey, setApiKey] = useState(() => getStoredNotionApiKey() || "");
  const [apiKeySaved, setApiKeySaved] = useState(!!getStoredNotionApiKey());
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [autoConfiguring, setAutoConfiguring] = useState(false);

  // Load on mount
  useEffect(() => {
    loadSources();
    loadSyncLog();
  }, [loadSources, loadSyncLog]);

  // Count stats
  const configuredCount = sources
    ? Object.values(sources).filter((s) => s.configured).length
    : 0;
  const totalItems = sources
    ? Object.values(sources).reduce((sum, s) => sum + (s.itemCount || 0), 0)
    : 0;

  const handleSync = async (type: NotionContentType) => {
    const items = await syncType(type);
    if (items.length > 0) {
      toast.success(`Synced ${items.length} items from ${CONTENT_TYPE_LABELS[type]}`);
    }
    await loadSyncLog();
  };

  const handleSyncAll = async () => {
    await syncAll();
    toast.success("All databases synced");
    await loadSyncLog();
  };

  const handleConfigure = async (databaseId: string) => {
    if (!configureTarget) return false;
    const success = await configureType(configureTarget, databaseId);
    if (success) {
      await loadSyncLog();
    }
    return success;
  };

  const handleRemove = async (type: NotionContentType) => {
    if (!confirm(`Disconnect ${CONTENT_TYPE_LABELS[type]}? You can reconnect later.`)) return;
    await removeType(type);
    toast.success(`Disconnected ${CONTENT_TYPE_LABELS[type]}`);
    await loadSyncLog();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ ...headingFont, color: "#3D524D" }}>
            Notion Integration
          </h2>
          <p className="text-[0.8125rem] mt-1" style={{ ...bodyFont, color: "#8A857F" }}>
            Connect Notion databases as the source of truth for app content.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-4 mr-2">
            <div className="text-center">
              <div className="text-lg font-bold" style={{ ...headingFont, color: "#C9A96E" }}>
                {configuredCount}
              </div>
              <div className="text-[0.625rem] uppercase tracking-wider" style={{ ...bodyFont, color: "#A09A94" }}>
                Connected
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold" style={{ ...headingFont, color: "#7E9E78" }}>
                {totalItems}
              </div>
              <div className="text-[0.625rem] uppercase tracking-wider" style={{ ...bodyFont, color: "#A09A94" }}>
                Total Items
              </div>
            </div>
          </div>

          {/* Sync All button */}
          <button
            onClick={handleSyncAll}
            disabled={isSyncing || configuredCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[0.8125rem] font-medium cursor-pointer disabled:opacity-50"
            style={{
              ...bodyFont,
              backgroundColor: "#C9A96E",
              color: "#FFFDF5",
            }}
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isSyncing ? "Syncing..." : "Sync All"}
          </button>
        </div>
      </div>

      {/* Last sync info */}
      {lastGlobalSync && (
        <div className="flex items-center gap-2 text-[0.75rem]" style={{ ...bodyFont, color: "#A09A94" }}>
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
          Last full sync: {formatRelativeTime(lastGlobalSync)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: "#F8F4EE" }}>
        {(["connections", "log", "settings"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer flex-1 justify-center"
            style={{
              ...bodyFont,
              backgroundColor: activeTab === tab ? "#FFFFFF" : "rgba(0,0,0,0)",
              color: activeTab === tab ? "#3D524D" : "#8A857F",
              boxShadow: activeTab === tab ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab === "connections" ? <Database className="w-3.5 h-3.5" /> : tab === "log" ? <Activity className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
            {tab === "connections" ? "Connections" : tab === "log" ? "Sync Log" : "Settings"}
            {tab === "connections" && configuredCount > 0 && (
              <span
                className="text-[0.625rem] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(126,158,120,0.1)", color: "#7E9E78" }}
              >
                {configuredCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "connections" ? (
        <div className="space-y-3">
          {/* IK26 Workspace Info */}
          <div
            className="rounded-2xl p-4"
            style={{ backgroundColor: "rgba(139,150,196,0.04)", border: "1px solid rgba(139,150,196,0.12)" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(139,150,196,0.1)", border: "1px solid rgba(139,150,196,0.2)" }}
              >
                <Database className="w-4 h-4" style={{ color: "#8B96C4" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[0.8125rem] font-semibold" style={{ ...bodyFont, color: "#3D524D" }}>
                    IK26 — Monica's Ops Center
                  </span>
                  <a
                    href="https://www.notion.so/b60f493a780e4c5ca053f14b3ca5ad23"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[0.625rem] px-1.5 py-0.5 rounded-full cursor-pointer"
                    style={{ backgroundColor: "rgba(139,150,196,0.1)", color: "#8B96C4", ...bodyFont }}
                  >
                    <ExternalLink className="w-2.5 h-2.5" />
                    Open
                  </a>
                </div>
                <p className="text-[0.6875rem] mt-0.5" style={{ ...bodyFont, color: "#A09A94" }}>
                  {configuredCount} of {ALL_CONTENT_TYPES.length} content types connected across {WORKSTREAM_GROUPS.length} workstreams.
                  All IDs are pre-populated from the real IK26 Notion workspace.
                </p>
              </div>
            </div>
          </div>

          {!sources ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A96E" }} />
            </div>
          ) : (
            WORKSTREAM_GROUPS.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[0.75rem] font-semibold" style={{ ...bodyFont, color: "#3D524D" }}>
                    {group.emoji} {group.label}
                  </span>
                  {group.pageId && (
                    <a
                      href={`https://www.notion.so/${group.pageId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.6875rem] cursor-pointer"
                      style={{ ...bodyFont, color: "#C9A96E" }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {group.types.map((type) => (
                  <SourceCard
                    key={type}
                    type={type}
                    source={sources[type] || { configured: false }}
                    isSyncing={syncingTypes.has(type)}
                    onSync={() => handleSync(type)}
                    onConfigure={() => setConfigureTarget(type)}
                    onRemove={() => handleRemove(type)}
                  />
                ))}
              </div>
            ))
          )}

          {/* Errors */}
          {Object.entries(errors).length > 0 && (
            <div className="space-y-2 mt-4">
              <h4 className="text-[0.75rem] font-semibold" style={{ ...bodyFont, color: "#C85050" }}>
                Errors
              </h4>
              {Object.entries(errors).map(([type, error]) => (
                <div
                  key={type}
                  className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: "rgba(200,80,80,0.04)", border: "1px solid rgba(200,80,80,0.1)" }}
                >
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#C85050" }} />
                  <div>
                    <span className="text-[0.75rem] font-medium" style={{ ...bodyFont, color: "#C85050" }}>
                      {CONTENT_TYPE_LABELS[type as NotionContentType] || type}:
                    </span>
                    <span className="text-[0.6875rem] ml-1" style={{ ...bodyFont, color: "#C85050" }}>
                      {error}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeTab === "settings" ? (
        <div className="space-y-5">
          {/* Notion API Key */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <h4 className="text-[0.9375rem] font-semibold" style={{ ...headingFont, color: "#3D524D" }}>
                Notion API Key
              </h4>
              <p className="text-[0.75rem] mt-1" style={{ ...bodyFont, color: "#8A857F" }}>
                Required for connecting to Notion databases. Create an integration at{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "#C9A96E" }}
                >
                  notion.so/my-integrations
                </a>{" "}
                and share the IK26 workspace with it.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={apiKeyVisible ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setApiKeySaved(false); }}
                    placeholder="ntn_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2.5 rounded-xl text-[0.8125rem] outline-none pr-20"
                    style={{
                      ...monoFont,
                      backgroundColor: "#F8F4EE",
                      border: apiKeySaved ? "1px solid rgba(126,158,120,0.3)" : "1px solid rgba(0,0,0,0.08)",
                      color: "#3D524D",
                    }}
                  />
                  <button
                    onClick={() => setApiKeyVisible(!apiKeyVisible)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.625rem] px-2 py-1 rounded-lg cursor-pointer"
                    style={{ ...bodyFont, color: "#8A857F", backgroundColor: "rgba(0,0,0,0.04)" }}
                  >
                    {apiKeyVisible ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (apiKey.trim()) {
                      setStoredNotionApiKey(apiKey.trim());
                      setApiKeySaved(true);
                      toast.success("Notion API key saved to browser");
                    }
                  }}
                  disabled={!apiKey.trim() || apiKeySaved}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] font-medium cursor-pointer disabled:opacity-50"
                  style={{ ...bodyFont, backgroundColor: "#C9A96E", color: "#FFFDF5" }}
                >
                  {apiKeySaved ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                  {apiKeySaved ? "Saved" : "Save Key"}
                </button>
                {apiKeySaved && (
                  <button
                    onClick={() => {
                      clearStoredNotionApiKey();
                      setApiKey("");
                      setApiKeySaved(false);
                      toast.success("API key cleared");
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[0.6875rem] cursor-pointer"
                    style={{ ...bodyFont, backgroundColor: "rgba(200,80,80,0.06)", color: "#C85050" }}
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {apiKeySaved && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: "rgba(126,158,120,0.06)", border: "1px solid rgba(126,158,120,0.12)" }}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#7E9E78" }} />
                  <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "#7E9E78" }}>
                    Key saved in browser storage. It will be sent as a header with each API request to the edge function.
                    The server uses this as a fallback when the <code style={monoFont}>NOTION_API_KEY</code> environment variable is not set.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Auto-Configure All */}
          <div
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div>
              <h4 className="text-[0.9375rem] font-semibold" style={{ ...headingFont, color: "#3D524D" }}>
                Auto-Configure All Databases
              </h4>
              <p className="text-[0.75rem] mt-1" style={{ ...bodyFont, color: "#8A857F" }}>
                Automatically connect all {ALL_CONTENT_TYPES.length} content types to their pre-configured IK26 Notion workspace pages.
                This will discover inline databases within each workstream page.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setAutoConfiguring(true);
                  try {
                    const res = await apiFetch("/notion/content/auto-configure", { method: "POST" });
                    if (res.error) {
                      toast.error(res.error);
                    } else {
                      toast.success(`Auto-configured ${res.configured ?? 0} of ${res.total ?? 11} content types`);
                      await loadSources();
                      await loadSyncLog();
                    }
                  } catch (err: any) {
                    toast.error(`Auto-configure failed: ${err.message}`);
                  } finally {
                    setAutoConfiguring(false);
                  }
                }}
                disabled={autoConfiguring}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] font-medium cursor-pointer disabled:opacity-50"
                style={{ ...bodyFont, backgroundColor: "#C9A96E", color: "#FFFDF5" }}
              >
                {autoConfiguring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {autoConfiguring ? "Configuring..." : "Auto-Configure All"}
              </button>
              <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "#8A857F" }}>
                Uses the <code style={monoFont}>NOTION_API_KEY</code> environment variable{apiKeySaved ? " (or saved browser key)" : ""}.
              </p>
            </div>

            {/* Workstream reference table */}
            <div className="space-y-1.5 pt-2">
              <h5 className="text-[0.75rem] font-medium" style={{ ...bodyFont, color: "#5A554F" }}>
                Configured Workstream Pages
              </h5>
              {WORKSTREAM_GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                >
                  <span className="text-[0.75rem]" style={{ ...bodyFont, color: "#3D524D" }}>
                    {group.emoji} {group.label}
                  </span>
                  <span className="flex-1" />
                  {group.pageId && (
                    <code className="text-[0.5625rem] px-1.5 py-0.5 rounded" style={{ ...monoFont, backgroundColor: "#F8F4EE", color: "#8A857F" }}>
                      {group.pageId.slice(0, 8)}…
                    </code>
                  )}
                  <span className="text-[0.625rem]" style={{ ...bodyFont, color: "#A09A94" }}>
                    {group.types.map((t) => CONTENT_TYPE_LABELS[t]).join(", ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="rounded-2xl p-4"
          style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[0.8125rem] font-semibold" style={{ ...bodyFont, color: "#3D524D" }}>
              Recent Activity
            </h4>
            <button
              onClick={loadSyncLog}
              className="text-[0.6875rem] flex items-center gap-1 cursor-pointer"
              style={{ ...bodyFont, color: "#C9A96E" }}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <SyncLogPanel log={syncLog} />
        </div>
      )}

      {/* Configure Dialog */}
      <AnimatePresence>
        {configureTarget && (
          <ConfigureDialog
            type={configureTarget}
            onConfigure={handleConfigure}
            onClose={() => setConfigureTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}