import { motion } from "motion/react";
import { MapPin, Plane, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { bodyFont, headingFont } from "../lib/fonts";

interface TravelerOrigin {
  name: string;
  origin: string;
  lat: number;
  lng: number;
  flightStatus: "booked" | "pending" | "needs-booking";
  arrivalDate: string;
  type: "chef" | "team";
}

const travelers: TravelerOrigin[] = [
  { name: "Chef Dio Buan", origin: "Las Vegas, NV", lat: 36.17, lng: -115.14, flightStatus: "booked", arrivalDate: "May 19", type: "chef" },
  { name: "Chef Rachel Barril", origin: "Anchorage, AK", lat: 61.22, lng: -149.9, flightStatus: "booked", arrivalDate: "May 19", type: "chef" },
  { name: "Chef Justin Barnes", origin: "Honolulu, HI", lat: 21.31, lng: -157.86, flightStatus: "pending", arrivalDate: "May 19", type: "chef" },
  { name: "Chef Patrice Cleary", origin: "Washington D.C.", lat: 38.91, lng: -77.04, flightStatus: "booked", arrivalDate: "May 19", type: "chef" },
  { name: "Chef Aaron Versoza", origin: "Seattle, WA", lat: 47.61, lng: -122.33, flightStatus: "booked", arrivalDate: "May 19", type: "chef" },
  { name: "Chef Christina Q.", origin: "New Orleans, LA", lat: 29.95, lng: -90.07, flightStatus: "needs-booking", arrivalDate: "May 19", type: "chef" },
  { name: "Chef Lord Maynard", origin: "Los Angeles, CA", lat: 34.05, lng: -118.24, flightStatus: "booked", arrivalDate: "May 20", type: "chef" },
  { name: "Ana Cruz", origin: "Los Angeles, CA", lat: 34.05, lng: -118.24, flightStatus: "pending", arrivalDate: "May 18", type: "team" },
];

const LAS_VEGAS = { lat: 36.17, lng: -115.14 };

const statusConfig = {
  booked: { color: "#7E9E78", bg: "rgba(126,158,120,0.1)", label: "Booked", icon: CheckCircle2 },
  pending: { color: "#C49370", bg: "rgba(196,147,112,0.1)", label: "Pending", icon: Clock },
  "needs-booking": { color: "#C75B3F", bg: "rgba(199,91,63,0.1)", label: "Needs Booking", icon: AlertCircle },
};

// Convert lat/lng to SVG viewBox coordinates (simplified US projection)
function project(lat: number, lng: number): { x: number; y: number } {
  // Simple Mercator-like for continental US + HI + AK
  const x = ((lng + 180) / 360) * 800;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

function daysUntilArrival(arrivalDate: string): number {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [mon, day] = arrivalDate.split(" ");
  const arrival = new Date(2026, months[mon], parseInt(day));
  const today = new Date(2026, 2, 11); // Mar 11, 2026
  return Math.ceil((arrival.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function TravelMapView() {
  const lasVegasPos = project(LAS_VEGAS.lat, LAS_VEGAS.lng);

  const booked = travelers.filter((t) => t.flightStatus === "booked").length;
  const pending = travelers.filter((t) => t.flightStatus === "pending").length;
  const needsBooking = travelers.filter((t) => t.flightStatus === "needs-booking").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-gold" />
          <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Travel Origins</h3>
        </div>
        <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
          Where everyone is traveling from to Las Vegas
        </p>
      </div>

      {/* Map visualization */}
      <div className="relative px-4 py-6" style={{ backgroundColor: "rgba(221,207,195,0.08)" }}>
        <svg viewBox="40 60 380 220" className="w-full h-auto" style={{ maxHeight: 280 }}>
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(221,207,195,0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="800" height="500" fill="url(#grid)" />

          {/* Flight lines to Las Vegas */}
          {travelers.map((t) => {
            const pos = project(t.lat, t.lng);
            const cfg = statusConfig[t.flightStatus];
            if (t.origin === "Las Vegas, NV") return null;
            return (
              <line
                key={`line-${t.name}`}
                x1={pos.x}
                y1={pos.y}
                x2={lasVegasPos.x}
                y2={lasVegasPos.y}
                stroke={cfg.color}
                strokeWidth="1"
                strokeDasharray={t.flightStatus === "needs-booking" ? "4 3" : t.flightStatus === "pending" ? "6 3" : "none"}
                opacity={0.4}
              />
            );
          })}

          {/* Las Vegas destination star */}
          <circle cx={lasVegasPos.x} cy={lasVegasPos.y} r="8" fill="#D4A843" opacity="0.2" />
          <circle cx={lasVegasPos.x} cy={lasVegasPos.y} r="5" fill="#D4A843" />
          <text x={lasVegasPos.x} y={lasVegasPos.y + 16} textAnchor="middle" fontSize="7" fill="#D4A843" fontWeight="600" fontFamily="'Inter', sans-serif">
            LAS VEGAS
          </text>

          {/* Traveler dots */}
          {travelers.map((t) => {
            const pos = project(t.lat, t.lng);
            const cfg = statusConfig[t.flightStatus];
            if (t.origin === "Las Vegas, NV") return null;
            return (
              <g key={`dot-${t.name}`}>
                <circle cx={pos.x} cy={pos.y} r="5" fill={cfg.color} opacity="0.15" />
                <circle cx={pos.x} cy={pos.y} r="3" fill={cfg.color} />
                <text x={pos.x} y={pos.y - 7} textAnchor="middle" fontSize="5.5" fill="var(--foreground)" fontFamily="'Inter', sans-serif" fontWeight="500">
                  {t.name.replace("Chef ", "").split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend + traveler list */}
      <div className="px-5 py-4 border-t border-border">
        {/* Status legend */}
        <div className="flex items-center gap-4 mb-4">
          {([
            { status: "booked" as const, count: booked },
            { status: "pending" as const, count: pending },
            { status: "needs-booking" as const, count: needsBooking },
          ]).map(({ status, count }) => {
            const cfg = statusConfig[status];
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                <span className="text-[0.6875rem]" style={{ color: cfg.color, ...bodyFont }}>{count} {cfg.label}</span>
              </div>
            );
          })}
        </div>

        {/* Compact traveler cards with countdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {travelers.filter((t) => t.origin !== "Las Vegas, NV").map((t) => {
            const cfg = statusConfig[t.flightStatus];
            const StatusIcon = cfg.icon;
            const countdown = daysUntilArrival(t.arrivalDate);
            return (
              <div
                key={t.name}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}15` }}
              >
                <StatusIcon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[0.75rem] text-foreground truncate block" style={bodyFont}>{t.name}</span>
                  <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>{t.origin}</span>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[0.6875rem]" style={{ color: cfg.color, ...bodyFont }}>{t.arrivalDate}</span>
                  <span className="text-[0.5625rem] text-muted-foreground" style={bodyFont}>{countdown}d away</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}