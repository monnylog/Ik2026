import { useState } from "react";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { bodyFont, headingFont } from "../../lib/fonts";

interface StakeholderQuestionnaireProps {
  onSubmit: () => void;
}

const questions = [
  {
    id: "dietary",
    label: "Any dietary restrictions or allergies?",
    options: ["None", "Vegetarian", "Vegan", "Gluten-Free", "Shellfish", "Nut Allergy", "Other"],
  },
  {
    id: "involvement",
    label: "How would you like to be involved?",
    options: ["Active Participant", "Observer / Supporter", "Media / Content Creator", "Sponsor Representative"],
  },
  {
    id: "experience",
    label: "Have you attended a collaborative dinner before?",
    options: ["Yes, multiple times", "Yes, once", "No, this is my first"],
  },
];

export function StakeholderQuestionnaire({ onSubmit }: StakeholderQuestionnaireProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const allAnswered = questions.every((q) => answers[q.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <h2
        className="text-xl mb-1 text-center"
        style={{ ...headingFont, color: "#F4EDE4" }}
      >
        A few quick questions
      </h2>
      <p
        className="text-sm text-center mb-6"
        style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}
      >
        Help us tailor your experience.
      </p>

      <div className="space-y-3">
        {questions.map((q) => (
          <div
            key={q.id}
            className="rounded-xl overflow-hidden"
            style={{
              backgroundColor: "rgba(244,237,228,0.035)",
              border: answers[q.id]
                ? "1px solid rgba(126,158,120,0.3)"
                : "1px solid rgba(201,169,110,0.12)",
            }}
          >
            <button
              onClick={() => setOpenId(openId === q.id ? null : q.id)}
              className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
              style={{ ...bodyFont }}
            >
              <span
                className="text-sm text-left"
                style={{ color: "#F4EDE4" }}
              >
                {q.label}
              </span>
              <div className="flex items-center gap-2">
                {answers[q.id] && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: "rgba(126,158,120,0.1)",
                      color: "#7E9E78",
                    }}
                  >
                    {answers[q.id]}
                  </span>
                )}
                <ChevronDown
                  className="w-4 h-4 transition-transform"
                  style={{
                    color: "rgba(244,237,228,0.3)",
                    transform: openId === q.id ? "rotate(180deg)" : "rotate(0)",
                  }}
                />
              </div>
            </button>

            {openId === q.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-3"
              >
                <div className="space-y-1">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setAnswers((a) => ({ ...a, [q.id]: opt }));
                        setOpenId(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer"
                      style={{
                        ...bodyFont,
                        backgroundColor:
                          answers[q.id] === opt
                            ? "rgba(201,169,110,0.1)"
                            : "rgba(0,0,0,0)",
                        color:
                          answers[q.id] === opt
                            ? "#C9A96E"
                            : "rgba(244,237,228,0.6)",
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <motion.button
        whileHover={allAnswered ? { scale: 1.02 } : {}}
        whileTap={allAnswered ? { scale: 0.98 } : {}}
        onClick={onSubmit}
        disabled={!allAnswered}
        className="w-full h-12 rounded-xl mt-6 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          ...bodyFont,
          fontSize: "0.9375rem",
          fontWeight: 600,
          background: allAnswered
            ? "linear-gradient(135deg, #C9A96E 0%, #B8944F 100%)"
            : "rgba(201,169,110,0.15)",
          color: allAnswered ? "#1E2019" : "rgba(244,237,228,0.3)",
        }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}
