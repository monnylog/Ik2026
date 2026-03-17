import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shuffle, Lightbulb, Send, ChevronDown, Users, ExternalLink } from "lucide-react";
import { getAvatar, getSavedAvatar, getSavedName } from "./avatars";
import { apiFetch } from "../../lib/supabase";
import { useProfile } from "../../lib/profile-context";
import { toast } from "sonner";
import { bodyFont, headingFont } from "../../lib/fonts";

// Filipino ingredients organized by category
const ingredients = {
  protein: [
    "Milkfish (Bangus)", "Pork Belly", "Chicken Thigh", "Shrimp",
    "Squid", "Ox Tail", "Goat", "Duck", "Crab", "Mussels (Tahong)",
  ],
  produce: [
    "Green Mango", "Bitter Melon (Ampalaya)", "Water Spinach (Kangkong)",
    "Eggplant", "Banana Heart", "Taro Leaves (Gabi)", "Winged Beans",
    "Okra", "Sayote", "Ube (Purple Yam)",
  ],
  aromatics: [
    "Calamansi", "Lemongrass (Tanglad)", "Ginger (Luya)", "Garlic",
    "Annatto (Atsuete)", "Turmeric (Luyang Dilaw)", "Pandan",
    "Bay Leaf (Laurel)", "Shallots", "Chili (Siling Labuyo)",
  ],
  pantry: [
    "Coconut Milk", "Fish Sauce (Patis)", "Shrimp Paste (Bagoong)",
    "Cane Vinegar (Sukang Iloko)", "Tamarind", "Fermented Black Beans",
    "Coconut Cream", "Palm Vinegar", "Dried Anchovies (Dilis)",
    "Muscovado Sugar",
  ],
};

const allIngredients = Object.values(ingredients).flat();

function getRandomPair(exclude?: [string, string]): [string, string] {
  let a: string, b: string;
  do {
    a = allIngredients[Math.floor(Math.random() * allIngredients.length)];
    b = allIngredients[Math.floor(Math.random() * allIngredients.length)];
  } while (
    a === b ||
    (exclude && a === exclude[0] && b === exclude[1]) ||
    (exclude && a === exclude[1] && b === exclude[0])
  );
  return [a, b];
}

function getCategoryColor(ingredient: string): string {
  if (ingredients.protein.includes(ingredient)) return "#CDA88A";
  if (ingredients.produce.includes(ingredient)) return "#7E9E78";
  if (ingredients.aromatics.includes(ingredient)) return "#C9A96E";
  return "#3B6298";
}

interface FusionIdea {
  id: string;
  ingredientA: string;
  ingredientB: string;
  author: string;
  avatarId: string;
  idea: string;
  timestamp: string;
  userId?: string;
}

export function FlavorFusion({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { profile } = useProfile();
  const [pair, setPair] = useState<[string, string]>(() => getRandomPair());
  const [ideas, setIdeas] = useState<FusionIdea[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const userName = getSavedName();
  const userAvatar = getSavedAvatar();

  const shuffle = useCallback(() => {
    setPair((prev) => getRandomPair(prev));
    setIdeas([]);
    setInputText("");
    setShowIdeas(false);
    setAnimKey((k) => k + 1);
  }, []);

  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || !userName) return;

    setSending(true);
    const idea: FusionIdea = {
      id: `ff-${Date.now()}`,
      ingredientA: pair[0],
      ingredientB: pair[1],
      author: userName,
      avatarId: userAvatar,
      idea: text,
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      userId: profile?.id,
    };

    try {
      await apiFetch("/flavor-fusion", {
        method: "POST",
        body: JSON.stringify(idea),
      });
      setIdeas((prev) => [...prev, idea]);
      setInputText("");
      setShowIdeas(true);
      toast.success("Fusion idea shared!");
    } catch (err) {
      console.error("Failed to save flavor fusion idea:", err);
      toast.error("Failed to share idea.");
    } finally {
      setSending(false);
    }
  };

  const colorA = getCategoryColor(pair[0]);
  const colorB = getCategoryColor(pair[1]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.32, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(201,169,110,0.12)" }}
    >
      <div
        className="p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(201,169,110,0.03) 0%, rgba(126,158,120,0.03) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(201,169,110,0.12)" }}
            >
              <Lightbulb className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            </div>
            <div>
              <span
                className="text-foreground text-[0.8125rem]"
                style={headingFont}
              >
                Flavor Fusion
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.3 }}
            onClick={shuffle}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/60 transition-colors cursor-pointer"
            title="New pairing"
          >
            <Shuffle className="w-3.5 h-3.5 text-muted-foreground/40" />
          </motion.button>
        </div>

        <p
          className="text-muted-foreground/50 text-[0.6875rem] mb-3"
          style={bodyFont}
        >
          Two ingredients, one creative idea. What would you make?
        </p>

        {/* Ingredient pair */}
        <AnimatePresence mode="wait">
          <motion.div
            key={animKey}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 mb-3"
          >
            <div
              className="flex-1 p-3 rounded-xl text-center"
              style={{
                backgroundColor: `${colorA}08`,
                border: `1px solid ${colorA}20`,
              }}
            >
              <p
                className="text-[0.8125rem] font-medium"
                style={{ color: colorA, ...headingFont }}
              >
                {pair[0]}
              </p>
            </div>

            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                backgroundColor: "rgba(201,169,110,0.1)",
                border: "1px solid rgba(201,169,110,0.2)",
              }}
            >
              <span
                className="text-[0.5rem]"
                style={{ color: "#C9A96E", ...headingFont }}
              >
                +
              </span>
            </div>

            <div
              className="flex-1 p-3 rounded-xl text-center"
              style={{
                backgroundColor: `${colorB}08`,
                border: `1px solid ${colorB}20`,
              }}
            >
              <p
                className="text-[0.8125rem] font-medium"
                style={{ color: colorB, ...headingFont }}
              >
                {pair[1]}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Input */}
        {userName ? (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="A dish, technique, or idea..."
                className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
                style={bodyFont}
                maxLength={300}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={!inputText.trim() || sending}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                inputText.trim()
                  ? "text-white"
                  : "bg-secondary/60 text-muted-foreground/30"
              }`}
              style={inputText.trim() ? { backgroundColor: "#C9A96E" } : {}}
            >
              <Send className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        ) : (
          <p
            className="text-muted-foreground/50 text-[0.75rem] mb-2"
            style={bodyFont}
          >
            Set your display name in Comms to share ideas.
          </p>
        )}

        {/* Submitted ideas */}
        {ideas.length > 0 && (
          <div>
            <button
              onClick={() => setShowIdeas(!showIdeas)}
              className="flex items-center gap-1.5 w-full cursor-pointer group"
            >
              <Users className="w-3 h-3 text-muted-foreground/40" />
              <span
                className="text-[0.6875rem] text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors"
                style={bodyFont}
              >
                {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${
                  showIdeas ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showIdeas && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    {ideas.map((idea) => {
                      const av = getAvatar(idea.avatarId);
                      const isOwn =
                        profile?.id && idea.userId === profile.id;
                      return (
                        <div key={idea.id} className="flex items-start gap-2.5">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[0.75rem] shrink-0 mt-0.5"
                            style={{ backgroundColor: av.bg }}
                          >
                            {av.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className="text-[0.75rem]"
                                style={{ color: av.color, ...bodyFont }}
                              >
                                {idea.author}
                              </span>
                              {isOwn && (
                                <span
                                  className="text-[0.5rem] px-1 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: "rgba(201,169,110,0.12)",
                                    color: "#C9A96E",
                                    ...bodyFont,
                                  }}
                                >
                                  you
                                </span>
                              )}
                              <span
                                className="text-muted-foreground/30 text-[0.5625rem]"
                                style={bodyFont}
                              >
                                {idea.timestamp}
                              </span>
                            </div>
                            <p
                              className="text-foreground/80 text-[0.75rem] leading-relaxed"
                              style={bodyFont}
                            >
                              {idea.idea}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Archive link */}
        {onNavigate && (
          <button
            onClick={() => onNavigate("Our Istoryas")}
            className="flex items-center gap-1.5 mt-2 w-full justify-center cursor-pointer group"
          >
            <ExternalLink className="w-2.5 h-2.5 text-muted-foreground/25 group-hover:text-gold/60 transition-colors" />
            <span
              className="text-[0.5625rem] text-muted-foreground/30 group-hover:text-gold/60 transition-colors"
              style={bodyFont}
            >
              View in Our Istoryas archive
            </span>
          </button>
        )}
      </div>
    </motion.div>
  );
}