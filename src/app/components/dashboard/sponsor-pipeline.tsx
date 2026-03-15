// ─── Sponsor Pipeline Summary Widget ─────────────────────────────
// Shows sponsor tracking stats with mini donut visualization

import { useMemo } from "react";
import { Building2, ArrowRight, CheckCircle2, Clock, Circle } from "lucide-react";
import { useNotionDatabase } from "../../lib/notion-sync";
import { transformCommsContact, type TransformedCommsContact } from "../../lib/notion-transforms";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface SponsorPipelineProps {
  onNavigate?: (page: string) => void;
}

// Fallback sponsors
const fallbackSponsors: TransformedCommsContact[] = [
  { id: "1", name: "Mama Sita's", contact: "", communicationType: "", status: "To Contact", lastContact: "", nextAction: "", priority: "high", owner: "", followUpDate: "", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Gold", estValue: "$10k", _notionId: "", _url: "" },
  { id: "2", name: "San Miguel Beer", contact: "", communicationType: "", status: "In Progress", lastContact: "", nextAction: "", priority: "medium", owner: "", followUpDate: "", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Gold", estValue: "$8k", _notionId: "", _url: "" },
  { id: "3", name: "T-Mobile", contact: "", communicationType: "", status: "To Contact", lastContact: "", nextAction: "", priority: "medium", owner: "", followUpDate: "", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Silver", estValue: "$5k", _notionId: "", _url: "" },
  { id: "4", name: "Red Bull", contact: "", communicationType: "", status: "To Contact", lastContact: "", nextAction: "", priority: "medium", owner: "", followUpDate: "", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Bronze", estValue: "$3k", _notionId: "", _url: "" },
  { id: "5", name: "Tanduay Rum", contact: "", communicationType: "", status: "To Contact", lastContact: "", nextAction: "", priority: "medium", owner: "", followUpDate: "", workstream: "Sponsor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Silver", estValue: "$4k", _notionId: "", _url: "" },
  { id: "6", name: "Seafood City", contact: "", communicationType: "", status: "To Contact", lastContact: "", nextAction: "", priority: "low", owner: "", followUpDate: "", workstream: "Vendor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "Bronze", estValue: "$2k", _notionId: "", _url: "" },
  { id: "7", name: "Goldilocks USA", contact: "", communicationType: "", status: "To Contact", lastContact: "", nextAction: "", priority: "low", owner: "", followUpDate: "", workstream: "Vendor", emailThread: "", notes: "", confirmed: false, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
  { id: "8", name: "Vegas PBS", contact: "", communicationType: "", status: "Confirmed", lastContact: "", nextAction: "", priority: "medium", owner: "", followUpDate: "", workstream: "Press", emailThread: "", notes: "", confirmed: true, responseDeadline: "", suggestedBy: "", source: "", tier: "", estValue: "", _notionId: "", _url: "" },
];

function categorizeStatus(status: string): "confirmed" | "in-progress" | "not-started" {
  const s = status.toLowerCase();
  if (s.includes("confirmed") || s.includes("done") || s.includes("complete")) return "confirmed";
  if (s.includes("in progress") || s.includes("waiting") || s.includes("follow")) return "in-progress";
  return "not-started";
}

export function SponsorPipeline({ onNavigate }: SponsorPipelineProps) {
  const { items: rawItems } = useNotionDatabase("comms");

  const contacts = useMemo(
    () => rawItems.map(transformCommsContact).filter((c) => c.name),
    [rawItems]
  );

  // Filter for sponsor-related contacts
  const sponsors = useMemo(() => {
    const list = contacts.length > 0 ? contacts : fallbackSponsors;
    return list.filter((c) => {
      const w = c.workstream?.toLowerCase() || "";
      return w.includes("sponsor") || w.includes("partner") || w.includes("vendor") || !!c.tier;
    });
  }, [contacts]);

  const confirmed = sponsors.filter((s) => categorizeStatus(s.status) === "confirmed").length;
  const inProgress = sponsors.filter((s) => categorizeStatus(s.status) === "in-progress").length;
  const notStarted = sponsors.filter((s) => categorizeStatus(s.status) === "not-started").length;
  const total = sponsors.length;

  // SVG donut chart
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const confirmedPct = total > 0 ? confirmed / total : 0;
  const inProgressPct = total > 0 ? inProgress / total : 0;
  const notStartedPct = total > 0 ? notStarted / total : 0;

  const confirmedArc = confirmedPct * circumference;
  const inProgressArc = inProgressPct * circumference;
  const notStartedArc = notStartedPct * circumference;

  return (
    <button
      onClick={() => onNavigate?.("Comms")}
      className="w-full bg-card border border-border rounded-xl p-4 sm:p-5 text-left cursor-pointer hover:border-gold/30 transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C9A96E" }} />
          <h3 className="text-foreground text-[0.875rem]" style={headingFont}>
            Sponsor Pipeline
          </h3>
        </div>
        <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground group-hover:text-gold transition-colors" style={bodyFont}>
          View all
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Mini donut */}
        <div className="relative shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            {/* Background circle */}
            <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(140,130,120,0.08)" strokeWidth="8" />
            {/* Not Started arc */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none" stroke="rgba(138,133,127,0.3)" strokeWidth="8"
              strokeDasharray={`${notStartedArc} ${circumference - notStartedArc}`}
              strokeDashoffset={0}
              transform="rotate(-90 36 36)"
              strokeLinecap="round"
            />
            {/* In Progress arc */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none" stroke="#C9A96E" strokeWidth="8"
              strokeDasharray={`${inProgressArc} ${circumference - inProgressArc}`}
              strokeDashoffset={-notStartedArc}
              transform="rotate(-90 36 36)"
              strokeLinecap="round"
            />
            {/* Confirmed arc */}
            <circle
              cx="36" cy="36" r={radius}
              fill="none" stroke="#5DA06B" strokeWidth="8"
              strokeDasharray={`${confirmedArc} ${circumference - confirmedArc}`}
              strokeDashoffset={-(notStartedArc + inProgressArc)}
              transform="rotate(-90 36 36)"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-foreground text-[1rem] font-semibold" style={bodyFont}>{total}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: "#5DA06B" }} />
            <span className="text-[0.75rem] text-foreground" style={bodyFont}>
              {confirmed} Confirmed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 shrink-0" style={{ color: "#C9A96E" }} />
            <span className="text-[0.75rem] text-foreground" style={bodyFont}>
              {inProgress} In Progress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 shrink-0" style={{ color: "#8A857F" }} />
            <span className="text-[0.75rem] text-foreground" style={bodyFont}>
              {notStarted} Not Started
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
