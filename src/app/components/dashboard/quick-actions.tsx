import { motion } from "motion/react";
import {
  Plane,
  UtensilsCrossed,
  MessageCircle,
  Users,
  DollarSign,
  CalendarDays,
  BookOpen,
  ClipboardList,
  ExternalLink,
  UserCheck,
  Share2,
  Presentation,
  Wallet,
} from "lucide-react";
import type { UserRole } from "../onboarding/use-auth";

import { bodyFont, headingFont } from "../../lib/fonts";

interface QuickAction {
  label: string;
  icon: typeof Plane;
  color: string;
  bg: string;
  border: string;
  navigateTo?: string;
  externalUrl?: string;
  scrollTo?: string;
}

const leadershipActions: QuickAction[] = [
  {
    label: "Event Deck",
    icon: Presentation,
    color: "#C9A96E",
    bg: "rgba(201,169,110,0.04)",
    border: "rgba(201,169,110,0.12)",
    externalUrl: "https://www.canva.com/design/DAHDbuedjDg/5FyH2zp979AW7sdKx5BN_w/view?utm_content=DAHDbuedjDg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h376297da25",
  },
  {
    label: "Action Items",
    icon: ClipboardList,
    color: "#D0897A",
    bg: "rgba(208,137,122,0.04)",
    border: "rgba(208,137,122,0.12)",
    scrollTo: "action-needed-section",
  },
  {
    label: "Budget & COGS",
    icon: DollarSign,
    color: "#D4B896",
    bg: "rgba(212,184,150,0.04)",
    border: "rgba(212,184,150,0.12)",
    navigateTo: "Budget & COGS",
  },
  {
    label: "Team Deploy",
    icon: UserCheck,
    color: "#6B9EC2",
    bg: "rgba(107,158,194,0.04)",
    border: "rgba(107,158,194,0.12)",
    navigateTo: "Team Deploy",
  },
  {
    label: "Travel Status",
    icon: Plane,
    color: "#D4B896",
    bg: "rgba(212,184,150,0.04)",
    border: "rgba(212,184,150,0.12)",
    navigateTo: "Travel & Lodging",
  },
  {
    label: "Comms",
    icon: MessageCircle,
    color: "#5DA06B",
    bg: "rgba(93,160,107,0.04)",
    border: "rgba(93,160,107,0.12)",
    navigateTo: "Comms",
  },
  {
    label: "Reimburse",
    icon: Wallet,
    color: "#7E9E78",
    bg: "rgba(126,158,120,0.04)",
    border: "rgba(126,158,120,0.12)",
    navigateTo: "Reimbursements",
  },
  {
    label: "Timeline",
    icon: CalendarDays,
    color: "#8899A6",
    bg: "rgba(136,153,166,0.04)",
    border: "rgba(136,153,166,0.12)",
    navigateTo: "Event Timeline",
  },
  {
    label: "Share & Invite",
    icon: Share2,
    color: "#C49370",
    bg: "rgba(196,147,112,0.04)",
    border: "rgba(196,147,112,0.12)",
    navigateTo: "Share Invite",
  },
];

const chefActions: QuickAction[] = [
  {
    label: "Submit Menu",
    icon: UtensilsCrossed,
    color: "#D4B896",
    bg: "rgba(212,184,150,0.04)",
    border: "rgba(212,184,150,0.12)",
    navigateTo: "Submit Menu",
  },
  {
    label: "Ingredients",
    icon: ClipboardList,
    color: "#8AAD84",
    bg: "rgba(138,173,132,0.04)",
    border: "rgba(138,173,132,0.12)",
    navigateTo: "Menu & Courses",
  },
  {
    label: "Message Team",
    icon: MessageCircle,
    color: "#5DA06B",
    bg: "rgba(93,160,107,0.04)",
    border: "rgba(93,160,107,0.12)",
    navigateTo: "Comms",
  },
  {
    label: "Research POC",
    icon: BookOpen,
    color: "#8899A6",
    bg: "rgba(136,153,166,0.04)",
    border: "rgba(136,153,166,0.12)",
    navigateTo: "Comms",
  },
  {
    label: "My Travel",
    icon: Plane,
    color: "#6B9EC2",
    bg: "rgba(107,158,194,0.04)",
    border: "rgba(107,158,194,0.12)",
    navigateTo: "Travel & Lodging",
  },
  {
    label: "Forms",
    icon: ClipboardList,
    color: "#6B7F8E",
    bg: "rgba(107,127,142,0.04)",
    border: "rgba(107,127,142,0.12)",
    navigateTo: "Forms & Agreements",
  },
  {
    label: "Timeline",
    icon: CalendarDays,
    color: "#7A8F9E",
    bg: "rgba(122,143,158,0.04)",
    border: "rgba(122,143,158,0.12)",
    navigateTo: "Event Timeline",
  },
  {
    label: "Share & Invite",
    icon: Share2,
    color: "#C49370",
    bg: "rgba(196,147,112,0.04)",
    border: "rgba(196,147,112,0.12)",
    navigateTo: "Share Invite",
  },
];

const teamActions: QuickAction[] = [
  {
    label: "My Tasks",
    icon: ClipboardList,
    color: "#6B9EC2",
    bg: "rgba(107,158,194,0.04)",
    border: "rgba(107,158,194,0.12)",
    scrollTo: "my-tasks-section",
  },
  {
    label: "Comms",
    icon: MessageCircle,
    color: "#5DA06B",
    bg: "rgba(93,160,107,0.04)",
    border: "rgba(93,160,107,0.12)",
    navigateTo: "Comms",
  },
  {
    label: "Timeline",
    icon: CalendarDays,
    color: "#8899A6",
    bg: "rgba(136,153,166,0.04)",
    border: "rgba(136,153,166,0.12)",
    navigateTo: "Event Timeline",
  },
  {
    label: "Chef Roster",
    icon: Users,
    color: "#8AAD84",
    bg: "rgba(138,173,132,0.04)",
    border: "rgba(138,173,132,0.12)",
    navigateTo: "Chef Roster",
  },
  {
    label: "Travel Status",
    icon: Plane,
    color: "#D4B896",
    bg: "rgba(212,184,150,0.04)",
    border: "rgba(212,184,150,0.12)",
    navigateTo: "Travel & Lodging",
  },
  {
    label: "Forms",
    icon: ClipboardList,
    color: "#6B7F8E",
    bg: "rgba(107,127,142,0.04)",
    border: "rgba(107,127,142,0.12)",
    navigateTo: "Forms & Agreements",
  },
  {
    label: "Team Deploy",
    icon: UserCheck,
    color: "#7A8F9E",
    bg: "rgba(122,143,158,0.04)",
    border: "rgba(122,143,158,0.12)",
    navigateTo: "Team Deploy",
  },
  {
    label: "Share & Invite",
    icon: Share2,
    color: "#C49370",
    bg: "rgba(196,147,112,0.04)",
    border: "rgba(196,147,112,0.12)",
    navigateTo: "Share Invite",
  },
];

interface QuickActionsProps {
  role: UserRole;
  onNavigate: (page: string) => void;
}

export function QuickActions({ role, onNavigate }: QuickActionsProps) {
  const actions =
    role === "leadership"
      ? leadershipActions
      : role === "team"
      ? teamActions
      : chefActions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {actions.map((action, idx) => {
        const Icon = action.icon;
        const isExternal = !!action.externalUrl;

        return (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + idx * 0.04 }}
            whileHover={{ 
              y: -3, 
              boxShadow: `0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px ${action.border}`,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (action.scrollTo) {
                const el = document.getElementById(action.scrollTo);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                return;
              }
              if (action.navigateTo) onNavigate(action.navigateTo);
              if (action.externalUrl) window.open(action.externalUrl, "_blank");
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer shrink-0"
            style={{
              backgroundColor: action.bg,
              border: `1px solid ${action.border}`,
            }}
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color: action.color }} />
            <span className="text-[0.8125rem] whitespace-nowrap" style={{ color: action.color, ...bodyFont }}>
              {action.label}
            </span>
            {isExternal && <ExternalLink className="w-3 h-3 shrink-0 opacity-40" style={{ color: action.color }} />}
          </motion.button>
        );
      })}
    </motion.div>
  );
}