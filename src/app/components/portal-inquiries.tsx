import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Clock,
  User,
  Building2,
  MessageSquare,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Filter,
  Sparkles,
  Handshake,
  HelpCircle,
  Lightbulb,
  Camera,
  Star as StarIcon,
  Check,
  Archive,
  ExternalLink,
  Inbox,
  Download,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface Inquiry {
  id: string;
  name: string;
  email: string;
  organization: string;
  inquiryType: string;
  message: string;
  timestamp: string;
  status: string;
}

const typeIcons: Record<string, React.ElementType> = {
  Sponsorship: StarIcon,
  Partnership: Handshake,
  "VIP Experience": Sparkles,
  "General Question": HelpCircle,
  Suggestion: Lightbulb,
  "Media/Press": Camera,
};

const typeColors: Record<string, string> = {
  Sponsorship: "#C9A96E",
  Partnership: "#7E9E78",
  "VIP Experience": "#8B96C4",
  "General Question": "#CDA88A",
  Suggestion: "#EDCBC8",
  "Media/Press": "#C49370",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PortalInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/portal-inquiries`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch (err) {
      console.error("Failed to load portal inquiries:", err);
      setError("Failed to load inquiries. Check your connection.");
      // Fallback to localStorage
      try {
        const local = JSON.parse(localStorage.getItem("ik26-portal-inquiries") || "[]");
        if (local.length > 0) {
          setInquiries(
            local.map((l: any, i: number) => ({
              ...l,
              id: l.id || `local-${i}`,
              status: l.status || "new",
            }))
          );
          setError("Showing cached data. Backend unavailable.");
        }
      } catch {
        // ignore
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/portal-inquiry/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setInquiries((prev) =>
          prev.map((inq) =>
            inq.id === id ? { ...inq, status: data.inquiry?.status ?? status } : inq
          )
        );
      } else {
        console.error("Failed to update inquiry status:", await res.text());
      }
    } catch (err) {
      console.error("Network error updating inquiry status:", err);
    }
    setUpdatingId(null);
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (filterType !== "all" && inq.inquiryType !== filterType) return false;
    if (filterStatus !== "all" && inq.status !== filterStatus) return false;
    return true;
  });

  const typeCounts = inquiries.reduce<Record<string, number>>((acc, inq) => {
    acc[inq.inquiryType] = (acc[inq.inquiryType] || 0) + 1;
    return acc;
  }, {});

  const newCount = inquiries.filter((i) => i.status === "new").length;

  const exportCSV = () => {
    if (filteredInquiries.length === 0) return;
    const headers = ["Name", "Email", "Organization", "Type", "Status", "Date", "Message"];
    const rows = filteredInquiries.map((inq) => [
      inq.name,
      inq.email,
      inq.organization,
      inq.inquiryType,
      inq.status,
      new Date(inq.timestamp).toLocaleString(),
      inq.message.replace(/"/g, '""'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `isang-kusina-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2
            className="text-xl sm:text-2xl font-bold flex items-center gap-2"
            style={{ ...headingFont, color: "var(--color-ecru, #F4EDE4)" }}
          >
            <Inbox className="w-5 h-5" style={{ color: "var(--color-gold, #C9A96E)" }} />
            Portal Inquiries
            {newCount > 0 && (
              <span
                className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: "rgba(201,169,110,0.15)",
                  color: "#C9A96E",
                  border: "1px solid rgba(201,169,110,0.25)",
                }}
              >
                {newCount} new
              </span>
            )}
          </h2>
          <p
            className="text-sm mt-1"
            style={{ ...bodyFont, color: "var(--color-ecru-muted, rgba(244,237,228,0.5))" }}
          >
            Inquiries submitted through the public portal page
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredInquiries.length > 0 && !loading && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
              style={{
                ...bodyFont,
                backgroundColor: "rgba(126,158,120,0.08)",
                color: "#7E9E78",
                border: "1px solid rgba(126,158,120,0.2)",
              }}
              aria-label="Export inquiries to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={fetchInquiries}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer"
            style={{
              ...bodyFont,
              backgroundColor: "rgba(201,169,110,0.08)",
              color: "#C9A96E",
              border: "1px solid rgba(201,169,110,0.2)",
            }}
            aria-label="Refresh inquiries"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </motion.button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className="p-3 rounded-xl text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(201,169,110,0.12)",
          }}
        >
          <div className="text-lg font-bold" style={{ color: "#C9A96E" }}>
            {inquiries.length}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider" style={{ color: "rgba(244,237,228,0.4)" }}>
            Total
          </div>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(126,158,120,0.15)",
          }}
        >
          <div className="text-lg font-bold" style={{ color: "#7E9E78" }}>
            {newCount}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider" style={{ color: "rgba(244,237,228,0.4)" }}>
            New
          </div>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(139,150,196,0.15)",
          }}
        >
          <div className="text-lg font-bold" style={{ color: "#8B96C4" }}>
            {typeCounts["Sponsorship"] || 0}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider" style={{ color: "rgba(244,237,228,0.4)" }}>
            Sponsorship
          </div>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(205,168,138,0.15)",
          }}
        >
          <div className="text-lg font-bold" style={{ color: "#CDA88A" }}>
            {typeCounts["Partnership"] || 0}
          </div>
          <div className="text-[0.6875rem] uppercase tracking-wider" style={{ color: "rgba(244,237,228,0.4)" }}>
            Partnership
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5" style={{ color: "rgba(244,237,228,0.35)" }} />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs appearance-none cursor-pointer outline-none"
          style={{
            ...bodyFont,
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "rgba(244,237,228,0.7)",
            border: "1px solid rgba(201,169,110,0.12)",
          }}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          <option value="Sponsorship">Sponsorship</option>
          <option value="Partnership">Partnership</option>
          <option value="VIP Experience">VIP Experience</option>
          <option value="General Question">General Question</option>
          <option value="Suggestion">Suggestion</option>
          <option value="Media/Press">Media/Press</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs appearance-none cursor-pointer outline-none"
          style={{
            ...bodyFont,
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "rgba(244,237,228,0.7)",
            border: "1px solid rgba(201,169,110,0.12)",
          }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="archived">Archived</option>
        </select>
        <span className="ml-auto text-[0.6875rem]" style={{ color: "rgba(244,237,228,0.35)" }}>
          {filteredInquiries.length} result{filteredInquiries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{
            ...bodyFont,
            backgroundColor: "rgba(237,203,200,0.08)",
            color: "#EDCBC8",
            border: "1px solid rgba(237,203,200,0.2)",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl animate-pulse"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(201,169,110,0.08)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                <div className="flex-1">
                  <div className="h-3 w-32 rounded" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
                  <div className="h-2.5 w-48 rounded mt-2" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
                </div>
                <div className="h-2.5 w-16 rounded" style={{ backgroundColor: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredInquiries.length === 0 && (
        <div className="text-center py-16">
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{
              backgroundColor: "rgba(201,169,110,0.08)",
              border: "1px solid rgba(201,169,110,0.15)",
            }}
          >
            <Mail className="w-6 h-6" style={{ color: "rgba(201,169,110,0.4)" }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(244,237,228,0.5)" }}>
            No inquiries yet
          </p>
          <p className="text-xs" style={{ color: "rgba(244,237,228,0.3)" }}>
            Inquiries from the public portal will appear here
          </p>
        </div>
      )}

      {/* Inquiry list */}
      {!loading && filteredInquiries.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filteredInquiries.map((inq, i) => {
              const isExpanded = expandedId === inq.id;
              const TypeIcon = typeIcons[inq.inquiryType] || HelpCircle;
              const typeColor = typeColors[inq.inquiryType] || "#CDA88A";

              return (
                <motion.div
                  key={inq.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${
                      inq.status === "new"
                        ? "rgba(201,169,110,0.2)"
                        : "rgba(244,237,228,0.06)"
                    }`,
                  }}
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                    className="w-full flex items-center gap-3 p-4 text-left cursor-pointer min-h-[56px]"
                    aria-expanded={isExpanded}
                    aria-label={`Inquiry from ${inq.name}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${typeColor}15`,
                        border: `1px solid ${typeColor}25`,
                      }}
                    >
                      <TypeIcon className="w-3.5 h-3.5" style={{ color: typeColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-medium truncate"
                          style={{ color: "rgba(244,237,228,0.85)" }}
                        >
                          {inq.name}
                        </span>
                        {inq.status === "new" && (
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: "#C9A96E" }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className="text-[0.6875rem] truncate"
                          style={{ color: typeColor, opacity: 0.8 }}
                        >
                          {inq.inquiryType}
                        </span>
                        {inq.organization && (
                          <>
                            <span style={{ color: "rgba(244,237,228,0.15)" }}>·</span>
                            <span
                              className="text-[0.6875rem] truncate"
                              style={{ color: "rgba(244,237,228,0.35)" }}
                            >
                              {inq.organization}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[0.625rem]" style={{ color: "rgba(244,237,228,0.3)" }}>
                        {formatDate(inq.timestamp)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" style={{ color: "rgba(244,237,228,0.25)" }} />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: "rgba(244,237,228,0.25)" }} />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="px-4 pb-4 space-y-3"
                          style={{ borderTop: "1px solid rgba(244,237,228,0.06)" }}
                        >
                          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3" style={{ color: "rgba(244,237,228,0.3)" }} />
                              <span className="text-xs" style={{ color: "rgba(244,237,228,0.6)" }}>
                                {inq.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3" style={{ color: "rgba(244,237,228,0.3)" }} />
                              <a
                                href={`mailto:${inq.email}`}
                                className="text-xs underline"
                                style={{ color: "#C9A96E" }}
                              >
                                {inq.email}
                              </a>
                            </div>
                            {inq.organization && (
                              <div className="flex items-center gap-2">
                                <Building2 className="w-3 h-3" style={{ color: "rgba(244,237,228,0.3)" }} />
                                <span className="text-xs" style={{ color: "rgba(244,237,228,0.6)" }}>
                                  {inq.organization}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3" style={{ color: "rgba(244,237,228,0.3)" }} />
                              <span className="text-xs" style={{ color: "rgba(244,237,228,0.4)" }}>
                                {new Date(inq.timestamp).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          <div
                            className="p-3 rounded-lg"
                            style={{
                              backgroundColor: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(244,237,228,0.06)",
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-2">
                              <MessageSquare className="w-3 h-3" style={{ color: "rgba(244,237,228,0.3)" }} />
                              <span className="text-[0.625rem] uppercase tracking-wider" style={{ color: "rgba(244,237,228,0.3)" }}>
                                Message
                              </span>
                            </div>
                            <p
                              className="text-sm leading-relaxed whitespace-pre-wrap"
                              style={{ ...bodyFont, color: "rgba(244,237,228,0.7)" }}
                            >
                              {inq.message}
                            </p>
                          </div>

                          {/* Quick actions */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <motion.a
                              href={`mailto:${inq.email}?subject=Re: ${inq.inquiryType} — Isang Kusina 2026`}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                              style={{
                                backgroundColor: "rgba(201,169,110,0.1)",
                                color: "#C9A96E",
                                border: "1px solid rgba(201,169,110,0.2)",
                              }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Reply via email
                            </motion.a>

                            {inq.status !== "reviewed" && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => updateStatus(inq.id, "reviewed")}
                                disabled={updatingId === inq.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                                style={{
                                  backgroundColor: "rgba(126,158,120,0.1)",
                                  color: "#7E9E78",
                                  border: "1px solid rgba(126,158,120,0.2)",
                                  opacity: updatingId === inq.id ? 0.5 : 1,
                                }}
                              >
                                <Check className="w-3 h-3" />
                                {updatingId === inq.id ? "Updating..." : "Mark Reviewed"}
                              </motion.button>
                            )}

                            {inq.status !== "archived" && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => updateStatus(inq.id, "archived")}
                                disabled={updatingId === inq.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                                style={{
                                  backgroundColor: "rgba(139,150,196,0.08)",
                                  color: "#8B96C4",
                                  border: "1px solid rgba(139,150,196,0.15)",
                                  opacity: updatingId === inq.id ? 0.5 : 1,
                                }}
                              >
                                <Archive className="w-3 h-3" />
                                Archive
                              </motion.button>
                            )}

                            {inq.status !== "new" && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => updateStatus(inq.id, "new")}
                                disabled={updatingId === inq.id}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                                style={{
                                  backgroundColor: "rgba(244,237,228,0.04)",
                                  color: "rgba(244,237,228,0.45)",
                                  border: "1px solid rgba(244,237,228,0.08)",
                                  opacity: updatingId === inq.id ? 0.5 : 1,
                                }}
                              >
                                Mark as New
                              </motion.button>
                            )}

                            {/* Status badge */}
                            <span
                              className="ml-auto text-[0.625rem] uppercase tracking-wider px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: inq.status === "new"
                                  ? "rgba(201,169,110,0.1)"
                                  : inq.status === "reviewed"
                                  ? "rgba(126,158,120,0.1)"
                                  : "rgba(139,150,196,0.08)",
                                color: inq.status === "new"
                                  ? "#C9A96E"
                                  : inq.status === "reviewed"
                                  ? "#7E9E78"
                                  : "#8B96C4",
                                border: `1px solid ${
                                  inq.status === "new"
                                    ? "rgba(201,169,110,0.2)"
                                    : inq.status === "reviewed"
                                    ? "rgba(126,158,120,0.2)"
                                    : "rgba(139,150,196,0.15)"
                                }`,
                              }}
                            >
                              {inq.status}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}