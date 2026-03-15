import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GitCompareArrows,
  X,
  Lightbulb,
  Package,
  Wrench,
  ChevronDown,
  Minus,
  CheckCircle2,
} from "lucide-react";
import { getAvatar } from "./engagement/avatars";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ChefSubmissionSummary {
  userId: string;
  displayName: string;
  avatarId: string;
  chefDirectoryId: string | null;
  lastActive: string;
  submissions: {
    concept: Record<string, string>;
    ingredients: Record<string, string>;
    kitchen: Record<string, string>;
  } | null;
}

function hasContent(obj: Record<string, string> | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => typeof v === "string" && v.trim().length > 0);
}

interface CompareSubmissionsProps {
  submissions: ChefSubmissionSummary[];
}

type CompareTab = "concept" | "ingredients" | "kitchen";

const tabConfig: { id: CompareTab; label: string; icon: typeof Lightbulb; color: string }[] = [
  { id: "concept", label: "Concept", icon: Lightbulb, color: "#C49370" },
  { id: "ingredients", label: "Ingredients", icon: Package, color: "#7E9E78" },
  { id: "kitchen", label: "Kitchen", icon: Wrench, color: "#4A7FB5" },
];

const fieldLabels: Record<CompareTab, Record<string, string>> = {
  concept: {
    dishName: "Dish Name",
    description: "Description",
    plating: "Plating & Presentation",
    story: "Storytelling Angle",
  },
  ingredients: {
    keyIngredients: "Key Ingredients",
    specialtyItems: "Specialty Items",
    sourcing: "Sourcing Preferences",
    dietaryNotes: "Dietary / Allergen Notes",
  },
  kitchen: {
    equipment: "Equipment",
    stationNeeds: "Station Setup",
    prepSpace: "Prep Space / Cold Storage",
    specialRequirements: "Special Requirements",
  },
};

export function CompareSubmissions({ submissions }: CompareSubmissionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chefA, setChefA] = useState<string>("");
  const [chefB, setChefB] = useState<string>("");
  const [activeTab, setActiveTab] = useState<CompareTab>("concept");

  const chefsWithContent = submissions.filter(
    (s) => s.submissions && (hasContent(s.submissions.concept) || hasContent(s.submissions.ingredients) || hasContent(s.submissions.kitchen))
  );

  if (chefsWithContent.length < 2) return null;

  const chefAData = submissions.find((s) => s.userId === chefA);
  const chefBData = submissions.find((s) => s.userId === chefB);

  const canCompare = chefAData && chefBData;

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer transition-all"
        style={{
          backgroundColor: "rgba(74,143,212,0.06)",
          color: "#4A8FD4",
          border: "1px solid rgba(74,143,212,0.15)",
          ...bodyFont,
        }}
      >
        <GitCompareArrows className="w-4 h-4" />
        Compare Chefs
      </motion.button>

      {/* Full-screen compare modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              style={{ border: "1px solid rgba(74,143,212,0.2)" }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex items-center gap-3 shrink-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(74,143,212,0.1)" }}
                >
                  <GitCompareArrows className="w-4 h-4" style={{ color: "#4A8FD4" }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-foreground text-[1.125rem]" style={headingFont}>
                    Compare Submissions
                  </h3>
                  <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                    Select two chefs to view their submissions side by side
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chef selectors */}
              <div className="px-5 py-3 border-b border-border/50 flex items-center gap-4 flex-wrap">
                {/* Chef A selector */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  {chefAData && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[0.875rem] shrink-0"
                      style={{ backgroundColor: getAvatar(chefAData.avatarId).bg }}
                    >
                      {getAvatar(chefAData.avatarId).emoji}
                    </div>
                  )}
                  <div className="relative flex-1">
                    <select
                      value={chefA}
                      onChange={(e) => setChefA(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 rounded-lg text-[0.8125rem] border border-border bg-background text-foreground focus:outline-none focus:border-[#4A8FD4]/50 transition-colors appearance-none cursor-pointer"
                      style={bodyFont}
                    >
                      <option value="">Select Chef A...</option>
                      {chefsWithContent
                        .filter((c) => c.userId !== chefB)
                        .map((c) => (
                          <option key={c.userId} value={c.userId}>
                            {c.displayName}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-secondary/60 flex items-center justify-center">
                    <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>vs</span>
                  </div>
                </div>

                {/* Chef B selector */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  {chefBData && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[0.875rem] shrink-0"
                      style={{ backgroundColor: getAvatar(chefBData.avatarId).bg }}
                    >
                      {getAvatar(chefBData.avatarId).emoji}
                    </div>
                  )}
                  <div className="relative flex-1">
                    <select
                      value={chefB}
                      onChange={(e) => setChefB(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 rounded-lg text-[0.8125rem] border border-border bg-background text-foreground focus:outline-none focus:border-[#4A8FD4]/50 transition-colors appearance-none cursor-pointer"
                      style={bodyFont}
                    >
                      <option value="">Select Chef B...</option>
                      {chefsWithContent
                        .filter((c) => c.userId !== chefA)
                        .map((c) => (
                          <option key={c.userId} value={c.userId}>
                            {c.displayName}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              {canCompare && (
                <div className="flex border-b border-border/50">
                  {tabConfig.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-[0.8125rem] cursor-pointer transition-all relative"
                        style={{
                          color: isActive ? tab.color : "var(--muted-foreground)",
                          backgroundColor: isActive ? `${tab.color}08` : "transparent",
                          ...bodyFont,
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {isActive && (
                          <motion.div
                            layoutId="compare-tab-indicator"
                            className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                            style={{ backgroundColor: tab.color }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Compare content */}
              <div className="flex-1 overflow-y-auto">
                {!canCompare ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <GitCompareArrows className="w-10 h-10 text-muted-foreground/15 mb-3" />
                    <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
                      Select two chefs above to compare
                    </p>
                    <p className="text-muted-foreground/50 text-[0.75rem] mt-1" style={bodyFont}>
                      View their submissions side by side across all categories
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 divide-x divide-border/30">
                    {[chefAData, chefBData].map((chef) => {
                      const avatar = getAvatar(chef!.avatarId);
                      const section = chef!.submissions?.[activeTab];
                      const labels = fieldLabels[activeTab];
                      const tabCfg = tabConfig.find((t) => t.id === activeTab)!;

                      return (
                        <div key={chef!.userId} className="p-5">
                          {/* Chef header */}
                          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/30">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[1rem]"
                              style={{ backgroundColor: avatar.bg }}
                            >
                              {avatar.emoji}
                            </div>
                            <div>
                              <p className="text-foreground text-[0.875rem]" style={bodyFont}>
                                {chef!.displayName}
                              </p>
                              <p className="text-muted-foreground text-[0.625rem]" style={bodyFont}>
                                {chef!.submissions?.[activeTab]
                                  ? (hasContent(chef!.submissions[activeTab])
                                    ? <span className="flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5 text-green-500" /> Submitted</span>
                                    : "Empty")
                                  : "No data"}
                              </p>
                            </div>
                          </div>

                          {/* Fields */}
                          <div className="space-y-3.5">
                            {Object.entries(labels).map(([key, label]) => {
                              const value = section?.[key]?.trim();
                              return (
                                <div key={key}>
                                  <span
                                    className="text-[0.6875rem] flex items-center gap-1.5 mb-1"
                                    style={{ color: tabCfg.color, ...bodyFont }}
                                  >
                                    {label}
                                  </span>
                                  {value ? (
                                    <p className="text-foreground text-[0.8125rem] whitespace-pre-wrap leading-relaxed" style={bodyFont}>
                                      {value}
                                    </p>
                                  ) : (
                                    <p className="flex items-center gap-1.5 text-muted-foreground/40 text-[0.75rem] italic" style={bodyFont}>
                                      <Minus className="w-3 h-3" />
                                      Not submitted
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}