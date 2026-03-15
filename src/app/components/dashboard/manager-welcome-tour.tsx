import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  BarChart3,
  Users,
  ClipboardCheck,
  Key,
  Compass,
  ArrowRight,
  ArrowLeft,
  X,
  CheckCircle2,
  Heart,
} from "lucide-react";
import { useProfile } from "../../lib/profile-context";
import { useUserData } from "../../lib/use-user-data";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface TourStep {
  id: string;
  icon: typeof Shield;
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
    iconColor: "#DDA15E",
    iconBg: "rgba(221,161,94,0.1)",
    title: "Welcome to Command Center",
    subtitle: "You're leading Isang Kusina 2026",
    body: "This is your operations dashboard for coordinating every aspect of the dinner \u2014 from chef management to event logistics. Everything the team and chefs see flows from decisions you make here.",
    cta: "Let's get started",
    navigateTo: "",
  },
  {
    id: "readiness",
    icon: ClipboardCheck,
    iconColor: "#5DA06B",
    iconBg: "rgba(93,160,107,0.1)",
    title: "Review Deployment Readiness",
    subtitle: "Track what's done and what's blocking",
    body: "The Deployment Readiness panel on your dashboard shows real-time completion across all workstreams \u2014 venue, staffing, menu, travel, and more. Critical items surface automatically from your Notion workspace.",
    cta: "View Dashboard",
    navigateTo: "Dashboard",
  },
  {
    id: "analytics",
    icon: BarChart3,
    iconColor: "#DDA15E",
    iconBg: "rgba(221,161,94,0.1)",
    title: "Check Analytics & Metrics",
    subtitle: "Real-time engagement and submission tracking",
    body: "The Analytics Overview shows chef submission rates, team onboarding progress, milestone completion, and engagement pulse \u2014 all pulling live data from the KV store and Notion. Use it to spot bottlenecks early.",
    cta: "View Analytics",
    navigateTo: "Dashboard",
  },
  {
    id: "team",
    icon: Users,
    iconColor: "#4A7FB5",
    iconBg: "rgba(74,127,181,0.1)",
    title: "Manage Team & Chefs",
    subtitle: "Onboard, assign, and coordinate",
    body: "Use the Chef Roster to track all 7 chefs and their submissions. Team Deploy handles your crew assignments. The Members page lets you manage access codes and user profiles. Preview how chefs and team see the app with the role switcher.",
    cta: "Open Chef Roster",
    navigateTo: "Chef Roster",
  },
  {
    id: "access",
    icon: Key,
    iconColor: "#CDA88A",
    iconBg: "rgba(205,168,138,0.1)",
    title: "Configure Access & Invites",
    subtitle: "Share the right codes with the right people",
    body: "Three access tiers keep things organized: leadership (northstar222), team (teamik26/ops2026), and chef (kusina2026/chefik26). Share team codes with Denise, Kara, and Sarah. Share chef codes when chefs are ready to onboard.",
    cta: "View Members",
    navigateTo: "Members",
  },
  {
    id: "explore",
    icon: Compass,
    iconColor: "#7E9E78",
    iconBg: "rgba(126,158,120,0.1)",
    title: "Explore All Features",
    subtitle: "Budget, timeline, comms, and more",
    body: "You have access to everything: Budget & COGS tracking, the Event Timeline synced from Notion, real-time Comms channels, Research & Story coordination, and Links & Resources. Use \u2318K to quickly jump between any section.",
    cta: "Start managing",
    navigateTo: "Dashboard",
  },
];

interface ManagerWelcomeTourProps {
  onNavigate: (page: string) => void;
}

export function ManagerWelcomeTour({ onNavigate }: ManagerWelcomeTourProps) {
  const { profile } = useProfile();
  const [tourDismissed, setTourDismissed] = useUserData<boolean>("manager-tour-dismissed", false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showTour, setShowTour] = useState(false);

  // Profile-specific localStorage flag so tour only shows once per profile
  const profileTourKey = profile?.id ? `hasSeenTour_manager_${profile.id}` : null;

  useEffect(() => {
    if (profileTourKey && localStorage.getItem(profileTourKey) === "true") {
      return; // Already seen by this profile
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

  const firstName = profile?.displayName?.split(" ")[0] || "there";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{
        border: "1px solid rgba(221,161,94,0.2)",
        boxShadow: "0 4px 24px rgba(221,161,94,0.08)",
      }}
    >
      {/* Progress bar */}
      <div className="h-1" style={{ backgroundColor: "rgba(221,161,94,0.08)" }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #DDA15E, #C9A96E)" }}
        />
      </div>

      {/* Header with dismiss */}
      <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#DDA15E" }} />
          <Shield className="w-4 h-4" style={{ color: "#DDA15E" }} />
          <span className="text-foreground text-[0.875rem]" style={headingFont}>
            Welcome, {firstName}
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
          className="px-4 sm:px-5 py-4"
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: step.iconBg }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: step.iconColor }} />
            </div>
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
                    ? "#DDA15E"
                    : idx < currentStep
                      ? "rgba(221,161,94,0.3)"
                      : "rgba(221,161,94,0.12)",
              }}
            />
          </button>
        ))}
      </div>
    </motion.div>
  );
}