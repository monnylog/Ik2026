import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WelcomeStep } from "./step-welcome";
import { ChefQuestionnaire } from "./step-chef";
import { OrientationStep } from "./step-orientation";
import { AppearanceStep } from "./step-appearance";
import { DraftToast } from "./draft-toast";
import type { UserRole } from "./use-auth";
import {
  loadDraft,
  saveDraft,
  useDraftToast,
  defaultChefForm,
  defaultTeamForm,
  type ChefFormData,
  type TeamFormData,
} from "./use-draft";
import { useProfile } from "../../lib/profile-context";
import { getConfirmedChef, prefillChefForm } from "./chef-directory";

interface OnboardingModalProps {
  role: UserRole;
  onComplete: () => void;
}

/*
 * Flow:
 * Chef:       0=Welcome → 1=Appearance → 2=Profile(+ack+storytelling) → 3=Orientation
 * Leadership: bypasses onboarding entirely (handled in App.tsx)
 */

export function OnboardingModal({ role, onComplete }: OnboardingModalProps) {
  const { profile } = useProfile();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [chefForm, setChefForm] = useState<ChefFormData>(defaultChefForm);
  const [teamForm, setTeamForm] = useState<TeamFormData>(defaultTeamForm);
  const { visible: toastVisible, showToast } = useDraftToast();

  // Load draft on mount — or pre-fill from chef directory if available
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.role === role) {
      setStep(draft.step);
      setChefForm(draft.chefForm || defaultChefForm);
      setTeamForm(draft.teamForm || defaultTeamForm);
    } else if (profile?.chefDirectoryId) {
      // Pre-fill from confirmed chef directory
      const chef = getConfirmedChef(profile.chefDirectoryId);
      if (chef) {
        setChefForm(prefillChefForm(chef));
      }
    }
  }, [role, profile?.chefDirectoryId]);

  const persist = useCallback(
    (overrides?: { step?: number }) => {
      saveDraft({ step: overrides?.step ?? step, role, chefForm, teamForm });
      showToast();
    },
    [step, role, chefForm, teamForm, showToast]
  );

  const goNext = () => {
    setDirection(1);
    setStep((s) => {
      const next = s + 1;
      persist({ step: next });
      return next;
    });
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => {
      const next = s - 1;
      persist({ step: next });
      return next;
    });
  };

  const handleChefFormChange = (form: ChefFormData) => {
    setChefForm(form);
    saveDraft({ step, role, chefForm: form, teamForm });
    showToast();
  };

  const totalSteps = 4;

  const getStepLabels = (): string[] => {
    return ["Welcome", "Appearance", "Profile", "Orientation"];
  };

  const renderStep = () => {
    if (step === 0) {
      return <WelcomeStep onNext={goNext} role={role} />;
    }

    if (step === 1) {
      return <AppearanceStep onNext={goNext} onBack={goBack} />;
    }

    if (step === 2) {
      return <ChefQuestionnaire form={chefForm} onFormChange={handleChefFormChange} onSubmit={goNext} onBack={goBack} />;
    }

    if (step === 3) {
      return <OrientationStep role={role} onEnter={onComplete} />;
    }

    return null;
  };

  const stepLabels = getStepLabels();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 backdrop-blur-lg"
        style={{ backgroundColor: "rgba(43,68,100,0.88)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-card rounded-2xl overflow-hidden flex flex-col"
        style={{ boxShadow: "0 25px 50px -12px rgba(40,54,24,0.5)", border: "1px solid rgba(96,108,56,0.1)" }}
      >
        {/* Progress bar */}
        {step > 0 && step < totalSteps - 1 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1.5 px-6 pt-5 pb-2"
          >
            {stepLabels.map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full bg-gold"
                  />
                </div>
                <span
                  className={`text-[0.6rem] uppercase tracking-[0.15em] transition-colors duration-300 ${
                    i <= step ? "text-gold" : "text-muted-foreground/40"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        <div className="flex-1 overflow-y-auto scroll-smooth">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${role}-${step}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -50 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <DraftToast visible={toastVisible} />
    </div>
  );
}