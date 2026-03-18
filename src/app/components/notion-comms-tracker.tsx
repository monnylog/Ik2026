// ─── Notion Comms Tracker ────────────────────────────────────────
// Shows contacts from the IK26 Comms Tracker (inline DB on the Notion page)
// with status, priority, next actions, and follow-up dates.

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Phone,
  Mail,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  ExternalLink,
  User,
  Filter,
  Loader2,
  CheckCircle2,
  Send,
  MessageCircle,
  Eye,
  ArrowRight,
} from "lucide-react";
import { useNotionDatabase } from "../lib/notion-sync";
import { transformCommsContact, type TransformedCommsContact } from "../lib/notion-transforms";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { bodyFont, headingFont } from "../lib/fonts";

const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: "rgba(200,80,80,0.06)", text: "#C85050", border: "rgba(200,80,80,0.15)" },
  medium: { bg: "rgba(206,180,122,0.06)", text: "#C9A96E", border: "rgba(206,180,122,0.15)" },
  low: { bg: "rgba(126,158,120,0.06)", text: "#7E9E78", border: "rgba(126,158,120,0.15)" },
};

const statusColors: Record<string, string> = {
  "pending": "#C9A96E",
  "in progress": "#4A7FB5",
  "confirmed": "#7E9E78",
  "done": "#7E9E78",
  "waiting": "#C9A96E",
  "needs follow-up": "#C85050",
  "no response": "#C85050",
};

function getStatusColor(status: string): string {
  const lower = status.toLowerCase();
  for (const [key, color] of Object.entries(statusColors)) {
    if (lower.includes(key)) return color;
  }
  return "#8A857F";
}

// Generate mailto: link for contact
function getMailtoLink(contact: TransformedCommsContact): string {
  const email = contact.contact && contact.contact.includes("@") ? contact.contact : "";
  
  // Subject line based on workstream
  let subject = "Isang Kusina 2026";
  const workstream = contact.workstream?.toLowerCase() || "";
  if (workstream.includes("sponsor")) subject = "Isang Kusina 2026 — Partnership Opportunity";
  else if (workstream.includes("venue")) subject = "Isang Kusina 2026 — Venue Inquiry";
  else if (workstream.includes("chef")) subject = "Isang Kusina 2026 — Chef Invitation";
  else if (workstream.includes("vendor")) subject = "Isang Kusina 2026 — Vendor Partnership";
  else if (workstream.includes("press") || workstream.includes("marketing")) subject = "Isang Kusina 2026 — Media Inquiry";
  
  // Body template
  const body = `Hi ${contact.name},\n\nI'm reaching out regarding Isang Kusina 2026, a Filipino chefs collaboration dinner taking place on May 22, 2026, at Keep Memory Alive Event Center in Las Vegas.\n\n${contact.nextAction || "I'd love to discuss how we can work together on this event."}\n\nBest regards,\nIsang Kusina Team`;
  
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Get CTA button config based on status
function getCTAConfig(status: string): { label: string; icon: typeof Send; action: "mailto" | "view" } {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes("confirmed") || statusLower.includes("done") || statusLower.includes("complete")) {
    return { label: "View", icon: Eye, action: "view" };
  }
  
  if (statusLower.includes("in progress") || statusLower.includes("waiting") || statusLower.includes("follow")) {
    return { label: "Follow Up", icon: MessageCircle, action: "mailto" };
  }
  
  // Default to "Send"
  return { label: "Send", icon: Send, action: "mailto" };
}

interface NotionCommsTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

type TrackerTab = "pipeline" | "status" | "type";

export function NotionCommsTracker({ isOpen, onClose }: NotionCommsTrackerProps) {
  const { items: rawItems, isLoading, error, refresh } = useNotionDatabase("comms");
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterWorkstream, setFilterWorkstream] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TrackerTab>("pipeline");

  const contacts: TransformedCommsContact[] = useMemo(
    () => rawItems.map(transformCommsContact).filter((c) => c.name),
    [rawItems]
  );

  const workstreams = useMemo(
    () => [...new Set(contacts.map((c) => c.workstream).filter(Boolean))].sort(),
    [contacts]
  );

  const filtered = useMemo(() => {
    let list = contacts;
    if (filterPriority) list = list.filter((c) => c.priority === filterPriority);
    if (filterWorkstream) list = list.filter((c) => c.workstream === filterWorkstream);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        (c.workstream || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, filterPriority, filterWorkstream, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // No fallback data — Notion is the single source of truth
  const displayContacts = filtered;
  const isLive = contacts.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-lg h-full overflow-hidden flex flex-col"
            style={{ backgroundColor: "#FFFDF5", boxShadow: "-4px 0 20px rgba(0,0,0,0.1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
              <div>
                <h3 className="text-lg font-bold" style={{ ...headingFont, color: "#3D524D" }}>
                  Comms Tracker
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <NotionSyncBadge isLive={isLive} itemCount={isLive ? contacts.length : undefined} compact />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-xl cursor-pointer"
                  style={{ backgroundColor: "rgba(206,180,122,0.08)", color: "#C9A96E" }}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                </button>
                <button onClick={onClose} className="p-2 rounded-xl cursor-pointer" style={{ color: "#8A857F" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-5 pt-3 pb-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, org, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-[0.8125rem] outline-none"
                  style={{ ...bodyFont, backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", color: "#3D524D" }}
                />
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#A09A94" }} />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: "#A09A94" }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-5 pb-2">
              {([
                { id: "pipeline" as TrackerTab, label: "Pipeline View" },
                { id: "status" as TrackerTab, label: "By Status" },
                { id: "type" as TrackerTab, label: "By Type" },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-all"
                  style={{
                    ...bodyFont,
                    backgroundColor: activeTab === tab.id ? "rgba(201,169,110,0.12)" : "transparent",
                    color: activeTab === tab.id ? "#C9A96E" : "#8A857F",
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    border: activeTab === tab.id ? "1px solid rgba(201,169,110,0.2)" : "1px solid transparent",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
              <Filter className="w-3.5 h-3.5 shrink-0" style={{ color: "#A09A94" }} />
              {(["high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                  className="px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer whitespace-nowrap"
                  style={{
                    ...bodyFont,
                    backgroundColor: filterPriority === p ? priorityColors[p].bg : "transparent",
                    color: filterPriority === p ? priorityColors[p].text : "#8A857F",
                    border: filterPriority === p ? `1px solid ${priorityColors[p].border}` : "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
              {workstreams.length > 0 && (
                <select
                  value={filterWorkstream || ""}
                  onChange={(e) => setFilterWorkstream(e.target.value || null)}
                  className="px-2.5 py-1 rounded-lg text-[0.6875rem] outline-none cursor-pointer"
                  style={{ ...bodyFont, backgroundColor: "#F8F4EE", color: "#5A554F", border: "1px solid rgba(0,0,0,0.06)" }}
                >
                  <option value="">All workstreams</option>
                  {workstreams.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              )}
            </div>

            {/* Contact List */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
              {isLoading && contacts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#C9A96E" }} />
                </div>
              ) : displayContacts.length === 0 ? (
                <div className="text-center py-12">
                  <User className="w-8 h-8 mx-auto mb-3" style={{ color: "#CCC7BF" }} />
                  <p className="text-[0.8125rem]" style={{ ...bodyFont, color: "#A09A94" }}>
                    No contacts match filters
                  </p>
                </div>
              ) : (
                displayContacts.map((contact) => {
                  const isExpanded = expandedId === contact.id;
                  const pColor = priorityColors[contact.priority] || priorityColors.medium;
                  const sColor = getStatusColor(contact.status);

                  return (
                    <div
                      key={contact.id || contact.name}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div
                        className="flex items-center gap-3 p-3.5 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : contact.id)}
                      >
                        {/* Priority dot */}
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pColor.text }} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[0.8125rem] font-semibold truncate" style={{ ...bodyFont, color: "#3D524D" }}>
                              {contact.name}
                            </span>
                            {contact.confirmed && (
                              <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#7E9E78" }} />
                            )}
                          </div>
                          <p className="text-[0.6875rem] truncate" style={{ ...bodyFont, color: "#A09A94" }}>
                            {contact.nextAction || contact.contact || contact.workstream}
                          </p>
                        </div>

                        {/* Status badge */}
                        <span
                          className="text-[0.5625rem] px-2 py-0.5 rounded-full shrink-0"
                          style={{ backgroundColor: `${sColor}15`, color: sColor, ...bodyFont }}
                        >
                          {contact.status || "—"}
                        </span>

                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: "#A09A94" }} />
                          : <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "#A09A94" }} />
                        }
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3.5 space-y-2.5" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                              {contact.contact && (
                                <div className="flex items-center gap-2 pt-2">
                                  <Mail className="w-3 h-3" style={{ color: "#A09A94" }} />
                                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#5A554F" }}>{contact.contact}</span>
                                </div>
                              )}
                              {contact.owner && (
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3" style={{ color: "#A09A94" }} />
                                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#5A554F" }}>Owner: {contact.owner}</span>
                                </div>
                              )}
                              {contact.followUpDate && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3" style={{ color: "#A09A94" }} />
                                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#5A554F" }}>Follow-up: {contact.followUpDate}</span>
                                </div>
                              )}
                              {contact.workstream && (
                                <div className="flex items-center gap-2">
                                  <span className="text-[0.6875rem] px-2 py-0.5 rounded" style={{ ...bodyFont, backgroundColor: "rgba(0,0,0,0.04)", color: "#8A857F" }}>
                                    {contact.workstream}
                                  </span>
                                  {contact.tier && (
                                    <span className="text-[0.6875rem] px-2 py-0.5 rounded" style={{ ...bodyFont, backgroundColor: "rgba(206,180,122,0.1)", color: "#C9A96E" }}>
                                      {contact.tier}
                                    </span>
                                  )}
                                </div>
                              )}
                              {contact.notes && (
                                <p className="text-[0.6875rem] p-2 rounded-lg" style={{ ...bodyFont, backgroundColor: "#F8F4EE", color: "#5A554F" }}>
                                  {contact.notes}
                                </p>
                              )}
                              
                              {/* CTA Button */}
                              {(() => {
                                const ctaConfig = getCTAConfig(contact.status);
                                const CTAIcon = ctaConfig.icon;
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (ctaConfig.action === "mailto") {
                                        window.open(getMailtoLink(contact), "_blank");
                                      } else {
                                        // View action - could navigate to detailed view
                                        if (contact._url) {
                                          window.open(contact._url, "_blank");
                                        }
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:opacity-80 w-full justify-center"
                                    style={{
                                      backgroundColor: `${sColor}12`,
                                      border: `1px solid ${sColor}30`,
                                      color: sColor,
                                    }}
                                  >
                                    <CTAIcon className="w-3.5 h-3.5" />
                                    <span className="text-[0.6875rem] font-medium" style={bodyFont}>
                                      {ctaConfig.label}
                                    </span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                );
                              })()}
                              
                              {contact._url && (
                                <a
                                  href={contact._url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[0.625rem]"
                                  style={{ ...bodyFont, color: "#4A7FB5" }}
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Open in Notion
                                </a>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer stats */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
              <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "#A09A94" }}>
                {displayContacts.length} contact{displayContacts.length !== 1 ? "s" : ""}
                {filterPriority || filterWorkstream ? " (filtered)" : ""}
              </span>
              <div className="flex items-center gap-3">
                {displayContacts.filter((c) => c.priority === "high").length > 0 && (
                  <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(200,80,80,0.08)", color: "#C85050", ...bodyFont }}>
                    {displayContacts.filter((c) => c.priority === "high").length} high priority
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}