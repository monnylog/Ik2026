import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface FunFact {
  id: string;
  text: string;
  source?: string;
  category: "history" | "culinary" | "culture" | "language" | "trade";
}

const funFacts: FunFact[] = [
  {
    id: "f1",
    text: "The Boxer Codex (c. 1590) is one of the earliest illustrated manuscripts depicting Filipino people, their clothing, and customs — created decades before most colonial accounts.",
    source: "Boxer Codex",
    category: "history",
  },
  {
    id: "f2",
    text: "Turmeric (luyang dilaw) has been cultivated in the Sulu Archipelago for centuries. Tausug cuisine uses it as a base for tiyula itum, a blackened soup made with burnt coconut.",
    category: "culinary",
  },
  {
    id: "f3",
    text: "Binondo in Manila, established in 1594, is considered the oldest Chinatown in the world — and its food scene is a living archive of Chinese-Filipino culinary fusion.",
    category: "history",
  },
  {
    id: "f4",
    text: "The Manila-Acapulco Galleon Trade (1565–1815) carried not just silk and silver, but also chocolate, chili peppers, and tomatoes — forever changing Filipino cuisine.",
    source: "Galleon Trade",
    category: "trade",
  },
  {
    id: "f5",
    text: "Bagoong (fermented shrimp paste) shares deep roots with fish sauce traditions across Southeast Asia. In the Philippines, regional varieties range from sweet pink to pungent black.",
    category: "culinary",
  },
  {
    id: "f6",
    text: "The word 'kusina' comes from the Spanish 'cocina' — but Filipino kitchens predate Spanish contact by millennia. Cooking with clay pots (palayok) is among the oldest continuous traditions.",
    category: "language",
  },
  {
    id: "f7",
    text: "Calamansi, the tiny citrus ubiquitous in Filipino cooking, is actually a hybrid — a cross between kumquat and mandarin that evolved in the Philippines over thousands of years.",
    category: "culinary",
  },
  {
    id: "f8",
    text: "The concept of 'salo-salo' (eating together) is central to Filipino culture. The kamayan feast — eating with hands from banana leaves — is an act of equality: everyone starts the same way.",
    category: "culture",
  },
  {
    id: "f9",
    text: "Before refrigeration, Filipino preservation methods included fermentation (burong), smoking (tinapa), salting (tuyo), and vinegar-cooking (adobo) — each method shaped by the demands of tropical climate and local geography.",
    category: "culinary",
  },
  {
    id: "f10",
    text: "The Philippine archipelago has over 7,641 islands, and nearly every island group has its own version of adobo — a fact that delights and divides Filipino food lovers equally.",
    category: "culture",
  },
  {
    id: "f11",
    text: "Patis (fish sauce) from Pangasinan is sometimes aged for two years in clay jars. The best batches develop a complex umami that rivals aged balsamic.",
    category: "culinary",
  },
  {
    id: "f12",
    text: "The ancient Baybayin script was used across the Philippines before Spanish colonization. Today, chefs and artists are reviving it as a mark of cultural reclamation.",
    source: "Baybayin",
    category: "history",
  },
  {
    id: "f13",
    text: "Ube (purple yam) has been cultivated in the Philippines for over 4,000 years. Its vibrant color comes from anthocyanins — the same antioxidants found in blueberries.",
    category: "culinary",
  },
  {
    id: "f14",
    text: "The Filipino 'merienda' tradition (afternoon snack) reflects both Spanish siesta culture and the tropical need for sustained energy through long, humid days.",
    category: "culture",
  },
  {
    id: "f15",
    text: "Coconut trees are called the 'tree of life' in the Philippines — every part is used: the water for drinking, the meat for cooking, the husk for fiber, the shell for charcoal.",
    category: "culinary",
  },
  {
    id: "f16",
    text: "The 'Istorya' in our name comes from the Visayan word for 'story.' In Cebuano, it also means 'to converse' — reflecting that storytelling is inherently a collaborative act.",
    category: "language",
  },
  {
    id: "f17",
    text: "Lanzones, a fruit native to the Philippines, was once so sacred that harvesting it before it was ripe was considered a community offense — a lesson in patience and collective timing.",
    category: "culture",
  },
  {
    id: "f18",
    text: "The X motif in Istorya's branding represents a constellation — each person, ingredient, and reference point connected across time and geography.",
    source: "Istorya Brand",
    category: "culture",
  },
];

const intros = [
  "Historical context:",
  "Research Notes",
  "Did you know?",
  "Reference:",
  "Culinary context:",
  "Background:",
];

function getRandomFact(exclude?: string): FunFact {
  const available = exclude ? funFacts.filter((f) => f.id !== exclude) : funFacts;
  return available[Math.floor(Math.random() * available.length)];
}

function getRandomIntro(): string {
  return intros[Math.floor(Math.random() * intros.length)];
}

interface FunFactsProps {
  compact?: boolean;
}

export function FunFacts({ compact }: FunFactsProps) {
  const [fact, setFact] = useState<FunFact>(() => getRandomFact());
  const [intro, setIntro] = useState(() => getRandomIntro());
  const [key, setKey] = useState(0);

  const shuffle = useCallback(() => {
    setFact((prev) => getRandomFact(prev.id));
    setIntro(getRandomIntro());
    setKey((k) => k + 1);
  }, []);

  const categoryColors: Record<string, string> = {
    history: "#6B7F8E",
    culinary: "#7E9E78",
    culture: "#C9A96E",
    language: "#4A7FB5",
    trade: "#CDA88A",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(201,169,110,0.15)" }}
    >
      <div
        className={compact ? "p-3" : "p-4"}
        style={{
          background:
            "linear-gradient(135deg, rgba(201,169,110,0.04) 0%, rgba(205,168,138,0.02) 50%, rgba(237,235,226,0.3) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {/* X constellation motif */}
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(201,169,110,0.12)" }}
            >
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            </div>
            {!compact && (
              <span
                className="text-[0.6875rem] uppercase tracking-[0.1em] text-muted-foreground/50"
                style={bodyFont}
              >
                Research Notes
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={shuffle}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            title="Next"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground/40" />
          </motion.button>
        </div>

        {/* Fact */}
        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <p
              className="text-muted-foreground text-[0.6875rem] italic mb-1.5"
              style={headingFont}
            >
              {intro}
            </p>
            <p
              className={`text-foreground leading-relaxed ${compact ? "text-[0.75rem]" : "text-[0.8125rem]"}`}
              style={bodyFont}
            >
              {fact.text}
            </p>

            <div className="flex items-center gap-2 mt-2.5">
              <span
                className="text-[0.5625rem] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${categoryColors[fact.category]}0D`,
                  color: categoryColors[fact.category],
                  ...bodyFont,
                }}
              >
                {fact.category}
              </span>
              {fact.source && (
                <>
                  <span className="text-muted-foreground/20 text-[0.5rem]">·</span>
                  <span className="text-muted-foreground/40 text-[0.5625rem]" style={bodyFont}>
                    {fact.source}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}