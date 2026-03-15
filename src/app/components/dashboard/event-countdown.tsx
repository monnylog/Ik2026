import { motion } from "motion/react";
import {
  Calendar,
  MapPin,
  UtensilsCrossed,
  Users,
  Plane,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";
import { useProfile } from "../../lib/profile-context";
import { getConfirmedChef } from "../onboarding/chef-directory";
import { ImageWithFallback } from "../figma/ImageWithFallback";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const EVENT_DATE = new Date("2026-05-22");
const KICKOFF = new Date("2026-01-15");

// Use a project-aware date that always shows 2026 regardless of sandbox clock
function getProjectNow() {
  const now = new Date();
  // Construct a fresh date with 2026 to avoid any mutation issues
  return new Date(2026, now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());
}

const BANANA_LEAF_URL =
  "https://images.unsplash.com/photo-1768104177012-fb8eb9b1b8f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXJrJTIwcm9jayUyMHN0b25lJTIwdGV4dHVyZSUyMGNsb3NldXB8ZW58MXx8fHwxNzczNDc3MjI2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

function getLiveDays() {
  const now = getProjectNow();
  const daysUntil = Math.ceil(
    (EVENT_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalSpan = Math.ceil(
    (EVENT_DATE.getTime() - KICKOFF.getTime()) / (1000 * 60 * 60 * 24)
  );
  return { daysUntil: Math.max(0, daysUntil), totalSpan };
}

const quickLinks = [
  { icon: CalendarDays, label: "Event Timeline", page: "Event Timeline", color: "#A9BE95" },
  { icon: Users, label: "Chef Roster", page: "Chef Roster", color: "#C0D1B1" },
  { icon: UtensilsCrossed, label: "Menu & Courses", page: "Menu & Courses", color: "#CDA88A" },
  { icon: Plane, label: "Travel", page: "Travel & Lodging", color: "#A9BE95" },
];

interface EventCountdownProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function EventCountdown({ role, onNavigate }: EventCountdownProps) {
  const { profile } = useProfile();
  const confirmedChef = profile?.chefDirectoryId
    ? getConfirmedChef(profile.chefDirectoryId)
    : null;
  const { daysUntil, totalSpan } = getLiveDays();
  const progress = Math.round(((totalSpan - daysUntil) / totalSpan) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1A2F23 0%, #243D2E 30%, #2D4A35 55%, #1E332A 80%, #141F1A 100%)",
        border: "1px solid rgba(201,169,110,0.12)",
        boxShadow: "0 4px 24px rgba(20,31,26,0.25), 0 1px 6px rgba(0,0,0,0.08)",
      }}
    >
      {/* Rock/stone texture overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <ImageWithFallback
          src={BANANA_LEAF_URL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          width={800}
          height={400}
          loading="lazy"
          style={{ opacity: 0.08, mixBlendMode: "luminosity", filter: "contrast(1.2)" }}
        />
        {/* Dark gradient to ensure text readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(26,47,35,0.7) 0%, rgba(36,61,46,0.4) 40%, rgba(30,51,42,0.5) 100%)",
          }}
        />
      </div>

      <div className="relative px-6 py-6 sm:px-8 sm:py-7">
        {/* Top section — greeting + countdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Calendar className="w-4 h-4" style={{ color: "#CDA88A" }} />
              <span
                className="text-[0.6875rem] uppercase tracking-[0.2em]"
                style={{ color: "rgba(205,168,138,0.85)", ...bodyFont }}
              >
                Isang Kusina 2026
              </span>
            </div>
            <h2
              className="mb-1.5"
              style={{
                ...headingFont,
                fontSize: "1.5rem",
                lineHeight: 1.2,
                color: "#E8EDE3",
              }}
            >
              {confirmedChef
                ? `Welcome, Chef ${confirmedChef.name.split(" ")[0]}`
                : role === "chef"
                  ? "Welcome, Chef"
                  : "Event Overview"}
            </h2>
            <div
              className="flex items-center gap-3 text-[0.8125rem]"
              style={{ color: "rgba(192,209,177,0.65)", ...bodyFont }}
            >
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                Las Vegas, NV
              </div>
              <span style={{ color: "rgba(192,209,177,0.25)" }}>·</span>
              <span>May 22, 2026</span>
            </div>
            {/* Tagline */}
            <p
              className="text-[0.75rem] italic mt-1.5 max-w-[22rem] leading-relaxed"
              style={{ color: "rgba(201,169,110,0.7)", ...bodyFont }}
            >
              A Filipino-American dining experience honoring Filipino foodways
            </p>
            {/* Today's date pill */}
            <div
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.625rem]"
              style={{
                backgroundColor: "rgba(192,209,177,0.08)",
                border: "1px solid rgba(192,209,177,0.12)",
                color: "rgba(192,209,177,0.55)",
                ...bodyFont,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "rgba(205,168,138,0.6)" }} />
              Today: {getProjectNow().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>

          {/* Big countdown */}
          <div className="flex items-baseline gap-2">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              style={{
                ...headingFont,
                fontSize: "3.5rem",
                lineHeight: 1,
                color: "#E8EDE3",
              }}
            >
              {daysUntil}
            </motion.span>
            <span
              className="text-[0.875rem] uppercase tracking-wider"
              style={{ color: "rgba(205,168,138,0.9)", ...bodyFont }}
            >
              days
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span
              className="text-[0.6875rem] uppercase tracking-wider"
              style={{ color: "rgba(192,209,177,0.45)", ...bodyFont }}
            >
              Progress
            </span>
            <span
              className="text-[0.8125rem]"
              style={{ color: "#CDA88A", ...headingFont }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-visible relative"
            style={{ backgroundColor: "rgba(192,209,177,0.1)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full relative"
              style={{
                background: "linear-gradient(90deg, #7E9E78, #A3B898)",
              }}
            >
              {/* Pulsing tip dot */}
              <span
                className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ik26-progress-dot"
                style={{ backgroundColor: "#CDA88A" }}
              />
            </motion.div>
          </div>
        </div>

        {/* Quick-link grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.06 }}
                whileHover={{ y: -2 }}
                onClick={() => onNavigate?.(link.page)}
                className="group flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: "rgba(192,209,177,0.06)",
                  border: "1px solid rgba(192,209,177,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(192,209,177,0.12)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(192,209,177,0.18)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(192,209,177,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor =
                    "rgba(192,209,177,0.08)";
                }}
              >
                <Icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: link.color }}
                />
                <span
                  className="text-[0.75rem] truncate flex-1 text-left"
                  style={{ color: "rgba(232,237,227,0.85)", ...bodyFont }}
                >
                  {link.label}
                </span>
                <ChevronRight
                  className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "rgba(192,209,177,0.4)" }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}