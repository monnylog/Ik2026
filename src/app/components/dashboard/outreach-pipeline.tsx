import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  MessageCircle,
  Eye,
  Plus,
  ArrowRight,
  Loader2,
  Building2,
  ChefHat,
  Package,
  Newspaper,
  Users,
  X,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformCommsContact, type TransformedCommsContact } from "../../lib/notion-transforms";
import { NotionSyncBadge } from "../ui/notion-sync-badge";

import { bodyFont, headingFont } from "../../lib/fonts";

// Helper to safely format dates
const formatDate = (d: string | null | undefined) => {
  if (!d) return null;
  const parsed = Date.parse(d);
  if (isNaN(parsed)) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface OutreachPipelineProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

// Map workstream/contact type to display type
function getContactType(contact: TransformedCommsContact): string {
  const workstreamLower = contact.workstream.toLowerCase();
  const nameLower = contact.name.toLowerCase();
  const contactLower = contact.contact.toLowerCase();
  
  if (workstreamLower.includes("sponsor") || workstreamLower.includes("partnership") || contact.tier) {
    return "Sponsor";
  }
  if (workstreamLower.includes("chef") || nameLower.includes("chef") || contactLower.includes("chef")) {
    return "Chef";
  }
  if (workstreamLower.includes("vendor") || workstreamLower.includes("supplier")) {
    return "Vendor";
  }
  if (workstreamLower.includes("press") || workstreamLower.includes("media") || workstreamLower.includes("pr")) {
    return "Press";
  }
  if (workstreamLower.includes("venue")) {
    return "Venue";
  }
  return "Contact";
}

// Get icon for contact type
function getTypeIcon(type: string) {
  switch (type) {
    case "Sponsor": return Building2;
    case "Chef": return ChefHat;
    case "Vendor": return Package;
    case "Press": return Newspaper;
    default: return Users;
  }
}

// Map Notion status to pipeline column
function mapStatusToColumn(status: string): "to-contact" | "in-progress" | "confirmed" | null {
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes("pending") || statusLower.includes("new") || statusLower.includes("to contact")) {
    return "to-contact";
  }
  if (statusLower.includes("in progress") || statusLower.includes("waiting") || statusLower.includes("follow")) {
    return "in-progress";
  }
  if (statusLower.includes("confirmed") || statusLower.includes("done") || statusLower.includes("complete")) {
    return "confirmed";
  }
  
  // Default to "to-contact" if status is unclear
  return "to-contact";
}

// Fallback mock data (18 contacts as mentioned)
const fallbackContacts: TransformedCommsContact[] = [
  { id: "1", name: "Mama Sita's", contact: "Marketing Director", communicationType: "Email", status: "To Contact", lastContact: "", nextAction: "Initial sponsor pitch", priority: "high", owner: "Sarah", followUpDate: "2026-03-20", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Gold", estValue: "$10k", _notionId: "", _url: "" },
  { id: "2", name: "Resorts World Las Vegas", contact: "Events Team", communicationType: "Email", status: "In Progress", lastContact: "2026-03-12", nextAction: "Awaiting venue quote", priority: "high", owner: "Monica", followUpDate: "2026-03-18", workstream: "Venue", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "3", name: "T-Mobile", contact: "Corporate Partnerships", communicationType: "Call", status: "To Contact", lastContact: "", nextAction: "Send sponsorship deck", priority: "medium", owner: "Sarah", followUpDate: "2026-03-22", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Silver", estValue: "$5k", _notionId: "", _url: "" },
  { id: "4", name: "Philippine Airlines", contact: "PR Manager", communicationType: "Email", status: "In Progress", lastContact: "2026-03-10", nextAction: "Follow up on chef flights", priority: "high", owner: "Dio", followUpDate: "2026-03-16", workstream: "Travel Partner", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "5", name: "Chef Tom Cunanan", contact: "Bad Saint DC", communicationType: "Text", status: "Confirmed", lastContact: "2026-03-08", nextAction: "", priority: "high", owner: "Dio", followUpDate: "", workstream: "Chefs", emailThread: "", notes: "", confirmed: true, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "6", name: "Chef Charles Olalia", contact: "Ma'am Sir LA", communicationType: "WhatsApp", status: "Confirmed", lastContact: "2026-03-05", nextAction: "", priority: "high", owner: "Dio", followUpDate: "", workstream: "Chefs", emailThread: "", notes: "", confirmed: true, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "7", name: "Red Bull", contact: "Events Sponsorship", communicationType: "Email", status: "To Contact", lastContact: "", nextAction: "Beverage sponsorship inquiry", priority: "medium", owner: "Sarah", followUpDate: "2026-03-25", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Bronze", estValue: "$3k", _notionId: "", _url: "" },
  { id: "8", name: "Eater Las Vegas", contact: "Editor", communicationType: "Email", status: "In Progress", lastContact: "2026-03-11", nextAction: "Send press release", priority: "medium", owner: "Flerine", followUpDate: "2026-03-17", workstream: "Press", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "9", name: "Las Vegas Review-Journal", contact: "Food Critic", communicationType: "Email", status: "To Contact", lastContact: "", nextAction: "Media pitch for IK26", priority: "medium", owner: "Flerine", followUpDate: "2026-03-21", workstream: "Press", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "10", name: "San Miguel Beer", contact: "Brand Partnerships", communicationType: "Call", status: "In Progress", lastContact: "2026-03-09", nextAction: "Negotiate beverage package", priority: "medium", owner: "Sarah", followUpDate: "2026-03-19", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Gold", estValue: "$8k", _notionId: "", _url: "" },
  { id: "11", name: "Chef Timothy Flores", contact: "Kasama Chicago", communicationType: "Email", status: "In Progress", lastContact: "2026-03-08", nextAction: "Route through Max's connection", priority: "high", owner: "Walbert", followUpDate: "2026-03-25", workstream: "Chefs", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "12", name: "Chef Margarita Manzke", contact: "Wildflour Manila", communicationType: "Email", status: "Confirmed", lastContact: "2026-03-06", nextAction: "", priority: "high", owner: "Dio", followUpDate: "", workstream: "Chefs", emailThread: "", notes: "", confirmed: true, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "13", name: "Seafood City", contact: "Marketing VP", communicationType: "Email", status: "To Contact", lastContact: "", nextAction: "Ingredient sponsorship pitch", priority: "low", owner: "Sarah", followUpDate: "2026-03-28", workstream: "Vendor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Bronze", estValue: "$2k", _notionId: "", _url: "" },
  { id: "14", name: "Filipino Channel", contact: "Content Director", communicationType: "Email", status: "In Progress", lastContact: "2026-03-13", nextAction: "Discuss media partnership", priority: "medium", owner: "Ayce", followUpDate: "2026-03-20", workstream: "Press", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "15", name: "Tanduay Rum", contact: "Brand Manager", communicationType: "Email", status: "To Contact", lastContact: "", nextAction: "Cocktail sponsorship proposal", priority: "medium", owner: "Cy", followUpDate: "2026-03-24", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Silver", estValue: "$4k", _notionId: "", _url: "" },
  { id: "16", name: "Vegas PBS", contact: "Producer", communicationType: "Call", status: "Confirmed", lastContact: "2026-03-07", nextAction: "", priority: "medium", owner: "JJ", followUpDate: "", workstream: "Press", emailThread: "", notes: "", confirmed: true, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "17", name: "Goldilocks USA", contact: "Regional Manager", communicationType: "Email", status: "To Contact", lastContact: "", nextAction: "Dessert vendor outreach", priority: "low", owner: "Dio", followUpDate: "2026-03-26", workstream: "Vendor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "18", name: "The Infatuation", contact: "LA Editor", communicationType: "Email", status: "In Progress", lastContact: "2026-03-14", nextAction: "Send event details", priority: "medium", owner: "Flerine", followUpDate: "2026-03-22", workstream: "Press", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
];

export function OutreachPipeline({ role, onNavigate }: OutreachPipelineProps) {
  const { items: rawItems, isLoading } = useNotionDatabase("comms");
  const isLeadershipOrManager = role === "leadership";
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const contacts: TransformedCommsContact[] = useMemo(
    () => rawItems.map(transformCommsContact).filter((c) => c.name),
    [rawItems]
  );

  // Use Notion data if available, otherwise fallback
  const allContacts = contacts.length > 0 ? contacts : fallbackContacts;
  const isLive = contacts.length > 0;

  // Filter out dismissed and limit to 8 contacts
  const displayContacts = useMemo(() => {
    return allContacts
      .filter((c) => !dismissedIds.has(c.id))
      .slice(0, 8);
  }, [allContacts, dismissedIds]);

  const totalCount = allContacts.length;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const handleClearAll = () => {
    setDismissedIds(new Set());
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "#C85050";
    if (priority === "medium") return "#E67E4A";
    return "#A09A94";
  };

  // Get status config
  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes("confirmed") || statusLower.includes("done") || statusLower.includes("complete")) {
      return {
        label: "Confirmed",
        color: "#7E9E78",
        bgColor: "rgba(126,158,120,0.08)",
        buttonLabel: "View",
        ButtonIcon: Eye,
      };
    }
    
    if (statusLower.includes("in progress") || statusLower.includes("waiting") || statusLower.includes("follow")) {
      return {
        label: "In progress",
        color: "#C9A96E",
        bgColor: "rgba(201,169,110,0.08)",
        buttonLabel: "Follow Up",
        ButtonIcon: MessageCircle,
      };
    }
    
    // Default to "Not started"
    return {
      label: "Not started",
      color: "#8A857F",
      bgColor: "rgba(138,133,127,0.08)",
      buttonLabel: "Send",
      ButtonIcon: Send,
    };
  };

  // Generate mailto: link for contact
  const getMailtoLink = (contact: TransformedCommsContact, contactType: string) => {
    const email = contact.contact && contact.contact.includes("@") ? contact.contact : "";
    
    // Subject line based on type
    let subject = "Isang Kusina 2026";
    if (contactType === "Sponsor") subject = "Isang Kusina 2026 — Partnership Opportunity";
    else if (contactType === "Venue") subject = "Isang Kusina 2026 — Venue Inquiry";
    else if (contactType === "Chef") subject = "Isang Kusina 2026 — Chef Invitation";
    else if (contactType === "Vendor") subject = "Isang Kusina 2026 — Vendor Partnership";
    else if (contactType === "Press") subject = "Isang Kusina 2026 — Media Inquiry";
    
    // Body template
    const body = `Hi ${contact.name},\n\nI'm reaching out regarding Isang Kusina 2026, a Filipino chefs collaboration dinner taking place on May 22, 2026, at Keep Memory Alive Event Center in Las Vegas.\n\n${contact.nextAction || "I'd love to discuss how we can work together on this event."}\n\nBest regards,\nIsang Kusina Team`;
    
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCTAClick = (contact: TransformedCommsContact, statusConfig: any, contactType: string) => {
    // For confirmed contacts, navigate to Comms page
    if (statusConfig.label === "Confirmed") {
      onNavigate && onNavigate("Comms");
      return;
    }
    
    // For Send/Follow Up, open mailto
    const mailtoLink = getMailtoLink(contact, contactType);
    window.open(mailtoLink, "_blank");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#D4B896" }} />
            <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
              Outreach Pipeline
            </h3>
            <span
              className="text-[0.625rem] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(201,169,110,0.1)",
                color: "#C9A96E",
                ...bodyFont,
              }}
            >
              {totalCount} contact{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate("Comms")}
              className="flex items-center gap-1 text-[0.6875rem] cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: "#4A7FB5", ...bodyFont }}
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
            Sponsors, chefs, vendors, and press outreach tracker
          </p>
          {isLive && <NotionSyncBadge isLive={true} compact />}
        </div>
      </div>

      {/* Contact list */}
      {isLoading && !isLive ? (
        <div className="p-3 space-y-2">
          {/* Skeleton loading state */}
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-xl animate-pulse"
              style={{
                backgroundColor: "rgba(126,158,120,0.03)",
                border: "1px solid rgba(126,158,120,0.06)",
                minHeight: "72px",
              }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "rgba(138,133,127,0.2)" }} />
              <div className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: "rgba(126,158,120,0.08)" }} />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3 w-32 rounded" style={{ backgroundColor: "rgba(126,158,120,0.12)" }} />
                <div className="h-2.5 w-48 rounded" style={{ backgroundColor: "rgba(126,158,120,0.08)" }} />
              </div>
              <div className="h-6 w-20 rounded-full shrink-0" style={{ backgroundColor: "rgba(126,158,120,0.08)" }} />
              <div className="h-8 w-24 rounded-lg shrink-0" style={{ backgroundColor: "rgba(126,158,120,0.08)" }} />
            </div>
          ))}
        </div>
      ) : displayContacts.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
            No active outreach contacts
          </p>
          {dismissedIds.size > 0 && (
            <button
              onClick={handleClearAll}
              className="mt-2 text-[0.6875rem] cursor-pointer hover:opacity-70 transition-opacity"
              style={{ color: "#4A7FB5", ...bodyFont }}
            >
              Show all again
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 space-y-2">
          <AnimatePresence mode="popLayout">
            {displayContacts.map((contact, idx) => {
              const priorityColor = getPriorityColor(contact.priority);
              const statusConfig = getStatusConfig(contact.status);
              const ButtonIcon = statusConfig.ButtonIcon;
              const contactType = getContactType(contact);
              const TypeIcon = getTypeIcon(contactType);

              return (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl group relative"
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.06)",
                    minHeight: "72px",
                  }}
                >
                  {/* Priority dot */}
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: priorityColor }}
                    title={`${contact.priority} priority`}
                  />

                  {/* Type icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: "rgba(201,169,110,0.06)",
                      border: "1px solid rgba(201,169,110,0.12)",
                    }}
                  >
                    <TypeIcon className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
                  </div>

                  {/* Contact info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        className="text-[0.8125rem] font-semibold truncate"
                        style={{ color: "#3D524D", ...bodyFont }}
                      >
                        {contact.name}
                      </p>
                      <span
                        className="text-[0.5625rem] px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: "rgba(0,0,0,0.04)",
                          color: "#8A857F",
                          ...bodyFont,
                        }}
                      >
                        {contactType}
                      </span>
                    </div>
                    <p
                      className="text-[0.6875rem] text-muted-foreground truncate"
                      style={bodyFont}
                    >
                      {contact.nextAction || contact.contact || `Follow up with ${contact.name}`}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className="text-[0.625rem] px-2.5 py-1 rounded-full shrink-0 font-medium"
                    style={{
                      backgroundColor: statusConfig.bgColor,
                      color: statusConfig.color,
                      ...bodyFont,
                    }}
                  >
                    {statusConfig.label}
                  </span>

                  {/* CTA button */}
                  <button
                    onClick={() => handleCTAClick(contact, statusConfig, contactType)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:opacity-80 shrink-0"
                    style={{
                      backgroundColor: statusConfig.bgColor,
                      border: `1px solid ${statusConfig.color}20`,
                      color: statusConfig.color,
                    }}
                  >
                    <span className="text-[0.6875rem] font-medium" style={bodyFont}>
                      {statusConfig.buttonLabel}
                    </span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  {/* Dismiss button */}
                  <button
                    onClick={() => handleDismiss(contact.id)}
                    className="w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-opacity opacity-0 group-hover:opacity-100 shrink-0"
                    style={{ color: "#A09A94" }}
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Show more indicator */}
          {allContacts.length > displayContacts.length + dismissedIds.size && (
            <div className="text-center pt-2">
              <button
                onClick={() => onNavigate && onNavigate("Comms")}
                className="text-[0.6875rem] cursor-pointer hover:opacity-70 transition-opacity"
                style={{ color: "#4A7FB5", ...bodyFont }}
              >
                {allContacts.length - displayContacts.length - dismissedIds.size} more in Comms Tracker →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Contact button — leadership/manager only */}
      {isLeadershipOrManager && displayContacts.length > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onNavigate && onNavigate("Comms")}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:opacity-80"
            style={{
              backgroundColor: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.15)",
              color: "#C9A96E",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[0.6875rem] font-medium" style={bodyFont}>
              Add Contact
            </span>
          </button>
        </div>
      )}
    </div>
  );
}