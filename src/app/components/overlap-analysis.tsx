import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Layers,
  Package,
  Wrench,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
} from "lucide-react";
import { getAvatar } from "./engagement/avatars";
import { bodyFont, headingFont } from "../lib/fonts";

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

interface OverlapItem {
  term: string;
  chefs: { name: string; avatarId: string }[];
  type: "ingredient" | "equipment";
}

/**
 * Extracts individual items from multi-line or comma-separated text fields.
 * Normalizes to lowercase, trims whitespace, removes leading dashes/bullets.
 */
function extractItems(text: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[\n,;]+/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-–—•*]\s*/, "") // strip bullets
        .replace(/\s*—.*$/, "") // strip trailing notes after em-dash
        .replace(/\s*\(.*\)$/, "") // strip parentheticals
        .toLowerCase()
        .trim()
    )
    .filter((item) => item.length > 2); // Skip tiny tokens
}

/**
 * Fuzzy match: checks if two normalized terms share a significant word overlap
 */
function termsOverlap(a: string, b: string): boolean {
  if (a === b) return true;
  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) return true;
  // Word overlap
  const wordsA = a.split(/\s+/).filter((w) => w.length > 2);
  const wordsB = b.split(/\s+/).filter((w) => w.length > 2);
  const shared = wordsA.filter((w) => wordsB.some((wb) => wb.includes(w) || w.includes(wb)));
  return shared.length > 0 && (shared.length / Math.min(wordsA.length, wordsB.length)) >= 0.5;
}

function analyzeOverlaps(submissions: ChefSubmissionSummary[]): OverlapItem[] {
  const ingredientMap = new Map<string, { name: string; avatarId: string; raw: string }[]>();
  const equipmentMap = new Map<string, { name: string; avatarId: string; raw: string }[]>();

  for (const chef of submissions) {
    if (!chef.submissions) continue;
    const chefInfo = { name: chef.displayName, avatarId: chef.avatarId };

    // Ingredients
    const allIngredientText = [
      chef.submissions.ingredients?.keyIngredients || "",
      chef.submissions.ingredients?.specialtyItems || "",
    ].join("\n");

    const ingredientItems = extractItems(allIngredientText);
    for (const item of ingredientItems) {
      let matched = false;
      for (const [key, entries] of ingredientMap) {
        if (termsOverlap(item, key)) {
          if (!entries.some((e) => e.name === chefInfo.name)) {
            entries.push({ ...chefInfo, raw: item });
          }
          matched = true;
          break;
        }
      }
      if (!matched) {
        ingredientMap.set(item, [{ ...chefInfo, raw: item }]);
      }
    }

    // Equipment
    const allEquipText = [
      chef.submissions.kitchen?.equipment || "",
      chef.submissions.kitchen?.stationNeeds || "",
    ].join("\n");

    const equipItems = extractItems(allEquipText);
    for (const item of equipItems) {
      let matched = false;
      for (const [key, entries] of equipmentMap) {
        if (termsOverlap(item, key)) {
          if (!entries.some((e) => e.name === chefInfo.name)) {
            entries.push({ ...chefInfo, raw: item });
          }
          matched = true;
          break;
        }
      }
      if (!matched) {
        equipmentMap.set(item, [{ ...chefInfo, raw: item }]);
      }
    }
  }

  const overlaps: OverlapItem[] = [];

  for (const [term, chefs] of ingredientMap) {
    if (chefs.length >= 2) {
      overlaps.push({ term, chefs: chefs.map((c) => ({ name: c.name, avatarId: c.avatarId })), type: "ingredient" });
    }
  }
  for (const [term, chefs] of equipmentMap) {
    if (chefs.length >= 2) {
      overlaps.push({ term, chefs: chefs.map((c) => ({ name: c.name, avatarId: c.avatarId })), type: "equipment" });
    }
  }

  // Sort by most shared first
  overlaps.sort((a, b) => b.chefs.length - a.chefs.length);

  return overlaps;
}

interface OverlapAnalysisProps {
  submissions: ChefSubmissionSummary[];
}

export function OverlapAnalysis({ submissions }: OverlapAnalysisProps) {
  const [expanded, setExpanded] = useState(false);
  const [showType, setShowType] = useState<"all" | "ingredient" | "equipment">("all");

  const overlaps = useMemo(() => analyzeOverlaps(submissions), [submissions]);

  const filtered = showType === "all" ? overlaps : overlaps.filter((o) => o.type === showType);

  const ingredientCount = overlaps.filter((o) => o.type === "ingredient").length;
  const equipmentCount = overlaps.filter((o) => o.type === "equipment").length;
  const totalCount = overlaps.length;

  if (submissions.length < 2) return null;

  // Check if there's any content to analyze
  const hasAnyContent = submissions.some(
    (s) =>
      s.submissions?.ingredients?.keyIngredients?.trim() ||
      s.submissions?.ingredients?.specialtyItems?.trim() ||
      s.submissions?.kitchen?.equipment?.trim() ||
      s.submissions?.kitchen?.stationNeeds?.trim()
  );

  if (!hasAnyContent) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(126,158,120,0.2)" }}
    >
      {/* Header — always visible, toggles expanded */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-3 cursor-pointer hover:bg-secondary/20 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(126,158,120,0.1)" }}
        >
          <Layers className="w-4 h-4" style={{ color: "#7E9E78" }} />
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-foreground text-[0.875rem]" style={headingFont}>
            Overlap Analysis
          </h4>
          <p className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
            {totalCount === 0
              ? "No shared items detected yet"
              : `${totalCount} shared item${totalCount !== 1 ? "s" : ""} found across chefs`}
          </p>
        </div>

        {/* Summary badges */}
        {totalCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {ingredientCount > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem]"
                style={{
                  backgroundColor: "rgba(126,158,120,0.08)",
                  color: "#7E9E78",
                  border: "1px solid rgba(126,158,120,0.15)",
                  ...bodyFont,
                }}
              >
                <Package className="w-2.5 h-2.5" />
                {ingredientCount}
              </span>
            )}
            {equipmentCount > 0 && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem]"
                style={{
                  backgroundColor: "rgba(74,143,212,0.08)",
                  color: "#4A8FD4",
                  border: "1px solid rgba(74,143,212,0.15)",
                  ...bodyFont,
                }}
              >
                <Wrench className="w-2.5 h-2.5" />
                {equipmentCount}
              </span>
            )}
          </div>
        )}

        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {totalCount === 0 ? (
              <div className="px-5 pb-5 text-center">
                <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                  No overlapping ingredients or equipment detected yet.
                </p>
                <p className="text-muted-foreground/60 text-[0.6875rem] mt-1" style={bodyFont}>
                  Overlaps will appear here as more chefs submit their details.
                </p>
              </div>
            ) : (
              <>
                {/* Filter tabs */}
                <div className="px-5 pb-3 flex items-center gap-1.5">
                  {([
                    { id: "all" as const, label: "All", count: totalCount },
                    { id: "ingredient" as const, label: "Ingredients", count: ingredientCount },
                    { id: "equipment" as const, label: "Equipment", count: equipmentCount },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={(e) => { e.stopPropagation(); setShowType(tab.id); }}
                      className="px-2.5 py-1 rounded-md text-[0.625rem] transition-colors cursor-pointer"
                      style={{
                        backgroundColor: showType === tab.id ? "rgba(126,158,120,0.08)" : "transparent",
                        color: showType === tab.id ? "#7E9E78" : "var(--muted-foreground)",
                        border: showType === tab.id ? "1px solid rgba(126,158,120,0.2)" : "1px solid transparent",
                        ...bodyFont,
                      }}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                {/* Overlap items */}
                <div className="px-5 pb-4 space-y-2">
                  {filtered.map((overlap, idx) => (
                    <div
                      key={`${overlap.type}-${overlap.term}-${idx}`}
                      className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                      style={{
                        backgroundColor: overlap.type === "ingredient"
                          ? "rgba(126,158,120,0.04)"
                          : "rgba(74,143,212,0.04)",
                        border: `1px solid ${
                          overlap.type === "ingredient"
                            ? "rgba(126,158,120,0.1)"
                            : "rgba(74,143,212,0.1)"
                        }`,
                      }}
                    >
                      {/* Type icon */}
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: overlap.type === "ingredient"
                            ? "rgba(126,158,120,0.1)"
                            : "rgba(74,143,212,0.1)",
                        }}
                      >
                        {overlap.type === "ingredient" ? (
                          <Package className="w-3 h-3" style={{ color: "#7E9E78" }} />
                        ) : (
                          <Wrench className="w-3 h-3" style={{ color: "#4A8FD4" }} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Term */}
                        <p className="text-foreground text-[0.8125rem] capitalize" style={bodyFont}>
                          {overlap.term}
                        </p>

                        {/* Chefs who share this */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Users className="w-2.5 h-2.5 text-muted-foreground/40" />
                          {overlap.chefs.map((chef) => {
                            const avatar = getAvatar(chef.avatarId);
                            return (
                              <span
                                key={chef.name}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[0.5625rem]"
                                style={{
                                  backgroundColor: avatar.bg,
                                  color: "var(--foreground)",
                                  ...bodyFont,
                                }}
                              >
                                <span className="text-[0.5rem]">{avatar.emoji}</span>
                                {chef.name.split(" ")[0]}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Overlap severity */}
                      {overlap.chefs.length >= 3 && (
                        <div className="shrink-0" title="High overlap — consider consolidating procurement">
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#F5B836" }} />
                        </div>
                      )}
                    </div>
                  ))}

                  {filtered.length === 0 && (
                    <p className="text-muted-foreground text-[0.75rem] text-center py-2" style={bodyFont}>
                      No overlaps in this category.
                    </p>
                  )}
                </div>

                {/* Procurement hint */}
                {ingredientCount > 0 && (
                  <div
                    className="mx-5 mb-4 px-3 py-2.5 rounded-xl flex items-start gap-2"
                    style={{
                      background: "linear-gradient(135deg, rgba(245,184,54,0.04) 0%, rgba(196,147,112,0.04) 100%)",
                      border: "1px solid rgba(245,184,54,0.1)",
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#F5B836" }} />
                    <div>
                      <p className="text-[0.75rem] text-foreground/80" style={bodyFont}>
                        <strong>{ingredientCount}</strong> shared ingredient{ingredientCount !== 1 ? "s" : ""} detected
                        — consider bulk ordering to reduce costs.
                      </p>
                      <p className="text-[0.6875rem] text-muted-foreground/60 mt-0.5" style={bodyFont}>
                        Coordinate in Comms to avoid duplicate sourcing efforts.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}