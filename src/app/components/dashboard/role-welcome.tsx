import { motion } from "motion/react";
import {
  Shield,
  Users,
  ChefHat,
  Sparkles,
  TrendingUp,
  Heart,
} from "lucide-react";
import type { ViewMode } from "../onboarding/use-auth";
import { useProfile } from "../../lib/profile-context";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface RoleWelcomeProps {
  viewMode: ViewMode;
}

const roleConfig = {
  leadership: {
    icon: Shield,
    greeting: "Command Center",
    subtitle: "68 days to event night",
    color: "#C9A96E",
    bg: "rgba(201,169,110,0.05)",
    border: "rgba(201,169,110,0.10)",
    accentIcon: TrendingUp,
  },
  team: {
    icon: Users,
    greeting: "Team Hub",
    subtitle: "Your tasks and coordination",
    color: "#6B9EC2",
    bg: "rgba(107,158,194,0.05)",
    border: "rgba(107,158,194,0.10)",
    accentIcon: Sparkles,
  },
  chef: {
    icon: ChefHat,
    greeting: "Creative Space",
    subtitle: "Your culinary journey starts here",
    color: "#8AAD84",
    bg: "rgba(138,173,132,0.05)",
    border: "rgba(138,173,132,0.10)",
    accentIcon: Heart,
  },
};

export function RoleWelcome({ viewMode }: RoleWelcomeProps) {
  const { profile } = useProfile();
  const config = roleConfig[viewMode];
  const Icon = config.icon;
  const AccentIcon = config.accentIcon;

  const firstName = profile?.displayName?.split(" ")[0] || "there";

  // Time-based greeting with icon
  const hour = new Date().getHours();
  let timeGreeting: string;
  let timeEmoji: string;
  
  if (hour >= 5 && hour < 12) {
    timeGreeting = "Good morning";
    timeEmoji = "☀️";
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
    timeEmoji = "🌤";
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = "Good evening";
    timeEmoji = "🌙";
  } else {
    timeGreeting = "Working late";
    timeEmoji = "🌙";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl"
      style={{
        background: `linear-gradient(135deg, ${config.bg}, rgba(255,255,255,0.4))`,
        border: `1px solid ${config.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color: config.color }} />
        </div>
        <div className="min-w-0">
          <p
            className="text-foreground text-[0.8125rem] sm:text-[0.875rem] truncate"
            style={bodyFont}
          >
            <span className="mr-1.5">{timeEmoji}</span>
            {timeGreeting}, <span className="font-medium">{firstName}</span>
          </p>
          <p
            className="text-muted-foreground text-[0.625rem] sm:text-[0.6875rem] mt-0.5 flex items-center gap-1.5 truncate"
            style={bodyFont}
          >
            <AccentIcon className="w-3 h-3 inline shrink-0" style={{ color: config.color }} />
            <span className="hidden sm:inline">{config.greeting} — </span>{config.subtitle}
          </p>
        </div>
      </div>

      {/* Role indicator pill */}
      <span
        className="hidden sm:flex items-center gap-1.5 text-[0.625rem] px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0"
        style={{
          backgroundColor: `${config.color}12`,
          color: config.color,
          border: `1px solid ${config.color}25`,
          ...bodyFont,
        }}
      >
        <Icon className="w-3 h-3" />
        {viewMode === "leadership"
          ? "Manager"
          : viewMode === "team"
            ? "Team"
            : "Chef"}
      </span>
    </motion.div>
  );
}