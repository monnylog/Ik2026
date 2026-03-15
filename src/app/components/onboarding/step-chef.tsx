import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Plane,
  User,
  ClipboardCheck,
  BookOpen,
  ChevronDown,
  Check,
  CheckCircle2,
} from "lucide-react";
import type { ChefFormData } from "./use-draft";
import { useProfile } from "../../lib/profile-context";
import { getConfirmedChef } from "./chef-directory";

interface ChefQuestionnaireProps {
  form: ChefFormData;
  onFormChange: (form: ChefFormData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const travelMethods = ["Flying", "Driving", "Train", "Other"];
const shirtSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const storytellingQuestions = [
  "Identify a dish in your repertoire that reflects dual geographic or cultural influences.",
  "What aspect of your heritage is best communicated through your cooking?",
  "How does the Filipino tradition of care through food manifest in your kitchen practice or service approach?",
  "What Filipino dish falls outside your current skill set, and why?",
  "How do you navigate the gap between traditional flavor profiles and locally available ingredients?",
  "What flavor profile or kitchen practice from your background requires the most explanation to those unfamiliar with it?",
];

function useScrollInView(ref: React.RefObject<HTMLDivElement | null>) {
  const [isInView, setIsInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-40px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return isInView;
}

function ScrollRevealQuestion({
  question,
  index,
  value,
  onChange,
}: {
  question: string;
  index: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useScrollInView(ref);
  const sectionFont = { fontFamily: "'Inter', sans-serif" };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.08 * index, ease: "easeOut" }}
    >
      <label
        className="block text-foreground text-[0.875rem] mb-2 leading-relaxed"
        style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}
      >
        {question}
      </label>
      <textarea
        className="w-full px-3 py-2.5 rounded-lg bg-white/80 border border-gold/15 text-foreground text-[0.875rem] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/40 focus:border-gold/30 transition-colors resize-none"
        style={sectionFont}
        rows={3}
        placeholder="Enter your response"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </motion.div>
  );
}

function SectionCheck({ complete }: { complete: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={complete ? { scale: 1 } : { scale: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <CheckCircle2 className="w-4 h-4 text-success" />
    </motion.div>
  );
}

export function ChefQuestionnaire({
  form,
  onFormChange,
  onSubmit,
  onBack,
}: ChefQuestionnaireProps) {
  const { profile } = useProfile();
  const confirmedChef = profile?.chefDirectoryId ? getConfirmedChef(profile.chefDirectoryId) : null;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeSubmit, setShakeSubmit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateField = (field: string, value: string | boolean) => {
    const updated = { ...form, [field]: value };
    onFormChange(updated);
    // Clear error when field is filled
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateStorytelling = (index: number, value: string) => {
    const updated = { ...form, storytelling: [...form.storytelling] };
    updated.storytelling[index] = value;
    onFormChange(updated);
  };

  const travelComplete =
    form.cityOfDeparture.trim() !== "" && form.nearestAirport.trim() !== "";
  const personalComplete = form.shirtSize !== "";
  const acknowledgmentComplete = form.acknowledged;

  const isFormValid =
    form.cityOfDeparture.trim() !== "" &&
    form.nearestAirport.trim() !== "" &&
    form.shirtSize !== "" &&
    form.acknowledged;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.cityOfDeparture.trim())
      newErrors.cityOfDeparture = "City of departure is required";
    if (!form.nearestAirport.trim())
      newErrors.nearestAirport = "Airport is required";
    if (!form.shirtSize) newErrors.shirtSize = "Please select a size";
    if (!form.acknowledged)
      newErrors.acknowledged = "Please acknowledge the requirements";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 600);
      // Scroll to first error
      if (scrollRef.current) {
        const firstError = scrollRef.current.querySelector("[data-error]");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    onSubmit();
  };

  const inputBase =
    "w-full h-10 px-3 rounded-lg bg-input-background text-foreground text-[0.875rem] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 transition-colors";
  const inputClass = (field: string) =>
    `${inputBase} border ${
      errors[field]
        ? "border-destructive/60 focus:ring-destructive/40"
        : "border-border focus:ring-gold/50 focus:border-gold/30"
    }`;
  const textareaClass =
    "w-full px-3 py-2.5 rounded-lg bg-input-background border border-border text-foreground text-[0.875rem] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/30 transition-colors resize-none";
  const labelClass = "block text-[0.8125rem] text-foreground mb-1.5";
  const sectionFont = { fontFamily: "'Inter', sans-serif" };
  const errorClass =
    "text-destructive text-[0.75rem] mt-1 flex items-center gap-1";

  return (
    <div className="px-8 py-8" ref={scrollRef}>
      {/* Back */}
      <motion.button
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground text-[0.8125rem] hover:text-foreground mb-6 cursor-pointer"
        style={sectionFont}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back
      </motion.button>

      {/* Heading */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-foreground mb-1"
        style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif", fontSize: "1.5rem" }}
      >
        {confirmedChef ? `Chef ${confirmedChef.name.split(" ")[0]}'s Profile` : "Chef Profile"}
      </motion.h2>
      <p className="text-muted-foreground text-[0.875rem] mb-2" style={sectionFont}>
        Required for travel coordination, lodging, ingredient sourcing, and
        research documentation.
      </p>
      {confirmedChef && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg mb-6"
          style={{
            backgroundColor: "rgba(126,158,120,0.06)",
            border: "1px solid rgba(126,158,120,0.12)",
          }}
        >
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#7E9E78" }} />
          <span className="text-[0.75rem]" style={{ color: "#7E9E78", ...sectionFont }}>
            Travel info pre-filled from your confirmed details — review and update as needed
          </span>
        </motion.div>
      )}
      {!confirmedChef && <div className="mb-6" />}

      {/* ─── TRAVEL & LOGISTICS ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Plane className="w-4 h-4 text-gold" />
          <h3
            className="text-foreground text-[0.9375rem] flex-1"
            style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}
          >
            Travel & Logistics
          </h3>
          <SectionCheck complete={travelComplete} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div data-error={errors.cityOfDeparture ? "" : undefined}>
            <label className={labelClass} style={sectionFont}>
              City of Departure <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className={inputClass("cityOfDeparture")}
              style={sectionFont}
              placeholder="e.g. Seattle, WA"
              value={form.cityOfDeparture}
              onChange={(e) => updateField("cityOfDeparture", e.target.value)}
            />
            {errors.cityOfDeparture && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={errorClass}
                style={sectionFont}
              >
                {errors.cityOfDeparture}
              </motion.p>
            )}
          </div>
          <div data-error={errors.nearestAirport ? "" : undefined}>
            <label className={labelClass} style={sectionFont}>
              Nearest Major Airport <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              className={inputClass("nearestAirport")}
              style={sectionFont}
              placeholder="e.g. SEA"
              value={form.nearestAirport}
              onChange={(e) => updateField("nearestAirport", e.target.value)}
            />
            {errors.nearestAirport && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className={errorClass}
                style={sectionFont}
              >
                {errors.nearestAirport}
              </motion.p>
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass} style={sectionFont}>
              Preferred Method of Travel
            </label>
            <div className="relative">
              <select
                className={`${inputBase} border border-border focus:ring-gold/50 focus:border-gold/30 appearance-none pr-9`}
                style={sectionFont}
                value={form.travelMethod}
                onChange={(e) => updateField("travelMethod", e.target.value)}
              >
                <option value="">Select...</option>
                {travelMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── PERSONAL ─── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-gold" />
          <h3
            className="text-foreground text-[0.9375rem] flex-1"
            style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}
          >
            Dietary & Allergen Information
          </h3>
          <SectionCheck complete={personalComplete} />
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass} style={sectionFont}>
              Dietary restrictions or allergies
            </label>
            <textarea
              className={textareaClass}
              style={sectionFont}
              rows={2}
              placeholder="List any restrictions"
              value={form.dietaryRestrictions}
              onChange={(e) =>
                updateField("dietaryRestrictions", e.target.value)
              }
            />
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            data-error={errors.shirtSize ? "" : undefined}
          >
            <div>
              <label className={labelClass} style={sectionFont}>
                Shirt Size <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <select
                  className={`${inputClass("shirtSize")} appearance-none pr-9`}
                  style={sectionFont}
                  value={form.shirtSize}
                  onChange={(e) => updateField("shirtSize", e.target.value)}
                >
                  <option value="">Select...</option>
                  {shirtSizes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.shirtSize && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={errorClass}
                  style={sectionFont}
                >
                  {errors.shirtSize}
                </motion.p>
              )}
            </div>
          </div>

          {/* Lodging preference */}
          <div>
            <label className={labelClass} style={sectionFont}>
              Lodging Preference
            </label>
            <div className="space-y-2">
              {[
                { value: "hotel", label: "Hotel" },
                { value: "airbnb", label: "Airbnb" },
                {
                  value: "community",
                  label: "Community Host",
                  description:
                    "Local team members host visiting chefs at their homes",
                },
              ].map((option) => (
                <motion.label
                  key={option.value}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                    form.lodging === option.value
                      ? "border-gold/40 bg-gold/5"
                      : "border-border hover:border-gold/20 hover:bg-secondary/50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      form.lodging === option.value
                        ? "border-gold"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {form.lodging === option.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-gold"
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className="text-foreground text-[0.875rem]"
                      style={sectionFont}
                    >
                      {option.label}
                    </span>
                    {"description" in option && option.description && (
                      <p
                        className="text-muted-foreground text-[0.75rem] mt-0.5"
                        style={sectionFont}
                      >
                        {option.description}
                      </p>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="lodging"
                    value={option.value}
                    checked={form.lodging === option.value}
                    onChange={(e) => updateField("lodging", e.target.value)}
                    className="sr-only"
                  />
                </motion.label>
              ))}
            </div>
          </div>

          {/* Talk toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
            <span
              className="text-foreground text-[0.875rem]"
              style={sectionFont}
            >
              Available to lead a talk, demo, or presentation?
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => updateField("leadTalk", !form.leadTalk)}
              className={`relative w-11 h-6 rounded-full cursor-pointer ${
                form.leadTalk ? "bg-gold" : "bg-switch-background"
              }`}
            >
              <motion.div
                animate={{ x: form.leadTalk ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
              />
            </motion.button>
          </div>
        </div>
      </div>

      {/* ─── INGREDIENTS ACKNOWLEDGMENT ─── */}
      <div className="mb-8" data-error={errors.acknowledged ? "" : undefined}>
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-4 h-4 text-gold" />
          <h3
            className="text-foreground text-[0.9375rem] flex-1"
            style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}
          >
            Ingredient Acknowledgment
          </h3>
          <SectionCheck complete={acknowledgmentComplete} />
        </div>

        <div
          className={`rounded-xl p-5 mb-3 border transition-colors ${
            errors.acknowledged
              ? "bg-destructive/3 border-destructive/20"
              : "bg-gold/5 border-gold/20"
          }`}
        >
          <p
            className="text-foreground text-[0.8125rem] leading-relaxed"
            style={sectionFont}
          >
            To stay within budget and meet local health department standards, we
            require:
          </p>
          <ol
            className="mt-3 space-y-2 text-[0.8125rem] text-muted-foreground"
            style={sectionFont}
          >
            <li className="flex gap-2">
              <span className="text-gold shrink-0">1.</span>
              Receipts for all ingredients transported or prepped off-site
            </li>
            <li className="flex gap-2">
              <span className="text-gold shrink-0">2.</span>
              A pre-approved COGS ceiling for off-site prep
            </li>
            <li className="flex gap-2">
              <span className="text-gold shrink-0">3.</span>
              Confirmation that off-site prep follows food handling protocols for
              transport to Vegas
            </li>
          </ol>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => updateField("acknowledged", !form.acknowledged)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${
              form.acknowledged
                ? "bg-gold border-gold"
                : errors.acknowledged
                ? "border-destructive/50 hover:border-destructive"
                : "border-muted-foreground/30 hover:border-gold/50"
            }`}
          >
            {form.acknowledged && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <Check className="w-3 h-3 text-navy" />
              </motion.div>
            )}
          </motion.button>
          <span className="text-foreground text-[0.8125rem]" style={sectionFont}>
            Yes, understood <span className="text-destructive">*</span>
          </span>
        </label>
        {errors.acknowledged && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-destructive text-[0.75rem] mt-2 ml-8"
            style={sectionFont}
          >
            {errors.acknowledged}
          </motion.p>
        )}
      </div>

      {/* ─── STORYTELLING & HERITAGE ─── */}
      <div
        className="rounded-xl p-6 mb-8 border border-gold/15"
        style={{ background: "linear-gradient(to bottom, rgba(192,209,177,0.15), rgba(205,168,138,0.08))" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-gold" />
          <h3
            className="text-foreground text-[0.9375rem]"
            style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}
          >
            Storytelling
          </h3>
        </div>
        <p
          className="text-muted-foreground text-[0.8125rem] mb-6"
          style={sectionFont}
        >
          These questions inform the research and storytelling components of the
          event. Respond with as much or as little detail as you prefer.
        </p>

        <div className="space-y-7">
          {storytellingQuestions.map((question, idx) => (
            <ScrollRevealQuestion
              key={idx}
              question={question}
              index={idx}
              value={form.storytelling[idx] || ""}
              onChange={(v) => updateStorytelling(idx, v)}
            />
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground/50 text-[0.75rem]" style={sectionFont}>
          <span className="text-destructive">*</span> Required fields
        </p>
        <motion.button
          animate={
            shakeSubmit
              ? {
                  x: [0, -8, 8, -6, 6, -3, 3, 0],
                }
              : {}
          }
          transition={{ duration: 0.5 }}
          whileHover={
            isFormValid
              ? { scale: 1.03, boxShadow: "0 8px 30px rgba(205,168,138,0.25)" }
              : {}
          }
          whileTap={isFormValid ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          className={`px-8 py-3 rounded-xl cursor-pointer ${
            isFormValid
              ? "bg-gold text-white"
              : "bg-gold/40 text-navy/60"
          }`}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.9375rem",
          }}
        >
          Submit Profile
        </motion.button>
      </div>
    </div>
  );
}