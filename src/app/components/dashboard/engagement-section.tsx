import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ChevronDown } from "lucide-react";
import { FunFacts } from "../engagement/fun-facts";
import { TriviaDrop } from "../engagement/trivia-drop";
import { MemoryWall } from "../engagement/memory-wall";
import { FlavorFusion } from "../engagement/flavor-fusion";
import { RecipeRoulette } from "../engagement/recipe-roulette";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

export function EngagementSection({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      {/* Section header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full mb-3 cursor-pointer group"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(206,180,122,0.06)" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "#CEB47A" }} />
        </div>
        <span
          className="text-foreground text-[0.8125rem] group-hover:text-gold transition-colors"
          style={headingFont}
        >
          Engagement
        </span>
        <span
          className="text-muted-foreground/30 text-[0.5625rem] ml-0.5"
          style={bodyFont}
        >
          5 activities
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground/30 ml-auto transition-transform duration-300 ${
            expanded ? "rotate-0" : "-rotate-90"
          }`}
        />
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-5">
              {/* Fun facts */}
              <FunFacts />

              {/* Trivia */}
              <TriviaDrop />

              {/* Memory Wall */}
              <MemoryWall onNavigate={onNavigate} />

              {/* Flavor Fusion */}
              <FlavorFusion onNavigate={onNavigate} />

              {/* Recipe Roulette */}
              <RecipeRoulette />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}