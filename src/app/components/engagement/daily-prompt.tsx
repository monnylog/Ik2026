import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquareHeart, Clock, Send, ChevronDown, Users } from "lucide-react";
import { getAvatar, getSavedAvatar, getSavedName } from "./avatars";
import { apiFetch } from "../../lib/supabase";
import { useUserData } from "../../lib/use-user-data";
import { useProfile } from "../../lib/profile-context";
import { toast } from "sonner";

import { bodyFont, headingFont } from "../../lib/fonts";

// ─── Curated prompts ─────────────────────────────────────────────
// Rotate daily based on day-of-year

const prompts = [
  { id: "p1", question: "What regional dish best represents your culinary background?" },
  { id: "p2", question: "What is your earliest formative food experience?" },
  { id: "p3", question: "Which historical figure would you most want to cook for, and why?" },
  { id: "p4", question: "Name an ingredient you consider underutilized in contemporary Filipino cooking." },
  { id: "p5", question: "Describe your signature dish in three words." },
  { id: "p6", question: "How do you define the role of the 'kusina' in Filipino food culture?" },
  { id: "p7", question: "What Filipino food tradition do you consider most at risk of being lost?" },
  { id: "p8", question: "What aroma most defines your regional cooking tradition?" },
  { id: "p9", question: "What technique or dish should be documented for the next generation?" },
  { id: "p10", question: "Who was your primary culinary mentor, and what was their most important lesson?" },
  { id: "p11", question: "What does collaborative cooking accomplish that solo cooking cannot?" },
  { id: "p12", question: "What is the most technically impressive plate you have encountered?" },
  { id: "p13", question: "What music, if any, influences your kitchen rhythm or process?" },
  { id: "p14", question: "What aspect of Filipino cuisine is most consistently misunderstood?" },
];

function getTodayPrompt() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return prompts[dayOfYear % prompts.length];
}

function getHoursRemaining(): number {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 3600000));
}

interface PromptResponse {
  id: string;
  promptId: string;
  author: string;
  avatarId: string;
  text: string;
  timestamp: string;
}

export function DailyPrompt() {
  const todayPrompt = getTodayPrompt();
  const { profile } = useProfile();
  const [responses, setResponses] = useState<PromptResponse[]>([]);
  const [inputText, setInputText] = useState("");
  const [showResponses, setShowResponses] = useState(false);
  const [sending, setSending] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(getHoursRemaining);
  const [loading, setLoading] = useState(true);

  const userName = getSavedName();
  const userAvatar = getSavedAvatar();

  // Per-user prompt responded state — synced to KV
  const [promptResponded, setPromptResponded] = useUserData<Record<string, boolean>>("prompt-responded", {});
  const hasResponded = !!promptResponded[todayPrompt.id];

  // Load responses from server
  const loadResponses = useCallback(async () => {
    try {
      const data = await apiFetch(`/prompt-responses/${todayPrompt.id}`);
      setResponses(data.responses || []);
    } catch (err) {
      console.error("Failed to load prompt responses:", err);
    } finally {
      setLoading(false);
    }
  }, [todayPrompt.id]);

  useEffect(() => {
    loadResponses();
  }, [loadResponses]);

  // Update countdown
  useEffect(() => {
    const timer = setInterval(() => setHoursLeft(getHoursRemaining()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || !userName) return;

    setSending(true);
    const response: PromptResponse = {
      id: `pr-${Date.now()}`,
      promptId: todayPrompt.id,
      author: userName,
      avatarId: userAvatar,
      text,
      timestamp: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };

    try {
      await apiFetch("/prompt-responses", {
        method: "POST",
        body: JSON.stringify({ ...response, userId: profile?.id }),
      });
      setResponses((prev) => [...prev, response]);
      setInputText("");
      setPromptResponded({ ...promptResponded, [todayPrompt.id]: true });
      toast.success("Response submitted!");
      
      // TIER 4A: Track engagement metric
      try {
        await apiFetch("/analytics/engagement", {
          method: "POST",
          body: JSON.stringify({
            userId: profile?.id || "anonymous",
            eventType: "prompt_responded",
            metadata: { promptId: todayPrompt.id, textLength: text.length },
          }),
        });
      } catch (metricsErr) {
        console.log("Analytics tracking skipped:", metricsErr);
      }
    } catch (err) {
      console.error("Failed to save prompt response:", err);
      toast.error("Failed to submit response.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(205,168,138,0.2)" }}
    >
      <div
        className="p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(205,168,138,0.06) 0%, rgba(201,169,110,0.03) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(205,168,138,0.12)" }}
            >
              <MessageSquareHeart className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            </div>
            <div>
              <span className="text-foreground text-[0.8125rem]" style={headingFont}>
                Daily Research Prompt
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground/40">
            <Clock className="w-3 h-3" />
            <span className="text-[0.5625rem]" style={bodyFont}>
              Resets in {hoursLeft}h
            </span>
          </div>
        </div>

        {/* Today's prompt */}
        <div className="mb-3">
          <p
            className="text-foreground text-[0.9375rem] leading-relaxed"
            style={headingFont}
          >
            "{todayPrompt.question}"
          </p>
          <p className="text-muted-foreground/50 text-[0.6875rem] mt-1" style={bodyFont}>
            Visible to all participants. Resets daily at midnight.
          </p>
        </div>

        {/* Input or thank-you */}
        {!hasResponded ? (
          <div className="flex items-center gap-2 mb-3">
            {userName ? (
              <>
                <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit();
                    }}
                    placeholder="Your response"
                    className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
                    style={bodyFont}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || sending}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer shrink-0 ${
                    inputText.trim() ? "text-white" : "bg-secondary/60 text-muted-foreground/30"
                  }`}
                  style={inputText.trim() ? { backgroundColor: "#C9A96E" } : {}}
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </>
            ) : (
              <p className="text-muted-foreground/50 text-[0.75rem]" style={bodyFont}>
                Set your display name in Comms to respond.
              </p>
            )}
          </div>
        ) : (
          <div
            className="flex items-center gap-2 mb-3 p-2.5 rounded-xl"
            style={{ backgroundColor: "rgba(126,158,120,0.06)", border: "1px solid rgba(126,158,120,0.12)" }}
          >
            <span className="text-[0.75rem]" style={{ color: "#7E9E78", ...bodyFont }}>
              Response submitted
            </span>
          </div>
        )}

        {/* Community responses */}
        {responses.length > 0 && (
          <div>
            <button
              onClick={() => setShowResponses(!showResponses)}
              className="flex items-center gap-1.5 w-full cursor-pointer group"
            >
              <Users className="w-3 h-3 text-muted-foreground/40" />
              <span className="text-[0.6875rem] text-muted-foreground/50 group-hover:text-muted-foreground/70 transition-colors" style={bodyFont}>
                {responses.length} {responses.length === 1 ? "response" : "responses"} today
              </span>
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${
                  showResponses ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {showResponses && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    {responses.map((r) => {
                      const av = getAvatar(r.avatarId);
                      const isOwn = profile?.id && (r as any).userId === profile.id;
                      return (
                        <div key={r.id} className="flex items-start gap-2.5">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[0.75rem] shrink-0 mt-0.5"
                            style={{ backgroundColor: av.bg }}
                          >
                            {av.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[0.75rem]" style={{ color: av.color, ...bodyFont }}>
                                {r.author}
                              </span>
                              {isOwn && (
                                <span
                                  className="text-[0.5rem] px-1 py-0.5 rounded-full"
                                  style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}
                                >
                                  you
                                </span>
                              )}
                              <span className="text-muted-foreground/30 text-[0.5625rem]" style={bodyFont}>
                                {r.timestamp}
                              </span>
                            </div>
                            <p className="text-foreground/80 text-[0.75rem] leading-relaxed" style={bodyFont}>
                              {r.text}
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

        {loading && responses.length === 0 && (
          <p className="text-muted-foreground/30 text-[0.625rem] text-center" style={bodyFont}>
            Loading responses
          </p>
        )}
      </div>
    </motion.div>
  );
}