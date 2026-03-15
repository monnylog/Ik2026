import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plane,
  Hotel,
  MapPin,
  ChefHat,
  Users,
  Map,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Calendar,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface TravelRecord {
  id: string;
  name: string;
  role: "chef" | "team" | "guest";
  origin: string;
  flightStatus: "booked" | "pending" | "needs-booking";
  flightDetails: string;
  arrivalDate: string;
  departureDate: string;
  lodgingStatus: "confirmed" | "pending" | "needs-booking";
  lodgingDetails: string;
  groundTransport: string;
  notes: string;
}

const travelRecords: TravelRecord[] = [
  { id: "1", name: "Chef Patrice Cleary", role: "chef", origin: "Portland, OR", flightStatus: "booked", flightDetails: "Alaska AS 1422 · May 21 8:15AM PDT → 10:30AM PDT", arrivalDate: "2026-05-21", departureDate: "2026-05-24", lodgingStatus: "confirmed", lodgingDetails: "The Venetian — Suite 2204", groundTransport: "Shuttle from LAS", notes: "Arriving early for prep day" },
  { id: "2", name: "Chef Justin De Leon", role: "chef", origin: "Los Angeles, CA", flightStatus: "booked", flightDetails: "Southwest WN 3847 · May 21 2:00PM PDT → 3:10PM PDT", arrivalDate: "2026-05-21", departureDate: "2026-05-24", lodgingStatus: "confirmed", lodgingDetails: "The Venetian — Suite 2206", groundTransport: "Driving from LA", notes: "Bringing own knife kit" },
  { id: "3", name: "Chef Aaron Verzosa", role: "chef", origin: "Seattle, WA", flightStatus: "booked", flightDetails: "Delta DL 1893 · May 21 6:00AM PDT → 8:25AM PDT", arrivalDate: "2026-05-21", departureDate: "2026-05-24", lodgingStatus: "confirmed", lodgingDetails: "The Venetian — Suite 2208", groundTransport: "Shuttle from LAS", notes: "" },
  { id: "4", name: "Chef Cristina Martinez", role: "chef", origin: "Philadelphia, PA", flightStatus: "pending", flightDetails: "TBD — Waiting on confirmation", arrivalDate: "2026-05-21", departureDate: "2026-05-24", lodgingStatus: "pending", lodgingDetails: "The Venetian — room TBD", groundTransport: "Shuttle from LAS", notes: "Needs passport info for booking" },
  { id: "5", name: "Chef Lord Maynard", role: "chef", origin: "New York, NY", flightStatus: "pending", flightDetails: "TBD — Multiple options quoted", arrivalDate: "2026-05-21", departureDate: "2026-05-24", lodgingStatus: "pending", lodgingDetails: "The Venetian — room TBD", groundTransport: "Shuttle from LAS", notes: "" },
  { id: "6", name: "Chef Rachel Yang", role: "chef", origin: "Seattle, WA", flightStatus: "needs-booking", flightDetails: "Not yet started", arrivalDate: "2026-05-21", departureDate: "2026-05-24", lodgingStatus: "needs-booking", lodgingDetails: "Not yet assigned", groundTransport: "TBD", notes: "Awaiting schedule confirmation" },
  { id: "7", name: "Chef Dio Buan", role: "chef", origin: "Las Vegas, NV", flightStatus: "booked", flightDetails: "Local — No flight needed", arrivalDate: "2026-05-22", departureDate: "2026-05-22", lodgingStatus: "confirmed", lodgingDetails: "Local — No lodging needed", groundTransport: "Self-driving", notes: "Host chef, arrives morning of" },
  { id: "8", name: "Walbert", role: "team", origin: "Las Vegas, NV", flightStatus: "booked", flightDetails: "Local — No flight needed", arrivalDate: "2026-05-20", departureDate: "2026-05-25", lodgingStatus: "confirmed", lodgingDetails: "Home base", groundTransport: "Personal vehicle", notes: "On-site from May 20 for setup" },
  { id: "9", name: "Kara", role: "team", origin: "Las Vegas, NV", flightStatus: "booked", flightDetails: "Local — No flight needed", arrivalDate: "2026-05-21", departureDate: "2026-05-23", lodgingStatus: "confirmed", lodgingDetails: "Home base", groundTransport: "Personal vehicle", notes: "Marketing & social media" },
  { id: "10", name: "JJ", role: "team", origin: "San Francisco, CA", flightStatus: "pending", flightDetails: "TBD — Spirit or Southwest", arrivalDate: "2026-05-20", departureDate: "2026-05-24", lodgingStatus: "pending", lodgingDetails: "The Venetian or Airbnb", groundTransport: "Shuttle from LAS", notes: "Research lead" },
];

const flightStatusCfg = {
  booked: { label: "Booked", color: "#2D5F2D", bg: "rgba(45,95,45,0.08)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  "needs-booking": { label: "Needs Booking", color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: AlertCircle },
};

const lodgingStatusCfg = {
  confirmed: { label: "Confirmed", color: "#2D5F2D", bg: "rgba(45,95,45,0.08)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  "needs-booking": { label: "Needs Booking", color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: AlertCircle },
};

interface TravelLodgingProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function TravelLodging({ role, onNavigate }: TravelLodgingProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filterRole, setFilterRole] = useState<"all" | "chef" | "team" | "guest">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filterRole === "all"
    ? travelRecords
    : travelRecords.filter((r) => r.role === filterRole);

  const chefCount = travelRecords.filter((r) => r.role === "chef").length;
  const teamCount = travelRecords.filter((r) => r.role === "team").length;
  const flightsBooked = travelRecords.filter((r) => r.flightStatus === "booked").length;
  const lodgingConfirmed = travelRecords.filter((r) => r.lodgingStatus === "confirmed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-5 h-5" style={{ color: "#6B9EC2" }} />
              <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
                Travel & Lodging
              </h2>
            </div>
            <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
              Track flights, accommodations, and ground transport for all participants.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-card rounded-lg p-0.5" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] cursor-pointer transition-colors"
              style={{
                backgroundColor: viewMode === "grid" ? "rgba(107,158,194,0.08)" : "rgba(0,0,0,0)",
                color: viewMode === "grid" ? "#6B9EC2" : "var(--muted-foreground)",
                ...bodyFont,
              }}
            >
              <Map className="w-3.5 h-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] cursor-pointer transition-colors"
              style={{
                backgroundColor: viewMode === "list" ? "rgba(107,158,194,0.08)" : "rgba(0,0,0,0)",
                color: viewMode === "list" ? "#6B9EC2" : "var(--muted-foreground)",
                ...bodyFont,
              }}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <ChefHat className="w-3.5 h-3.5" style={{ color: "#8AAD84" }} />
          <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{chefCount} chefs</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <Users className="w-3.5 h-3.5" style={{ color: "#6B9EC2" }} />
          <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{teamCount} team</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <Plane className="w-3.5 h-3.5" style={{ color: "#D4B896" }} />
          <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{flightsBooked}/{travelRecords.length} flights booked</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <Hotel className="w-3.5 h-3.5" style={{ color: "#CEB47A" }} />
          <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{lodgingConfirmed}/{travelRecords.length} lodging confirmed</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {([
          { id: "all" as const, label: "All", count: travelRecords.length },
          { id: "chef" as const, label: "Chefs", count: chefCount },
          { id: "team" as const, label: "Team", count: teamCount },
        ]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterRole(f.id)}
            className="px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-all"
            style={{
              ...bodyFont,
              backgroundColor: filterRole === f.id ? "rgba(107,158,194,0.1)" : "transparent",
              color: filterRole === f.id ? "#6B9EC2" : "#8A857F",
              border: filterRole === f.id ? "1px solid rgba(107,158,194,0.25)" : "1px solid rgba(0,0,0,0.06)",
              fontWeight: filterRole === f.id ? 600 : 400,
            }}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>Overall Travel Readiness</span>
          <span className="text-[0.8125rem] font-semibold" style={{ ...bodyFont, color: "#C9A96E" }}>
            {Math.round(((flightsBooked + lodgingConfirmed) / (travelRecords.length * 2)) * 100)}%
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(221,207,195,0.4)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(((flightsBooked + lodgingConfirmed) / (travelRecords.length * 2)) * 100)}%`,
              background: "linear-gradient(90deg, #6B9EC2, #4A7FB5)",
            }}
          />
        </div>
      </div>

      {/* Travel grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((record, idx) => {
            const fCfg = flightStatusCfg[record.flightStatus];
            const lCfg = lodgingStatusCfg[record.lodgingStatus];
            const FlightIcon = fCfg.icon;
            const LodgingIcon = lCfg.icon;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[0.9375rem] text-foreground" style={headingFont}>
                        {record.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground" style={bodyFont}>
                        <MapPin className="w-3 h-3" />
                        {record.origin}
                      </div>
                    </div>
                    <span
                      className="text-[0.5625rem] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                      style={{
                        backgroundColor: record.role === "chef" ? "rgba(201,169,110,0.1)" : "rgba(107,158,194,0.1)",
                        color: record.role === "chef" ? "#C9A96E" : "#6B9EC2",
                        ...bodyFont,
                      }}
                    >
                      {record.role}
                    </span>
                  </div>

                  {/* Flight */}
                  <div className="flex items-start gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: fCfg.bg }}>
                    <FlightIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: fCfg.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.6875rem] font-medium block" style={{ ...bodyFont, color: fCfg.color }}>
                        Flight: {fCfg.label}
                      </span>
                      <span className="text-[0.625rem] text-muted-foreground block truncate" style={bodyFont}>
                        {record.flightDetails}
                      </span>
                    </div>
                  </div>

                  {/* Lodging */}
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: lCfg.bg }}>
                    <LodgingIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: lCfg.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.6875rem] font-medium block" style={{ ...bodyFont, color: lCfg.color }}>
                        Lodging: {lCfg.label}
                      </span>
                      <span className="text-[0.625rem] text-muted-foreground block truncate" style={bodyFont}>
                        {record.lodgingDetails}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-3 mt-2 text-[0.625rem] text-muted-foreground" style={bodyFont}>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      Arr: {record.arrivalDate}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      Dep: {record.departureDate}
                    </div>
                  </div>

                  {record.notes && (
                    <p className="text-[0.625rem] text-muted-foreground/60 mt-2 italic" style={bodyFont}>
                      {record.notes}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {filtered.map((record, idx) => {
            const fCfg = flightStatusCfg[record.flightStatus];
            const lCfg = lodgingStatusCfg[record.lodgingStatus];
            const isExpanded = expandedId === record.id;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.875rem] font-medium block" style={{ ...bodyFont, color: "var(--foreground)" }}>
                      {record.name}
                    </span>
                    <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                      {record.origin}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: fCfg.bg, color: fCfg.color, ...bodyFont }}>
                      {fCfg.label}
                    </span>
                    <span className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: lCfg.bg, color: lCfg.color, ...bodyFont }}>
                      {lCfg.label}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                        <div className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--foreground)" }}>
                          <strong>Flight:</strong> {record.flightDetails}
                        </div>
                        <div className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--foreground)" }}>
                          <strong>Lodging:</strong> {record.lodgingDetails}
                        </div>
                        <div className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--foreground)" }}>
                          <strong>Ground:</strong> {record.groundTransport}
                        </div>
                        <div className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
                          {record.arrivalDate} → {record.departureDate}
                        </div>
                        {record.notes && (
                          <p className="text-[0.6875rem] text-muted-foreground/60 italic" style={bodyFont}>
                            {record.notes}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
