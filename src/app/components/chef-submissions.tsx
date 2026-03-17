import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Check,
  ChefHat,
  Lightbulb,
  Package,
  Wrench,
  MessageCircle,
  ArrowRight,
  Loader2,
  Cloud,
  CloudOff,
} from "lucide-react";
import { apiFetch, supabase } from "../lib/supabase";
import { useProfile } from "../lib/profile-context";
import { CardSkeleton } from "./ui/skeleton-loaders";
import { bodyFont, headingFont } from "../lib/fonts";

type SubmissionTab = "concept" | "ingredients" | "kitchen";

interface TabConfig {
  id: SubmissionTab;
  label: string;
  icon: typeof Lightbulb;
  color: string;
  description: string;
}

const tabs: TabConfig[] = [
  {
    id: "concept",
    label: "Dish Concept",
    icon: Lightbulb,
    color: "#C49370",
    description: "Share your initial dish ideas, plating vision, and storytelling angle.",
  },
  {
    id: "ingredients",
    label: "Ingredients",
    icon: Package,
    color: "#7E9E78",
    description: "List key ingredients, specialty items, and sourcing preferences.",
  },
  {
    id: "kitchen",
    label: "Kitchen Needs",
    icon: Wrench,
    color: "#4A7FB5",
    description: "Equipment, cookware, station setup, and special requirements.",
  },
];

interface SubmissionData {
  concept: {
    dishName: string;
    description: string;
    plating: string;
    story: string;
  };
  ingredients: {
    keyIngredients: string;
    specialtyItems: string;
    sourcing: string;
    dietaryNotes: string;
  };
  kitchen: {
    equipment: string;
    stationNeeds: string;
    prepSpace: string;
    specialRequirements: string;
  };
}

const emptyData: SubmissionData = {
  concept: { dishName: "", description: "", plating: "", story: "" },
  ingredients: { keyIngredients: "", specialtyItems: "", sourcing: "", dietaryNotes: "" },
  kitchen: { equipment: "", stationNeeds: "", prepSpace: "", specialRequirements: "" },
};

interface ChefSubmissionsProps {
  onNavigate?: (page: string) => void;
}

export function ChefSubmissions({ onNavigate }: ChefSubmissionsProps) {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<SubmissionTab>("concept");
  const [data, setData] = useState<SubmissionData>(emptyData);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "error">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved data on mount
  useEffect(() => {
    if (!profile?.id) { setLoading(false); return; }
    (async () => {
      try {
        const res = await apiFetch(`/user-data/${profile.id}/chef-submissions`);
        if (res.data) {
          setData(res.data);
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Failed to load chef submissions:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const persistData = async (newData: SubmissionData) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await apiFetch(`/user-data/${profile.id}/chef-submissions`, {
        method: "PUT",
        body: JSON.stringify({ data: newData }),
      });
      setSyncStatus("synced");

      // Broadcast submission update for leadership tracker
      try {
        await supabase.channel("ik26-chef-submissions").send({
          type: "broadcast",
          event: "submission-update",
          payload: {
            userId: profile.id,
            displayName: profile.displayName,
            avatarId: profile.avatarId,
            submissions: newData,
            updatedAt: new Date().toISOString(),
          },
        });
        // Also broadcast to the activity feed channel
        await supabase.channel("ik26-chef-submissions-feed").send({
          type: "broadcast",
          event: "submission-update",
          payload: {
            userId: profile.id,
            displayName: profile.displayName,
            avatarId: profile.avatarId,
            submissions: newData,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch (bErr) {
        console.error("Broadcast submission update failed:", bErr);
      }
    } catch (e) {
      console.error("Failed to save chef submissions:", e);
      setSyncStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (tab: SubmissionTab) => {
    setSaved((p) => ({ ...p, [tab]: true }));
    persistData(data);
    setTimeout(() => setSaved((p) => ({ ...p, [tab]: false })), 2500);
  };

  const updateField = (tab: SubmissionTab, field: string, value: string) => {
    const newData = {
      ...data,
      [tab]: { ...data[tab], [field]: value },
    };
    setData(newData);
    setSyncStatus("idle");

    // Auto-save after 3 seconds of inactivity
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistData(newData), 3000);
  };

  const currentTab = tabs.find((t) => t.id === activeTab)!;

  if (loading) {
    return (
      <CardSkeleton />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(196,147,112,0.15)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C49370" }} />
          <ChefHat className="w-4 h-4" style={{ color: "#C49370" }} />
          <h3 className="text-foreground" style={headingFont}>
            Your Submissions
          </h3>
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Sync status */}
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : syncStatus === "synced" ? (
              <Cloud className="w-3 h-3 text-green-500" />
            ) : syncStatus === "error" ? (
              <CloudOff className="w-3 h-3 text-red-400" />
            ) : null}
            {/* Tab completion dots */}
            {tabs.map((tab) => (
              <span
                key={tab.id}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: saved[tab.id]
                    ? "#22c55e"
                    : Object.values(data[tab.id]).some((v) => v.trim())
                    ? tab.color
                    : "rgba(0,0,0,0.1)",
                }}
              />
            ))}
          </div>
        </div>
        <p className="text-muted-foreground text-[0.75rem] pl-7" style={bodyFont}>
          Submit your dish details, ingredients, and kitchen requirements. Auto-saves after 3s of inactivity.
        </p>

        {/* Gentle nudge — only shows if no submissions started */}
        {!Object.values(data).some((section) =>
          Object.values(section).some((v) => v.trim())
        ) && (
          <div
            className="mt-3 ml-7 flex items-start gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: "linear-gradient(135deg, rgba(196,147,112,0.04) 0%, rgba(245,184,54,0.04) 100%)",
              border: "1px solid rgba(196,147,112,0.1)",
            }}
          >
            <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#C49370" }} />
            <div>
              <p className="text-[0.75rem] text-foreground/80" style={bodyFont}>
                Even a few notes help the logistics team plan ahead.
              </p>
              <p className="text-[0.6875rem] text-muted-foreground/60 mt-0.5" style={bodyFont}>
                No pressure — you can update anytime before May. Start wherever feels right.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasContent = Object.values(data[tab.id]).some((v) => v.trim());
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
              <span className="hidden sm:inline">{tab.label}</span>
              {hasContent && !isActive && (
                <span
                  className="w-1.5 h-1.5 rounded-full absolute top-2 right-3"
                  style={{ backgroundColor: tab.color }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="chef-tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: tab.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="p-5 space-y-4"
        >
          {/* Description */}
          <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
            {currentTab.description}
          </p>

          {/* Concept tab */}
          {activeTab === "concept" && (
            <>
              <FieldInput label="Dish Name" value={data.concept.dishName} onChange={(v) => updateField("concept", "dishName", v)} placeholder="e.g., Smoked Salmon Sinigang" />
              <FieldTextarea label="Dish Description" value={data.concept.description} onChange={(v) => updateField("concept", "description", v)} placeholder="Describe your dish — flavors, technique, inspiration..." rows={3} />
              <FieldTextarea label="Plating & Presentation Vision" value={data.concept.plating} onChange={(v) => updateField("concept", "plating", v)} placeholder="How do you envision the plating? Any specific vessels, garnishes..." rows={2} />
              <FieldTextarea label="Storytelling Angle" value={data.concept.story} onChange={(v) => updateField("concept", "story", v)} placeholder="What story does this dish tell? How does it connect to the region/era?" rows={2} />
            </>
          )}

          {/* Ingredients tab */}
          {activeTab === "ingredients" && (
            <>
              <FieldTextarea label="Key Ingredients (one per line)" value={data.ingredients.keyIngredients} onChange={(v) => updateField("ingredients", "keyIngredients", v)} placeholder={"Wild salmon — 10 lbs\nFresh tamarind — 3 lbs\nMalunggay leaves — 2 bunches"} rows={4} />
              <FieldTextarea label="Specialty / Hard-to-Source Items" value={data.ingredients.specialtyItems} onChange={(v) => updateField("ingredients", "specialtyItems", v)} placeholder="Items needing advance ordering or special sourcing..." rows={2} />
              <FieldInput label="Sourcing Preferences" value={data.ingredients.sourcing} onChange={(v) => updateField("ingredients", "sourcing", v)} placeholder="e.g., Local farms preferred, specific brands..." />
              <FieldInput label="Dietary / Allergen Notes" value={data.ingredients.dietaryNotes} onChange={(v) => updateField("ingredients", "dietaryNotes", v)} placeholder="e.g., Contains shellfish, can be made gluten-free..." />
            </>
          )}

          {/* Kitchen tab */}
          {activeTab === "kitchen" && (
            <>
              <FieldTextarea label="Equipment Needed" value={data.kitchen.equipment} onChange={(v) => updateField("kitchen", "equipment", v)} placeholder="e.g., Smoker, immersion circulator, plancha, mandoline..." rows={3} />
              <FieldTextarea label="Station Setup & Space Needs" value={data.kitchen.stationNeeds} onChange={(v) => updateField("kitchen", "stationNeeds", v)} placeholder="How much burner/counter space? Preferred station layout..." rows={2} />
              <FieldInput label="Prep Space / Cold Storage" value={data.kitchen.prepSpace} onChange={(v) => updateField("kitchen", "prepSpace", v)} placeholder="e.g., Need walk-in access, sheet tray rack, speed rack..." />
              <FieldTextarea label="Special Requirements" value={data.kitchen.specialRequirements} onChange={(v) => updateField("kitchen", "specialRequirements", v)} placeholder="Anything else — bringing your own staff, power needs, timing constraints..." rows={2} />
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSave(activeTab)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] text-white cursor-pointer transition-colors disabled:opacity-60"
              style={{
                backgroundColor: saved[activeTab] ? "#22c55e" : currentTab.color,
                ...bodyFont,
              }}
            >
              {saved[activeTab] ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Save Now
                </>
              )}
            </motion.button>

            {onNavigate && (
              <button
                onClick={() => onNavigate("Comms")}
                className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground hover:text-gold transition-colors cursor-pointer"
                style={bodyFont}
              >
                <MessageCircle className="w-3 h-3" />
                Discuss with team
                <ArrowRight className="w-3 h-3 opacity-50" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Reusable field components ─────────────────────────────── */

function FieldInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-foreground text-[0.75rem] mb-1.5 block" style={bodyFont}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg text-[0.8125rem] border border-border bg-background text-foreground focus:outline-none focus:border-gold/50 transition-colors"
        style={bodyFont}
      />
    </div>
  );
}

function FieldTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; rows?: number;
}) {
  return (
    <div>
      <label className="text-foreground text-[0.75rem] mb-1.5 block" style={bodyFont}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg text-[0.8125rem] border border-border bg-background text-foreground focus:outline-none focus:border-gold/50 transition-colors resize-none"
        style={bodyFont}
      />
    </div>
  );
}