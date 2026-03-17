import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FlaskConical,
  CheckCircle2,
  Circle,
  ChevronDown,
  Eye,
  ChefHat,
  UsersRound,
  Shield,
  FileText,
  MessageCircle,
  CalendarDays,
  UtensilsCrossed,
  Wallet,
  BookOpen,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import type { ViewMode } from "../onboarding/use-auth";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = {
  fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif",
};

const STORAGE_KEY = "ik26-prelaunch-checks";

interface CheckItem {
  id: string;
  label: string;
  hint: string;
  icon: typeof Eye;
  color: string;
  /** Which view mode to switch to for testing */
  testView?: ViewMode;
  /** Page to navigate to for verification */
  navigateTo?: string;
}

const checkItems: CheckItem[] = [
  {
    id: "leader-dash",
    label: "Leadership dashboard renders",
    hint: "Verify all widgets load: Analytics, Readiness, Activity Feed",
    icon: Shield,
    color: "#C9A96E",
    testView: "leadership",
    navigateTo: "Dashboard",
  },
  {
    id: "team-dash",
    label: "Team dashboard renders",
    hint: "Switch to Team view — check Welcome Tour, My Tasks, Checklist",
    icon: UsersRound,
    color: "#4A7FB5",
    testView: "team",
    navigateTo: "Dashboard",
  },
  {
    id: "chef-dash",
    label: "Chef dashboard renders",
    hint: "Switch to Chef view — check Progress Tracker, Timeline",
    icon: ChefHat,
    color: "#D4DCBA",
    testView: "chef",
    navigateTo: "Dashboard",
  },
  {
    id: "forms-load",
    label: "Forms & Agreements loads embedded forms",
    hint: "Open the page and verify iframes render (requires production URLs)",
    icon: FileText,
    color: "#CDA88A",
    navigateTo: "Forms & Agreements",
  },
  {
    id: "comms-send",
    label: "Comms — send & receive a test message",
    hint: "Open #general, type a message, confirm it appears in the feed",
    icon: MessageCircle,
    color: "#1A5C38",
    navigateTo: "Comms",
  },
  {
    id: "timeline-nav",
    label: "Event Timeline displays milestones",
    hint: "Verify milestone cards render with Google Calendar deep links",
    icon: CalendarDays,
    color: "#5DA06B",
    navigateTo: "Event Timeline",
  },
  {
    id: "menu-submit",
    label: "Menu & Courses — chef submission flow",
    hint: "In Chef view, submit a test dish and verify it in the pipeline",
    icon: UtensilsCrossed,
    color: "#C9A96E",
    testView: "chef",
    navigateTo: "Menu & Courses",
  },
  {
    id: "expense-create",
    label: "Expenses — create a test expense",
    hint: "Open Expenses, submit a sample entry with receipt upload",
    icon: Wallet,
    color: "#CDA88A",
    navigateTo: "Expenses",
  },
  {
    id: "research-map",
    label: "Research & Story — story map loads",
    hint: "Verify horizontal timeline, region cards, and filter pills render",
    icon: BookOpen,
    color: "#8B96C4",
    navigateTo: "Research & Story",
  },
  {
    id: "role-filter",
    label: "Role-based nav filtering works",
    hint: "In Chef view, confirm Budget, Finance, Mission Control are hidden",
    icon: ClipboardList,
    color: "#7E9E78",
    testView: "chef",
  },
];

interface PreLaunchChecklistProps {
  onNavigate: (page: string) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function PreLaunchChecklist({
  onNavigate,
  onViewModeChange,
}: PreLaunchChecklistProps) {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetAll = () => {
    setChecked({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const doneCount = checkItems.filter((c) => checked[c.id]).length;
  const percentage = Math.round((doneCount / checkItems.length) * 100);
  const allDone = doneCount === checkItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{
        border: allDone
          ? "1px solid rgba(126,158,120,0.25)"
          : "1px solid rgba(201,169,110,0.15)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 sm:px-5 py-4 flex items-center gap-2 cursor-pointer"
        style={{
          background: allDone
            ? "linear-gradient(135deg, rgba(126,158,120,0.06) 0%, rgba(126,158,120,0.02) 100%)"
            : "linear-gradient(135deg, rgba(201,169,110,0.04) 0%, rgba(205,168,138,0.02) 100%)",
        }}
      >
        <div
          className="w-1 h-5 rounded-full shrink-0"
          style={{
            backgroundColor: allDone ? "#7E9E78" : "#CDA88A",
          }}
        />
        <FlaskConical
          className="w-4 h-4 shrink-0"
          style={{ color: allDone ? "#7E9E78" : "#CDA88A" }}
        />
        <div className="flex-1 text-left">
          <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
            Pre-Launch Testing
          </h3>
          <p
            className="text-muted-foreground text-[0.6875rem]"
            style={bodyFont}
          >
            {allDone
              ? "All checks passed — ready to distribute access codes"
              : `${doneCount}/${checkItems.length} verified — test each role view before going live`}
          </p>
        </div>
        <span
          className="text-[0.6875rem] px-2.5 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: allDone
              ? "rgba(126,158,120,0.12)"
              : "rgba(205,168,138,0.12)",
            color: allDone ? "#7E9E78" : "#CDA88A",
            ...bodyFont,
          }}
        >
          {percentage}%
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground/40 shrink-0 transition-transform duration-200 ${
            expanded ? "" : "-rotate-90"
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Progress bar */}
            <div className="px-5 pt-2 pb-1">
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(201,169,110,0.06)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: allDone
                      ? "linear-gradient(90deg, #7E9E78, #5DA06B)"
                      : "linear-gradient(90deg, #CDA88A, #C9A96E)",
                  }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="p-3 space-y-0.5">
              {checkItems.map((item, idx) => {
                const Icon = item.icon;
                const isDone = !!checked[item.id];

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + idx * 0.03 }}
                    className="flex items-start gap-3 px-3 py-2 rounded-xl group"
                    onMouseEnter={(e) => {
                      (
                        e.currentTarget as HTMLElement
                      ).style.backgroundColor = "rgba(0,0,0,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "";
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(item.id)}
                      className="shrink-0 mt-0.5 cursor-pointer"
                      aria-label={isDone ? "Uncheck" : "Check"}
                    >
                      {isDone ? (
                        <CheckCircle2
                          className="w-4 h-4"
                          style={{ color: "#7E9E78" }}
                        />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/25 group-hover:text-muted-foreground/40 transition-colors" />
                      )}
                    </button>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        if (item.testView && onViewModeChange) {
                          onViewModeChange(item.testView);
                        }
                        if (item.navigateTo) {
                          onNavigate(item.navigateTo);
                        }
                      }}
                    >
                      <span
                        className={`text-[0.8125rem] block ${
                          isDone
                            ? "text-foreground/50 line-through"
                            : "text-foreground"
                        }`}
                        style={bodyFont}
                      >
                        {item.label}
                      </span>
                      <p
                        className="text-muted-foreground/50 text-[0.625rem] leading-relaxed mt-0.5"
                        style={bodyFont}
                      >
                        {item.hint}
                      </p>
                    </div>

                    {/* Icon + optional view badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.testView && (
                        <span
                          className="text-[0.5rem] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${item.color}12`,
                            color: item.color,
                            ...bodyFont,
                          }}
                        >
                          {item.testView}
                        </span>
                      )}
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}10` }}
                      >
                        <Icon
                          className="w-3 h-3"
                          style={{ color: item.color }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <button
                onClick={resetAll}
                className="flex items-center gap-1.5 text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors cursor-pointer text-[0.6875rem]"
                style={bodyFont}
              >
                <RotateCcw className="w-3 h-3" />
                Reset all
              </button>
              {allDone && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[0.6875rem] px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: "rgba(126,158,120,0.12)",
                    color: "#7E9E78",
                    ...bodyFont,
                    fontWeight: 600,
                  }}
                >
                  Ready for launch
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
