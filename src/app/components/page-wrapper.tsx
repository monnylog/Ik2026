import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ArrowUp, LayoutDashboard, ArrowLeft, CalendarDays, Users, UserCheck, Heart, Plane, UtensilsCrossed, DollarSign, BookOpen, Link2, ListChecks, Tag, CalendarClock, ClipboardList, MessageCircle, Mic, Shield, Share2, Inbox, Settings, Flame } from "lucide-react";

import { bodyFont, headingFont } from "../lib/fonts";

// Map page titles to their icons
const pageIconMap: Record<string, typeof LayoutDashboard> = {
  "Event Timeline": CalendarDays,
  "Chef Roster": Users,
  "Team Deploy": UserCheck,
  "Community": Heart,
  "Members": Shield,
  "Travel & Lodging": Plane,
  "Menu & Courses": UtensilsCrossed,
  "Budget & COGS": DollarSign,
  "Research & Story": BookOpen,
  "Links & Resources": Link2,
  "Pre-Event Checklist": ListChecks,
  "Task Board": Tag,
  "Event Schedule": CalendarClock,
  "Activity Log": ClipboardList,
  "Comms": MessageCircle,
  "Our Istoryas": Mic,
  "Submit Menu": UtensilsCrossed,
  "Share & Invite": Share2,
  "Portal Inquiries": Inbox,
  "Settings": Settings,
  "Mission Control": Flame,
};

interface PageWrapperProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function PageWrapper({ title, onBack, children }: PageWrapperProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const PageIcon = pageIconMap[title];

  useEffect(() => {
    const container = scrollRef.current?.closest("main");
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 400);
      // Calculate scroll progress
      const scrollHeight = container.scrollHeight - container.clientHeight;
      if (scrollHeight > 0) {
        setScrollProgress(Math.min(1, container.scrollTop / scrollHeight));
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut: Backspace to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only trigger if not focused on an input/textarea/contenteditable
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = (e.target as HTMLElement)?.isContentEditable;
      if (tag === "INPUT" || tag === "TEXTAREA" || isEditable) return;
      if (e.key === "Backspace" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  const scrollToTop = useCallback(() => {
    const container = scrollRef.current?.closest("main");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Scroll progress indicator */}
      {scrollProgress > 0.02 && (
        <div className="fixed top-0 left-0 right-0 z-30 h-[2px] lg:left-60" style={{ backgroundColor: "rgba(0,0,0,0)" }}>
          <motion.div
            className="h-full rounded-r relative"
            style={{
              width: `${scrollProgress * 100}%`,
              background: "linear-gradient(90deg, rgba(206,180,122,0.35), rgba(206,180,122,0.65), rgba(222,187,150,0.7))",
            }}
            transition={{ duration: 0 }}
          >
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ik26-progress-dot"
              style={{ backgroundColor: "rgba(222,187,150,0.8)" }}
            />
          </motion.div>
        </div>
      )}

      {/* Breadcrumb navigation */}
      <motion.nav
        className="flex items-center gap-1.5 mb-5"
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Breadcrumb"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center gap-1.5 text-[0.75rem] text-muted-foreground hover:text-gold cursor-pointer group"
          style={bodyFont}
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-3 h-3 group-hover:text-gold lg:hidden" />
          <LayoutDashboard className="w-3 h-3 group-hover:text-gold hidden lg:block" />
          <span>Dashboard</span>
        </motion.button>
        <ChevronRight className="w-3 h-3 text-muted-foreground/30" />
        <span
          className="text-[0.75rem] text-foreground font-medium flex items-center gap-1.5"
          style={bodyFont}
          aria-current="page"
        >
          {PageIcon && <PageIcon className="w-3 h-3" style={{ color: "var(--gold)" }} />}
          {title}
        </span>
        {/* Keyboard shortcut hint (desktop only) */}
        <span className="hidden lg:inline text-[0.5625rem] text-muted-foreground/30 ml-2" style={bodyFont}>
          Backspace to go back
        </span>
      </motion.nav>

      {/* Page content */}
      {children}

      {/* Scroll to top FAB */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={scrollToTop}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
            style={{
              backgroundColor: "rgba(71, 93, 86, 0.92)",
              border: "1px solid rgba(206,180,122,0.25)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Scroll to top"
            aria-label="Scroll to top of page"
          >
            <ArrowUp className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}