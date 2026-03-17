import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Compass, Check, Users } from "lucide-react";
import { apiFetch } from "../../lib/supabase";
import { getSavedAvatar, getSavedName } from "./avatars";
import { useUserData } from "../../lib/use-user-data";
import { useProfile } from "../../lib/profile-context";
import { bodyFont, headingFont } from "../../lib/fonts";

interface TriviaQuestion {
  id: string;
  question: string;
  choices: { id: string; text: string }[];
  correctId: string;
  explanation: string;
}

const triviaBank: TriviaQuestion[] = [
  {
    id: "t1",
    question: "What is the traditional Filipino cooking vessel made of clay called?",
    choices: [
      { id: "a", text: "Palayok" },
      { id: "b", text: "Kawali" },
      { id: "c", text: "Kaldero" },
      { id: "d", text: "Sandok" },
    ],
    correctId: "a",
    explanation: "The palayok is an earthenware pot used for slow-cooking dishes like sinigang and nilaga. Its porous clay allows steam to circulate, creating a unique depth of flavor that metal pots can't replicate.",
  },
  {
    id: "t2",
    question: "Which trade route brought chocolate and chili peppers to the Philippines?",
    choices: [
      { id: "a", text: "The Silk Road" },
      { id: "b", text: "The Manila-Acapulco Galleon Trade" },
      { id: "c", text: "The Spice Route" },
      { id: "d", text: "The Tea Horse Road" },
    ],
    correctId: "b",
    explanation: "The Manila-Acapulco Galleon Trade (1565–1815) was one of the longest maritime trade routes in history. It brought New World ingredients to the Philippines, including chocolate, chili peppers, tomatoes, and corn — fundamentally shaping Filipino cuisine.",
  },
  {
    id: "t3",
    question: "What does 'salo-salo' mean in Filipino culture?",
    choices: [
      { id: "a", text: "A formal banquet" },
      { id: "b", text: "A cooking competition" },
      { id: "c", text: "Eating together as a group" },
      { id: "d", text: "A dessert course" },
    ],
    correctId: "c",
    explanation: "Salo-salo is the Filipino tradition of communal eating — gathering around food as equals. It's at the heart of kamayan feasts, where everyone eats with their hands from shared banana leaves. No hierarchy, just togetherness.",
  },
  {
    id: "t4",
    question: "How many islands make up the Philippine archipelago?",
    choices: [
      { id: "a", text: "3,000" },
      { id: "b", text: "5,200" },
      { id: "c", text: "7,641" },
      { id: "d", text: "9,100" },
    ],
    correctId: "c",
    explanation: "The Philippines has 7,641 islands at high tide — each with its own microclimate, ingredients, and culinary traditions. That's why Filipino cuisine is really many cuisines woven together.",
  },
  {
    id: "t5",
    question: "What is the oldest Chinatown in the world?",
    choices: [
      { id: "a", text: "San Francisco" },
      { id: "b", text: "Singapore" },
      { id: "c", text: "Binondo, Manila" },
      { id: "d", text: "Yokohama" },
    ],
    correctId: "c",
    explanation: "Binondo in Manila, established in 1594, is the world's oldest Chinatown. For over 400 years, it has been a melting pot of Chinese and Filipino culinary traditions — giving us pancit, lumpia, and siopao.",
  },
  {
    id: "t6",
    question: "What gives ube (purple yam) its vivid purple color?",
    choices: [
      { id: "a", text: "Artificial dye" },
      { id: "b", text: "Anthocyanins" },
      { id: "c", text: "Carotenoids" },
      { id: "d", text: "Chlorophyll" },
    ],
    correctId: "b",
    explanation: "Anthocyanins are natural pigments found in ube, blueberries, and red cabbage. Filipino ube has been cultivated for over 4,000 years — long before it became an Instagram trend.",
  },
  {
    id: "t7",
    question: "What ancient script was used in the Philippines before Spanish colonization?",
    choices: [
      { id: "a", text: "Sanskrit" },
      { id: "b", text: "Baybayin" },
      { id: "c", text: "Jawi" },
      { id: "d", text: "Hangul" },
    ],
    correctId: "b",
    explanation: "Baybayin is a pre-colonial Philippine script used for personal communication, poetry, and record-keeping. Today, it's being revived by artists, chefs, and designers as a symbol of cultural reclamation and pride.",
  },
  {
    id: "t8",
    question: "Which preservation method gives Filipino adobo its distinctive tang?",
    choices: [
      { id: "a", text: "Smoking" },
      { id: "b", text: "Fermentation" },
      { id: "c", text: "Vinegar-cooking" },
      { id: "d", text: "Sun-drying" },
    ],
    correctId: "c",
    explanation: "Before refrigeration, Filipinos used vinegar to preserve meats in the tropical climate. This vinegar-cooking method became adobo — not a single recipe, but a technique with thousands of family variations across the islands.",
  },
];

function getTodayTrivia(): TriviaQuestion {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return triviaBank[dayOfYear % triviaBank.length];
}

export function TriviaDrop() {
  const trivia = getTodayTrivia();
  const { profile } = useProfile();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [communityCount, setCommunityCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const userName = getSavedName();
  const userAvatar = getSavedAvatar();

  // Per-user trivia answered state — synced to KV
  const [triviaAnswers, setTriviaAnswers] = useUserData<Record<string, string>>("trivia-answers", {});

  // Check if already answered today (from synced state)
  useEffect(() => {
    const saved = triviaAnswers[trivia.id];
    if (saved) {
      setSelectedId(saved);
      setRevealed(true);
    }
  }, [trivia.id, triviaAnswers]);

  // Load community answer count
  const loadAnswers = useCallback(async () => {
    try {
      const data = await apiFetch(`/trivia-answers/${trivia.id}`);
      setCommunityCount(data.answers?.length || 0);
    } catch {
      // Silently fail
    }
  }, [trivia.id]);

  useEffect(() => {
    loadAnswers();
  }, [loadAnswers]);

  const handleSelect = async (choiceId: string) => {
    if (revealed) return;
    setSelectedId(choiceId);
    setRevealed(true);

    // Save to per-user synced state
    setTriviaAnswers((prev) => ({ ...prev, [trivia.id]: choiceId }));

    // Save answer to server (community)
    setSubmitting(true);
    try {
      await apiFetch("/trivia-answers", {
        method: "POST",
        body: JSON.stringify({
          triviaId: trivia.id,
          id: `ta-${Date.now()}`,
          author: userName || "Anonymous",
          avatarId: userAvatar,
          answerId: choiceId,
          userId: profile?.id,
        }),
      });
      setCommunityCount((c) => c + 1);
    } catch (err) {
      console.error("Failed to save trivia answer:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(43,68,100,0.12)" }}
    >
      <div
        className="p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(43,68,100,0.03) 0%, rgba(201,169,110,0.02) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(43,68,100,0.08)" }}
          >
            <Compass className="w-3.5 h-3.5" style={{ color: "#3B6298" }} />
          </div>
          <div>
            <span className="text-foreground text-[0.8125rem]" style={headingFont}>
              Knowledge Check
            </span>
            <span className="text-muted-foreground/40 text-[0.5625rem] ml-2" style={bodyFont}>
              Daily question
            </span>
          </div>
        </div>

        {/* Question */}
        <p className="text-foreground text-[0.8125rem] mb-3 leading-relaxed" style={bodyFont}>
          {trivia.question}
        </p>

        {/* Choices */}
        <div className="space-y-1.5 mb-3">
          {trivia.choices.map((choice) => {
            const isSelected = selectedId === choice.id;
            const isCorrect = choice.id === trivia.correctId;
            const showResult = revealed;

            let bgColor = "rgba(0,0,0,0)";
            let borderColor = "var(--border)";
            let textColor = "inherit";

            if (showResult && isCorrect) {
              bgColor = "rgba(126,158,120,0.08)";
              borderColor = "rgba(126,158,120,0.3)";
              textColor = "#7E9E78";
            } else if (showResult && isSelected && !isCorrect) {
              bgColor = "rgba(205,168,138,0.06)";
              borderColor = "rgba(205,168,138,0.2)";
              textColor = "#CDA88A";
            }

            return (
              <motion.button
                key={choice.id}
                whileHover={!revealed ? { x: 3 } : {}}
                whileTap={!revealed ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(choice.id)}
                disabled={revealed}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left ${
                  revealed ? "cursor-default" : "cursor-pointer"
                }`}
                style={{ backgroundColor: bgColor, border: `1px solid ${borderColor}`, color: textColor }}
              >
                <span className="text-[0.8125rem] flex-1" style={bodyFont}>
                  {choice.text}
                </span>
                {showResult && isCorrect && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#7E9E78" }} />}
              </motion.button>
            );
          })}
        </div>

        {/* Explanation reveal */}
        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="overflow-hidden"
            >
              <div
                className="p-3 rounded-xl mb-2"
                style={{ backgroundColor: "rgba(126,158,120,0.05)", border: "1px solid rgba(126,158,120,0.1)" }}
              >
                <p className="text-[0.6875rem] italic text-muted-foreground/50 mb-1" style={headingFont}>
                  Context:
                </p>
                <p className="text-foreground/80 text-[0.75rem] leading-relaxed" style={bodyFont}>
                  {trivia.explanation}
                </p>
              </div>

              {communityCount > 0 && (
                <div className="flex items-center gap-1.5 text-muted-foreground/40">
                  <Users className="w-3 h-3" />
                  <span className="text-[0.625rem]" style={bodyFont}>
                    {communityCount} {communityCount === 1 ? "participant" : "participants"} answered
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}