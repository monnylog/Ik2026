import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import {
  Sparkles,
  Users,
  UtensilsCrossed,
  Moon,
  MapPin,
  CalendarDays,
  BookOpen,
  Heart,
  MessageCircle,
  Handshake,
  Send,
  ChevronDown,
  ArrowRight,
  ExternalLink,
  Mail,
  Star,
  Check,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { projectId, publicAnonKey } from "/utils/supabase/info";

/* ── Brand Colors (rgba for motion compat) ── */
const C = {
  forest: "#2A3328",
  forestDeep: "#1A2118",
  forestRgba: "rgba(42,51,40,1)",
  forestDeepRgba: "rgba(26,33,24,1)",
  gold: "#C49370",
  goldLight: "#D4AA8A",
  goldRgba: "rgba(196,147,112,1)",
  goldSubtle: "rgba(196,147,112,0.12)",
  goldBorder: "rgba(196,147,112,0.25)",
  cream: "#F4EDE4",
  creamRgba: "rgba(244,237,228,1)",
  creamSoft: "rgba(244,237,228,0.85)",
  sage: "#7A865C",
  sageRgba: "rgba(122,134,92,1)",
  transparent: "rgba(0,0,0,0)",
};

const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };

/* ── Scroll-triggered section wrapper ── */
function FadeInSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Shimmer Button ── */
function ShimmerButton({ children, onClick, className = "", large = false }: { children: React.ReactNode; onClick?: () => void; className?: string; large?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-full cursor-pointer ${large ? "px-8 py-4 text-base" : "px-6 py-3 text-sm"} font-medium ${className}`}
      style={{
        ...bodyFont,
        backgroundColor: C.goldRgba,
        color: C.forestDeep,
        fontWeight: 600,
      }}
    >
      <span className="relative z-10 flex items-center gap-2 justify-center">{children}</span>
      {/* shimmer overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 60%)",
        }}
        animate={{ x: ["-200%", "200%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
      />
    </motion.button>
  );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, value, label, delay }: { icon: React.ElementType; value: string; label: string; delay: number }) {
  return (
    <FadeInSection delay={delay}>
      <motion.div
        className="flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          border: `1px solid ${C.goldBorder}`,
          backdropFilter: "blur(8px)",
        }}
        whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.08)" }}
        transition={{ duration: 0.3 }}
      >
        <Icon className="w-5 h-5 mb-3" style={{ color: C.goldLight }} />
        <span className="text-2xl sm:text-3xl font-bold mb-1" style={{ ...headingFont, color: C.creamRgba }}>{value}</span>
        <span className="text-xs uppercase tracking-widest" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>{label}</span>
      </motion.div>
    </FadeInSection>
  );
}

/* ── Experience Tile ── */
function ExperienceTile({ title, description, icon: Icon, delay }: { title: string; description: string; icon: React.ElementType; delay: number }) {
  return (
    <FadeInSection delay={delay}>
      <motion.div
        className="group relative p-6 sm:p-8 rounded-2xl cursor-default overflow-hidden"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.goldBorder}`,
        }}
        whileHover={{
          backgroundColor: "rgba(196,147,112,0.08)",
          borderColor: "rgba(196,147,112,0.4)",
        }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: C.goldSubtle }}>
            <Icon className="w-5 h-5" style={{ color: C.goldLight }} />
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-2" style={{ ...headingFont, color: C.creamRgba }}>{title}</h4>
            <p className="text-sm leading-relaxed" style={{ ...bodyFont, color: "rgba(244,237,228,0.6)" }}>{description}</p>
          </div>
        </div>
        {/* subtle corner glow on hover */}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(196,147,112,0.15) 0%, rgba(0,0,0,0) 70%)" }}
          initial={{ opacity: 0, scale: 0.5 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </FadeInSection>
  );
}

/* ── Partnership Card ── */
function PartnerCard({ tier, description, delay }: { tier: string; description: string; delay: number }) {
  return (
    <FadeInSection delay={delay}>
      <motion.div
        className="p-6 rounded-2xl text-center"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: `1px solid ${C.goldBorder}`,
        }}
        whileHover={{
          backgroundColor: "rgba(196,147,112,0.06)",
          scale: 1.02,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: C.goldSubtle, border: `1px solid ${C.goldBorder}` }}>
          <Star className="w-5 h-5" style={{ color: C.goldLight }} />
        </div>
        <h4 className="text-base font-semibold mb-2" style={{ ...headingFont, color: C.goldLight }}>{tier}</h4>
        <p className="text-sm leading-relaxed" style={{ ...bodyFont, color: "rgba(244,237,228,0.55)" }}>{description}</p>
      </motion.div>
    </FadeInSection>
  );
}

/* ══════════════════════════════════════════════════
   PORTAL PAGE
   ══════════════════════════════════════════════════ */
export function PortalPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activationPhase, setActivationPhase] = useState<"dark" | "glow" | "title" | "done">("dark");
  const [formData, setFormData] = useState({ name: "", email: "", organization: "", inquiryType: "General Question", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Activation sequence ── */
  useEffect(() => {
    const t1 = setTimeout(() => setActivationPhase("glow"), 600);
    const t2 = setTimeout(() => setActivationPhase("title"), 2800);
    const t3 = setTimeout(() => setActivationPhase("done"), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const scrollDown = () => {
    scrollRef.current?.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/portal-inquiry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Portal inquiry error:", err);
      }
    } catch (err) {
      console.error("Portal inquiry network error:", err);
      // Fallback to localStorage
      const existing = JSON.parse(localStorage.getItem("ik26-portal-inquiries") || "[]");
      existing.push({ ...formData, timestamp: new Date().toISOString() });
      localStorage.setItem("ik26-portal-inquiries", JSON.stringify(existing));
    }

    setFormSubmitting(false);
    setFormSubmitted(true);
  };

  const inquiryTypes = ["Sponsorship", "Partnership", "VIP Experience", "General Question", "Suggestion", "Media/Press"];

  return (
    <div
      ref={scrollRef}
      className="w-full"
      style={{
        backgroundColor: C.forestDeep,
      }}
    >
      {/* ════ SECTION 1: OPENING ACTIVATION ══════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Ambient background glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(196,147,112,0.12) 0%, ${C.forestDeepRgba} 70%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: activationPhase !== "dark" ? 1 : 0 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />

        {/* Candlelight particle effects */}
        <AnimatePresence>
          {activationPhase !== "dark" && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 rounded-full"
                  style={{
                    left: `${40 + i * 5}%`,
                    top: "55%",
                    backgroundColor: "rgba(196,147,112,0.4)",
                  }}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{
                    opacity: [0, 0.6, 0],
                    y: [-20, -80 - i * 15],
                    x: [0, (i % 2 === 0 ? 1 : -1) * (10 + i * 5)],
                  }}
                  transition={{
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    delay: i * 0.7,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Phase: "Every plate tells a story..." */}
        <AnimatePresence mode="wait">
          {(activationPhase === "glow") && (
            <motion.p
              key="tagline-1"
              className="text-center text-lg sm:text-xl md:text-2xl italic z-10"
              style={{ ...headingFont, color: C.goldLight }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              Every plate tells a story...
            </motion.p>
          )}

          {/* Phase: Welcome + CTA */}
          {(activationPhase === "title" || activationPhase === "done") && (
            <motion.div
              key="main-title"
              className="flex flex-col items-center text-center z-10 px-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.h1
                className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 leading-tight"
                style={{ ...headingFont, color: C.creamRgba }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Isang Kusina 2026
              </motion.h1>
              <motion.p
                className="text-sm sm:text-base md:text-lg tracking-[0.25em] uppercase mb-8"
                style={{ ...bodyFont, color: C.goldLight }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                A Filipino Chefs Collaboration Dinner
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <ShimmerButton onClick={scrollDown} large>
                  <Sparkles className="w-4 h-4" />
                  Enter the Istorya
                </ShimmerButton>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll indicator */}
        {activationPhase === "done" && (
          <motion.div
            className="absolute bottom-8 flex flex-col items-center gap-2 cursor-pointer z-10"
            onClick={scrollDown}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
          >
            <span className="text-xs tracking-widest uppercase" style={{ ...bodyFont, color: "rgba(244,237,228,0.4)" }}>Scroll</span>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ChevronDown className="w-4 h-4" style={{ color: "rgba(244,237,228,0.4)" }} />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ══════ SECTION 2: THE VISION ════════════════════════ */}
      <section className="relative py-20 sm:py-28 px-6">
        {/* Subtle divider */}
        <div className="max-w-4xl mx-auto mb-16">
          <FadeInSection>
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
              <Sparkles className="w-4 h-4" style={{ color: C.goldLight }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
            </div>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-6 leading-tight" style={{ ...headingFont, color: C.creamRgba }}>
              More than a dinner.<br />
              <span style={{ color: C.goldLight }}>An Istorya.</span>
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <p className="text-center text-base sm:text-lg leading-relaxed max-w-2xl mx-auto mb-6" style={{ ...bodyFont, color: "rgba(244,237,228,0.65)" }}>
              Five Filipino chefs from five cities are coming together in Las Vegas
              for one night. One kitchen. They're cooking the food they grew up on, the food that
              raised them, the food they've spent their careers reimagining. And they're doing it together.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <p className="text-center text-sm leading-relaxed max-w-xl mx-auto" style={{ ...bodyFont, color: "rgba(244,237,228,0.45)" }}>
              Isang Kusina means "One Kitchen." It started as a simple idea: what happens when
              Filipino chefs stop competing and start collaborating? What kind of meal do you get
              when the only goal is to tell the truth about where we come from?
            </p>
          </FadeInSection>
        </div>

        {/* Image break */}
        <FadeInSection delay={0.15} className="max-w-5xl mx-auto mb-16">
          <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.goldBorder}` }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1712026063488-380bf9f3a8e9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZGlubmVyJTIwdGFibGUlMjBjYW5kbGVsaWdodCUyMHdhcm18ZW58MXx8fHwxNzczMjQ2Mzk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Elegant dinner table with warm candlelight"
              className="w-full h-48 sm:h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,33,24,0.8) 0%, rgba(0,0,0,0) 50%)" }} />
          </div>
        </FadeInSection>

        {/* Stats grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard icon={Users} value="5" label="Chefs" delay={0.05} />
          <StatCard icon={UtensilsCrossed} value="8" label="Courses" delay={0.1} />
          <StatCard icon={Moon} value="1" label="Night" delay={0.15} />
          <StatCard icon={Heart} value="200+" label="Guests" delay={0.2} />
          <StatCard icon={MapPin} value="LV" label="Las Vegas, NV" delay={0.25} />
          <StatCard icon={CalendarDays} value="May 22" label="2026" delay={0.3} />
        </div>
      </section>

      {/* ══════ SECTION 3: THE EXPERIENCE PREVIEW ════════════ */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
              <BookOpen className="w-4 h-4" style={{ color: C.goldLight }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ ...headingFont, color: C.creamRgba }}>
              What This Night Looks Like
            </h2>
            <p className="text-center text-sm mb-12" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
              Here's what we're building, course by course
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-12">
            <ExperienceTile
              icon={UtensilsCrossed}
              title="The Menu Journey"
              description="Eight courses that travel across regions and generations. Recipes handed down from lolas, reinterpreted by chefs who carry those flavors with them every day."
              delay={0.05}
            />
            <ExperienceTile
              icon={Users}
              title="The Chef Stories"
              description="These are real people with real stories. Family kitchens in the provinces, late nights in restaurant lines, the long road to finding their voice through food."
              delay={0.1}
            />
            <ExperienceTile
              icon={BookOpen}
              title="The Cultural Narrative"
              description="This isn't just a tasting menu. There's music, there's art, there's history woven into every moment. We want you to feel the Philippines, not just taste it."
              delay={0.15}
            />
            <ExperienceTile
              icon={Heart}
              title="The Community Table"
              description="You're not just a guest here. You're sitting at the same table as the people who made this happen. That's the whole point. We eat together."
              delay={0.2}
            />
          </div>

          {/* Image row */}
          <FadeInSection delay={0.1} className="mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.goldBorder}` }}>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1625715966960-809d07c7d81b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxGaWxpcGlubyUyMGZvb2QlMjBwbGF0aW5nJTIwZmluZSUyMGRpbmluZyUyMGRhcmt8ZW58MXx8fHwxNzczMjQ2Mzk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Filipino food artfully plated"
                  className="w-full h-48 sm:h-56 object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,33,24,0.6) 0%, rgba(0,0,0,0) 60%)" }} />
              </div>
              <div className="relative rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.goldBorder}` }}>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1616140862003-2df5a7988fdf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMGtpdGNoZW4lMjBkYXJrJTIwbW9vZHl8ZW58MXx8fHwxNzczMjQ2Mzk0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Chef cooking in moody kitchen"
                  className="w-full h-48 sm:h-56 object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,33,24,0.6) 0%, rgba(0,0,0,0) 60%)" }} />
              </div>
            </div>
          </FadeInSection>

          {/* VIP Preview Button */}
          <FadeInSection delay={0.15}>
            <div className="flex justify-center">
              <ShimmerButton
                large
                onClick={() => onNavigate?.("Chef Roster")}
              >
                Preview the Full Experience
                <ArrowRight className="w-4 h-4" />
              </ShimmerButton>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ══════ SECTION 4: PARTNERSHIP CTA ═══════════════════ */}
      <section className="py-20 sm:py-28 px-6" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
              <Handshake className="w-4 h-4" style={{ color: C.goldLight }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ ...headingFont, color: C.creamRgba }}>
              Cook With Us
            </h2>
            <p className="text-center text-sm mb-12 max-w-lg mx-auto" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
              We're looking for people and brands who care about this as much as we do. If Filipino food and culture matter to you, let's talk.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <PartnerCard
              tier="Presenting Partner"
              description="Be the name behind the night. Your brand at the front of the table, working alongside our chefs to shape the experience."
              delay={0.05}
            />
            <PartnerCard
              tier="Cultural Partner"
              description="You get what we're doing and you want to help us do it right. Filipino culture, food heritage, community building. That's the work."
              delay={0.1}
            />
            <PartnerCard
              tier="Community Partner"
              description="Help us reach more people. Share the story with your audience, bring your community to ours. The table gets bigger together."
              delay={0.15}
            />
            <PartnerCard
              tier="Media Partner"
              description="Get in the kitchen with us. Behind-the-scenes access, chef conversations, the real story of how this dinner comes together."
              delay={0.2}
            />
          </div>

          <FadeInSection delay={0.1}>
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const formSection = document.getElementById("portal-inquiry-form");
                  formSection?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-3.5 rounded-full text-sm font-medium cursor-pointer"
                style={{
                  ...bodyFont,
                  backgroundColor: C.transparent,
                  color: C.goldLight,
                  border: `1.5px solid ${C.goldBorder}`,
                  fontWeight: 600,
                }}
              >
                <span className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Partner With Us
                </span>
              </motion.button>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ══════ SECTION 5: INQUIRY FORM ═════════════════════ */}
      <section id="portal-inquiry-form" className="py-20 sm:py-28 px-6">
        <div className="max-w-2xl mx-auto">
          <FadeInSection>
            <div className="flex items-center justify-center gap-4 mb-12">
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
              <Mail className="w-4 h-4" style={{ color: C.goldLight }} />
              <div className="h-px flex-1 max-w-[80px]" style={{ backgroundColor: C.goldBorder }} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4" style={{ ...headingFont, color: C.creamRgba }}>
              We'd Love to Hear From You
            </h2>
            <p className="text-center text-sm mb-10" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
              Got a question? An idea? Want to get involved? Drop us a line. We read everything.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <AnimatePresence mode="wait">
              {formSubmitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 px-6 rounded-2xl"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.goldBorder}`,
                  }}
                >
                  <motion.div
                    className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
                    style={{ backgroundColor: "rgba(122,134,92,0.2)", border: "1px solid rgba(122,134,92,0.3)" }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <Check className="w-6 h-6" style={{ color: C.sageRgba }} />
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2" style={{ ...headingFont, color: C.goldLight }}>
                    Salamat!
                  </h3>
                  <p className="text-sm" style={{ ...bodyFont, color: "rgba(244,237,228,0.6)" }}>
                    We got your message. Someone from the team will get back to you soon. Maraming salamat.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setFormSubmitted(false); setFormData({ name: "", email: "", organization: "", inquiryType: "General Question", message: "" }); }}
                    className="mt-6 px-5 py-2 rounded-full text-xs cursor-pointer"
                    style={{ ...bodyFont, color: C.goldLight, border: `1px solid ${C.goldBorder}`, backgroundColor: C.transparent }}
                  >
                    Send Another Message
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5 p-6 sm:p-8 rounded-2xl"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: `1px solid ${C.goldBorder}`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Inquiry Type */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
                      Inquiry Type
                    </label>
                    <select
                      value={formData.inquiryType}
                      onChange={(e) => setFormData(p => ({ ...p, inquiryType: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                      style={{
                        ...bodyFont,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: C.creamRgba,
                        border: `1px solid rgba(196,147,112,0.15)`,
                      }}
                      aria-label="Select inquiry type"
                    >
                      {inquiryTypes.map(t => <option key={t} value={t} style={{ backgroundColor: C.forestDeep, color: C.cream }}>{t}</option>)}
                    </select>
                  </div>

                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-2" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
                        Name <span style={{ color: C.goldLight }}>*</span>
                      </label>
                      <input
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-30"
                        style={{
                          ...bodyFont,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: C.creamRgba,
                          border: `1px solid rgba(196,147,112,0.15)`,
                        }}
                        aria-label="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider mb-2" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
                        Email <span style={{ color: C.goldLight }}>*</span>
                      </label>
                      <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                        placeholder="you@email.com"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-30"
                        style={{
                          ...bodyFont,
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: C.creamRgba,
                          border: `1px solid rgba(196,147,112,0.15)`,
                        }}
                        aria-label="Your email"
                      />
                    </div>
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
                      Organization / Brand <span className="opacity-50">(optional)</span>
                    </label>
                    <input
                      value={formData.organization}
                      onChange={(e) => setFormData(p => ({ ...p, organization: e.target.value }))}
                      placeholder="Your company or brand"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none placeholder:opacity-30"
                      style={{
                        ...bodyFont,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: C.creamRgba,
                        border: `1px solid rgba(196,147,112,0.15)`,
                      }}
                      aria-label="Organization or brand name"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider mb-2" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
                      Message <span style={{ color: C.goldLight }}>*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                      placeholder="Tell us what's on your mind..."
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none placeholder:opacity-30"
                      style={{
                        ...bodyFont,
                        backgroundColor: "rgba(255,255,255,0.06)",
                        color: C.creamRgba,
                        border: `1px solid rgba(196,147,112,0.15)`,
                      }}
                      aria-label="Your message"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex justify-end pt-2">
                    <ShimmerButton>
                      <Send className="w-3.5 h-3.5" />
                      {formSubmitting ? "Sending..." : "Send Message"}
                    </ShimmerButton>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </FadeInSection>
        </div>
      </section>

      {/* ══════ SECTION 6: CLOSING ══════════════════════════ */}
      <section className="py-20 sm:py-28 px-6 text-center">
        <FadeInSection>
          <div className="max-w-2xl mx-auto">
            {/* Community image */}
            <div className="relative rounded-2xl overflow-hidden mb-12 mx-auto max-w-md" style={{ border: `1px solid ${C.goldBorder}` }}>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1761092315416-ed229b18e3d6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmclMjBkaW5uZXIlMjBjdWx0dXJhbCUyMGNlbGVicmF0aW9ufGVufDF8fHx8MTc3MzI0NjM5Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Community dinner celebration"
                className="w-full h-40 sm:h-52 object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,33,24,0.7) 0%, rgba(0,0,0,0) 60%)" }} />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ ...headingFont, color: C.creamRgba }}>
              Isang Kusina.<br />
              <span style={{ color: C.goldLight }}>One Kitchen. One Family.</span>
            </h2>

            {/* IK26 logo mark */}
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{
                backgroundColor: "rgba(196,147,112,0.1)",
                border: `1px solid ${C.goldBorder}`,
              }}
              whileHover={{ scale: 1.05, rotate: 2 }}
            >
              <span className="text-2xl font-bold" style={{ ...headingFont, color: C.goldLight }}>IK</span>
            </motion.div>

            <div className="flex flex-col items-center gap-4 mb-8">
              <motion.a
                href="https://isangkusina.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm"
                style={{ ...bodyFont, color: C.goldLight }}
                whileHover={{ scale: 1.03 }}
              >
                isangkusina.com
                <ExternalLink className="w-3 h-3" />
              </motion.a>
            </div>

            {/* Back to app CTA */}
            {onNavigate && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate("Dashboard")}
                className="px-6 py-2.5 rounded-full text-xs cursor-pointer"
                style={{
                  ...bodyFont,
                  color: "rgba(244,237,228,0.5)",
                  border: `1px solid rgba(244,237,228,0.15)`,
                  backgroundColor: C.transparent,
                }}
              >
                Back to Dashboard
              </motion.button>
            )}

            {/* Footer */}
            <div className="mt-16 pt-8" style={{ borderTop: `1px solid rgba(244,237,228,0.08)` }}>
              <p className="text-xs" style={{ ...bodyFont, color: "rgba(244,237,228,0.25)" }}>
                &copy; 2026 Isang Kusina. Made with malasakit in Las Vegas.
              </p>
            </div>
          </div>
        </FadeInSection>
      </section>
    </div>
  );
}