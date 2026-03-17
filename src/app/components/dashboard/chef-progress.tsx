import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  ChefHat,
  UtensilsCrossed,
  ClipboardList,
  BookOpen,
  Plane,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Loader2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useProfile } from "../../lib/profile-context";
import { getConfirmedChef } from "../onboarding/chef-directory";
import { apiFetch } from "../../lib/supabase";
import { useUserData } from "../../lib/use-user-data";
import { bodyFont, headingFont } from "../../lib/fonts";

interface ProgressStep {
  id: string;
  label: string;
  description: string;
  icon: typeof ChefHat;
  color: string;
  navigateTo: string;
  cta: string;
  completed: boolean;
  manualToggle?: boolean; // can user manually mark as done
}

interface ChefProgressProps {
  onNavigate: (page: string) => void;
}

interface ManualChecks {
  research: boolean;
  travel: boolean;
}

export function ChefProgress({ onNavigate }: ChefProgressProps) {
  const { profile } = useProfile();
  const [submissions, setSubmissions] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  // Persist manual completion toggles per-user
  const [manualChecks, setManualChecks] = useUserData<ManualChecks>(
    "chef-manual-checks",
    { research: false, travel: false }
  );

  const confirmedChef = profile?.chefDirectoryId
    ? getConfirmedChef(profile.chefDirectoryId)
    : null;

  // Fetch this chef's submission status
  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    apiFetch(`/user-data/${profile.id}/chef-submissions`)
      .then((data) => {
        setSubmissions(data?.data || null);
      })
      .catch((e) => {
        console.error("Failed to load chef submissions:", e);
      })
      .finally(() => setLoading(false));
  }, [profile?.id]);

  const hasConceptData = submissions?.concept &&
    Object.values(submissions.concept).some(
      (v) => typeof v === "string" && (v as string).trim().length > 0
    );
  const hasIngredientData = submissions?.ingredients &&
    Object.values(submissions.ingredients).some(
      (v) => typeof v === "string" && (v as string).trim().length > 0
    );
  const hasKitchenData = submissions?.kitchen &&
    Object.values(submissions.kitchen).some(
      (v) => typeof v === "string" && (v as string).trim().length > 0
    );

  const toggleManualCheck = (key: keyof ManualChecks) => {
    setManualChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const steps: ProgressStep[] = [
    {
      id: "profile",
      label: "Profile Created",
      description: "Your hub identity is set up and active",
      icon: ChefHat,
      color: "#7E9E78",
      navigateTo: "Settings",
      cta: "View Profile",
      completed: !!profile?.displayName,
    },
    {
      id: "concept",
      label: "Dish Concept Submitted",
      description: "Course theme, dish name, and narrative direction",
      icon: UtensilsCrossed,
      color: "#CDA88A",
      navigateTo: "Menu & Courses",
      cta: "Submit Concept",
      completed: !!hasConceptData,
    },
    {
      id: "ingredients",
      label: "Ingredient List Filed",
      description: "Key ingredients, specialty items, sourcing needs",
      icon: ClipboardList,
      color: "#7E9E78",
      navigateTo: "Menu & Courses",
      cta: "File Ingredients",
      completed: !!hasIngredientData,
    },
    {
      id: "kitchen",
      label: "Kitchen Needs Logged",
      description: "Equipment, station setup, and special requirements",
      icon: ClipboardList,
      color: "#4A7FB5",
      navigateTo: "Menu & Courses",
      cta: "Log Kitchen Needs",
      completed: !!hasKitchenData,
    },
    {
      id: "research",
      label: "Research Partner Connected",
      description: "Reach out to your assigned researcher via Comms",
      icon: BookOpen,
      color: "#6B7F8E",
      navigateTo: "Comms",
      cta: "Open Comms",
      completed: manualChecks.research,
      manualToggle: true,
    },
    {
      id: "travel",
      label: "Travel Confirmed",
      description: "Flight booking and lodging arrangements finalized",
      icon: Plane,
      color: "#4A7FB5",
      navigateTo: "Travel & Lodging",
      cta: "Check Travel",
      completed: manualChecks.travel,
      manualToggle: true,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const percentage = Math.round((completedCount / totalSteps) * 100);

  // Determine next action
  const nextStep = steps.find((s) => !s.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(205,168,138,0.15)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(205,168,138,0.05) 0%, rgba(201,169,110,0.03) 100%)",
          borderBottom: "1px solid rgba(205,168,138,0.08)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#CDA88A" }} />
            <Sparkles className="w-4 h-4" style={{ color: "#CDA88A" }} />
            <h3 className="text-foreground" style={headingFont}>
              Your Progress
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[0.6875rem] px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor:
                  percentage >= 80
                    ? "rgba(126,158,120,0.12)"
                    : "rgba(205,168,138,0.12)",
                color: percentage >= 80 ? "#7E9E78" : "#CDA88A",
                ...bodyFont,
              }}
            >
              {completedCount}/{totalSteps}
            </span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-200 ${
                  expanded ? "" : "-rotate-90"
                }`}
              />
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
          {confirmedChef
            ? `Track your coordination milestones, Chef ${confirmedChef.name.split(" ")[0]}.`
            : "Track your coordination milestones for the event."}
        </p>
      </div>

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
            <div className="px-5 pt-4 pb-2">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "rgba(205,168,138,0.08)" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      percentage >= 80
                        ? "linear-gradient(90deg, #7E9E78, #7E9E78)"
                        : "linear-gradient(90deg, #CDA88A, #C9A96E)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span
                  className="text-[0.625rem] text-muted-foreground/50"
                  style={bodyFont}
                >
                  {percentage}% complete
                </span>
                {percentage === 100 && (
                  <span
                    className="text-[0.625rem]"
                    style={{ color: "#7E9E78", ...bodyFont }}
                  >
                    All set for May 22!
                  </span>
                )}
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                  Loading your progress...
                </span>
              </div>
            )}

            {/* Steps */}
            {!loading && (
              <div className="p-3 space-y-1">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isNext = nextStep?.id === step.id;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.04 }}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                        isNext ? "" : "hover:bg-secondary/30"
                      }`}
                      style={
                        isNext
                          ? {
                              backgroundColor: "rgba(205,168,138,0.05)",
                              border: "1px solid rgba(205,168,138,0.12)",
                            }
                          : {}
                      }
                    >
                      {/* Status */}
                      <div className="shrink-0 mt-0.5">
                        {step.completed ? (
                          <CheckCircle2
                            className="w-4 h-4"
                            style={{ color: "#7E9E78" }}
                          />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/25" />
                        )}
                      </div>

                      {/* Content */}
                      <button
                        onClick={() => onNavigate(step.navigateTo)}
                        className="flex-1 min-w-0 text-left cursor-pointer"
                      >
                        <span
                          className={`text-[0.8125rem] block ${
                            step.completed
                              ? "text-foreground/60"
                              : "text-foreground"
                          }`}
                          style={bodyFont}
                        >
                          {step.label}
                          {isNext && (
                            <span
                              className="ml-2 text-[0.5rem] px-1.5 py-0.5 rounded-full"
                              style={{
                                backgroundColor: "rgba(205,168,138,0.15)",
                                color: "#CDA88A",
                                ...bodyFont,
                              }}
                            >
                              Next
                            </span>
                          )}
                        </span>
                        <p
                          className="text-muted-foreground text-[0.6875rem]"
                          style={bodyFont}
                        >
                          {step.description}
                        </p>
                      </button>

                      {/* Manual toggle for research/travel */}
                      {step.manualToggle && (
                        <button
                          onClick={() => toggleManualCheck(step.id as keyof ManualChecks)}
                          className="shrink-0 mt-0.5 cursor-pointer transition-colors"
                          title={step.completed ? "Mark as not done" : "Mark as done"}
                        >
                          {step.completed ? (
                            <ToggleRight className="w-5 h-5" style={{ color: "#7E9E78" }} />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-muted-foreground/30" />
                          )}
                        </button>
                      )}

                      {/* CTA arrow for non-manual steps */}
                      {!step.completed && !step.manualToggle && (
                        <div className="flex items-center gap-1 shrink-0 mt-1">
                          <span
                            className="text-[0.625rem] opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ color: step.color, ...bodyFont }}
                          >
                            {step.cta}
                          </span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-gold transition-colors" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Encouragement footer */}
            {!loading && completedCount > 0 && completedCount < totalSteps && (
              <div className="px-4 pb-4">
                <div
                  className="px-4 py-3 rounded-xl text-center"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(192,209,177,0.06) 0%, rgba(205,168,138,0.04) 100%)",
                    border: "1px solid rgba(192,209,177,0.1)",
                  }}
                >
                  <p className="text-[0.75rem]" style={{ color: "#7E9E78", ...bodyFont }}>
                    {completedCount <= 2
                      ? "Great start \u2014 take it one step at a time."
                      : completedCount <= 4
                        ? "Making good progress. The team is here if you need anything."
                        : "Almost there \u2014 just a couple more items to wrap up."}
                  </p>
                </div>
              </div>
            )}

            {/* All complete celebration */}
            {!loading && completedCount === totalSteps && (
              <div className="px-4 pb-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-4 py-3 rounded-xl text-center"
                  style={{
                    backgroundColor: "rgba(126,158,120,0.08)",
                    border: "1px solid rgba(126,158,120,0.15)",
                  }}
                >
                  <p
                    className="text-[0.8125rem] mb-0.5"
                    style={{ color: "#7E9E78", ...headingFont }}
                  >
                    You're all set, Chef.
                  </p>
                  <p
                    className="text-muted-foreground text-[0.6875rem]"
                    style={bodyFont}
                  >
                    See you in Las Vegas on May 22.
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}