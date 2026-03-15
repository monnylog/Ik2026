import { useState, useRef } from "react";
import { motion } from "motion/react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { TeamFormData } from "./use-draft";

interface TeamQuestionnaireProps {
  form: TeamFormData;
  onFormChange: (form: TeamFormData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const roles = [
  "Event Strategy & Ops",
  "Creative Direction",
  "F&B / Events",
  "Kitchen / BOH",
  "Beverage Program",
  "Research & Storytelling",
  "Social Media / Marketing",
  "Design",
  "Content / Video Production",
  "Finance / Budget",
  "Ticketing / Booking",
  "Documentary / Film",
  "FOH Staffing",
  "Community Outreach",
  "Sponsorship",
  "PR",
  "Communications",
  "Day-Of Coordinator",
  "Other",
];

const shirtSizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

export function TeamQuestionnaire({
  form,
  onFormChange,
  onSubmit,
  onBack,
}: TeamQuestionnaireProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeSubmit, setShakeSubmit] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const updateField = (field: string, value: string) => {
    onFormChange({ ...form, [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const isFormValid = form.fullName.trim() !== "" && form.role !== "";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.role) newErrors.role = "Please select your role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 600);
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
        Team Profile
      </motion.h2>
      <p
        className="text-muted-foreground text-[0.875rem] mb-8"
        style={sectionFont}
      >
        Required for role assignment and coordination.
      </p>

      <div className="space-y-5">
        {/* Full Name */}
        <div data-error={errors.fullName ? "" : undefined}>
          <label className={labelClass} style={sectionFont}>
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={inputClass("fullName")}
            style={sectionFont}
            placeholder="Your full name"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
          {errors.fullName && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={errorClass}
              style={sectionFont}
            >
              {errors.fullName}
            </motion.p>
          )}
        </div>

        {/* Role / Function */}
        <div data-error={errors.role ? "" : undefined}>
          <label className={labelClass} style={sectionFont}>
            Role / Function <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <select
              className={`${inputClass("role")} appearance-none pr-9`}
              style={sectionFont}
              value={form.role}
              onChange={(e) => updateField("role", e.target.value)}
            >
              <option value="">Select your role...</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          {errors.role && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={errorClass}
              style={sectionFont}
            >
              {errors.role}
            </motion.p>
          )}
        </div>

        {/* Shirt Size */}
        <div>
          <label className={labelClass} style={sectionFont}>
            Shirt Size
          </label>
          <div className="relative">
            <select
              className={`${inputBase} border border-border focus:ring-gold/50 focus:border-gold/30 appearance-none pr-9`}
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
        </div>

        {/* Availability */}
        <div>
          <label className={labelClass} style={sectionFont}>
            Availability Notes
          </label>
          <textarea
            className={textareaClass}
            style={sectionFont}
            rows={3}
            placeholder="Scheduling constraints, blackout dates, or timezone notes"
            value={form.availability}
            onChange={(e) => updateField("availability", e.target.value)}
          />
        </div>

        {/* Work style */}
        <div
          className="rounded-xl p-5 border border-gold/15"
          style={{
            background: "linear-gradient(to bottom, rgba(192,209,177,0.15), rgba(205,168,138,0.08))",
          }}
        >
          <label
            className="block text-foreground text-[0.875rem] mb-2 leading-relaxed"
            style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" }}
          >
            What communication or workflow preference should the team be aware of?
          </label>
          <textarea
            className="w-full px-3 py-2.5 rounded-lg bg-white/80 border border-gold/15 text-foreground text-[0.875rem] placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-gold/40 focus:border-gold/30 transition-colors resize-none"
            style={sectionFont}
            rows={3}
            placeholder="Enter your response"
            value={form.workStyle}
            onChange={(e) => updateField("workStyle", e.target.value)}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between mt-8">
        <p
          className="text-muted-foreground/50 text-[0.75rem]"
          style={sectionFont}
        >
          <span className="text-destructive">*</span> Required fields
        </p>
        <motion.button
          animate={
            shakeSubmit
              ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
              : {}
          }
          transition={{ duration: 0.5 }}
          whileHover={
            isFormValid
              ? {
                  scale: 1.03,
                  boxShadow: "0 8px 30px rgba(96,108,56,0.25)",
                }
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