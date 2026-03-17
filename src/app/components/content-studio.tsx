import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  PenTool,
  Database,
  RefreshCw,
  Search,
  ChevronRight,
  Save,
  Trash2,
  X,
  Copy,
  ExternalLink,
  Layers,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Download,
  Users,
  Receipt,
  MessageCircle,
  Image,
  Sparkles,
  Inbox,
  BarChart3,
  Folder,
  Key,
  Lock,
  Link2,
  ScrollText,
  MapPin,
  ListChecks,
  Plus,
  Code2,
  FormInput,
  ToggleLeft,
  ToggleRight,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { apiFetch } from "../lib/supabase";
import { bodyFont, headingFont } from "../lib/fonts";

// ── Types ────────────────────────────────────────────────────────

interface RegistryItem {
  prefix: string;
  label: string;
  icon: string;
  category: string;
  count: number;
  sensitive?: boolean;
}

interface SingletonItem {
  key: string;
  label: string;
  icon: string;
  category: string;
  exists: boolean;
  preview: string | null;
}

interface NotionSource {
  configured: boolean;
  databaseId: string | null;
  label: string | null;
  configuredAt: string | null;
  lastPulled: number | null;
  itemCount: number;
  isStale: boolean;
}

// ── Icon resolver ────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  receipt: Receipt,
  "message-circle": MessageCircle,
  image: Image,
  utensils: PenTool,
  mic: Sparkles,
  sparkles: Sparkles,
  inbox: Inbox,
  "bar-chart": BarChart3,
  database: Database,
  folder: Folder,
  kanban: ListChecks,
  key: Key,
  lock: Lock,
  settings: Settings,
  scroll: ScrollText,
  link: Link2,
  "refresh-cw": RefreshCw,
  map: MapPin,
  "list-checks": ListChecks,
  route: MapPin,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Database;
}

// ── Category colors ──────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  auth: { color: "#8B7EC8", bg: "rgba(139,126,200,0.1)" },
  finance: { color: "#D4AA7C", bg: "rgba(212,170,124,0.1)" },
  engagement: { color: "#7E9E78", bg: "rgba(126,158,120,0.1)" },
  portal: { color: "#5EAAA8", bg: "rgba(94,170,168,0.1)" },
  analytics: { color: "#4A7FB5", bg: "rgba(74,127,181,0.1)" },
  notion: { color: "#C27B6B", bg: "rgba(194,123,107,0.1)" },
  cache: { color: "#8A857F", bg: "rgba(138,133,127,0.1)" },
  user: { color: "#B8A9C9", bg: "rgba(184,169,201,0.1)" },
  planning: { color: "#C9A96E", bg: "rgba(201,169,110,0.1)" },
  config: { color: "#9FB0D4", bg: "rgba(159,176,212,0.1)" },
};

function getCatStyle(category: string) {
  return CATEGORY_COLORS[category] || { color: "#C9A96E", bg: "rgba(201,169,110,0.1)" };
}

// ── Time helpers ─────────────────────────────────────────────────

function timeAgo(ts: number | string | null): string {
  if (!ts) return "Never";
  const diff = Date.now() - (typeof ts === "number" ? ts : new Date(ts).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ══════════════════════════════════════════════════════════════════
//  CONTENT STUDIO
// ══════════════════════════════════════════════════════════════════

interface ContentStudioProps {
  onNavigate: (page: string) => void;
}

type StudioView = "overview" | "collection" | "entry" | "notion-sources" | "singleton";

export default function ContentStudio({ onNavigate }: ContentStudioProps) {
  const [view, setView] = useState<StudioView>("overview");
  const [registry, setRegistry] = useState<RegistryItem[]>([]);
  const [singletons, setSingletons] = useState<SingletonItem[]>([]);
  const [notionSources, setNotionSources] = useState<Record<string, NotionSource>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Collection browser state
  const [activeCollection, setActiveCollection] = useState<RegistryItem | null>(null);
  const [collectionItems, setCollectionItems] = useState<any[]>([]);
  const [collectionLoading, setCollectionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Entry editor state
  const [activeEntry, setActiveEntry] = useState<{ key: string; value: any } | null>(null);
  const [editBuffer, setEditBuffer] = useState("");
  const [editDirty, setEditDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Singleton editor
  const [activeSingleton, setActiveSingleton] = useState<SingletonItem | null>(null);

  // Notion pull state
  const [notionItems, setNotionItems] = useState<any[]>([]);
  const [activeNotionType, setActiveNotionType] = useState<string | null>(null);
  const [notionLoading, setNotionLoading] = useState(false);

  // Editor mode: "json" or "visual"
  const [editorMode, setEditorMode] = useState<"json" | "visual">("visual");

  // Create new entry state
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryId, setNewEntryId] = useState("");

  // Access Codes management
  const [accessCodes, setAccessCodes] = useState<Record<string, string> | null>(null);
  const [accessCodesLoading, setAccessCodesLoading] = useState(false);
  const [accessCodesDirty, setAccessCodesDirty] = useState(false);
  const [accessCodesSaving, setAccessCodesSaving] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newCodeRole, setNewCodeRole] = useState("team");
  const [showAccessCodes, setShowAccessCodes] = useState(false);

  const loadAccessCodes = useCallback(async () => {
    setAccessCodesLoading(true);
    try {
      const res = await apiFetch("/config/access-codes");
      setAccessCodes(res.codes || {});
    } catch (err) {
      console.error("Failed to load access codes:", err);
      toast.error("Failed to load access codes");
    } finally {
      setAccessCodesLoading(false);
    }
  }, []);

  const saveAccessCodes = useCallback(async () => {
    if (!accessCodes) return;
    setAccessCodesSaving(true);
    try {
      await apiFetch("/config/access-codes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: accessCodes }),
      });
      toast.success(`Access codes saved — ${Object.keys(accessCodes).length} codes`);
      setAccessCodesDirty(false);
    } catch (err) {
      console.error("Failed to save access codes:", err);
      toast.error("Failed to save access codes");
    } finally {
      setAccessCodesSaving(false);
    }
  }, [accessCodes]);

  const addAccessCode = useCallback(() => {
    const code = newCode.trim().toLowerCase();
    if (!code) return;
    if (accessCodes && accessCodes[code]) {
      toast.error(`Code "${code}" already exists`);
      return;
    }
    setAccessCodes((prev) => ({ ...prev, [code]: newCodeRole }));
    setNewCode("");
    setAccessCodesDirty(true);
    toast.success(`Added "${code}" as ${newCodeRole}`);
  }, [newCode, newCodeRole, accessCodes]);

  const removeAccessCode = useCallback((code: string) => {
    setAccessCodes((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[code];
      return next;
    });
    setAccessCodesDirty(true);
  }, []);

  // ── Fetch overview data ──────────────────────────────────────────

  const fetchOverview = useCallback(async () => {
    try {
      const [registryRes, sourcesRes] = await Promise.all([
        apiFetch("/content-studio/registry"),
        apiFetch("/notion/content/sources").catch(() => ({ sources: {} })),
      ]);
      setRegistry(registryRes.registry || []);
      setSingletons(registryRes.singletons || []);
      setNotionSources(sourcesRes.sources || {});
    } catch (err) {
      console.error("Content Studio overview error:", err);
      toast.error("Failed to load Content Studio data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // ── Browse a collection ──────────────────────────────────────────

  const openCollection = async (item: RegistryItem) => {
    if (item.sensitive) {
      toast.error("This collection contains sensitive data and cannot be browsed.");
      return;
    }
    setActiveCollection(item);
    setView("collection");
    setCollectionLoading(true);
    setSearchQuery("");
    try {
      const res = await apiFetch(`/content-studio/browse?prefix=${encodeURIComponent(item.prefix)}`);
      setCollectionItems(res.items || []);
    } catch (err) {
      console.error("Browse error:", err);
      toast.error("Failed to load collection");
      setCollectionItems([]);
    } finally {
      setCollectionLoading(false);
    }
  };

  // ── Open a singleton ─────────────────────────────────────────────

  const openSingleton = async (item: SingletonItem) => {
    setActiveSingleton(item);
    setView("singleton");
    try {
      const res = await apiFetch(`/content-studio/entry?key=${encodeURIComponent(item.key)}`);
      const json = JSON.stringify(res.value, null, 2);
      setEditBuffer(json);
      setActiveEntry({ key: item.key, value: res.value });
      setEditDirty(false);
    } catch (err) {
      console.error("Singleton read error:", err);
      toast.error("Failed to load entry");
      setEditBuffer("null");
      setActiveEntry({ key: item.key, value: null });
    }
  };

  // ── Open an entry for editing ────────────────────────────────────

  const openEntry = async (item: any, prefix: string) => {
    const key = `${prefix}${item.id || item.key || ""}`;
    setView("entry");
    try {
      const res = await apiFetch(`/content-studio/entry?key=${encodeURIComponent(key)}`);
      const json = JSON.stringify(res.value, null, 2);
      setEditBuffer(json);
      setActiveEntry({ key, value: res.value });
      setEditDirty(false);
    } catch {
      // If exact key doesn't work, show the item as-is
      const json = JSON.stringify(item, null, 2);
      setEditBuffer(json);
      setActiveEntry({ key, value: item });
      setEditDirty(false);
    }
  };

  // ── Save entry ───────────────────────────────────────────────────

  const saveEntry = async () => {
    if (!activeEntry) return;
    setSaving(true);
    try {
      const parsed = JSON.parse(editBuffer);
      await apiFetch("/content-studio/entry", {
        method: "PUT",
        body: JSON.stringify({ key: activeEntry.key, value: parsed }),
      });
      toast.success("Entry saved successfully");
      setEditDirty(false);
      setActiveEntry({ ...activeEntry, value: parsed });
    } catch (err: any) {
      if (err.message?.includes("JSON")) {
        toast.error("Invalid JSON. Please fix the syntax and try again.");
      } else {
        toast.error("Failed to save entry");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete entry ─────────────────────────────────────────────────

  const deleteEntry = async () => {
    if (!activeEntry) return;
    if (!confirm(`Delete key "${activeEntry.key}"? This cannot be undone.`)) return;
    try {
      await apiFetch(`/content-studio/entry?key=${encodeURIComponent(activeEntry.key)}`, {
        method: "DELETE",
      });
      toast.success("Entry deleted");
      goBack();
      fetchOverview();
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  // ── Create new entry ──────────────────────────────────────────────

  const createNewEntry = async () => {
    if (!activeCollection || !newEntryId.trim()) {
      toast.error("Please enter an ID for the new entry");
      return;
    }
    const key = `${activeCollection.prefix}${newEntryId.trim()}`;
    const scaffold = getScaffold(activeCollection.prefix);
    try {
      await apiFetch("/content-studio/entry", {
        method: "PUT",
        body: JSON.stringify({ key, value: { id: newEntryId.trim(), ...scaffold } }),
      });
      toast.success(`Created ${key}`);
      setShowNewEntry(false);
      setNewEntryId("");
      // Reopen collection to refresh
      openCollection(activeCollection);
    } catch {
      toast.error("Failed to create entry");
    }
  };

  // ── Visual field update helper ────────────────────────────────────

  const updateVisualField = useCallback((fieldKey: string, newValue: any) => {
    try {
      const current = JSON.parse(editBuffer);
      current[fieldKey] = newValue;
      const updated = JSON.stringify(current, null, 2);
      setEditBuffer(updated);
      setEditDirty(true);
    } catch {
      toast.error("Cannot update field — switch to JSON mode to fix syntax");
    }
  }, [editBuffer]);

  // ── Notion sync ──────────────────────────────────────────────────

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch("/notion/content/sync-all", { method: "POST" });
      const successCount = Object.values(res.results || {}).filter((r: any) => r.success).length;
      toast.success(`Synced ${successCount} content types from Notion`);
      fetchOverview();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const pullNotionType = async (type: string) => {
    setActiveNotionType(type);
    setNotionLoading(true);
    setNotionItems([]);
    setView("notion-sources");
    try {
      const res = await apiFetch(`/notion/content/${type}/pull?force=true`);
      setNotionItems(res.items || []);
      toast.success(`Pulled ${res.itemCount || 0} items for ${type}`);
    } catch {
      toast.error(`Failed to pull ${type}`);
    } finally {
      setNotionLoading(false);
    }
  };

  // ── Navigation ───────────────────────────────────────────────────

  const goBack = () => {
    if (view === "entry" && activeCollection) {
      setView("collection");
      setActiveEntry(null);
    } else if (view === "singleton") {
      setView("overview");
      setActiveSingleton(null);
      setActiveEntry(null);
    } else {
      setView("overview");
      setActiveCollection(null);
      setActiveEntry(null);
      setActiveNotionType(null);
    }
  };

  // ── Filtered collection items ────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return collectionItems;
    const q = searchQuery.toLowerCase();
    return collectionItems.filter((item) => {
      const str = JSON.stringify(item).toLowerCase();
      return str.includes(q);
    });
  }, [collectionItems, searchQuery]);

  // ── Stats ────────────────────────────────────────────────────────

  const totalRecords = registry.reduce((s, r) => s + r.count, 0);
  const notionConfigured = Object.values(notionSources).filter((s) => s.configured).length;
  const notionTotalItems = Object.values(notionSources).reduce((s, src) => s + src.itemCount, 0);

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {view !== "overview" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goBack}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)" }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: "#C9A96E" }} />
            </motion.button>
          )}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(159,176,212,0.15), rgba(201,169,110,0.1))",
              border: "1px solid rgba(159,176,212,0.25)",
            }}
          >
            <PenTool className="w-5 h-5" style={{ color: "#9FB0D4" }} />
          </div>
          <div>
            <h2 className="text-foreground text-[1.125rem] font-bold" style={headingFont}>
              Content Studio
            </h2>
            <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              {view === "overview"
                ? `${totalRecords} records across ${registry.length} collections`
                : view === "collection" && activeCollection
                  ? `${activeCollection.label} — ${filteredItems.length} items`
                  : view === "entry" && activeEntry
                    ? activeEntry.key
                    : view === "singleton" && activeSingleton
                      ? activeSingleton.label
                      : view === "notion-sources" && activeNotionType
                        ? `Notion: ${activeNotionType} — ${notionItems.length} items`
                        : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {view === "overview" && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={syncAll}
                disabled={syncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                style={{
                  backgroundColor: "rgba(194,123,107,0.08)",
                  border: "1px solid rgba(194,123,107,0.2)",
                  color: "#C27B6B",
                  opacity: syncing ? 0.6 : 1,
                  ...bodyFont,
                }}
              >
                <Zap className={`w-3.5 h-3.5 ${syncing ? "animate-pulse" : ""}`} />
                {syncing ? "Syncing..." : "Sync All Notion"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setLoading(true); fetchOverview(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                style={{
                  backgroundColor: "rgba(74,127,181,0.08)",
                  border: "1px solid rgba(74,127,181,0.2)",
                  color: "#4A7FB5",
                  ...bodyFont,
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </motion.button>
            </>
          )}
          {view === "entry" && activeEntry && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={saveEntry}
                disabled={saving || !editDirty}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                style={{
                  backgroundColor: editDirty ? "rgba(126,158,120,0.12)" : "rgba(126,158,120,0.05)",
                  border: `1px solid ${editDirty ? "rgba(126,158,120,0.3)" : "rgba(126,158,120,0.15)"}`,
                  color: editDirty ? "#7E9E78" : "var(--muted-foreground)",
                  opacity: saving ? 0.6 : 1,
                  ...bodyFont,
                }}
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : "Save"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={deleteEntry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                style={{
                  backgroundColor: "rgba(194,123,107,0.08)",
                  border: "1px solid rgba(194,123,107,0.2)",
                  color: "#C27B6B",
                  ...bodyFont,
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </motion.button>
            </>
          )}
          {view === "singleton" && activeEntry && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={saveEntry}
              disabled={saving || !editDirty}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
              style={{
                backgroundColor: editDirty ? "rgba(126,158,120,0.12)" : "rgba(126,158,120,0.05)",
                border: `1px solid ${editDirty ? "rgba(126,158,120,0.3)" : "rgba(126,158,120,0.15)"}`,
                color: editDirty ? "#7E9E78" : "var(--muted-foreground)",
                opacity: saving ? 0.6 : 1,
                ...bodyFont,
              }}
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── OVERVIEW VIEW ───────────────────────────────────────────── */}
      {view === "overview" && (
        <div className="space-y-6">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "KV Records", value: totalRecords, icon: Database, color: "#9FB0D4" },
              { label: "Collections", value: registry.length, icon: Layers, color: "#C9A96E" },
              { label: "Notion Sources", value: `${notionConfigured}/11`, icon: Zap, color: "#C27B6B" },
              { label: "Notion Items", value: notionTotalItems, icon: Download, color: "#7E9E78" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>{stat.label}</span>
                </div>
                <p className="text-foreground text-[1.5rem] font-bold" style={headingFont}>
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Notion Sources */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: "#C27B6B" }} />
                <h3 className="text-foreground text-[0.875rem] font-semibold" style={headingFont}>
                  Notion Live Sources
                </h3>
                <span className="text-[0.625rem] text-muted-foreground px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(194,123,107,0.08)", ...bodyFont }}>
                  {notionConfigured} configured
                </span>
              </div>
              <button
                onClick={() => onNavigate("Notion Admin")}
                className="text-[0.6875rem] cursor-pointer flex items-center gap-1"
                style={{ color: "#9FB0D4", ...bodyFont }}
              >
                Full Admin <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 p-2">
              {Object.entries(notionSources).map(([type, source]) => (
                <button
                  key={type}
                  onClick={() => source.configured ? pullNotionType(type) : undefined}
                  disabled={!source.configured}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer hover:bg-secondary/40 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: source.configured ? "rgba(194,123,107,0.1)" : "rgba(138,133,127,0.08)",
                      border: `1px solid ${source.configured ? "rgba(194,123,107,0.2)" : "rgba(138,133,127,0.15)"}`,
                    }}
                  >
                    <Database className="w-3.5 h-3.5" style={{ color: source.configured ? "#C27B6B" : "#8A857F" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8125rem] text-foreground font-medium truncate" style={bodyFont}>{type}</p>
                    <p className="text-[0.625rem] text-muted-foreground truncate" style={bodyFont}>
                      {source.configured
                        ? `${source.itemCount} items · ${timeAgo(source.lastPulled)}`
                        : "Not configured"}
                    </p>
                  </div>
                  {source.configured && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {source.isStale ? (
                        <AlertTriangle className="w-3 h-3" style={{ color: "#D4AA7C" }} />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" style={{ color: "#7E9E78" }} />
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Access Code Manager */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" style={{ color: "#8B7EC8" }} />
                <h3 className="text-foreground text-[0.875rem] font-semibold" style={headingFont}>
                  Access Codes
                </h3>
                {accessCodes && (
                  <span className="text-[0.625rem] text-muted-foreground px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(139,126,200,0.08)", ...bodyFont }}>
                    {Object.keys(accessCodes).length} codes
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {accessCodesDirty && (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={saveAccessCodes}
                    disabled={accessCodesSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-medium cursor-pointer"
                    style={{
                      backgroundColor: "rgba(78,130,130,0.1)",
                      color: "#4E8282",
                      border: "1px solid rgba(78,130,130,0.2)",
                      ...bodyFont,
                    }}
                  >
                    <Save className="w-3 h-3" />
                    {accessCodesSaving ? "Saving..." : "Save Changes"}
                  </motion.button>
                )}
                <button
                  onClick={() => {
                    setShowAccessCodes(!showAccessCodes);
                    if (!showAccessCodes && !accessCodes) loadAccessCodes();
                  }}
                  className="text-[0.6875rem] cursor-pointer flex items-center gap-1"
                  style={{ color: "#9FB0D4", ...bodyFont }}
                >
                  {showAccessCodes ? "Hide" : "Manage"} <ChevronRight className={`w-3 h-3 transition-transform ${showAccessCodes ? "rotate-90" : ""}`} />
                </button>
              </div>
            </div>

            {showAccessCodes && (
              <div className="p-4 space-y-3">
                {accessCodesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : accessCodes ? (
                  <>
                    {/* Add new code */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="New access code..."
                        className="flex-1 px-3 py-2 rounded-lg text-[0.75rem] bg-secondary/40 text-foreground placeholder:text-muted-foreground/50 outline-none"
                        style={{ border: "1px solid var(--border)", ...bodyFont }}
                        onKeyDown={(e) => e.key === "Enter" && addAccessCode()}
                      />
                      <select
                        value={newCodeRole}
                        onChange={(e) => setNewCodeRole(e.target.value)}
                        className="px-2 py-2 rounded-lg text-[0.75rem] bg-secondary/40 text-foreground outline-none cursor-pointer"
                        style={{ border: "1px solid var(--border)", ...bodyFont }}
                      >
                        <option value="leadership">Leadership</option>
                        <option value="team">Team</option>
                        <option value="chef">Chef</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={addAccessCode}
                        disabled={!newCode.trim()}
                        className="px-3 py-2 rounded-lg text-[0.75rem] font-medium cursor-pointer disabled:opacity-40"
                        style={{
                          backgroundColor: "rgba(78,130,130,0.1)",
                          color: "#4E8282",
                          border: "1px solid rgba(78,130,130,0.2)",
                          ...bodyFont,
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Grouped by role */}
                    {(["leadership", "team", "chef", "viewer"] as const).map((role) => {
                      const codes = Object.entries(accessCodes).filter(([, r]) => r === role);
                      if (codes.length === 0) return null;
                      const roleColors: Record<string, string> = {
                        leadership: "#CBA47A",
                        team: "#4E8282",
                        chef: "#C08E7E",
                        viewer: "#9FB0D4",
                      };
                      return (
                        <div key={role}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: roleColors[role] }} />
                            <span className="text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wider" style={bodyFont}>
                              {role} ({codes.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {codes.map(([code]) => (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.6875rem] group"
                                style={{
                                  backgroundColor: `${roleColors[role]}08`,
                                  border: `1px solid ${roleColors[role]}18`,
                                  color: roleColors[role],
                                  ...bodyFont,
                                }}
                              >
                                <Lock className="w-2.5 h-2.5 opacity-40" />
                                <code className="font-mono">{code}</code>
                                <button
                                  onClick={() => removeAccessCode(code)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                                  title="Remove code"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* KV Collections */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Layers className="w-4 h-4" style={{ color: "#C9A96E" }} />
              <h3 className="text-foreground text-[0.875rem] font-semibold" style={headingFont}>
                KV Store Collections
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {registry.map((item) => {
                const Icon = getIcon(item.icon);
                const cat = getCatStyle(item.category);
                return (
                  <button
                    key={item.prefix}
                    onClick={() => openCollection(item)}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors cursor-pointer hover:bg-secondary/30"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.bg, border: `1px solid ${cat.color}25` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] text-foreground font-medium" style={bodyFont}>{item.label}</p>
                      <p className="text-[0.625rem] text-muted-foreground font-mono" style={bodyFont}>{item.prefix}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.sensitive && <Lock className="w-3 h-3 text-muted-foreground/40" />}
                      <span
                        className="text-[0.6875rem] px-2 py-0.5 rounded-full tabular-nums"
                        style={{ backgroundColor: cat.bg, color: cat.color, ...bodyFont }}
                      >
                        {item.count}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Singletons (Config Keys) */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Settings className="w-4 h-4" style={{ color: "#9FB0D4" }} />
              <h3 className="text-foreground text-[0.875rem] font-semibold" style={headingFont}>
                Configuration & Singletons
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {singletons.map((item) => {
                const Icon = getIcon(item.icon);
                const cat = getCatStyle(item.category);
                return (
                  <button
                    key={item.key}
                    onClick={() => item.exists ? openSingleton(item) : undefined}
                    disabled={!item.exists}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors cursor-pointer hover:bg-secondary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.bg, border: `1px solid ${cat.color}25` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125rem] text-foreground font-medium" style={bodyFont}>{item.label}</p>
                      <p className="text-[0.625rem] text-muted-foreground font-mono truncate" style={bodyFont}>{item.key}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.exists ? (
                        <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>{item.preview}</span>
                      ) : (
                        <span className="text-[0.625rem] text-muted-foreground/40" style={bodyFont}>Empty</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── COLLECTION VIEW ─────────────────────────────────────────── */}
      {view === "collection" && activeCollection && (
        <div className="space-y-4">
          {/* Search + New Entry */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeCollection.label}...`}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-[0.8125rem] text-foreground outline-none"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  ...bodyFont,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowNewEntry(!showNewEntry)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[0.75rem] cursor-pointer shrink-0"
              style={{
                backgroundColor: showNewEntry ? "rgba(126,158,120,0.12)" : "rgba(159,176,212,0.08)",
                border: `1px solid ${showNewEntry ? "rgba(126,158,120,0.3)" : "rgba(159,176,212,0.2)"}`,
                color: showNewEntry ? "#7E9E78" : "#9FB0D4",
                ...bodyFont,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </motion.button>
          </div>

          {/* New Entry Form */}
          {showNewEntry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl p-4"
              style={{ backgroundColor: "var(--card)", border: "1px solid rgba(126,158,120,0.3)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4" style={{ color: "#7E9E78" }} />
                <span className="text-[0.8125rem] text-foreground font-semibold" style={headingFont}>
                  Create New Entry
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[0.6875rem] text-muted-foreground font-mono shrink-0" style={bodyFont}>
                  {activeCollection.prefix}
                </span>
                <input
                  type="text"
                  value={newEntryId}
                  onChange={(e) => setNewEntryId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNewEntry()}
                  placeholder="entry-id"
                  className="flex-1 px-3 py-1.5 rounded-lg text-[0.8125rem] text-foreground outline-none font-mono"
                  style={{
                    backgroundColor: "var(--secondary)",
                    border: "1px solid var(--border)",
                    ...bodyFont,
                  }}
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={createNewEntry}
                  disabled={!newEntryId.trim()}
                  className="px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
                  style={{
                    backgroundColor: "rgba(126,158,120,0.12)",
                    border: "1px solid rgba(126,158,120,0.3)",
                    color: "#7E9E78",
                    opacity: newEntryId.trim() ? 1 : 0.4,
                    ...bodyFont,
                  }}
                >
                  Create
                </motion.button>
                <button
                  onClick={() => { setShowNewEntry(false); setNewEntryId(""); }}
                  className="cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-[0.625rem] text-muted-foreground mt-2" style={bodyFont}>
                Full key: <code className="font-mono">{activeCollection.prefix}{newEntryId || "..."}</code>
              </p>
            </motion.div>
          )}

          {/* Items list */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            {collectionLoading ? (
              <div className="py-12 text-center">
                <div
                  className="w-6 h-6 rounded-full animate-spin mx-auto mb-3"
                  style={{ border: "2px solid rgba(201,169,110,0.15)", borderTopColor: "rgba(201,169,110,0.6)" }}
                />
                <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>Loading...</span>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-12 text-center">
                <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-[0.875rem] text-muted-foreground" style={bodyFont}>
                  {searchQuery ? "No matching items." : "Collection is empty."}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filteredItems.slice(0, 100).map((item, idx) => {
                  const preview = getItemPreview(item);
                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => openEntry(item, activeCollection.prefix)}
                      className="w-full flex items-start gap-3 px-5 py-3 text-left transition-colors cursor-pointer hover:bg-secondary/30"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-[0.625rem] font-bold tabular-nums"
                        style={{ backgroundColor: "var(--secondary)", color: "var(--muted-foreground)" }}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.8125rem] text-foreground font-medium truncate" style={bodyFont}>
                          {preview.title}
                        </p>
                        {preview.subtitle && (
                          <p className="text-[0.6875rem] text-muted-foreground truncate" style={bodyFont}>
                            {preview.subtitle}
                          </p>
                        )}
                        <p className="text-[0.5625rem] text-muted-foreground/50 font-mono mt-0.5" style={bodyFont}>
                          ID: {item.id || `item-${idx}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-1" />
                    </button>
                  );
                })}
                {filteredItems.length > 100 && (
                  <div className="px-5 py-3 text-center text-[0.75rem] text-muted-foreground" style={bodyFont}>
                    Showing 100 of {filteredItems.length} items. Use search to narrow results.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ENTRY EDITOR VIEW ───────────────────────────────────────── */}
      {(view === "entry" || view === "singleton") && activeEntry && (
        <div className="space-y-4">
          {/* Key info + Editor Mode Toggle */}
          <div
            className="rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <code className="text-[0.75rem] text-foreground font-mono flex-1 truncate" style={bodyFont}>
                {activeEntry.key}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeEntry.key);
                  toast.success("Key copied");
                }}
                className="shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            </div>
            {activeEntry.value && typeof activeEntry.value === "object" && !Array.isArray(activeEntry.value) && (
              <div className="flex items-center gap-0.5 rounded-lg p-0.5 shrink-0" style={{ backgroundColor: "var(--secondary)" }}>
                <button
                  onClick={() => setEditorMode("visual")}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.6875rem] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: editorMode === "visual" ? "var(--card)" : "transparent",
                    color: editorMode === "visual" ? "var(--foreground)" : "var(--muted-foreground)",
                    boxShadow: editorMode === "visual" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                    ...bodyFont,
                  }}
                >
                  <FormInput className="w-3 h-3" /> Visual
                </button>
                <button
                  onClick={() => setEditorMode("json")}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.6875rem] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: editorMode === "json" ? "var(--card)" : "transparent",
                    color: editorMode === "json" ? "var(--foreground)" : "var(--muted-foreground)",
                    boxShadow: editorMode === "json" ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                    ...bodyFont,
                  }}
                >
                  <Code2 className="w-3 h-3" /> JSON
                </button>
              </div>
            )}
          </div>

          {editorMode === "visual" && activeEntry.value && typeof activeEntry.value === "object" && !Array.isArray(activeEntry.value) ? (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1px solid ${editDirty ? "rgba(201,169,110,0.4)" : "var(--border)"}` }}
            >
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <FormInput className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider" style={bodyFont}>
                    Visual Editor — {Object.keys(activeEntry.value).length} fields
                  </span>
                </div>
                {editDirty && (
                  <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}>
                    Unsaved changes
                  </span>
                )}
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {(() => {
                  let parsed: any;
                  try { parsed = JSON.parse(editBuffer); } catch { parsed = activeEntry.value; }
                  return Object.entries(parsed).slice(0, 40).map(([fieldKey, fieldVal]) => {
                    const valType = fieldVal === null ? "null" : Array.isArray(fieldVal) ? "array" : typeof fieldVal;
                    const typeIcon = valType === "string" ? <Key className="w-3 h-3" />
                      : valType === "number" ? <Hash className="w-3 h-3" />
                      : valType === "boolean" ? (fieldVal ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />)
                      : valType === "object" ? <Folder className="w-3 h-3" />
                      : valType === "array" ? <ListChecks className="w-3 h-3" />
                      : <Database className="w-3 h-3" />;
                    return (
                      <div key={fieldKey} className="flex items-start gap-3 px-4 py-2.5">
                        <div className="flex items-center gap-2 shrink-0 w-40 pt-1.5">
                          <span className="text-muted-foreground/40">{typeIcon}</span>
                          <span className="text-[0.6875rem] text-muted-foreground font-mono truncate" style={bodyFont}>{fieldKey}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {valType === "string" ? (
                            String(fieldVal).length > 100 ? (
                              <textarea
                                value={String(fieldVal)}
                                onChange={(e) => updateVisualField(fieldKey, e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg text-[0.8125rem] text-foreground outline-none resize-none min-h-[60px]"
                                style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", ...bodyFont }}
                              />
                            ) : (
                              <input
                                type={fieldKey.toLowerCase().includes("email") ? "email" : fieldKey.toLowerCase().includes("url") || fieldKey.toLowerCase().includes("link") ? "url" : "text"}
                                value={String(fieldVal)}
                                onChange={(e) => updateVisualField(fieldKey, e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg text-[0.8125rem] text-foreground outline-none"
                                style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", ...bodyFont }}
                              />
                            )
                          ) : valType === "number" ? (
                            <input
                              type="number"
                              value={Number(fieldVal)}
                              onChange={(e) => updateVisualField(fieldKey, e.target.value === "" ? 0 : Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 rounded-lg text-[0.8125rem] text-foreground outline-none tabular-nums"
                              style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", ...bodyFont }}
                            />
                          ) : valType === "boolean" ? (
                            <button
                              onClick={() => updateVisualField(fieldKey, !fieldVal)}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[0.8125rem] cursor-pointer transition-colors"
                              style={{
                                backgroundColor: fieldVal ? "rgba(126,158,120,0.1)" : "var(--secondary)",
                                border: `1px solid ${fieldVal ? "rgba(126,158,120,0.25)" : "var(--border)"}`,
                                color: fieldVal ? "#7E9E78" : "var(--muted-foreground)",
                                ...bodyFont,
                              }}
                            >
                              {fieldVal ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              {fieldVal ? "true" : "false"}
                            </button>
                          ) : valType === "null" ? (
                            <span className="text-[0.8125rem] text-muted-foreground/40 italic px-2.5 py-1.5 inline-block" style={bodyFont}>null</span>
                          ) : (
                            <div className="px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-mono text-muted-foreground/70 whitespace-pre-wrap max-h-24 overflow-y-auto" style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", ...bodyFont }}>
                              {JSON.stringify(fieldVal, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: `1px solid ${editDirty ? "rgba(201,169,110,0.4)" : "var(--border)"}` }}
            >
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider" style={bodyFont}>JSON Editor</span>
                </div>
                {editDirty && (
                  <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}>
                    Unsaved changes
                  </span>
                )}
              </div>
              <textarea
                value={editBuffer}
                onChange={(e) => {
                  setEditBuffer(e.target.value);
                  setEditDirty(true);
                }}
                className="w-full p-4 bg-transparent text-foreground font-mono text-[0.75rem] leading-relaxed outline-none resize-none min-h-[300px] sm:min-h-[400px]"
                style={bodyFont}
                spellCheck={false}
              />
            </div>
          )}
        </div>
      )}

      {/* ── NOTION PULL VIEW ────────────────────────────────────────── */}
      {view === "notion-sources" && activeNotionType && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeNotionType} items...`}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl text-[0.8125rem] text-foreground outline-none"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                ...bodyFont,
              }}
            />
          </div>

          {notionLoading ? (
            <div className="py-12 text-center">
              <div
                className="w-6 h-6 rounded-full animate-spin mx-auto mb-3"
                style={{ border: "2px solid rgba(194,123,107,0.15)", borderTopColor: "rgba(194,123,107,0.6)" }}
              />
              <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>
                Pulling from Notion...
              </span>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
            >
              {notionItems.length === 0 ? (
                <div className="py-12 text-center">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-[0.875rem] text-muted-foreground" style={bodyFont}>No items found.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {notionItems
                    .filter((item) => {
                      if (!searchQuery.trim()) return true;
                      return JSON.stringify(item).toLowerCase().includes(searchQuery.toLowerCase());
                    })
                    .slice(0, 100)
                    .map((item, idx) => {
                      const preview = getItemPreview(item);
                      return (
                        <div
                          key={item._notionId || idx}
                          className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors"
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-[0.625rem] font-bold tabular-nums"
                            style={{ backgroundColor: "rgba(194,123,107,0.08)", color: "#C27B6B" }}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[0.8125rem] text-foreground font-medium truncate" style={bodyFont}>
                              {preview.title}
                            </p>
                            {preview.subtitle && (
                              <p className="text-[0.6875rem] text-muted-foreground truncate" style={bodyFont}>
                                {preview.subtitle}
                              </p>
                            )}
                            {/* Show top 4 non-internal fields */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                              {Object.entries(item)
                                .filter(([k]) => !k.startsWith("_") && k !== "id")
                                .slice(0, 4)
                                .map(([k, v]) => (
                                  <span key={k} className="text-[0.5625rem] text-muted-foreground/60" style={bodyFont}>
                                    <span className="font-mono">{k}</span>: {formatValue(v)}
                                  </span>
                                ))}
                            </div>
                          </div>
                          {item._url && (
                            <a
                              href={item._url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 mt-1"
                              title="Open in Notion"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 hover:text-foreground transition-colors" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function getItemPreview(item: any): { title: string; subtitle: string | null } {
  if (!item || typeof item !== "object") return { title: String(item), subtitle: null };

  // Try to find a title-like field
  for (const field of ["displayName", "name", "milestone", "title", "Milestone", "Name", "Title", "Chef Name", "action", "event"]) {
    if (item[field] && typeof item[field] === "string") {
      // Find a subtitle
      const subtitleFields = ["email", "role", "status", "Status", "Division", "division", "category", "type", "inquiryType"];
      let subtitle: string | null = null;
      for (const sf of subtitleFields) {
        if (item[sf]) {
          subtitle = `${sf}: ${item[sf]}`;
          break;
        }
      }
      return { title: item[field], subtitle };
    }
  }

  return { title: `${Object.keys(item).length} fields`, subtitle: item.id ? `ID: ${item.id}` : null };
}

function formatValue(val: any): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return val.toLocaleString();
  if (typeof val === "string") {
    if (val.length > 60) return val.slice(0, 57) + "...";
    return val || "—";
  }
  if (Array.isArray(val)) return `[${val.length} items]`;
  if (typeof val === "object") return `{${Object.keys(val).length} fields}`;
  return String(val);
}

function getScaffold(prefix: string): any {
  switch (prefix) {
    case "ik26:profile:":
      return { displayName: "", email: "", role: "team", division: "", status: "active", createdAt: new Date().toISOString() };
    case "ik26:expense:":
      return { description: "", amount: 0, currency: "USD", category: "", status: "pending", submittedBy: "", submittedAt: new Date().toISOString() };
    case "ik26:portal-inquiry:":
      return { name: "", email: "", inquiryType: "general", message: "", status: "new", submittedAt: new Date().toISOString() };
    case "ik26:msg:":
      return { message: "", sender: "", timestamp: new Date().toISOString() };
    case "ik26:memory-wall:":
      return { title: "", description: "", imageUrl: "", author: "", createdAt: new Date().toISOString() };
    case "ik26:analytics:":
      return { event: "", category: "", metadata: {}, timestamp: new Date().toISOString() };
    default:
      return { createdAt: new Date().toISOString() };
  }
}