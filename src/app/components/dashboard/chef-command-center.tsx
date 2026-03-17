import { motion } from "motion/react";
import {
  BookOpen,
  MessageCircle,
  UtensilsCrossed,
  ClipboardList,
  Plane,
  ChefHat,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { bodyFont, headingFont } from "../../lib/fonts";

interface ChefCommandCenterProps {
  onNavigate: (page: string) => void;
}

interface CommandCard {
  title: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
  accentGradient: string;
  navigateTo: string;
  cta: string;
}

const commandCards: CommandCard[] = [
  {
    title: "Your Research Partner",
    description: "Connect with your researcher for historical context, storytelling, and cultural background.",
    icon: BookOpen,
    color: "#9FB0D4",
    accentGradient: "linear-gradient(135deg, rgba(159,176,212,0.12) 0%, rgba(159,176,212,0.04) 100%)",
    navigateTo: "Comms",
    cta: "Open Comms",
  },
  {
    title: "Menu & Ingredients",
    description: "Submit your dish concepts, key ingredients, specialty sourcing, and plating ideas.",
    icon: UtensilsCrossed,
    color: "#CBA47A",
    accentGradient: "linear-gradient(135deg, rgba(203,164,122,0.12) 0%, rgba(203,164,122,0.04) 100%)",
    navigateTo: "Submit Menu",
    cta: "Submit Menu",
  },
  {
    title: "Kitchen & Equipment",
    description: "Log equipment needs, cookware preferences, station setup, and special requirements.",
    icon: ClipboardList,
    color: "#8AAD84",
    accentGradient: "linear-gradient(135deg, rgba(138,173,132,0.12) 0%, rgba(138,173,132,0.04) 100%)",
    navigateTo: "Menu & Courses",
    cta: "Submit Needs",
  },
  {
    title: "Travel & Logistics",
    description: "View flight details, lodging info, airport transfers, and arrival day schedule.",
    icon: Plane,
    color: "#4E8282",
    accentGradient: "linear-gradient(135deg, rgba(78,130,130,0.12) 0%, rgba(78,130,130,0.04) 100%)",
    navigateTo: "Travel & Lodging",
    cta: "Check Travel",
  },
];

export function ChefCommandCenter({ onNavigate }: ChefCommandCenterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="ik26-card-elevated overflow-hidden"
    >
      {/* Header with warm gradient accent */}
      <div
        className="relative px-5 pt-5 pb-4"
        style={{
          background: "linear-gradient(180deg, rgba(203,164,122,0.04) 0%, transparent 100%)",
        }}
      >
        {/* Decorative accent line */}
        <div
          className="absolute top-0 left-5 right-5 h-[2px] rounded-full"
          style={{
            background: "linear-gradient(90deg, rgba(203,164,122,0.3) 0%, rgba(192,142,126,0.2) 50%, transparent 100%)",
          }}
        />
        <div className="flex items-center gap-2.5 mb-1.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(203,164,122,0.15) 0%, rgba(192,142,126,0.1) 100%)",
              border: "1px solid rgba(203,164,122,0.15)",
            }}
          >
            <ChefHat className="w-4 h-4" style={{ color: "#CBA47A" }} />
          </div>
          <div>
            <h3
              className="text-[0.9375rem] text-foreground leading-tight"
              style={headingFont}
            >
              Your Command Center
            </h3>
            <p
              className="text-[0.6875rem] text-muted-foreground mt-0.5"
              style={bodyFont}
            >
              Everything you need — one tap away
            </p>
          </div>
        </div>
      </div>

      {/* Command cards grid */}
      <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {commandCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(card.navigateTo)}
              className="relative flex flex-col items-start p-4 rounded-xl cursor-pointer group text-left overflow-hidden"
              style={{
                background: card.accentGradient,
                border: `1px solid ${card.color}18`,
              }}
            >
              {/* Hover glow effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${card.color}08 0%, transparent 70%)`,
                }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 relative"
                style={{
                  background: `${card.color}12`,
                  border: `1px solid ${card.color}20`,
                  boxShadow: `0 2px 8px ${card.color}10`,
                }}
              >
                <Icon className="w-[18px] h-[18px]" style={{ color: card.color }} />
              </div>
              <span
                className="text-foreground text-[0.8125rem] font-medium mb-1 relative"
                style={bodyFont}
              >
                {card.title}
              </span>
              <p
                className="text-muted-foreground text-[0.6875rem] leading-relaxed mb-3 relative"
                style={bodyFont}
              >
                {card.description}
              </p>
              <div className="flex items-center gap-1 mt-auto relative">
                <span
                  className="text-[0.6875rem] font-medium"
                  style={{ color: card.color, ...bodyFont }}
                >
                  {card.cta}
                </span>
                <ArrowRight
                  className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200"
                  style={{ color: card.color, opacity: 0.6 }}
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Brainstorm CTA */}
      <div className="px-3 pb-4 flex gap-2">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("Chef Journey")}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(78,130,130,0.08) 0%, rgba(78,130,130,0.04) 100%)",
            border: "1px solid rgba(78,130,130,0.15)",
          }}
        >
          <BookOpen className="w-3.5 h-3.5" style={{ color: "#4E8282" }} />
          <span className="text-[0.75rem] font-medium" style={{ color: "#4E8282", ...bodyFont }}>
            Chef Journey
          </span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("Our Istoryas")}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(203,164,122,0.08) 0%, rgba(192,142,126,0.06) 100%)",
            border: "1px solid rgba(203,164,122,0.15)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#CBA47A" }} />
          <span className="text-[0.75rem] font-medium" style={{ color: "#CBA47A", ...bodyFont }}>
            Share Istorya
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}