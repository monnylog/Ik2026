import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ClipboardCheck,
  Lightbulb,
  Package,
  Wrench,
  ChefHat,
  RefreshCw,
  CheckCircle2,
  Circle,
  Eye,
  X,
  Loader2,
  Download,
  Radio,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { apiFetch, supabase } from "../lib/supabase";
import { getAvatar } from "./engagement/avatars";
import { EmptyState } from "./ui/empty-state";
import { CardSkeleton } from "./ui/skeleton-loaders";
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

const categories = [
  { id: "concept", label: "Concept", icon: Lightbulb, color: "#C49370" },
  { id: "ingredients", label: "Ingredients", icon: Package, color: "#7E9E78" },
  { id: "kitchen", label: "Kitchen", icon: Wrench, color: "#4A7FB5" },
] as const;

function hasContent(obj: Record<string, string> | undefined): boolean {
  if (!obj) return false;
  return Object.values(obj).some((v) => typeof v === "string" && v.trim().length > 0);
}

function completionPercent(sub: ChefSubmissionSummary["submissions"]): number {
  if (!sub) return 0;
  let filled = 0;
  let total = 0;
  for (const cat of ["concept", "ingredients", "kitchen"] as const) {
    const section = sub[cat];
    if (!section) { total += 4; continue; }
    const vals = Object.values(section);
    total += vals.length || 4;
    filled += vals.filter((v) => typeof v === "string" && v.trim().length > 0).length;
  }
  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

interface SubmissionDetailModalProps {
  chef: ChefSubmissionSummary;
  onClose: () => void;
}

function SubmissionDetailModal({ chef, onClose }: SubmissionDetailModalProps) {
  const avatar = getAvatar(chef.avatarId);
  const sub = chef.submissions;

  const renderFields = (section: Record<string, string> | undefined, labels: Record<string, string>) => {
    if (!section) return <p className="text-muted-foreground text-[0.75rem] italic" style={bodyFont}>No submission yet</p>;
    return (
      <div className="space-y-2">
        {Object.entries(labels).map(([key, label]) => (
          <div key={key}>
            <span className="text-muted-foreground text-[0.6875rem] block mb-0.5" style={bodyFont}>{label}</span>
            <p className="text-foreground text-[0.8125rem] whitespace-pre-wrap" style={bodyFont}>
              {section[key]?.trim() || <span className="text-muted-foreground/50 italic">Empty</span>}
            </p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ border: "1px solid rgba(196,147,112,0.15)" }}
      >
        {/* Header */}
        <div className="p-5 pb-4 border-b border-border flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-[1.25rem]" style={{ backgroundColor: avatar.bg }}>
            {avatar.emoji}
          </div>
          <div className="flex-1">
            <h3 className="text-foreground text-[1.125rem]" style={headingFont}>{chef.displayName}</h3>
            <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              {completionPercent(sub)}% complete · Last active {new Date(chef.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Concept */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4" style={{ color: "#C49370" }} />
              <h4 className="text-foreground text-[0.875rem]" style={headingFont}>Dish Concept</h4>
              {hasContent(sub?.concept) && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </div>
            {renderFields(sub?.concept, {
              dishName: "Dish Name",
              description: "Description",
              plating: "Plating & Presentation",
              story: "Storytelling Angle",
            })}
          </div>

          <div className="border-t border-border/50" />

          {/* Ingredients */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4" style={{ color: "#7E9E78" }} />
              <h4 className="text-foreground text-[0.875rem]" style={headingFont}>Ingredients</h4>
              {hasContent(sub?.ingredients) && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </div>
            {renderFields(sub?.ingredients, {
              keyIngredients: "Key Ingredients",
              specialtyItems: "Specialty Items",
              sourcing: "Sourcing Preferences",
              dietaryNotes: "Dietary / Allergen Notes",
            })}
          </div>

          <div className="border-t border-border/50" />

          {/* Kitchen */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4" style={{ color: "#4A7FB5" }} />
              <h4 className="text-foreground text-[0.875rem]" style={headingFont}>Kitchen Needs</h4>
              {hasContent(sub?.kitchen) && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />}
            </div>
            {renderFields(sub?.kitchen, {
              equipment: "Equipment",
              stationNeeds: "Station Setup",
              prepSpace: "Prep Space / Cold Storage",
              specialRequirements: "Special Requirements",
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SubmissionTracker() {
  const [submissions, setSubmissions] = useState<ChefSubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChef, setSelectedChef] = useState<ChefSubmissionSummary | null>(null);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"completion" | "recent" | "name">("completion");
  const [filterBy, setFilterBy] = useState<"all" | "started" | "not-started">("all");

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/chef-submissions");
      setSubmissions(res.submissions || []);
    } catch (e) {
      console.error("Failed to load chef submissions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubmissions(); }, []);

  // Listen for real-time submission updates from chefs
  useEffect(() => {
    const channel = supabase.channel("ik26-chef-submissions");
    channel.on("broadcast", { event: "submission-update" }, (payload) => {
      const update = payload.payload as {
        userId: string;
        displayName: string;
        avatarId: string;
        submissions: ChefSubmissionSummary["submissions"];
        updatedAt: string;
      };
      if (!update?.userId) return;

      setSubmissions((prev) => {
        const idx = prev.findIndex((s) => s.userId === update.userId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            submissions: update.submissions,
            displayName: update.displayName || updated[idx].displayName,
            avatarId: update.avatarId || updated[idx].avatarId,
            lastActive: update.updatedAt,
          };
          return updated;
        }
        // New chef we haven't seen — add them
        return [...prev, {
          userId: update.userId,
          displayName: update.displayName,
          avatarId: update.avatarId,
          chefDirectoryId: null,
          lastActive: update.updatedAt,
          submissions: update.submissions,
        }];
      });

      // Also update selected chef if it's the one being viewed
      setSelectedChef((prev) => {
        if (prev && prev.userId === update.userId) {
          return {
            ...prev,
            submissions: update.submissions,
            lastActive: update.updatedAt,
          };
        }
        return prev;
      });

      // Mark the chef as recently updated
      setRecentlyUpdated((prev) => {
        const newSet = new Set(prev);
        newSet.add(update.userId);
        return newSet;
      });

      // Clear the "recently updated" indicator after 5 seconds
      setTimeout(() => {
        setRecentlyUpdated((prev) => {
          const newSet = new Set(prev);
          newSet.delete(update.userId);
          return newSet;
        });
      }, 5000);
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Export all submissions as a text document
  const exportSubmissions = () => {
    const lines: string[] = [
      "ISANG KUSINA 2026 — Chef Submissions Export",
      `Generated: ${new Date().toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}`,
      `Total Chefs: ${submissions.length}`,
      "═".repeat(60),
      "",
    ];

    for (const chef of submissions) {
      const pct = completionPercent(chef.submissions);
      lines.push(`▸ ${chef.displayName} (${pct}% complete)`);
      lines.push(`  Last active: ${new Date(chef.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
      lines.push("");

      const sub = chef.submissions;
      if (!sub) {
        lines.push("  No submissions yet.");
        lines.push("");
        lines.push("─".repeat(50));
        lines.push("");
        continue;
      }

      // Concept
      lines.push("  ◆ DISH CONCEPT");
      if (sub.concept) {
        if (sub.concept.dishName?.trim()) lines.push(`    Dish Name: ${sub.concept.dishName}`);
        if (sub.concept.description?.trim()) lines.push(`    Description: ${sub.concept.description}`);
        if (sub.concept.plating?.trim()) lines.push(`    Plating: ${sub.concept.plating}`);
        if (sub.concept.story?.trim()) lines.push(`    Story: ${sub.concept.story}`);
      } else { lines.push("    (empty)"); }
      lines.push("");

      // Ingredients
      lines.push("  ◆ INGREDIENTS");
      if (sub.ingredients) {
        if (sub.ingredients.keyIngredients?.trim()) lines.push(`    Key Ingredients:\n      ${sub.ingredients.keyIngredients.split("\n").join("\n      ")}`);
        if (sub.ingredients.specialtyItems?.trim()) lines.push(`    Specialty Items: ${sub.ingredients.specialtyItems}`);
        if (sub.ingredients.sourcing?.trim()) lines.push(`    Sourcing: ${sub.ingredients.sourcing}`);
        if (sub.ingredients.dietaryNotes?.trim()) lines.push(`    Dietary Notes: ${sub.ingredients.dietaryNotes}`);
      } else { lines.push("    (empty)"); }
      lines.push("");

      // Kitchen
      lines.push("  ◆ KITCHEN NEEDS");
      if (sub.kitchen) {
        if (sub.kitchen.equipment?.trim()) lines.push(`    Equipment: ${sub.kitchen.equipment}`);
        if (sub.kitchen.stationNeeds?.trim()) lines.push(`    Station: ${sub.kitchen.stationNeeds}`);
        if (sub.kitchen.prepSpace?.trim()) lines.push(`    Prep Space: ${sub.kitchen.prepSpace}`);
        if (sub.kitchen.specialRequirements?.trim()) lines.push(`    Special Requirements: ${sub.kitchen.specialRequirements}`);
      } else { lines.push("    (empty)"); }
      lines.push("");
      lines.push("─".repeat(50));
      lines.push("");
    }

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `IK26-Chef-Submissions-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalChefs = submissions.length;
  const conceptCount = submissions.filter((s) => hasContent(s.submissions?.concept)).length;
  const ingredientCount = submissions.filter((s) => hasContent(s.submissions?.ingredients)).length;
  const kitchenCount = submissions.filter((s) => hasContent(s.submissions?.kitchen)).length;

  // Apply filter + sort
  const displayedSubmissions = (() => {
    let list = [...submissions];

    // Filter
    if (filterBy === "started") {
      list = list.filter((s) => completionPercent(s.submissions) > 0);
    } else if (filterBy === "not-started") {
      list = list.filter((s) => completionPercent(s.submissions) === 0);
    }

    // Sort
    if (sortBy === "completion") {
      list.sort((a, b) => completionPercent(b.submissions) - completionPercent(a.submissions));
    } else if (sortBy === "recent") {
      list.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
    } else if (sortBy === "name") {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    return list;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(196,147,112,0.15)" }}
    >
      {/* Header — merged with summary stats */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C49370" }} />
          <ClipboardCheck className="w-4 h-4" style={{ color: "#C49370" }} />
          <h3 className="text-foreground" style={headingFont}>
            Submission Tracker
          </h3>

          {/* Live indicator */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[0.5625rem] text-green-600" style={bodyFont}>Live</span>
          </div>

          {/* Inline summary stats */}
          {totalChefs > 0 && (
            <div className="flex items-center gap-2 ml-2">
              {[
                { label: "C", count: conceptCount, total: totalChefs, color: "#C49370" },
                { label: "I", count: ingredientCount, total: totalChefs, color: "#7E9E78" },
                { label: "K", count: kitchenCount, total: totalChefs, color: "#4A7FB5" },
              ].map((stat) => (
                <span key={stat.label} className="text-[0.625rem] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${stat.color}12`, color: stat.color, ...bodyFont }}>
                  {stat.label} {stat.count}/{stat.total}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 ml-auto">
            {/* Export button */}
            {submissions.length > 0 && (
              <button
                onClick={exportSubmissions}
                className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Export all submissions"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={loadSubmissions}
              className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Sort & filter — compact inline toolbar */}
        {submissions.length > 1 && (
          <div className="flex items-center gap-1.5 pl-7 mt-2 flex-wrap">
            <ArrowUpDown className="w-3 h-3 text-muted-foreground/40" />
            {([
              { id: "completion" as const, label: "Completion" },
              { id: "recent" as const, label: "Recent" },
              { id: "name" as const, label: "A–Z" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className="px-2 py-0.5 rounded text-[0.625rem] transition-colors cursor-pointer"
                style={{
                  backgroundColor: sortBy === opt.id ? "rgba(196,147,112,0.08)" : "transparent",
                  color: sortBy === opt.id ? "#C49370" : "var(--muted-foreground)",
                  border: sortBy === opt.id ? "1px solid rgba(196,147,112,0.2)" : "1px solid transparent",
                  ...bodyFont,
                }}
              >
                {opt.label}
              </button>
            ))}
            <div className="w-px h-3 bg-border/30 mx-0.5" />
            <Filter className="w-3 h-3 text-muted-foreground/40" />
            {([
              { id: "all" as const, label: "All" },
              { id: "started" as const, label: "Started" },
              { id: "not-started" as const, label: "Not Started" },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFilterBy(opt.id)}
                className="px-2 py-0.5 rounded text-[0.625rem] transition-colors cursor-pointer"
                style={{
                  backgroundColor: filterBy === opt.id ? "rgba(74,127,181,0.08)" : "transparent",
                  color: filterBy === opt.id ? "#4A7FB5" : "var(--muted-foreground)",
                  border: filterBy === opt.id ? "1px solid rgba(74,127,181,0.2)" : "1px solid transparent",
                  ...bodyFont,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chef rows */}
      <div className="divide-y divide-border/30">
        {loading && submissions.length === 0 ? (
          <CardSkeleton lines={5} />
        ) : submissions.length === 0 ? (
          <EmptyState
            variant="submissions"
            title="No chef profiles found yet"
            description="Submissions will appear here as chefs fill out their details."
          />
        ) : displayedSubmissions.length === 0 ? (
          <EmptyState
            variant="submissions"
            title="No chefs match this filter"
            action={{ label: "Show all chefs", onClick: () => setFilterBy("all") }}
          />
        ) : (
          displayedSubmissions.map((chef) => {
            const avatar = getAvatar(chef.avatarId);
            const pct = completionPercent(chef.submissions);
            const hasConcept = hasContent(chef.submissions?.concept);
            const hasIngredients = hasContent(chef.submissions?.ingredients);
            const hasKitchen = hasContent(chef.submissions?.kitchen);
            const isJustUpdated = recentlyUpdated.has(chef.userId);

            return (
              <motion.button
                key={chef.userId}
                onClick={() => setSelectedChef(chef)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer text-left"
                whileTap={{ scale: 0.99 }}
                style={isJustUpdated ? { backgroundColor: "rgba(34,197,94,0.04)" } : undefined}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[1rem] shrink-0" style={{ backgroundColor: avatar.bg }}>
                    {avatar.emoji}
                  </div>
                  {isJustUpdated && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center animate-pulse" style={{ border: "2px solid var(--color-card)" }}>
                      <Radio className="w-1.5 h-1.5 text-white" />
                    </div>
                  )}
                </div>

                {/* Name + completion */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-[0.8125rem] truncate" style={bodyFont}>{chef.displayName}</span>
                    <span className="text-muted-foreground/50 text-[0.625rem]" style={bodyFont}>{pct}%</span>
                    {isJustUpdated && (
                      <span className="text-[0.5rem] text-green-600 px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.15)", ...bodyFont }}>
                        Just updated
                      </span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-secondary/60 mt-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: pct === 100 ? "#22c55e" : pct > 50 ? "#C49370" : pct > 0 ? "#F5B836" : "rgba(0,0,0,0)",
                      }}
                    />
                  </div>
                </div>

                {/* Category status dots */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {[
                    { done: hasConcept, color: "#C49370", label: "C" },
                    { done: hasIngredients, color: "#7E9E78", label: "I" },
                    { done: hasKitchen, color: "#4A7FB5", label: "K" },
                  ].map((cat) => (
                    <div
                      key={cat.label}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[0.5rem]"
                      style={{
                        backgroundColor: cat.done ? `${cat.color}15` : "rgba(0,0,0,0.03)",
                        color: cat.done ? cat.color : "rgba(0,0,0,0.2)",
                        border: cat.done ? `1px solid ${cat.color}30` : "1px solid rgba(0,0,0,0.05)",
                        ...bodyFont,
                        fontWeight: 600,
                      }}
                      title={cat.label === "C" ? "Concept" : cat.label === "I" ? "Ingredients" : "Kitchen"}
                    >
                      {cat.done ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    </div>
                  ))}
                </div>

                {/* View detail */}
                <Eye className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              </motion.button>
            );
          })
        )}
      </div>

      {/* Detail modal */}
      {selectedChef && (
        <SubmissionDetailModal chef={selectedChef} onClose={() => setSelectedChef(null)} />
      )}
    </motion.div>
  );
}