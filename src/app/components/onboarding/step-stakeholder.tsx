import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";

interface StakeholderQuestionnaireProps {
  onSubmit: () => void;
}

const bodyFont = { fontFamily: "'Inter', sans-serif" };

export function StakeholderQuestionnaire({ onSubmit }: StakeholderQuestionnaireProps) {
  const [form, setForm] = useState({
    fullName: "",
    organization: "",
    connection: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeSubmit, setShakeSubmit] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const isValid = form.fullName.trim() !== "";

  const handleSubmit = () => {
    if (!form.fullName.trim()) {
      setErrors({ fullName: "Name is required" });
      setShakeSubmit(true);
      setTimeout(() => setShakeSubmit(false), 600);
      return;
    }
    onSubmit();
  };

  const inputClass = (field: string) =>
    `w-full h-10 px-3 rounded-lg bg-input-background text-foreground text-[0.875rem] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 transition-colors border ${
      errors[field] ? "border-destructive/60 focus:ring-destructive/40" : "border-border focus:ring-gold/50 focus:border-gold/30"
    }`;

  const connections = [
    "Sponsor / Partner",
    "Media / Press",
    "Community Leader",
    "Industry Peer",
    "Government / Cultural Org",
    "Friend of the Event",
    "Other",
  ];

  return (
    <div className="px-8 py-8">
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-foreground mb-1"
        style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif", fontSize: "1.5rem" }}
      >
        Quick profile
      </motion.h2>
      <p className="text-muted-foreground text-[0.875rem] mb-8" style={bodyFont}>
        Just the essentials — we'll keep it brief.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-[0.8125rem] text-foreground mb-1.5" style={bodyFont}>
            Full Name <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            className={inputClass("fullName")}
            style={bodyFont}
            placeholder="Your full name"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
          />
          {errors.fullName && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-destructive text-[0.75rem] mt-1" style={bodyFont}>
              {errors.fullName}
            </motion.p>
          )}
        </div>

        <div>
          <label className="block text-[0.8125rem] text-foreground mb-1.5" style={bodyFont}>
            Organization
          </label>
          <input
            type="text"
            className={inputClass("organization")}
            style={bodyFont}
            placeholder="Company or organization"
            value={form.organization}
            onChange={(e) => updateField("organization", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[0.8125rem] text-foreground mb-1.5" style={bodyFont}>
            Connection to IK26
          </label>
          <div className="relative">
            <select
              className={`${inputClass("connection")} appearance-none pr-9`}
              style={bodyFont}
              value={form.connection}
              onChange={(e) => updateField("connection", e.target.value)}
            >
              <option value="">Select...</option>
              {connections.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <motion.button
          animate={shakeSubmit ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.5 }}
          whileHover={isValid ? { scale: 1.03, boxShadow: "0 8px 30px rgba(96,108,56,0.25)" } : {}}
          whileTap={isValid ? { scale: 0.98 } : {}}
          onClick={handleSubmit}
          className={`px-8 py-3 rounded-xl cursor-pointer ${
            isValid ? "bg-gold text-white" : "bg-gold/40 text-white/60"
          }`}
          style={{ ...bodyFont, fontSize: "0.9375rem" }}
        >
          Continue
        </motion.button>
      </div>
    </div>
  );
}