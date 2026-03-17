import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Users,
  MessageCircle,
  CalendarDays,
  Plane,
  Link2,
  Heart,
} from "lucide-react";
import { useUserData } from "../../lib/use-user-data";
import { bodyFont, headingFont } from "../../lib/fonts";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: typeof Users;
  iconColor: string;
  iconBg: string;
  navigateTo?: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "comms",
    title: "Introduce yourself in Comms",
    description: "Say hello and share your role with the team",
    icon: MessageCircle,
    iconColor: "#1A5C38",
    iconBg: "rgba(26,92,56,0.08)",
    navigateTo: "Comms",
  },
  {
    id: "timeline",
    title: "Review the Event Timeline",
    description: "Get familiar with key milestones and deadlines",
    icon: CalendarDays,
    iconColor: "#6B7F8E",
    iconBg: "rgba(107,127,142,0.08)",
    navigateTo: "Event Timeline",
  },
  {
    id: "roster",
    title: "Meet the Chef Roster",
    description: "Learn about the 7 chefs and their assigned courses",
    icon: Users,
    iconColor: "#7E9E78",
    iconBg: "rgba(126,158,120,0.08)",
    navigateTo: "Chef Roster",
  },
  {
    id: "travel",
    title: "Check Travel & Lodging logistics",
    description: "Understand travel arrangements and venue details",
    icon: Plane,
    iconColor: "#4A7FB5",
    iconBg: "rgba(74,127,181,0.08)",
    navigateTo: "Travel & Lodging",
  },
  {
    id: "community",
    title: "Explore the Community space",
    description: "Discover the cultural heart of Isang Kusina",
    icon: Heart,
    iconColor: "#CDA88A",
    iconBg: "rgba(205,168,138,0.08)",
    navigateTo: "Community",
  },
  {
    id: "resources",
    title: "Bookmark key Links & Resources",
    description: "Save important docs and shared drives",
    icon: Link2,
    iconColor: "#506870",
    iconBg: "rgba(80,104,112,0.08)",
    navigateTo: "Links & Resources",
  },
];

interface TeamChecklistProps {
  onNavigate: (page: string) => void;
}

export function TeamChecklist({ onNavigate }: TeamChecklistProps) {
  // Persist completed checklist items to KV for cross-device sync
  const [completedIds, setCompletedIds] = useUserData<string[]>("team-checklist-done", []);
  const [dismissed, setDismissed] = useState(false);

  const completedCount = completedIds.length;
  const allDone = completedCount === checklistItems.length;

  if (dismissed) return null;

  const toggleItem = (id: string) => {
    setCompletedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-card rounded-2xl border overflow-hidden"
      style={{ borderColor: "rgba(74,127,181,0.2)" }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(74,127,181,0.06) 0%, rgba(126,158,120,0.04) 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(74,127,181,0.12)" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#4A7FB5" }} />
            </div>
            <div>
              <h3
                className="text-foreground text-[1rem]"
                style={headingFont}
              >
                Getting Started
              </h3>
              <p
                className="text-muted-foreground text-[0.6875rem] mt-0.5"
                style={bodyFont}
              >
                {allDone
                  ? "You're all set! Welcome aboard."
                  : `${completedCount}/${checklistItems.length} steps completed`}
              </p>
            </div>
          </div>

          {allDone && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDismissed(true)}
              className="text-[0.6875rem] px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
              style={{
                backgroundColor: "rgba(126,158,120,0.1)",
                color: "#7E9E78",
                border: "1px solid rgba(126,158,120,0.2)",
                ...bodyFont,
              }}
            >
              Dismiss
            </motion.button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(96,108,56,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "#4A7FB5" }}
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Checklist items */}
      <div className="px-5 pb-4 pt-2 space-y-1">
        {checklistItems.map((item, idx) => {
          const Icon = item.icon;
          const isDone = completedIds.includes(item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx }}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                isDone ? "opacity-60" : "hover:bg-secondary/50"
              }`}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="mt-0.5 shrink-0 cursor-pointer"
              >
                {isDone ? (
                  <CheckCircle2
                    className="w-4.5 h-4.5"
                    style={{ color: "#7E9E78" }}
                  />
                ) : (
                  <Circle
                    className="w-4.5 h-4.5 text-muted-foreground/40 group-hover:text-gold transition-colors"
                  />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <button
                  onClick={() => {
                    if (item.navigateTo) {
                      toggleItem(item.id);
                      onNavigate(item.navigateTo);
                    } else {
                      toggleItem(item.id);
                    }
                  }}
                  className="text-left cursor-pointer w-full"
                >
                  <span
                    className={`text-[0.8125rem] block leading-snug ${
                      isDone
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                    style={bodyFont}
                  >
                    {item.title}
                  </span>
                  {!isDone && (
                    <span
                      className="text-muted-foreground text-[0.6875rem] mt-0.5 block"
                      style={bodyFont}
                    >
                      {item.description}
                    </span>
                  )}
                </button>
              </div>

              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: item.iconBg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: item.iconColor }} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}