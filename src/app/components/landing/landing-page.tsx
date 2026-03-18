import { useState, useEffect, useRef, useMemo } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import {
  ChevronDown,
  UtensilsCrossed,
  MapPin,
  Share2,
  Check,
  Calendar,
  Clock,
  ArrowRight,
  Instagram,
  Volume2,
  VolumeX,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
// Inline fallback for deleted Figma helper
function ImageWithFallback({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={src} alt={alt} loading="lazy" {...props} />;
}
import istoryaLogo from "../../../imports/Logo_orange.svg";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { bodyFont, headingFont } from "../../lib/fonts";

/* ── Fonts ────────────────────────────────────────────────────────── */
const hf = headingFont;
const bf = bodyFont;

/* ── Palette ──────────────────────────────────────────────────────── */
const C = {
  bg: "#1A1A18",
  ecru: "#F4EDE4",
  gold: "#C9A96E",
  brass: "#CDA88A",
  sage: "#7E9E78",
  blush: "#EDCBC8",
  periwinkle: "#8B96C4",
} as const;

/* ── Images ───────────────────────────────────────────────────────── */
const IMG = {
  feast:
    "https://images.unsplash.com/photo-1770991190940-a1971ea8e36f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxGaWxpcGlubyUyMGZlYXN0JTIwY2VsZWJyYXRpb24lMjBkaW5uZXIlMjBnYXRoZXJpbmclMjBvdmVyaGVhZHxlbnwxfHx8fDE3NzMyNTM0Nzd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  tableSetting:
    "https://images.unsplash.com/photo-1762806883627-4bcbfad98a2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZGlubmVyJTIwdGFibGUlMjBzZXR0aW5nJTIwYW1iaWVudCUyMGxpZ2h0aW5nfGVufDF8fHx8MTc3MzI1MTUxNnww&ixlib=rb-4.1.0&q=80&w=1080",
  communal:
    "https://images.unsplash.com/photo-1723853310545-b657f3e36396?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5hbCUyMEFzaWFuJTIwZGlubmVyJTIwc2hhcmVkJTIwcGxhdGVzJTIwaGFuZHN8ZW58MXx8fHwxNzczMjUxNTE2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  dessert:
    "https://images.unsplash.com/photo-1767510533362-4d5dbdaaf8c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW5kbGVsaWdodCUyMGRpbm5lciUyMGludGltYXRlJTIwd2luZSUyMGdsYXNzZXMlMjBldmVuaW5nfGVufDF8fHx8MTc3MzI1MzQ3N3ww&ixlib=rb-4.1.0&q=80&w=1080",
  steam:
    "https://images.unsplash.com/photo-1572282981354-f371f859a22a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGVhbSUyMHJpc2luZyUyMGZvb2QlMjBwbGF0ZSUyMGRhcmslMjBiYWNrZ3JvdW5kfGVufDF8fHx8MTc3MzI1MTUyMHww&ixlib=rb-4.1.0&q=80&w=1080",
};

/* ── Chef data ────────────────────────────────────────────────────── */
const chefs = [
  {
    name: "Lord Maynard Llera",
    alias: "Kuya Lord",
    city: "Los Angeles",
    credential: "JB Best Chef: California 2024",
    quote:
      "Every plate I send out carries the weight of every lola who cooked before me.",
    color: C.brass,
    photo:
      "https://images.unsplash.com/photo-1552358155-515e264cb8b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxGaWxpcGlubyUyMG1hbGUlMjBjaGVmJTIwcG9ydHJhaXQlMjBraXRjaGVuJTIwd2FybSUyMGxpZ2h0aW5nfGVufDF8fHx8MTc3MzI1MzQ3NHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "Aaron Verzosa",
    alias: "Archipelago",
    city: "Seattle",
    credential: "Eater ROTY 2019, JB nominee",
    quote: "Filipino food is not a trend. It is an inheritance.",
    color: C.sage,
    photo:
      "https://images.unsplash.com/photo-1607615764542-c591aecb2222?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxBc2lhbiUyMG1hbGUlMjBjaGVmJTIwcGxhdGluZyUyMGZvb2QlMjByZXN0YXVyYW50fGVufDF8fHx8MTc3MzI1MzQ3NXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "Christina Quackenbush",
    alias: "Tatlo / Milkfish",
    city: "New Orleans",
    credential: "Two-concept visionary",
    quote:
      "New Orleans taught me that food and music are the same language. Manila already knew.",
    color: C.blush,
    photo:
      "https://images.unsplash.com/photo-1771360963016-1408c2de12c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBjaGVmJTIwY29va2luZyUyMHJlc3RhdXJhbnQlMjBraXRjaGVuJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MzI1MzQ3NXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "Rachel Barril",
    alias: "Salmon Cannery",
    city: "Juneau, AK",
    credential: "Alaska\u2019s Filipino culinary voice",
    quote:
      "In Juneau, our kitchen is the warmest room in town. That\u2019s not a metaphor.",
    color: C.periwinkle,
    photo:
      "https://images.unsplash.com/photo-1756715743380-d86e3eecbe83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGNoZWYlMjBBc2lhbiUyMGN1aXNpbmUlMjBwcmVwYXJpbmclMjBmb29kJTIwd2FybXxlbnwxfHx8fDE3NzMyNTM0NzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    name: "Patrice Cleary",
    alias: "Purple Patch",
    city: "Washington, DC",
    credential: "DC\u2019s beloved Filipino table",
    quote:
      "Purple Patch was never about me. It was about giving my family\u2019s recipes a permanent address.",
    color: C.gold,
    photo:
      "https://images.unsplash.com/photo-1726595452976-fa41c42158a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBjaGVmJTIwcGxhdGluZyUyMGRlc3NlcnQlMjBmaW5lJTIwZGluaW5nfGVufDF8fHx8MTc3MzI1MzQ3Nnww&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

type PersonaRole = "guest" | "partner" | "explorer";

/* ═════════════════════════════════════════════════════════════════ */
/*  Analytics helper                                               */
/* ═════════════════════════════════════════════════════════════════ */
function trackEvent(name: string, data?: Record<string, string>) {
  console.log(`[IK Analytics] ${name}`, data ?? {});
  // Fire-and-forget to backend
  fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-5ed426e6/analytics/event`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ event: name, data: data ?? {} }),
    }
  ).catch(() => {});
}

/* ═════════════════════════════════════════════════════════════════ */
/*  TikTok Icon (lucide doesn't have one)                          */
/* ═════════════════════════════════════════════════════════════════ */
function TikTokIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  IntroSplash — 4-beat cinematic opener                          */
/* ═════════════════════════════════════════════════════════════════ */
function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const [beat, setBeat] = useState(0);
  const doneRef = useRef(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reducedMotion) {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
      return;
    }
    const t = [
      setTimeout(() => setBeat(1), 100),
      setTimeout(() => setBeat(2), 1600),
      setTimeout(() => setBeat(3), 3400),
      setTimeout(() => setBeat(4), 5000),
    ];
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (beat < 4 || doneRef.current) return;
    const t = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onComplete();
      }
    }, 900);
    return () => clearTimeout(t);
  }, [beat, onComplete]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    trackEvent(beat >= 4 ? "splashCompleted" : "splashSkipped", { beat: String(beat) });
    onComplete();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: C.bg }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Beat 1 — warm glow */}
      {beat >= 1 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute"
          style={{
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(201,169,110,0.3) 0%, rgba(201,169,110,0) 70%)`,
          }}
        />
      )}

      {/* Beat 2 — wordmark + Istorya logo */}
      {beat >= 2 && (
        <div className="absolute flex flex-col items-center z-10 px-6">
          <motion.img
            src={istoryaLogo}
            alt="Istorya"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-28 mb-6"
            style={{ filter: "brightness(0.6) sepia(1) saturate(0.5) hue-rotate(10deg)" }}
          />
          <h1
            className="text-center mb-3"
            style={{
              ...hf,
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              color: C.ecru,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
            }}
          >
            {"Isang Kusina".split("").map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.045,
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-center"
            style={{
              ...bf,
              color: `${C.ecru}73`,
              fontSize: "clamp(0.875rem, 2vw, 1.125rem)",
            }}
          >
            One Kitchen. One Night. One Story.
          </motion.p>
        </div>
      )}

      {/* Beat 3 — background image */}
      {beat >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.14 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={IMG.feast}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: "blur(4px) saturate(0.5)" }}
          />
        </motion.div>
      )}

      {/* Beat 4 — CTA */}
      {beat >= 4 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.2,
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          onClick={skip}
          className="absolute bottom-[18vh] px-8 py-4 rounded-full cursor-pointer z-20"
          style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.brass})`,
            color: C.bg,
            ...bf,
            fontWeight: 600,
            fontSize: "1.0625rem",
            boxShadow: `0 0 40px rgba(201,169,110,0.3), 0 4px 20px rgba(0,0,0,0.3)`,
          }}
        >
          Step into the story
        </motion.button>
      )}

      {/* Skip */}
      <button
        onClick={skip}
        className="absolute bottom-8 right-8 z-30 cursor-pointer"
        style={{ ...bf, color: `${C.ecru}4D`, fontSize: "0.75rem" }}
        aria-label="Skip intro"
      >
        Skip
      </button>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  PersonalizationGate                                            */
/* ═════════════════════════════════════════════════════════════════ */
function PersonalizationGate({
  onSelect,
}: {
  onSelect: (role: PersonaRole) => void;
}) {
  const [hovered, setHovered] = useState<PersonaRole | null>(null);

  const cards: {
    role: PersonaRole;
    emoji: string;
    title: string;
    sub: string;
  }[] = [
    {
      role: "guest",
      emoji: "\u{1F37D}\uFE0F",
      title: "I want a seat at the table",
      sub: "Story, seating, and booking",
    },
    {
      role: "partner",
      emoji: "\u{1F91D}",
      title: "I want to collaborate",
      sub: "Partner portal and press",
    },
    {
      role: "explorer",
      emoji: "\u{1F440}",
      title: "I\u2019m just here to explore",
      sub: "Browse the full experience",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="max-w-lg w-full">
        {/* Subtle logo watermark */}
        <motion.img
          src={istoryaLogo}
          alt=""
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.04 }}
          className="w-40 mx-auto mb-8"
          style={{ filter: "brightness(0.5) sepia(1) saturate(0.3)" }}
        />

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-center mb-10"
          style={{
            ...hf,
            color: C.ecru,
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            lineHeight: 1.2,
          }}
        >
          How are you joining us tonight?
        </motion.h2>

        <div className="space-y-3">
          {cards.map((c, i) => {
            const active = hovered === c.role;
            const dimmed = hovered !== null && !active;
            return (
              <motion.button
                key={c.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: dimmed ? 0.4 : 1,
                  y: 0,
                  scale: active ? 1.02 : 1,
                }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.35 }}
                onMouseEnter={() => setHovered(c.role)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => {
                  localStorage.setItem("ik26-persona", c.role);
                  trackEvent("personalizationChoice", { role: c.role });
                  onSelect(c.role);
                }}
                className="w-full flex items-center gap-4 p-5 rounded-2xl cursor-pointer text-left min-h-[64px]"
                style={{
                  backgroundColor: active
                    ? `${C.gold}0F`
                    : `${C.ecru}0A`,
                  border: `1px solid ${active ? `${C.gold}4D` : `${C.ecru}14`}`,
                }}
              >
                <span className="text-3xl shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span
                    className="block text-[1.0625rem]"
                    style={{ ...hf, color: C.ecru }}
                  >
                    {c.title}
                  </span>
                  <span
                    className="block text-[0.8125rem] mt-0.5"
                    style={{ ...bf, color: `${C.ecru}66` }}
                  >
                    {c.sub}
                  </span>
                </div>
                <ArrowRight
                  className="w-4 h-4 shrink-0"
                  style={{ color: `${C.gold}66` }}
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  StickyNav — minimal floating nav for the main site             */
/* ═════════════════════════════════════════════════════════════════ */
function StickyNav({
  calmMode,
  onToggleCalm,
}: {
  calmMode: boolean;
  onToggleCalm: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => {
    setVisible(v > 400);
  });

  const links = [
    { label: "The Story", id: "what-is" },
    { label: "The Chefs", id: "chefs" },
    { label: "The Night", id: "night-unfolds" },
    { label: "Seating", id: "booking" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.nav
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            backgroundColor: `${C.bg}E6`,
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${C.ecru}0A`,
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="cursor-pointer shrink-0"
              aria-label="Scroll to top"
            >
              <img
                src={istoryaLogo}
                alt="Istorya"
                className="h-5"
                style={{
                  filter: "brightness(0.7) sepia(1) saturate(0.4) hue-rotate(10deg)",
                  opacity: 0.6,
                }}
              />
            </button>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              {links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => scrollTo(l.id)}
                  className="cursor-pointer"
                  style={{
                    ...bf,
                    color: `${C.ecru}59`,
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  {l.label}
                </button>
              ))}
              <div
                className="w-px h-4"
                style={{ backgroundColor: `${C.ecru}14` }}
              />
              <button
                onClick={onToggleCalm}
                className="cursor-pointer flex items-center gap-1"
                style={{
                  ...bf,
                  color: `${C.ecru}40`,
                  fontSize: "0.625rem",
                }}
                aria-label={calmMode ? "Enable animations" : "Disable animations"}
              >
                {calmMode ? (
                  <VolumeX className="w-3 h-3" />
                ) : (
                  <Volume2 className="w-3 h-3" />
                )}
                {calmMode ? "Calm" : "Full"}
              </button>
              <a
                href="/portal"
                onClick={() => trackEvent("portalClick", { location: "nav" })}
                className="px-3 py-1.5 rounded-full text-[0.6875rem] cursor-pointer"
                style={{
                  ...bf,
                  color: C.gold,
                  border: `1px solid ${C.gold}33`,
                  backgroundColor: `${C.gold}0A`,
                }}
              >
                Partner Portal
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden cursor-pointer p-2 -mr-2"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-5 h-5" style={{ color: `${C.ecru}80` }} />
              ) : (
                <Menu className="w-5 h-5" style={{ color: `${C.ecru}80` }} />
              )}
            </button>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="md:hidden overflow-hidden"
                style={{ borderTop: `1px solid ${C.ecru}0A` }}
              >
                <div className="px-6 py-4 space-y-1">
                  {links.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => scrollTo(l.id)}
                      className="block w-full text-left py-2.5 cursor-pointer min-h-[44px]"
                      style={{
                        ...bf,
                        color: `${C.ecru}73`,
                        fontSize: "0.875rem",
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                  <div
                    className="h-px my-2"
                    style={{ backgroundColor: `${C.ecru}0A` }}
                  />
                  <div className="flex items-center justify-between py-2">
                    <button
                      onClick={onToggleCalm}
                      className="cursor-pointer flex items-center gap-1.5"
                      style={{
                        ...bf,
                        color: `${C.ecru}40`,
                        fontSize: "0.75rem",
                      }}
                    >
                      {calmMode ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      {calmMode ? "Calm mode" : "Full experience"}
                    </button>
                    <a
                      href="/portal"
                      className="px-3 py-1.5 rounded-full text-[0.75rem] cursor-pointer"
                      style={{
                        ...bf,
                        color: C.gold,
                        border: `1px solid ${C.gold}33`,
                      }}
                    >
                      Portal
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  ScrollProgressSpine                                            */
/* ═════════════════════════════════════════════════════════════════ */
function ScrollProgressSpine() {
  const { scrollYProgress } = useScroll();
  return (
    <div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-40 w-[3px] h-[30vh] rounded-full overflow-hidden hidden md:block"
      style={{ backgroundColor: `${C.ecru}14` }}
    >
      <motion.div
        className="w-full rounded-full origin-top"
        style={{
          backgroundColor: C.gold,
          scaleY: scrollYProgress,
          height: "100%",
        }}
      />
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  Hero — parallax, particles, role-adaptive CTA                  */
/* ═════════════════════════════════════════════════════════════════ */
function HeroSection({ persona }: { persona: PersonaRole }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const ctaLabel =
    persona === "guest"
      ? "Reserve your seat \u2014 May 22"
      : persona === "partner"
        ? "Explore the vision"
        : "See how the night unfolds";

  const particles = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        id: i,
        w: 2 + ((i * 7) % 4),
        left: 8 + ((i * 17) % 84),
        top: 15 + ((i * 23) % 70),
        dur: 5 + (i % 4),
        delay: (i * 0.8) % 3.5,
        drift: 25 + ((i * 13) % 45),
      })),
    []
  );

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Parallax bg */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <ImageWithFallback
          src={IMG.feast}
          alt=""
          className="w-full h-[120%] object-cover"
          style={{ filter: "brightness(0.25) saturate(0.7)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${C.bg}99 0%, ${C.bg}F2 100%)`,
          }}
        />
      </motion.div>

      {/* Particles */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.w,
              height: p.w,
              left: `${p.left}%`,
              top: `${p.top}%`,
              backgroundColor: `${C.gold}33`,
            }}
            animate={{
              y: [0, -p.drift, 0],
              opacity: [0.08, 0.35, 0.08],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-3xl mx-auto"
        style={{ y: textY }}
      >
        {/* Istorya logo mark */}
        <motion.img
          src={istoryaLogo}
          alt="Istorya presents"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.2, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="h-6 mx-auto mb-6"
          style={{
            filter:
              "brightness(0.6) sepia(1) saturate(0.4) hue-rotate(10deg)",
          }}
        />

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-4"
          style={{
            ...bf,
            color: `${C.gold}B3`,
            fontSize: "0.8125rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase" as const,
          }}
        >
          May 22, 2026 &middot; Las Vegas
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            ...hf,
            color: C.ecru,
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
          }}
        >
          One Night.
          <br />
          One Kitchen.
          <br />
          One Story.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-6 max-w-md mx-auto"
          style={{
            ...bf,
            color: `${C.ecru}8C`,
            fontSize: "clamp(0.9375rem, 2vw, 1.0625rem)",
            lineHeight: 1.7,
          }}
        >
          Five Filipino chefs from five cities. One collaborative dinner in
          Las Vegas. Every course is a chapter.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            trackEvent("CTAClick", { location: "hero", persona });
            document
              .getElementById("booking")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-10 px-8 py-4 rounded-full cursor-pointer inline-flex items-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${C.gold}, ${C.brass})`,
            color: C.bg,
            ...bf,
            fontWeight: 600,
            fontSize: "0.9375rem",
            boxShadow: `0 0 30px ${C.gold}33`,
          }}
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </motion.button>

        {persona !== "partner" && (
          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            href="/portal"
            className="block mt-5"
            style={{
              ...bf,
              color: `${C.ecru}40`,
              fontSize: "0.75rem",
            }}
          onClick={() => trackEvent("portalClick", { location: "hero" })}
          >
            For Partners &amp; Press &rarr;
          </motion.a>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span
          style={{ ...bf, color: `${C.ecru}40`, fontSize: "0.6875rem" }}
        >
          Scroll to begin
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown
            className="w-4 h-4"
            style={{ color: `${C.gold}4D` }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  WhatIs Section                                                 */
/* ═════════════════════════════════════════════════════════════════ */
function WhatIsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.3"],
  });

  return (
    <section
      ref={ref}
      id="what-is"
      className="relative py-24 md:py-36 px-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.6 }}
            style={{
              ...hf,
              color: C.ecru,
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              lineHeight: 1.15,
            }}
          >
            One kitchen. Many chefs.
            <br />
            One night only.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6"
            style={{
              ...bf,
              color: `${C.ecru}80`,
              fontSize: "1rem",
              lineHeight: 1.8,
            }}
          >
            Every year, we invite a dream team of Filipino chefs to cook side
            by side in Las Vegas. Each dish is a chapter. Each night is
            unrepeatable.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="mt-4"
            style={{
              ...bf,
              color: `${C.ecru}59`,
              fontSize: "0.875rem",
              lineHeight: 1.8,
            }}
          >
            Year Three lands during AAPI Heritage Month. Five acclaimed chefs.
            Eight courses rooted in Filipino history, memory, and community.
            One night at the Keep Memory Alive Event Center.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden aspect-[4/3]"
        >
          <ImageWithFallback
            src={IMG.communal}
            alt="Communal dining"
            className="w-full h-full object-cover"
            style={{ filter: "saturate(0.8)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${C.bg}4D, ${C.gold}1A)`,
            }}
          />
        </motion.div>
      </div>

      {/* Section divider */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px origin-left"
        style={{
          backgroundColor: `${C.gold}26`,
          scaleX: scrollYProgress,
        }}
      />
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  Chefs Section                                                  */
/* ═════════════════════════════════════════════════════════════════ */
function ChefsSection() {
  const [flipped, setFlipped] = useState<number | null>(null);

  return (
    <section
      id="chefs"
      className="relative py-24 md:py-36 px-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4"
          style={{
            ...hf,
            color: C.ecru,
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          }}
        >
          Five chefs. Five cities. One table.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="text-center mb-14 max-w-md mx-auto"
          style={{
            ...bf,
            color: `${C.ecru}40`,
            fontSize: "0.8125rem",
            lineHeight: 1.6,
          }}
        >
          From Los Angeles to Juneau, these chefs bring every kitchen they've
          ever stood in to this one table.
        </motion.p>

        {/* City connection line — simplified route visualization */}
        <div className="hidden md:block mb-6 relative h-12">
          <svg
            viewBox="0 0 1000 40"
            className="w-full h-full"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <motion.path
              d="M100,20 C200,8 280,32 380,20 C440,12 520,28 600,20 C660,14 740,28 820,20 C880,14 920,24 960,20"
              fill="none"
              stroke={`${C.gold}33`}
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {[100, 320, 540, 720, 900].map((cx, i) => (
              <motion.circle
                key={i}
                cx={cx}
                cy={20}
                r="4"
                fill={chefs[i].color}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.15 }}
              />
            ))}
            <motion.circle
              cx="960"
              cy="20"
              r="6"
              fill={C.gold}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2, type: "spring" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-end justify-between px-[8%]">
            {["LA", "Seattle", "NOLA", "Juneau", "DC"].map((city, i) => (
              <motion.span
                key={city}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
                style={{
                  ...bf,
                  color: `${C.ecru}33`,
                  fontSize: "0.5625rem",
                  letterSpacing: "0.05em",
                }}
              >
                {city}
              </motion.span>
            ))}
          </div>
        </div>

        <div className="flex md:grid md:grid-cols-5 gap-4 overflow-x-auto pb-4 md:pb-0 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
          {chefs.map((chef, idx) => (
            <motion.div
              key={chef.name}
              initial={{ opacity: 0, y: 20, rotate: 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              className="snap-center shrink-0 w-[72vw] sm:w-[60vw] md:w-auto"
            >
              <motion.button
                onClick={() => {
                  const wasFlipped = flipped === idx;
                  setFlipped(wasFlipped ? null : idx);
                  if (!wasFlipped) {
                    trackEvent("chefCardInteraction", { chef: chef.name });
                  }
                }}
                whileHover={{ y: -4 }}
                className="w-full rounded-2xl overflow-hidden cursor-pointer text-left relative"
                style={{
                  backgroundColor: `${C.ecru}0A`,
                  border: `1px solid ${flipped === idx ? chef.color + "40" : `${C.ecru}0F`}`,
                  minHeight: 320,
                }}
                aria-label={
                  flipped === idx
                    ? `Close quote from ${chef.name}`
                    : `Read quote from ${chef.name}`
                }
              >
                <AnimatePresence mode="wait">
                  {flipped !== idx ? (
                    <motion.div
                      key="front"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col h-full"
                    >
                      {/* Chef photo */}
                      <div className="relative h-32 overflow-hidden">
                        <ImageWithFallback
                          src={chef.photo}
                          alt={chef.name}
                          className="w-full h-full object-cover"
                          style={{ filter: "saturate(0.8) brightness(0.85)" }}
                        />
                        <div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(180deg, rgba(0,0,0,0) 40%, ${C.bg} 100%)`,
                          }}
                        />
                        {/* Color accent bar on top */}
                        <div
                          className="absolute top-0 left-0 right-0 h-[3px]"
                          style={{ backgroundColor: chef.color }}
                        />
                      </div>

                      <div className="p-4 pt-2 flex-1 flex flex-col">
                        <h3
                          className="text-[1rem] mb-0.5"
                          style={{ ...hf, color: C.ecru }}
                        >
                          {chef.name}
                        </h3>
                        <p
                          className="text-[0.8125rem] mb-1"
                          style={{ ...bf, color: chef.color }}
                        >
                          {chef.alias}
                        </p>
                        <div className="flex items-center gap-1.5 mb-3">
                          <MapPin
                            className="w-3 h-3"
                            style={{ color: `${C.ecru}40` }}
                          />
                          <span
                            style={{
                              ...bf,
                              color: `${C.ecru}59`,
                              fontSize: "0.75rem",
                            }}
                          >
                            {chef.city}
                          </span>
                        </div>
                        <p
                          className="text-[0.6875rem] mt-auto"
                          style={{ ...bf, color: `${C.ecru}4D` }}
                        >
                          {chef.credential}
                        </p>
                      </div>
                      <div className="absolute bottom-3 right-3">
                        <span
                          style={{
                            color: `${C.ecru}26`,
                            fontSize: "0.625rem",
                            ...bf,
                          }}
                        >
                          Tap for story
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-5 flex flex-col justify-center"
                      style={{ minHeight: 320 }}
                    >
                      <div
                        className="w-8 h-1 rounded-full mb-5"
                        style={{ backgroundColor: chef.color }}
                      />
                      <p
                        className="text-[0.9375rem] leading-relaxed italic"
                        style={{ ...bf, color: `${C.ecru}B3` }}
                      >
                        &ldquo;{chef.quote}&rdquo;
                      </p>
                      <p
                        className="mt-4 text-[0.75rem]"
                        style={{ ...hf, color: chef.color }}
                      >
                        Chef {chef.name.split(" ")[0]}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  NightUnfolds — horizontal scroll-scrub pinned section          */
/* ═════════════════════════════════════════════════════════════════ */
const nightChapters = [
  {
    title: "Arrival",
    num: "I",
    copy: "You step through the doors. The room hums with low light, warm laughter, quiet anticipation. Welcome bites circulate. Someone hands you a drink. The night has no schedule. Only a rhythm.",
    bg: "#1E2432",
    image: IMG.tableSetting,
  },
  {
    title: "The Feast",
    num: "II",
    copy: "Courses arrive and stories surface. Five chefs. Eight dishes. Every plate a chapter pulled from memory, from home, from history. Hands reach across the table. Nobody\u2019s a stranger by the third course.",
    bg: "#2A1F1F",
    image: IMG.steam,
  },
  {
    title: "After the Story",
    num: "III",
    copy: "The room softens. Dessert lingers. Conversation spills past the plates. You\u2019ll remember the food, sure. But you\u2019ll remember the feeling longer.",
    bg: "#2A2518",
    image: IMG.dessert,
  },
];

function NightUnfoldsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-66.66%"]);

  const [active, setActive] = useState(0);
  const trackedRef = useRef(new Set<number>());
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = v < 0.33 ? 0 : v < 0.66 ? 1 : 2;
    if (next !== active) {
      setActive(next);
      if (!trackedRef.current.has(next)) {
        trackedRef.current.add(next);
        trackEvent("chapterEnter", { chapter: nightChapters[next].num });
      }
    }
  });

  return (
    <section
      ref={containerRef}
      id="night-unfolds"
      className="relative"
      style={{ height: "300vh" }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div className="flex h-full" style={{ x, width: "300%" }}>
          {nightChapters.map((ch) => (
            <div
              key={ch.num}
              className="w-screen h-full flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: ch.bg }}
            >
              <div className="absolute inset-0">
                <ImageWithFallback
                  src={ch.image}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.1, filter: "saturate(0.4)" }}
                />
              </div>
              <div className="relative z-10 px-8 max-w-lg text-center md:text-left">
                <span
                  className="block mb-3"
                  style={{
                    ...hf,
                    color: `${C.gold}66`,
                    fontSize: "0.875rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Chapter {ch.num}
                </span>
                <h3
                  style={{
                    ...hf,
                    color: C.ecru,
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    lineHeight: 1.1,
                  }}
                >
                  {ch.title}
                </h3>
                <p
                  className="mt-6"
                  style={{
                    ...bf,
                    color: `${C.ecru}80`,
                    fontSize: "1rem",
                    lineHeight: 1.8,
                  }}
                >
                  {ch.copy}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Chapter indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
          {nightChapters.map((ch, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    active === i ? C.gold : `${C.ecru}26`,
                  transition: "background-color 0.3s",
                }}
              />
              <span
                className="hidden sm:inline"
                style={{
                  ...bf,
                  color:
                    active === i ? `${C.gold}B3` : `${C.ecru}33`,
                  fontSize: "0.6875rem",
                  transition: "color 0.3s",
                }}
              >
                {ch.num}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  NightUnfolds CALM fallback — static three-card grid            */
/* ═════════════════════════════════════════════════════════════════ */
function NightUnfoldsCalmSection() {
  return (
    <section
      id="night-unfolds"
      className="py-24 md:py-36 px-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="max-w-5xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
          style={{
            ...hf,
            color: C.ecru,
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
          }}
        >
          How the night unfolds
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {nightChapters.map((ch, i) => (
            <motion.div
              key={ch.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: ch.bg,
                border: `1px solid ${C.ecru}0A`,
              }}
            >
              <div className="relative h-40">
                <ImageWithFallback
                  src={ch.image}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.2, filter: "saturate(0.4)" }}
                />
              </div>
              <div className="p-5">
                <span
                  className="block mb-2"
                  style={{
                    ...hf,
                    color: `${C.gold}59`,
                    fontSize: "0.75rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Chapter {ch.num}
                </span>
                <h3
                  className="mb-3"
                  style={{
                    ...hf,
                    color: C.ecru,
                    fontSize: "1.25rem",
                  }}
                >
                  {ch.title}
                </h3>
                <p
                  style={{
                    ...bf,
                    color: `${C.ecru}66`,
                    fontSize: "0.8125rem",
                    lineHeight: 1.7,
                  }}
                >
                  {ch.copy}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  Booking Section                                                */
/* ═════════════════════════════════════════════════════════════════ */
const seatings = [
  {
    time: "5:00 PM",
    label: "First Seating",
    vibe: "Doors open. Lights dim. We guide you through each course, one chapter at a time.",
    soldOut: false,
  },
  {
    time: "8:00 PM",
    label: "Second Seating",
    vibe: "The late chapter. Same story, deeper into the night.",
    soldOut: false,
  },
];

function BookingSection({ persona }: { persona: PersonaRole }) {
  const ctaFor = (soldOut: boolean) => {
    if (soldOut) return "Join the family list";
    return persona === "guest"
      ? "Reserve this seating"
      : persona === "partner"
        ? "Request a partner preview"
        : "Share this with a friend";
  };

  return (
    <section
      id="booking"
      className="relative py-24 md:py-36 px-6"
      style={{ backgroundColor: C.bg }}
    >
      <div className="max-w-3xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          className="text-center mb-4"
          style={{
            ...hf,
            color: C.ecru,
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
          }}
        >
          Choose your seating.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mb-12"
        >
          <span
            className="flex items-center gap-1.5"
            style={{ ...bf, color: `${C.ecru}59`, fontSize: "0.75rem" }}
          >
            <Calendar className="w-3 h-3" />
            May 22, 2026
          </span>
          <span
            className="flex items-center gap-1.5"
            style={{ ...bf, color: `${C.ecru}59`, fontSize: "0.75rem" }}
          >
            <MapPin className="w-3 h-3" />
            Keep Memory Alive Event Center
          </span>
          <span
            className="flex items-center gap-1.5"
            style={{ ...bf, color: `${C.ecru}59`, fontSize: "0.75rem" }}
          >
            <UtensilsCrossed className="w-3 h-3" />
            ~$150 GA
          </span>
          <span
            style={{ ...bf, color: `${C.ecru}40`, fontSize: "0.6875rem" }}
          >
            Optional beverage pairing
          </span>
          <span
            style={{ ...bf, color: `${C.ecru}40`, fontSize: "0.6875rem" }}
          >
            Dietary accommodations available
          </span>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4">
          {seatings.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="rounded-2xl p-6 flex flex-col"
              style={{
                backgroundColor: s.soldOut
                  ? `${C.ecru}05`
                  : `${C.ecru}08`,
                border: `1px solid ${s.soldOut ? `${C.ecru}08` : `${C.ecru}0F`}`,
                opacity: s.soldOut ? 0.7 : 1,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-4 h-4" style={{ color: s.soldOut ? `${C.ecru}40` : C.gold }} />
                <span
                  style={{
                    ...hf,
                    color: s.soldOut ? `${C.ecru}59` : C.gold,
                    fontSize: "1.25rem",
                  }}
                >
                  {s.time}
                </span>
                {s.soldOut && (
                  <span
                    className="ml-auto px-2 py-0.5 rounded-full text-[0.625rem]"
                    style={{
                      ...bf,
                      backgroundColor: `${C.blush}1A`,
                      color: C.blush,
                      fontWeight: 600,
                    }}
                  >
                    Sold Out
                  </span>
                )}
              </div>
              <h3
                style={{
                  ...hf,
                  color: s.soldOut ? `${C.ecru}59` : C.ecru,
                  fontSize: "1.125rem",
                }}
              >
                {s.label}
              </h3>
              <p
                className="mt-2 flex-1"
                style={{
                  ...bf,
                  color: `${C.ecru}66`,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                }}
              >
                {s.vibe}
              </p>
              {s.soldOut && (
                <p
                  className="mt-3 text-[0.75rem]"
                  style={{ ...bf, color: `${C.ecru}40` }}
                >
                  We&rsquo;ll let you know first when the next Isang Kusina
                  is announced.
                </p>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  trackEvent("CTAClick", {
                    location: "booking",
                    seating: s.label,
                    soldOut: String(s.soldOut),
                  })
                }
                className="mt-6 w-full py-3.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                style={{
                  background: s.soldOut
                    ? `${C.ecru}0F`
                    : `linear-gradient(135deg, ${C.gold}, ${C.brass})`,
                  color: s.soldOut ? `${C.ecru}66` : C.bg,
                  ...bf,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                }}
              >
                {ctaFor(s.soldOut)}
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-8"
          style={{ ...bf, color: `${C.ecru}40`, fontSize: "0.75rem" }}
        >
          Optional beverage pairing available &middot; Dietary accommodations
          provided &middot; All-inclusive experience
        </motion.p>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  Share / Closing Section                                        */
/* ═════════════════════════════════════════════════════════════════ */
function ShareSection() {
  const [copied, setCopied] = useState(false);
  const shareText =
    "Five Filipino chefs. One night in Vegas. One story at the table. isangkusina.com";

  const handleShare = async () => {
    trackEvent("shareAction", { method: navigator.share ? "native" : "clipboard" });
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Isang Kusina 2026",
          text: shareText,
          url: "https://isangkusina.com",
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section
      className="relative py-28 md:py-40 px-6 overflow-hidden"
      style={{ backgroundColor: C.bg }}
    >
      {/* Screenshot-friendly frame for IG stories */}
      <div
        className="max-w-2xl mx-auto text-center relative"
        style={{ isolation: "isolate" }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${C.gold}0D 0%, ${C.gold}00 70%)`,
          }}
        />

        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          className="w-16 h-px mx-auto mb-10 origin-center"
          style={{ backgroundColor: `${C.gold}40` }}
        />

        <motion.img
          src={istoryaLogo}
          alt=""
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.12 }}
          viewport={{ once: true }}
          className="w-36 mx-auto mb-10"
          style={{
            filter: "brightness(0.5) sepia(1) saturate(0.3)",
          }}
        />

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-3"
          style={{
            ...bf,
            color: `${C.gold}80`,
            fontSize: "0.8125rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
          }}
        >
          May 22, 2026 &middot; Las Vegas
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            ...hf,
            color: C.ecru,
            fontSize: "clamp(2rem, 6vw, 3.25rem)",
            lineHeight: 1.12,
          }}
        >
          Isang Kusina.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-3"
          style={{
            ...hf,
            color: `${C.ecru}8C`,
            fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
            lineHeight: 1.3,
          }}
        >
          One kitchen. One story told
          <br />
          together at the table.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-6 max-w-sm mx-auto"
          style={{
            ...bf,
            color: `${C.ecru}4D`,
            fontSize: "0.8125rem",
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          You&rsquo;re invited to step into the Istorya.
        </motion.p>

        {/* Social proof quotes */}
        <div className="mt-14 space-y-6">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-sm mx-auto"
            style={{
              borderLeft: `2px solid ${C.gold}33`,
              paddingLeft: 16,
            }}
          >
            <p
              className="italic text-left"
              style={{
                ...bf,
                color: `${C.ecru}73`,
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              &ldquo;We forgot we were in Vegas for two hours.&rdquo;
            </p>
            <footer
              className="mt-2 text-left"
              style={{ ...bf, color: `${C.gold}66`, fontSize: "0.75rem" }}
            >
              Year Two guest
            </footer>
          </motion.blockquote>

          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="max-w-sm mx-auto"
            style={{
              borderLeft: `2px solid ${C.sage}33`,
              paddingLeft: 16,
            }}
          >
            <p
              className="italic text-left"
              style={{
                ...bf,
                color: `${C.ecru}73`,
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              &ldquo;This isn&rsquo;t a dinner. It&rsquo;s a homecoming you
              didn&rsquo;t know you needed.&rdquo;
            </p>
            <footer
              className="mt-2 text-left"
              style={{ ...bf, color: `${C.sage}66`, fontSize: "0.75rem" }}
            >
              Asian Journal
            </footer>
          </motion.blockquote>
        </div>

        {/* Share CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-14 flex flex-col items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full cursor-pointer min-h-[44px]"
            style={{
              background: `linear-gradient(135deg, ${C.gold}, ${C.brass})`,
              color: C.bg,
              ...bf,
              fontWeight: 600,
              fontSize: "0.9375rem",
              boxShadow: `0 0 40px ${C.gold}26`,
            }}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {copied ? "Copied to clipboard" : "Send this to someone"}
          </motion.button>

          <span
            style={{ ...bf, color: `${C.ecru}1F`, fontSize: "0.6875rem" }}
          >
            Screenshot this frame for your IG story
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  Footer                                                         */
/* ═════════════════════════════════════════════════════════════════ */
function LandingFooter() {
  const links = [
    { label: "Contact", href: "mailto:hello@istoryalv.com" },
    { label: "FAQs", href: "#" },
    { label: "Accessibility", href: "#" },
    { label: "For Partners & Press", href: "/portal" },
    { label: "About Istorya", href: "https://www.istoryalv.com" },
  ];

  return (
    <footer
      className="py-14 px-6"
      style={{
        backgroundColor: "#141413",
        borderTop: `1px solid ${C.ecru}08`,
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={istoryaLogo}
            alt="Istorya"
            className="h-6"
            style={{
              filter: "brightness(0.5) sepia(1) saturate(0.3) hue-rotate(10deg)",
              opacity: 0.3,
            }}
          />
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="cursor-pointer min-h-[44px] flex items-center"
              style={{ ...bf, color: `${C.ecru}4D`, fontSize: "0.75rem" }}
              onClick={() => {
                if (l.href === "/portal") trackEvent("portalClick", { location: "footer" });
              }}
              {...(l.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {l.label}
              {l.href.startsWith("http") && (
                <ExternalLink className="w-2.5 h-2.5 ml-1 inline" />
              )}
            </a>
          ))}
        </div>

        <p
          className="text-center mb-6"
          style={{ ...bf, color: `${C.ecru}26`, fontSize: "0.6875rem" }}
        >
          Made with malasakit in Las Vegas.
        </p>

        <div className="flex justify-center gap-5 mb-8">
          <a
            href="https://instagram.com/istoryalv"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Istorya on Instagram"
            className="cursor-pointer p-2"
          >
            <Instagram
              className="w-4 h-4"
              style={{ color: `${C.ecru}33` }}
            />
          </a>
          <a
            href="https://tiktok.com/@istoryalv"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Istorya on TikTok"
            className="cursor-pointer p-2"
          >
            <TikTokIcon
              className="w-4 h-4"
              style={{ color: `${C.ecru}33` }}
            />
          </a>
        </div>

        <p
          className="text-center"
          style={{ ...bf, color: `${C.ecru}14`, fontSize: "0.5625rem" }}
        >
          &copy; 2026 Istorya, LLC. All rights reserved.
        </p>

        {/* Reset persona / back to top */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => {
              localStorage.removeItem("ik26-persona");
              localStorage.removeItem("ik26-splash-seen");
              window.location.reload();
            }}
            className="cursor-pointer min-h-[44px] flex items-center"
            style={{ ...bf, color: `${C.ecru}14`, fontSize: "0.5625rem" }}
          >
            Reset experience
          </button>
          <span
            className="flex items-center"
            style={{ color: `${C.ecru}0A` }}
          >
            &middot;
          </span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="cursor-pointer min-h-[44px] flex items-center"
            style={{ ...bf, color: `${C.ecru}14`, fontSize: "0.5625rem" }}
          >
            Back to top &uarr;
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ═════════════════════════════════════════════════════════════════ */
/*  LandingPage — top-level orchestrator                           */
/* ═════════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const [phase, setPhase] = useState<"splash" | "gate" | "site">(() => {
    const splashSeen = localStorage.getItem("ik26-splash-seen");
    const persona = localStorage.getItem("ik26-persona") as PersonaRole | null;
    if (splashSeen && persona) return "site";
    if (splashSeen && !persona) return "gate";
    return "splash";
  });

  const [persona, setPersona] = useState<PersonaRole>(
    () =>
      (localStorage.getItem("ik26-persona") as PersonaRole) || "explorer"
  );

  const [calmMode, setCalmMode] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  // Set document title for landing page
  useEffect(() => {
    document.title =
      "Isang Kusina 2026 — One Kitchen. One Night. One Story.";

    // Update meta for the public page
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Five Filipino chefs from five cities. One collaborative dinner in Las Vegas on May 22, 2026. Every course is a chapter. Reserve your seat at isangkusina.com."
    );

    // Open Graph meta for social sharing
    const ogTags: Record<string, string> = {
      "og:title": "Isang Kusina 2026 — One Night. One Kitchen. One Story.",
      "og:description":
        "Five Filipino chefs from five cities. One collaborative dinner in Las Vegas on May 22, 2026. Every course is a chapter.",
      "og:type": "website",
      "og:url": "https://isangkusina.com",
      "og:site_name": "Isang Kusina 2026",
      "og:locale": "en_US",
      "twitter:card": "summary_large_image",
      "twitter:title": "Isang Kusina 2026",
      "twitter:description":
        "Five Filipino chefs. One night in Vegas. You're invited to step into the Istorya.",
    };
    Object.entries(ogTags).forEach(([property, content]) => {
      const attr = property.startsWith("twitter:") ? "name" : "property";
      let tag = document.querySelector(`meta[${attr}="${property}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(attr, property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    });

    // Theme color for mobile browsers
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.setAttribute("name", "theme-color");
      document.head.appendChild(themeColor);
    }
    themeColor.setAttribute("content", C.bg);
  }, []);

  const handleSplashDone = () => {
    localStorage.setItem("ik26-splash-seen", "true");
    if (localStorage.getItem("ik26-persona")) {
      setPhase("site");
    } else {
      setPhase("gate");
    }
  };

  const handlePersonaSelect = (role: PersonaRole) => {
    setPersona(role);
    localStorage.setItem("ik26-persona", role);
    if (role === "partner") {
      window.location.href = "/portal";
      return;
    }
    setPhase("site");
  };

  return (
    <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
      <AnimatePresence mode="wait">
        {phase === "splash" && (
          <IntroSplash key="splash" onComplete={handleSplashDone} />
        )}
        {phase === "gate" && (
          <PersonalizationGate
            key="gate"
            onSelect={handlePersonaSelect}
          />
        )}
      </AnimatePresence>

      {phase === "site" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ScrollProgressSpine />
          <StickyNav
            calmMode={calmMode}
            onToggleCalm={() => setCalmMode((p) => !p)}
          />

          <HeroSection persona={persona} />
          <WhatIsSection />
          <ChefsSection />
          {calmMode ? (
            <NightUnfoldsCalmSection />
          ) : (
            <NightUnfoldsSection />
          )}
          <BookingSection persona={persona} />
          <ShareSection />
          <LandingFooter />
        </motion.div>
      )}
    </div>
  );
}
