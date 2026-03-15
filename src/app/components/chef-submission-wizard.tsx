import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  Lightbulb,
  Package,
  Camera,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Check,
  Send,
  Loader2,
  Cloud,
  CloudOff,
  Sparkles,
  X,
  Upload,
} from "lucide-react";
import { apiFetch, supabase } from "../lib/supabase";
import { useProfile } from "../lib/profile-context";
import { serverBase } from "../lib/supabase";
import { publicAnonKey } from "/utils/supabase/info";
import { toast } from "sonner";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Lightbulb;
  color: string;
  bgColor: string;
}

const steps: WizardStep[] = [
  {
    id: "course",
    title: "Course & Dish",
    subtitle: "What are you creating?",
    icon: ChefHat,
    color: "#C49370",
    bgColor: "rgba(196,147,112,0.08)",
  },
  {
    id: "description",
    title: "Description & Story",
    subtitle: "Tell us about your dish",
    icon: Lightbulb,
    color: "#D4A843",
    bgColor: "rgba(212,168,67,0.08)",
  },
  {
    id: "ingredients",
    title: "Key Ingredients",
    subtitle: "What goes into it?",
    icon: Package,
    color: "#7E9E78",
    bgColor: "rgba(126,158,120,0.08)",
  },
  {
    id: "dietary",
    title: "Dietary & Allergens",
    subtitle: "Important for guest safety",
    icon: AlertTriangle,
    color: "#E5573F",
    bgColor: "rgba(229,87,63,0.08)",
  },
  {
    id: "plating",
    title: "Plating Concept",
    subtitle: "Visual presentation",
    icon: Camera,
    color: "#4A7FB5",
    bgColor: "rgba(74,127,181,0.08)",
  },
  {
    id: "story",
    title: "Cultural Inspiration",
    subtitle: "The story behind the dish",
    icon: BookOpen,
    color: "#5C7256",
    bgColor: "rgba(92,114,86,0.08)",
  },
];

interface SubmissionFormData {
  courseTitle: string;
  dishName: string;
  description: string;
  keyIngredients: string;
  specialtyItems: string;
  dietaryNotes: string;
  allergens: string[];
  platingConcept: string;
  platingPhotoUrl: string;
  culturalStory: string;
  inspiration: string;
}

const emptyForm: SubmissionFormData = {
  courseTitle: "",
  dishName: "",
  description: "",
  keyIngredients: "",
  specialtyItems: "",
  dietaryNotes: "",
  allergens: [],
  platingConcept: "",
  platingPhotoUrl: "",
  culturalStory: "",
  inspiration: "",
};

const allergenOptions = [
  "Shellfish",
  "Tree Nuts",
  "Peanuts",
  "Dairy",
  "Gluten",
  "Soy",
  "Eggs",
  "Fish",
  "Sesame",
];

interface ChefSubmissionWizardProps {
  onNavigate?: (page: string) => void;
  onClose?: () => void;
}

export function ChefSubmissionWizard({
  onNavigate,
  onClose,
}: ChefSubmissionWizardProps) {
  const { profile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState<SubmissionFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "error">("idle");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing data
  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiFetch(
          `/user-data/${profile.id}/chef-submission-wizard`
        );
        if (res.data) {
          setForm({ ...emptyForm, ...res.data });
          setSyncStatus("synced");
        }
      } catch (e) {
        console.error("Failed to load wizard data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const persistData = async (data: SubmissionFormData) => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      await apiFetch(`/user-data/${profile.id}/chef-submission-wizard`, {
        method: "PUT",
        body: JSON.stringify({ data }),
      });
      setSyncStatus("synced");

      // Also update the old submissions format for backward compat
      const legacyData = {
        concept: {
          dishName: data.dishName,
          description: data.description,
          plating: data.platingConcept,
          story: data.culturalStory,
        },
        ingredients: {
          keyIngredients: data.keyIngredients,
          specialtyItems: data.specialtyItems,
          sourcing: "",
          dietaryNotes: data.dietaryNotes,
        },
        kitchen: {
          equipment: "",
          stationNeeds: "",
          prepSpace: "",
          specialRequirements: "",
        },
      };
      await apiFetch(`/user-data/${profile.id}/chef-submissions`, {
        method: "PUT",
        body: JSON.stringify({ data: legacyData }),
      });

      // Broadcast
      try {
        await supabase.channel("ik26-chef-submissions").send({
          type: "broadcast",
          event: "submission-update",
          payload: {
            userId: profile.id,
            displayName: profile.displayName,
            avatarId: profile.avatarId,
            submissions: legacyData,
            updatedAt: new Date().toISOString(),
          },
        });
      } catch {}
    } catch (e) {
      console.error("Save failed:", e);
      setSyncStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (
    field: keyof SubmissionFormData,
    value: string | string[]
  ) => {
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    setSyncStatus("idle");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => persistData(newForm), 3000);
  };

  const toggleAllergen = (a: string) => {
    const newAllergens = form.allergens.includes(a)
      ? form.allergens.filter((x) => x !== a)
      : [...form.allergens, a];
    updateField("allergens", newAllergens);
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };
  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    await persistData(form);
    setSubmitted(true);
    toast.success("Menu submission saved! You can update it anytime.");
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const StepIcon = step.icon;

  if (loading) {
    return (
      <div
        className="bg-card rounded-xl p-8 flex items-center justify-center gap-2"
        style={{ border: "1px solid rgba(196,147,112,0.15)" }}
      >
        <Loader2 className="w-4 h-4 animate-spin text-gold" />
        <span
          className="text-muted-foreground text-[0.8125rem]"
          style={bodyFont}
        >
          Loading your creative brief...
        </span>
      </div>
    );
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-xl overflow-hidden text-center p-8"
        style={{ border: "1px solid rgba(93,160,107,0.2)" }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "rgba(93,160,107,0.1)" }}
        >
          <Sparkles className="w-8 h-8" style={{ color: "#5DA06B" }} />
        </div>
        <h3
          className="text-foreground text-[1.25rem] mb-2"
          style={headingFont}
        >
          Submission Saved!
        </h3>
        <p
          className="text-muted-foreground text-[0.875rem] mb-1 max-w-sm mx-auto"
          style={bodyFont}
        >
          Your menu concept for{" "}
          <strong>{form.dishName || "your dish"}</strong> has been recorded.
        </p>
        <p
          className="text-muted-foreground/60 text-[0.75rem] mb-6"
          style={bodyFont}
        >
          You can come back and update it anytime before the event.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setSubmitted(false)}
            className="px-4 py-2 rounded-xl text-[0.8125rem] border border-border hover:border-gold/30 transition-colors cursor-pointer"
            style={bodyFont}
          >
            Edit Again
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[0.8125rem] text-white cursor-pointer"
              style={{ backgroundColor: "#5DA06B", ...bodyFont }}
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(196,147,112,0.15)",
        boxShadow: "0 4px 24px rgba(196,147,112,0.06)",
      }}
    >
      {/* Progress bar */}
      <div className="h-1" style={{ backgroundColor: "rgba(196,147,112,0.08)" }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${step.color}, #D4A843)` }}
        />
      </div>

      {/* Header */}
      <div className="px-4 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(196,147,112,0.08)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C49370" }} />
            <ChefHat className="w-4 h-4" style={{ color: "#C49370" }} />
            <h3 className="text-foreground" style={headingFont}>
              Creative Brief
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {saving ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : syncStatus === "synced" ? (
              <Cloud className="w-3 h-3 text-green-500" />
            ) : syncStatus === "error" ? (
              <CloudOff className="w-3 h-3 text-red-400" />
            ) : null}
            <span
              className="text-muted-foreground/40 text-[0.625rem]"
              style={bodyFont}
            >
              {currentStep + 1}/{steps.length}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground/40" />
              </button>
            )}
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mt-3">
          {steps.map((s, idx) => {
            const SIcon = s.icon;
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setDirection(idx > currentStep ? 1 : -1);
                  setCurrentStep(idx);
                }}
                className="flex-1 cursor-pointer group"
              >
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isActive
                      ? s.color
                      : isDone
                        ? `${s.color}60`
                        : "rgba(0,0,0,0.06)",
                  }}
                />
                <div className="flex items-center gap-1 mt-1.5 justify-center">
                  <SIcon
                    className="w-2.5 h-2.5"
                    style={{
                      color: isActive
                        ? s.color
                        : isDone
                          ? `${s.color}80`
                          : "rgba(0,0,0,0.15)",
                    }}
                  />
                  <span
                    className="text-[0.5rem] hidden sm:inline truncate"
                    style={{
                      color: isActive
                        ? s.color
                        : "var(--muted-foreground)",
                      opacity: isActive ? 1 : 0.4,
                      ...bodyFont,
                    }}
                  >
                    {s.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 sm:px-6 py-5 space-y-4"
        >
          {/* Step header */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: step.bgColor }}
            >
              <StepIcon className="w-5 h-5" style={{ color: step.color }} />
            </div>
            <div>
              <h4
                className="text-foreground text-[1rem]"
                style={headingFont}
              >
                {step.title}
              </h4>
              <p
                className="text-muted-foreground/60 text-[0.6875rem]"
                style={bodyFont}
              >
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Step 1: Course & Dish */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <WizardInput
                label="Course Title"
                value={form.courseTitle}
                onChange={(v) => updateField("courseTitle", v)}
                placeholder="e.g., Second Course — Mindanao"
                hint="Which course are you assigned to?"
              />
              <WizardInput
                label="Dish Name"
                value={form.dishName}
                onChange={(v) => updateField("dishName", v)}
                placeholder="e.g., Smoked Salmon Sinigang"
                hint="Working title is fine — you can refine later."
              />
            </div>
          )}

          {/* Step 2: Description */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <WizardTextarea
                label="Dish Description"
                value={form.description}
                onChange={(v) => updateField("description", v)}
                placeholder="Describe your dish — flavors, technique, what makes it special..."
                rows={4}
                hint="Think of how you'd describe it to a curious dinner guest."
              />
            </div>
          )}

          {/* Step 3: Ingredients */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <WizardTextarea
                label="Key Ingredients"
                value={form.keyIngredients}
                onChange={(v) => updateField("keyIngredients", v)}
                placeholder={"Wild salmon — 10 lbs\nFresh tamarind — 3 lbs\nMalunggay leaves — 2 bunches"}
                rows={5}
                hint="One ingredient per line with approximate quantity."
              />
              <WizardTextarea
                label="Specialty / Hard-to-Source Items"
                value={form.specialtyItems}
                onChange={(v) => updateField("specialtyItems", v)}
                placeholder="Items needing advance ordering or special sourcing..."
                rows={2}
                hint="We'll source these early — the more detail, the better."
              />
            </div>
          )}

          {/* Step 4: Dietary */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label
                  className="block text-foreground text-[0.8125rem] mb-2"
                  style={bodyFont}
                >
                  Common Allergens Present
                </label>
                <div className="flex flex-wrap gap-2">
                  {allergenOptions.map((a) => {
                    const isSelected = form.allergens.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => toggleAllergen(a)}
                        className={`px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-all ${
                          isSelected
                            ? "text-white"
                            : "border border-border text-muted-foreground hover:border-gold/30"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? "#E5573F"
                            : "transparent",
                          ...bodyFont,
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              </div>
              <WizardTextarea
                label="Additional Dietary Notes"
                value={form.dietaryNotes}
                onChange={(v) => updateField("dietaryNotes", v)}
                placeholder="e.g., Can be made gluten-free on request. Contains fermented shrimp paste."
                rows={2}
                hint="Help the team prepare for guests with dietary restrictions."
              />
            </div>
          )}

          {/* Step 5: Plating */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <WizardTextarea
                label="Plating & Presentation Vision"
                value={form.platingConcept}
                onChange={(v) => updateField("platingConcept", v)}
                placeholder="How do you envision the plating? Vessels, garnishes, color story..."
                rows={3}
                hint="Describe the visual story. Any specific dishware or styling?"
              />
              <div>
                <label
                  className="block text-foreground text-[0.8125rem] mb-2"
                  style={bodyFont}
                >
                  Reference Photo{" "}
                  <span className="text-muted-foreground/40">(optional)</span>
                </label>
                {form.platingPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={form.platingPhotoUrl}
                      alt="Plating reference"
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <button
                      onClick={() => updateField("platingPhotoUrl", "")}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-xl border-2 border-dashed border-border hover:border-gold/30 transition-colors p-6 text-center cursor-pointer"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file || !profile) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error("Max 2MB");
                          return;
                        }
                        setUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch(
                            `${serverBase}/upload-photo/${profile.id}`,
                            {
                              method: "POST",
                              headers: {
                                Authorization: `Bearer ${publicAnonKey}`,
                              },
                              body: fd,
                            }
                          );
                          if (!res.ok) throw new Error("Upload failed");
                          const data = await res.json();
                          updateField("platingPhotoUrl", data.url);
                          toast.success("Photo uploaded!");
                        } catch (err: any) {
                          toast.error(err.message || "Upload failed");
                        } finally {
                          setUploading(false);
                        }
                      };
                      input.click();
                    }}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-gold mx-auto" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gold/40 mx-auto mb-1.5" />
                        <p
                          className="text-muted-foreground text-[0.75rem]"
                          style={bodyFont}
                        >
                          Upload a reference image
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Cultural Story */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <WizardTextarea
                label="Cultural Story / Inspiration"
                value={form.culturalStory}
                onChange={(v) => updateField("culturalStory", v)}
                placeholder="What story does this dish tell? How does it connect to the region, era, or your personal journey?"
                rows={4}
                hint="This helps the storytelling team weave your narrative into the event."
              />
              <WizardInput
                label="Inspiration Source"
                value={form.inspiration}
                onChange={(v) => updateField("inspiration", v)}
                placeholder="e.g., My lola's recipe from Pampanga, adapted for modern palate"
                hint="A person, place, memory, or tradition that inspired this dish."
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4"
        style={{ borderTop: "1px solid rgba(196,147,112,0.08)" }}
      >
        <div>
          {!isFirst && (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
              style={bodyFont}
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isLast ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] text-white cursor-pointer"
              style={{ backgroundColor: step.color, ...bodyFont }}
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-[0.8125rem] text-white cursor-pointer disabled:opacity-60"
              style={{ backgroundColor: "#5DA06B", ...bodyFont }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Brief
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Gentle encouragement */}
      <div
        className="px-4 sm:px-6 py-2.5"
        style={{
          borderTop: "1px solid rgba(196,147,112,0.05)",
          backgroundColor: "rgba(212,168,67,0.02)",
        }}
      >
        <p
          className="text-muted-foreground/40 text-[0.625rem] text-center italic"
          style={bodyFont}
        >
          Auto-saves as you type. No pressure — you can update anytime before
          May.
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Reusable field components ─────────────────────── */

function WizardInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        className="block text-foreground text-[0.8125rem] mb-1.5"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-4 rounded-xl text-[0.875rem] border border-border bg-background text-foreground focus:outline-none focus:border-gold/50 transition-colors"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      {hint && (
        <p
          className="text-muted-foreground/40 text-[0.625rem] mt-1"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function WizardTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <label
        className="block text-foreground text-[0.8125rem] mb-1.5"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-xl text-[0.875rem] border border-border bg-background text-foreground focus:outline-none focus:border-gold/50 transition-colors resize-none leading-relaxed"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      {hint && (
        <p
          className="text-muted-foreground/40 text-[0.625rem] mt-1"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}