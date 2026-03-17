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
import { bodyFont, headingFont } from "../../lib/fonts";

interface RoleWelcomeProps {
  viewMode: ViewMode;
}

const roleConfig = {
  leadership: {
    icon: Shield,
    greeting: "Command Center",
    subtitle: "Full operational oversight",
    color: "#CBA47A",
    gradientFrom: "rgba(203,164,122,0.08)",
    gradientTo: "rgba(192,142,126,0.03)",
    border: "rgba(203,164,122,0.12)",
    accentIcon: TrendingUp,
    label: "Manager",
  },
  team: {
    icon: Users,
    greeting: "Team Hub",
    subtitle: "Your tasks and coordination",
    color: "#9FB0D4",
    gradientFrom: "rgba(159,176,212,0.08)",
    gradientTo: "rgba(159,176,212,0.02)",
    border: "rgba(159,176,212,0.12)",
    accentIcon: Sparkles,
    label: "Team",
  },
  chef: {
    icon: ChefHat,
    greeting: "Creative Space",
    subtitle: "Your culinary journey awaits",
    color: "#8AAD84",
    gradientFrom: "rgba(138,173,132,0.08)",
    gradientTo: "rgba(138,173,132,0.02)",
    border: "rgba(138,173,132,0.12)",
    accentIcon: Heart,
    label: "Chef",
  },
};

export function RoleWelcome({ viewMode }: RoleWelcomeProps) {
  const { profile } = useProfile();
  const config = roleConfig[viewMode];
  const Icon = config.icon;
  const AccentIcon = config.accentIcon;

  const firstName = profile?.displayName?.split(" ")[0] || "there";

  // Time-based greeting
  const hour = new Date().getHours();
  let timeGreeting: string;

  if (hour >= 5 && hour < 12) {
    timeGreeting = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = "Good afternoon";
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = "Good evening";
  } else {
    timeGreeting = "Working late";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
        border: `1px solid ${config.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
      }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${config.color}06 0%, transparent 50%)`,
        }}
      />

      <div className="flex items-center gap-3 relative min-w-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${config.color}18, ${config.color}0A)`,
            border: `1px solid ${config.color}20`,
            boxShadow: `0 2px 8px ${config.color}10`,
          }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: config.color }} />
        </motion.div>
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-foreground text-[0.875rem] sm:text-[0.9375rem] truncate"
            style={bodyFont}
          >
            {timeGreeting},{" "}
            <span className="font-semibold" style={headingFont}>
              {firstName}
            </span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 }}
            className="text-muted-foreground text-[0.6875rem] sm:text-[0.75rem] mt-0.5 flex items-center gap-1.5 truncate"
            style={bodyFont}
          >
            <AccentIcon className="w-3 h-3 inline shrink-0" style={{ color: config.color }} />
            <span className="hidden sm:inline">{config.greeting} &mdash; </span>
            {config.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Role indicator pill */}
      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        className="hidden sm:flex items-center gap-1.5 text-[0.625rem] px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0"
        style={{
          backgroundColor: `${config.color}10`,
          color: config.color,
          border: `1px solid ${config.color}20`,
          ...bodyFont,
          fontWeight: 500,
          letterSpacing: "0.08em",
        }}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </motion.span>
    </motion.div>
  );
}
