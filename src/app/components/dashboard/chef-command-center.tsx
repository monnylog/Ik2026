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

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ChefCommandCenterProps {
  onNavigate: (page: string) => void;
}

interface CommandCard {
  title: string;
  description: string;
  icon: typeof BookOpen;
  color: string;
  bg: string;
  border: string;
  navigateTo: string;
  cta: string;
}

const commandCards: CommandCard[] = [
  {
    title: "Your Research Partner",
    description: "Connect with your assigned researcher for historical context, storytelling, and cultural background for your course.",
    icon: BookOpen,
    color: "#8899A6",
    bg: "rgba(136,153,166,0.04)",
    border: "rgba(136,153,166,0.10)",
    navigateTo: "Comms",
    cta: "Open Comms",
  },
  {
    title: "Menu & Ingredients",
    description: "Submit your dish concepts, key ingredients, specialty sourcing requests, and plating ideas.",
    icon: UtensilsCrossed,
    color: "#D4B896",
    bg: "rgba(212,184,150,0.04)",
    border: "rgba(212,184,150,0.10)",
    navigateTo: "Submit Menu",
    cta: "Submit Menu",
  },
  {
    title: "Kitchen & Equipment",
    description: "Log your equipment needs, cookware preferences, station setup, and any special kitchen requirements.",
    icon: ClipboardList,
    color: "#8AAD84",
    bg: "rgba(138,173,132,0.04)",
    border: "rgba(138,173,132,0.10)",
    navigateTo: "Menu & Courses",
    cta: "Submit Needs",
  },
  {
    title: "Travel & Logistics",
    description: "View your flight details, lodging info, airport transfers, and arrival day schedule.",
    icon: Plane,
    color: "#6B9EC2",
    bg: "rgba(107,158,194,0.04)",
    border: "rgba(107,158,194,0.10)",
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
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(212,184,150,0.08)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#D4B896" }} />
          <ChefHat className="w-4 h-4" style={{ color: "#D4B896" }} />
          <h3 className="text-foreground" style={headingFont}>
            Your Command Center
          </h3>
        </div>
        <p className="text-muted-foreground text-[0.75rem] pl-7" style={bodyFont}>
          Everything you need to coordinate — one tap away.
        </p>
      </div>

      {/* Command cards */}
      <div className="p-3 space-y-2">
        {commandCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + idx * 0.06 }}
              whileHover={{ x: 2 }}
              onClick={() => onNavigate(card.navigateTo)}
              className="w-full flex items-start gap-3 px-4 py-3.5 rounded-xl cursor-pointer group text-left"
              style={{
                backgroundColor: card.bg,
                border: `1px solid ${card.border}`,
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${card.color}15`, border: `1px solid ${card.color}25` }}
              >
                <Icon className="w-4 h-4" style={{ color: card.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-foreground text-[0.8125rem]" style={bodyFont}>
                    {card.title}
                  </span>
                </div>
                <p className="text-muted-foreground text-[0.6875rem] leading-relaxed" style={bodyFont}>
                  {card.description}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 mt-1">
                <span
                  className="text-[0.625rem] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: card.color, ...bodyFont }}
                >
                  {card.cta}
                </span>
                <ArrowRight
                  className="w-3.5 h-3.5 text-muted-foreground/25 group-hover:text-gold transition-colors"
                />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Brainstorm CTA */}
      <div className="px-4 pb-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate("Our Istoryas")}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer"
          style={{
            backgroundColor: "rgba(201,169,110,0.08)",
            border: "1px solid rgba(201,169,110,0.2)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
          <span className="text-[0.75rem]" style={{ color: "#C9A96E", ...bodyFont }}>
            Brainstorm & Share Your Istorya
          </span>
          <ArrowRight className="w-3 h-3" style={{ color: "#C9A96E", opacity: 0.5 }} />
        </motion.button>
      </div>
    </motion.div>
  );
}