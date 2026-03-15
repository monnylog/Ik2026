import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  User,
  UtensilsCrossed,
  Plane,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  X,
  Sparkles,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { useProfile } from "../../lib/profile-context";
import { getConfirmedChef } from "../onboarding/chef-directory";
import { useUserData } from "../../lib/use-user-data";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface TourStep {
  id: string;
  icon: typeof ChefHat;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  body: string;
  cta: string;
  navigateTo: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    icon: Heart,
    iconColor: "#C9A96E",
    iconBg: "rgba(201,169,110,0.1)",
    title: "Welcome to Isang Kusina",
    subtitle: "Your coordination hub for May 22, 2026",
    body: "This is your home base for everything related to the dinner. Take things at your own pace \u2014 there's no rush. We're glad you're here.",
    cta: "Let's get started",
    navigateTo: "",
  },
  {
    id: "profile",
    icon: User,
    iconColor: "#7E9E78",
    iconBg: "rgba(126,158,120,0.1)",
    title: "Set Up Your Profile",
    subtitle: "Let the team know who you are",
    body: "Head to Settings to customize your display name, avatar, and upload a photo. This is how you'll appear in chat and across the hub.",
    cta: "Go to Settings",
    navigateTo: "Settings",
  },
  {
    id: "submissions",
    icon: UtensilsCrossed,
    iconColor: "#C9A96E",
    iconBg: "rgba(201,169,110,0.1)",
    title: "Submit Your Course Details",
    subtitle: "Dish concept, ingredients & kitchen needs",
    body: "When you're ready, visit Menu & Courses to share your dish concept, file your ingredient list, and log any kitchen equipment you'll need. You can save drafts and come back anytime.",
    cta: "View Menu & Courses",
    navigateTo: "Menu & Courses",
  },
  {
    id: "travel",
    icon: Plane,
    iconColor: "#4A7FB5",
    iconBg: "rgba(74,127,181,0.1)",
    title: "Confirm Travel & Lodging",
    subtitle: "Flights, accommodation & arrival details",
    body: "Check the Travel & Lodging section for event logistics. If you've already booked, you can mark your travel as confirmed from the Progress tracker on your dashboard.",
    cta: "Check Travel Info",
    navigateTo: "Travel & Lodging",
  },
  {
    id: "comms",
    icon: MessageCircle,
    iconColor: "#7E9E78",
    iconBg: "rgba(126,158,120,0.1)",
    title: "Join the Conversation",
    subtitle: "Chat with the team and your research partner",
    body: "The Comms section has real-time chat channels for the whole team. You'll also connect with your assigned research partner there. Don't be shy \u2014 we're all in this together.",
    cta: "Open Comms",
    navigateTo: "Comms",
  },
  {
    id: "done",
    icon: Sparkles,
    iconColor: "#C9A96E",
    iconBg: "rgba(201,169,110,0.1)",
    title: "You're All Set",
    subtitle: "Your dashboard will track everything",
    body: "Your Progress tracker on the dashboard shows what's done and what's next. Take it one step at a time. The leadership team is here whenever you need support.",
    cta: "Go to Dashboard",
    navigateTo: "Dashboard",
  },
];

interface ChefWelcomeTourProps {
  onNavigate: (page: string) => void;
}

export function ChefWelcomeTour({ onNavigate }: ChefWelcomeTourProps) {
  const { profile } = useProfile();
  const [tourDismissed, setTourDismissed] = useUserData<boolean>("chef-tour-dismissed", false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showTour, setShowTour] = useState(false);

  const confirmedChef = profile?.chefDirectoryId
    ? getConfirmedChef(profile.chefDirectoryId)
    : null;

  // Profile-specific localStorage flag so tour only shows once per profile
  const profileTourKey = profile?.id ? `hasSeenTour_chef_${profile.id}` : null;

  // Show the tour if not dismissed
  useEffect(() => {
    if (profileTourKey && localStorage.getItem(profileTourKey) === "true") {
      return;
    }
    if (!tourDismissed) {
      setShowTour(true);
    }
  }, [tourDismissed, profileTourKey]);

  // Listen for manual re-trigger from top bar
  useEffect(() => {
    const handler = () => {
      setTourDismissed(false);
      if (profileTourKey) localStorage.removeItem(profileTourKey);
      setCurrentStep(0);
      setShowTour(true);
    };
    window.addEventListener("ik26-restart-tour", handler);
    return () => window.removeEventListener("ik26-restart-tour", handler);
  }, [profileTourKey, setTourDismissed]);

  if (!showTour) return null;
  if (profileTourKey && localStorage.getItem(profileTourKey) === "true" && tourDismissed) return null;

  const step = tourSteps[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const goNext = () => {
    if (isLast) {
      // Done — dismiss tour
      setTourDismissed(true);
      if (profileTourKey) localStorage.setItem(profileTourKey, "true");
      setShowTour(false);
      return;
    }
    setDirection(1);
    setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const dismiss = () => {
    setTourDismissed(true);
    if (profileTourKey) localStorage.setItem(profileTourKey, "true");
    setShowTour(false);
  };

  const handleCta = () => {
    if (step.navigateTo && step.navigateTo !== "Dashboard" && step.navigateTo !== "") {
      onNavigate(step.navigateTo);
    }
    goNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(201,169,110,0.15)",
        boxShadow: "0 4px 24px rgba(201,169,110,0.06)",
      }}
    >
      {/* Progress bar */}
      <div className="h-1" style={{ backgroundColor: "rgba(201,169,110,0.08)" }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #C9A96E, #CDA88A)" }}
        />
      </div>

      {/* Header with dismiss */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#C9A96E" }} />
          <ChefHat className="w-4 h-4" style={{ color: "#C9A96E" }} />
          <span className="text-foreground text-[0.875rem]" style={headingFont}>
            {confirmedChef ? `Welcome, Chef ${confirmedChef.name.split(" ")[0]}` : "Getting Started"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/40 text-[0.625rem]" style={bodyFont}>
            {currentStep + 1} of {tourSteps.length}
          </span>
          <button
            onClick={dismiss}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer"
            title="Skip tour"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground/40" />
          </button>
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="px-4 sm:px-5 py-3 sm:py-4"
        >
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: step.iconBg }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: step.iconColor }} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-foreground text-[0.9375rem] sm:text-[1.0625rem] mb-0.5" style={headingFont}>
                {step.title}
              </h3>
              <p className="text-muted-foreground/60 text-[0.6875rem] mb-2.5" style={bodyFont}>
                {step.subtitle}
              </p>
              <p className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>
                {step.body}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-4 sm:px-5 pb-4 pt-1">
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
          {!isLast && (
            <button
              onClick={dismiss}
              className="px-3 py-1.5 rounded-lg text-[0.75rem] text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer"
              style={bodyFont}
            >
              Skip tour
            </button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCta}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[0.8125rem] text-white cursor-pointer"
            style={{
              backgroundColor: step.iconColor,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {step.cta}
              </>
            ) : (
              <>
                {step.cta}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5 pb-4">
        {tourSteps.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentStep ? 1 : -1);
              setCurrentStep(idx);
            }}
            className="cursor-pointer"
          >
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: idx === currentStep ? 16 : 6,
                height: 6,
                backgroundColor:
                  idx === currentStep
                    ? "#C9A96E"
                    : idx < currentStep
                      ? "rgba(126,158,120,0.3)"
                      : "rgba(205,168,138,0.15)",
              }}
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}