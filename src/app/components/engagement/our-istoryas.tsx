import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Play, Pause, Clock, Users, Mic, MessageSquareHeart, Filter, Search, User, ChevronDown } from "lucide-react";
import { getAvatar } from "./avatars";
import { apiFetch } from "../../lib/supabase";
import { StorySharing } from "./story-sharing";
import { useProfile } from "../../lib/profile-context";
import { Bookmark, Lightbulb, ArrowLeft, RefreshCw, Heart, ChevronsUpDown, ArrowRight, UtensilsCrossed } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

// Event is considered "post-event" after this date
const EVENT_DATE = new Date("2026-05-22");
const TODAY = new Date("2026-03-09");
const IS_POST_EVENT = TODAY >= EVENT_DATE;

// Same prompt list from daily-prompt.tsx
const promptQuestions: Record<string, string> = {
  p1: "What regional dish best represents your culinary background?",
  p2: "What is your earliest formative food experience?",
  p3: "Which historical figure would you most want to cook for, and why?",
  p4: "Name an ingredient you consider underutilized in contemporary Filipino cooking.",
  p5: "Describe your signature dish in three words.",
  p6: "How do you define the role of the 'kusina' in Filipino food culture?",
  p7: "What Filipino food tradition do you consider most at risk of being lost?",
  p8: "What aroma most defines your regional cooking tradition?",
  p9: "What technique or dish should be documented for the next generation?",
  p10: "Who was your primary culinary mentor, and what was their most important lesson?",
  p11: "What does collaborative cooking accomplish that solo cooking cannot?",
  p12: "What is the most technically impressive plate you have encountered?",
  p13: "What music, if any, influences your kitchen rhythm or process?",
  p14: "What aspect of Filipino cuisine is most consistently misunderstood?",
};

interface PromptResponse {
  id: string;
  promptId: string;
  author: string;
  avatarId: string;
  text: string;
  timestamp: string;
  userId: string;
}

interface VoiceNote {
  id: string;
  author: string;
  avatarId: string;
  caption: string;
  audioBase64: string;
  durationSec: number;
  timestamp: string;
  userId: string;
}

interface MemoryPost {
  id: string;
  author: string;
  avatarId: string;
  text: string;
  tagId: string;
  timestamp: string;
  userId?: string;
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

const memoryTagColors: Record<string, { label: string; color: string }> = {
  "food-memory": { label: "Food Memory", color: "#C9A96E" },
  "family-story": { label: "Family Story", color: "#CDA88A" },
  "kitchen-wisdom": { label: "Kitchen Wisdom", color: "#7E9E78" },
  "place-taste": { label: "Place & Taste", color: "#3B6298" },
  "gratitude": { label: "Gratitude", color: "#C9A96E" },
};

// Audio player for voice notes in recap
function MiniAudioPlayer({ audioBase64, durationSec }: { audioBase64: string; durationSec: number }) {
  const [playing, setPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audio) {
      const a = new Audio(`data:audio/webm;base64,${audioBase64}`);
      a.onended = () => setPlaying(false);
      setAudio(a);
      a.play();
      setPlaying(true);
    } else if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
      style={{ backgroundColor: "rgba(205,168,138,0.08)", border: "1px solid rgba(205,168,138,0.12)" }}
    >
      {playing ? (
        <Pause className="w-3 h-3" style={{ color: "#CDA88A" }} />
      ) : (
        <Play className="w-3 h-3" style={{ color: "#CDA88A", marginLeft: 1 }} />
      )}
      <span className="text-[0.6875rem] tabular-nums text-muted-foreground/50" style={bodyFont}>
        {Math.floor(durationSec / 60)}:{String(Math.floor(durationSec % 60)).padStart(2, "0")}
      </span>
    </button>
  );
}

// ─── Tab type ────────────────────────────────────────────────────

type TabId = "stories" | "prompts" | "voices" | "memories" | "fusions";

interface OurIstoryasProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export function OurIstoryas({ onBack, onNavigate }: OurIstoryasProps) {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<TabId>("prompts");
  const [promptResponses, setPromptResponses] = useState<PromptResponse[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [memoryPosts, setMemoryPosts] = useState<MemoryPost[]>([]);
  const [fusionIdeas, setFusionIdeas] = useState<FusionIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [memoryTagFilter, setMemoryTagFilter] = useState<string | null>(null);
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [promptSearch, setPromptSearch] = useState("");
  const [voiceSearch, setVoiceSearch] = useState("");
  const [memorySearch, setMemorySearch] = useState("");
  const [fusionSearch, setFusionSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [expandedFusionPairs, setExpandedFusionPairs] = useState<Set<string>>(new Set());

  // Clear search when switching tabs
  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setPromptSearch("");
    setVoiceSearch("");
    setMemorySearch("");
    setFusionSearch("");
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [promptData, voiceData, memoryData, fusionData] = await Promise.all([
        apiFetch("/all-prompt-responses"),
        apiFetch("/voice-notes"),
        apiFetch("/memory-wall"),
        apiFetch("/flavor-fusion"),
      ]);
      setPromptResponses(promptData.responses || []);
      setVoiceNotes(voiceData.notes || []);
      setMemoryPosts(memoryData.posts || []);
      setFusionIdeas(fusionData.ideas || []);
    } catch (err) {
      console.error("Failed to load Our Istoryas data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Group prompt responses by promptId
  const groupedPrompts: Record<string, PromptResponse[]> = {};
  promptResponses.forEach((r) => {
    if (!groupedPrompts[r.promptId]) groupedPrompts[r.promptId] = [];
    groupedPrompts[r.promptId].push(r);
  });

  const promptIds = Object.keys(groupedPrompts).sort();
  const totalContributions = promptResponses.length + voiceNotes.length + memoryPosts.length + fusionIdeas.length;

  // Compute user's personal journey stats
  const myPromptCount = profile?.id ? promptResponses.filter((r) => r.userId === profile.id).length : 0;
  const myVoiceCount = profile?.id ? voiceNotes.filter((v) => v.userId === profile.id).length : 0;
  const myMemoryCount = profile?.id ? memoryPosts.filter((m) => m.userId === profile.id).length : 0;
  const myFusionCount = profile?.id ? fusionIdeas.filter((f) => f.userId === profile.id).length : 0;
  const myTotalContributions = myPromptCount + myVoiceCount + myMemoryCount + myFusionCount;

  const tabs: { id: TabId; label: string; icon: typeof BookOpen; count?: number }[] = [
    { id: "stories", label: "Record", icon: Mic },
    { id: "prompts", label: "Prompts", icon: MessageSquareHeart, count: promptResponses.length },
    { id: "voices", label: "Voices", icon: Mic, count: voiceNotes.length },
    { id: "memories", label: "Memories", icon: Bookmark, count: memoryPosts.length },
    { id: "fusions", label: "Fusions", icon: Lightbulb, count: fusionIdeas.length },
  ];

  return (
    <div className="space-y-5">
      {/* ─── Back + Refresh bar ──────────────────────── */}
      <div className="flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors cursor-pointer group"
            style={{ border: "1px solid var(--border)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-[0.75rem] text-muted-foreground group-hover:text-foreground transition-colors" style={bodyFont}>
              Dashboard
            </span>
          </button>
        ) : (
          <div />
        )}
        <motion.button
          whileHover={{ rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
          style={{ border: "1px solid var(--border)", backgroundColor: "transparent" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
          title="Refresh data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-muted-foreground/50 ${refreshing ? "animate-spin" : ""}`}
          />
        </motion.button>
      </div>

      {/* ─── Header ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1A2410 0%, #283618 50%, #4A3F20 100%)",
          border: "1px solid rgba(221,161,94,0.2)",
        }}
      >
        <div className="relative px-6 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4" style={{ color: "#C9A96E" }} />
            <span className="text-[0.6875rem] uppercase tracking-[0.2em]" style={{ color: "rgba(201,169,110,0.7)", ...bodyFont }}>
              Project Archive
            </span>
          </div>
          <h2 className="text-white mb-1.5" style={{ ...headingFont, fontSize: "1.5rem", lineHeight: 1.2 }}>
            Our Istoryas
          </h2>
          <p className="text-[0.875rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)", ...bodyFont }}>
            Archive of prompt responses, voice recordings, shared memories, and flavor fusion ideas.
            {!IS_POST_EVENT && " Updated as new contributions are submitted."}
          </p>

          {totalContributions > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <Users className="w-3.5 h-3.5" style={{ color: "rgba(201,169,110,0.5)" }} />
              <span className="text-[0.75rem]" style={{ color: "rgba(255,255,255,0.4)", ...bodyFont }}>
                {totalContributions} {totalContributions === 1 ? "contribution" : "contributions"}
              </span>
            </div>
          )}

          {/* Pre-event teaser */}
          {!IS_POST_EVENT && (
            <div
              className="mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
              style={{ backgroundColor: "rgba(201,169,110,0.08)", border: "1px solid rgba(201,169,110,0.15)" }}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "#C9A96E" }} />
              <span className="text-[0.75rem]" style={{ color: "rgba(255,255,255,0.5)", ...bodyFont }}>
                Full archive compiled post-event. Current entries displayed below.
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Your Journey card ───────────────────────── */}
      {profile?.id && !loading && myTotalContributions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(205,168,138,0.08) 0%, rgba(201,169,110,0.04) 100%)",
            border: "1px solid rgba(205,168,138,0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            <span className="text-[0.75rem] text-foreground/70" style={headingFont}>
              Your Journey
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: "Prompts", count: myPromptCount, color: "#C9A96E", icon: MessageSquareHeart },
              { label: "Voices", count: myVoiceCount, color: "#CDA88A", icon: Mic },
              { label: "Memories", count: myMemoryCount, color: "#7E9E78", icon: Bookmark },
              { label: "Fusions", count: myFusionCount, color: "#3B6298", icon: Lightbulb },
            ].map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: `${stat.color}08`, border: `1px solid ${stat.color}15` }}
                >
                  <StatIcon className="w-3 h-3 shrink-0" style={{ color: stat.color }} />
                  <div>
                    <span className="text-[0.875rem] font-medium block" style={{ color: stat.color, ...bodyFont }}>
                      {stat.count}
                    </span>
                    <span className="text-[0.5625rem] text-muted-foreground/50" style={bodyFont}>
                      {stat.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[0.6875rem] text-muted-foreground/40 mt-2.5 italic" style={headingFont}>
            Every story shared adds to the collective memory of this gathering.
          </p>
        </motion.div>
      )}

      {/* ─── Start Your Journey (zero contributions) ─── */}
      {profile?.id && !loading && myTotalContributions === 0 && totalContributions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-xl p-4"
          style={{
            background: "linear-gradient(135deg, rgba(43,68,100,0.04) 0%, rgba(201,169,110,0.04) 100%)",
            border: "1px dashed rgba(201,169,110,0.25)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
            >
              <Heart className="w-4 h-4" style={{ color: "#C9A96E" }} />
            </div>
            <div>
              <p className="text-foreground text-[0.8125rem] mb-1" style={headingFont}>
                Your journey starts here
              </p>
              <p className="text-muted-foreground/50 text-[0.75rem] leading-relaxed" style={bodyFont}>
                Share a memory, respond to a prompt, record a voice note, or create a flavor fusion from the dashboard.
                Every contribution becomes part of the collective archive.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border/50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[0.75rem] transition-all cursor-pointer whitespace-nowrap ${
                isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              style={bodyFont}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className="text-[0.5625rem] min-w-[1.125rem] h-[1.125rem] rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: isActive ? "rgba(201,169,110,0.15)" : "rgba(107,127,142,0.1)",
                    color: isActive ? "#C9A96E" : "var(--muted-foreground)",
                    ...bodyFont,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── My Contributions Toggle ─────────────────── */}
      {profile?.id && activeTab !== "stories" && totalContributions > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowMineOnly(!showMineOnly)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: showMineOnly ? "rgba(201,169,110,0.12)" : "transparent",
              border: `1px solid ${showMineOnly ? "rgba(201,169,110,0.25)" : "var(--border)"}`,
            }}
          >
            <User className="w-3 h-3" style={{ color: showMineOnly ? "#C9A96E" : "var(--muted-foreground)" }} />
            <span
              className="text-[0.6875rem]"
              style={{ color: showMineOnly ? "#C9A96E" : "var(--muted-foreground)", ...bodyFont }}
            >
              My contributions
            </span>
          </button>
          {showMineOnly && (() => {
            const myPrompts = promptResponses.filter((r) => r.userId === profile.id).length;
            const myVoices = voiceNotes.filter((v) => v.userId === profile.id).length;
            const myMemories = memoryPosts.filter((m) => m.userId === profile.id).length;
            const myFusions = fusionIdeas.filter((f) => f.userId === profile.id).length;
            const myTotal = myPrompts + myVoices + myMemories + myFusions;
            return (
              <span className="text-[0.625rem] text-muted-foreground/40" style={bodyFont}>
                {myTotal} of yours
              </span>
            );
          })()}
        </div>
      )}

      {/* ─── Tab Content ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ─── Record & Share Tab ─────────────────── */}
        {activeTab === "stories" && (
          <motion.div
            key="stories"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <StorySharing />
          </motion.div>
        )}

        {/* ─── Prompt Responses Tab ──────────────── */}
        {activeTab === "prompts" && (() => {
          // Apply search and mine-only filters
          const searchLower = promptSearch.toLowerCase();
          const filteredGroupedPrompts: Record<string, PromptResponse[]> = {};
          promptIds.forEach((pid) => {
            const question = promptQuestions[pid] || "";
            let responses = groupedPrompts[pid];
            if (showMineOnly && profile?.id) {
              responses = responses.filter((r) => r.userId === profile.id);
            }
            if (searchLower) {
              const questionMatches = question.toLowerCase().includes(searchLower);
              if (!questionMatches) {
                responses = responses.filter(
                  (r) => r.text.toLowerCase().includes(searchLower) || r.author.toLowerCase().includes(searchLower)
                );
              }
            }
            if (responses.length > 0) {
              filteredGroupedPrompts[pid] = responses;
            }
          });
          const filteredPromptIds = Object.keys(filteredGroupedPrompts).sort();
          return (
          <motion.div
            key="prompts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search bar */}
            {!loading && promptIds.length > 0 && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
                <Search className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                <input
                  type="text"
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  placeholder="Search prompts and responses..."
                  className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
                  style={bodyFont}
                />
                {promptSearch && (
                  <button
                    onClick={() => setPromptSearch("")}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[0.75rem] cursor-pointer"
                    style={bodyFont}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Expand All / Collapse All */}
            {!loading && filteredPromptIds.length > 1 && !promptSearch && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const allExpanded = filteredPromptIds.every((pid) => expandedPrompts.has(pid));
                    if (allExpanded) {
                      setExpandedPrompts(new Set());
                    } else {
                      setExpandedPrompts(new Set(filteredPromptIds));
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.625rem] text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                  style={{ border: "1px solid transparent", ...bodyFont }}
                >
                  <ChevronsUpDown className="w-3 h-3" />
                  {filteredPromptIds.every((pid) => expandedPrompts.has(pid)) ? "Collapse all" : "Expand all"}
                </button>
              </div>
            )}

            {loading && (
              <p className="text-muted-foreground/30 text-[0.75rem] text-center py-8" style={bodyFont}>
                Loading prompt responses…
              </p>
            )}

            {!loading && promptIds.length === 0 && (
              <div className="text-center py-10">
                <MessageSquareHeart className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground/40 text-[0.875rem]" style={headingFont}>
                  No prompt responses submitted
                </p>
                <p className="text-muted-foreground/30 text-[0.75rem] mt-1" style={bodyFont}>
                  Respond to the daily prompt on the dashboard. Entries appear here.
                </p>
              </div>
            )}

            {!loading && promptIds.length > 0 && filteredPromptIds.length === 0 && (
              <p className="text-muted-foreground/40 text-[0.75rem] text-center py-6" style={bodyFont}>
                {showMineOnly ? "No matching contributions from you." : "No matching results."}
              </p>
            )}

            {filteredPromptIds.map((pid) => {
              const question = promptQuestions[pid] || "Prompt question";
              const responses = filteredGroupedPrompts[pid];
              const isExpanded = expandedPrompts.has(pid) || promptSearch.length > 0;

              const togglePrompt = () => {
                setExpandedPrompts((prev) => {
                  const next = new Set(prev);
                  if (next.has(pid)) next.delete(pid);
                  else next.add(pid);
                  return next;
                });
              };

              return (
                <div
                  key={pid}
                  className="bg-card rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  {/* Collapsible header */}
                  <button
                    onClick={togglePrompt}
                    className="w-full text-left px-5 py-4 flex items-start gap-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  >
                    <ChevronDown
                      className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground/40 transition-transform duration-200"
                      style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground italic" style={{ ...headingFont, fontSize: "1rem" }}>
                        "{question}"
                      </p>
                      <span className="text-muted-foreground/30 text-[0.625rem] mt-1 block" style={bodyFont}>
                        {responses.length} {responses.length === 1 ? "response" : "responses"}
                      </span>
                    </div>
                  </button>
                  {/* Collapsible content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4">
                          <div className="space-y-3 pl-3" style={{ borderLeft: "2px solid rgba(201,169,110,0.15)" }}>
                            {responses.map((r) => {
                              const av = getAvatar(r.avatarId);
                              return (
                                <div key={r.id} className="flex items-start gap-2.5">
                                  <div
                                    className="w-7 h-7 rounded-md flex items-center justify-center text-[0.8125rem] shrink-0 mt-0.5"
                                    style={{ backgroundColor: av.bg }}
                                  >
                                    {av.emoji}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-[0.75rem]" style={{ color: av.color, ...bodyFont }}>
                                        {r.author}
                                      </span>
                                      {profile?.id && r.userId === profile.id && (
                                        <span
                                          className="text-[0.5rem] px-1 py-0.5 rounded-full"
                                          style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}
                                        >
                                          you
                                        </span>
                                      )}
                                      <span className="text-muted-foreground/25 text-[0.5625rem]" style={bodyFont}>
                                        {r.timestamp}
                                      </span>
                                    </div>
                                    <p className="text-foreground/80 text-[0.8125rem] leading-relaxed mt-0.5" style={bodyFont}>
                                      {r.text}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
          );
        })()}

        {/* ─── Voice Notes Tab ───────────────────── */}
        {activeTab === "voices" && (() => {
          let filteredVoiceNotes = showMineOnly && profile?.id
            ? voiceNotes.filter((v) => v.userId === profile.id)
            : voiceNotes;
          // Apply search
          const vSearchLower = voiceSearch.toLowerCase();
          if (vSearchLower) {
            filteredVoiceNotes = filteredVoiceNotes.filter(
              (v) => v.author.toLowerCase().includes(vSearchLower) || (v.caption && v.caption.toLowerCase().includes(vSearchLower))
            );
          }
          return (
          <motion.div
            key="voices"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Search bar */}
            {!loading && voiceNotes.length > 0 && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
                <Search className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                <input
                  type="text"
                  value={voiceSearch}
                  onChange={(e) => setVoiceSearch(e.target.value)}
                  placeholder="Search by name or caption..."
                  className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
                  style={bodyFont}
                />
                {voiceSearch && (
                  <button
                    onClick={() => setVoiceSearch("")}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[0.75rem] cursor-pointer"
                    style={bodyFont}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {loading && (
              <p className="text-muted-foreground/30 text-[0.75rem] text-center py-8" style={bodyFont}>
                Loading voice notes…
              </p>
            )}

            {!loading && voiceNotes.length === 0 && (
              <div className="text-center py-10">
                <Mic className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground/40 text-[0.875rem]" style={headingFont}>
                  No voice notes submitted
                </p>
                <p className="text-muted-foreground/30 text-[0.75rem] mt-1" style={bodyFont}>
                  Use the Record tab to submit a voice note.
                </p>
              </div>
            )}

            {!loading && voiceNotes.length > 0 && filteredVoiceNotes.length === 0 && (
              <p className="text-muted-foreground/40 text-[0.75rem] text-center py-6" style={bodyFont}>
                {voiceSearch ? "No matching voice notes." : showMineOnly ? "No voice notes from you yet." : "No voice notes found."}
              </p>
            )}

            {filteredVoiceNotes.map((note) => {
              const av = getAvatar(note.avatarId);
              return (
                <div
                  key={note.id}
                  className="p-4 bg-card rounded-xl"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[1rem] shrink-0"
                      style={{ backgroundColor: av.bg }}
                    >
                      {av.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[0.8125rem]" style={{ color: av.color, ...bodyFont }}>
                          {note.author}
                        </span>
                        {profile?.id && note.userId === profile.id && (
                          <span
                            className="text-[0.5rem] px-1 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}
                          >
                            you
                          </span>
                        )}
                        <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                          {note.timestamp}
                        </span>
                      </div>
                      {note.caption && (
                        <p className="text-foreground/80 text-[0.8125rem] mb-2 leading-relaxed" style={bodyFont}>
                          {note.caption}
                        </p>
                      )}
                      <MiniAudioPlayer audioBase64={note.audioBase64} durationSec={note.durationSec} />
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
          );
        })()}

        {/* ─── Memories Tab ───────────────────── */}
        {activeTab === "memories" && (() => {
          let baseMemories = memoryPosts;
          if (showMineOnly && profile?.id) {
            baseMemories = memoryPosts.filter((m) => m.userId === profile.id);
          }
          // Apply text search
          const mSearchLower = memorySearch.toLowerCase();
          if (mSearchLower) {
            baseMemories = baseMemories.filter(
              (m) => m.text.toLowerCase().includes(mSearchLower) || m.author.toLowerCase().includes(mSearchLower)
            );
          }
          const filteredPosts = memoryTagFilter
            ? baseMemories.filter((p) => p.tagId === memoryTagFilter)
            : baseMemories;
          const tagCounts: Record<string, number> = {};
          baseMemories.forEach((p) => {
            tagCounts[p.tagId] = (tagCounts[p.tagId] || 0) + 1;
          });
          return (
          <motion.div
            key="memories"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Search bar */}
            {!loading && memoryPosts.length > 0 && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
                <Search className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                <input
                  type="text"
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  placeholder="Search memories by text or author..."
                  className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
                  style={bodyFont}
                />
                {memorySearch && (
                  <button
                    onClick={() => setMemorySearch("")}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[0.75rem] cursor-pointer"
                    style={bodyFont}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Tag filter pills */}
            {!loading && memoryPosts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                <button
                  onClick={() => setMemoryTagFilter(null)}
                  className="text-[0.625rem] px-2.5 py-1 rounded-full transition-all cursor-pointer"
                  style={{
                    backgroundColor: !memoryTagFilter ? "rgba(201,169,110,0.15)" : "transparent",
                    border: `1px solid ${!memoryTagFilter ? "rgba(201,169,110,0.3)" : "var(--border)"}`,
                    color: !memoryTagFilter ? "#C9A96E" : "var(--muted-foreground)",
                    ...bodyFont,
                  }}
                >
                  All ({memoryPosts.length})
                </button>
                {Object.entries(memoryTagColors).map(([tagId, { label, color }]) => {
                  const count = tagCounts[tagId] || 0;
                  if (count === 0) return null;
                  const isActive = memoryTagFilter === tagId;
                  return (
                    <button
                      key={tagId}
                      onClick={() => setMemoryTagFilter(isActive ? null : tagId)}
                      className="text-[0.625rem] px-2.5 py-1 rounded-full transition-all cursor-pointer"
                      style={{
                        backgroundColor: isActive ? `${color}20` : "transparent",
                        border: `1px solid ${isActive ? `${color}40` : "var(--border)"}`,
                        color: isActive ? color : "var(--muted-foreground)",
                        ...bodyFont,
                      }}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {loading && (
              <p className="text-muted-foreground/30 text-[0.75rem] text-center py-8" style={bodyFont}>
                Loading memories...
              </p>
            )}

            {!loading && memoryPosts.length === 0 && (
              <div className="text-center py-10">
                <Bookmark className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground/40 text-[0.875rem]" style={headingFont}>
                  No memories submitted
                </p>
                <p className="text-muted-foreground/30 text-[0.75rem] mt-1" style={bodyFont}>
                  Use the Memory Wall tab to submit a memory.
                </p>
              </div>
            )}

            {!loading && memoryPosts.length > 0 && filteredPosts.length === 0 && (
              <p className="text-muted-foreground/40 text-[0.75rem] text-center py-6" style={bodyFont}>
                {memorySearch ? "No matching memories." : memoryTagFilter ? "No memories with this tag." : showMineOnly ? "No memories from you yet." : "No memories found."}
              </p>
            )}

            {filteredPosts.map((post) => {
              const av = getAvatar(post.avatarId);
              const tagColor = memoryTagColors[post.tagId]?.color || "#7E9E78";
              return (
                <div
                  key={post.id}
                  className="p-4 bg-card rounded-xl"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[1rem] shrink-0"
                      style={{ backgroundColor: av.bg }}
                    >
                      {av.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[0.8125rem]" style={{ color: av.color, ...bodyFont }}>
                          {post.author}
                        </span>
                        {profile?.id && post.userId === profile.id && (
                          <span
                            className="text-[0.5rem] px-1 py-0.5 rounded-full"
                            style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}
                          >
                            you
                          </span>
                        )}
                        <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                          {post.timestamp}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-[0.8125rem] leading-relaxed" style={bodyFont}>
                        {post.text}
                      </p>
                      <div className="mt-2">
                        <span
                          className="text-[0.625rem] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: tagColor, color: "#fff", ...bodyFont }}
                        >
                          {memoryTagColors[post.tagId]?.label || "Tag"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
          );
        })()}

        {/* ─── Fusions Tab ───────────────────── */}
        {activeTab === "fusions" && (() => {
          // Apply mine-only filter
          let baseFusions = showMineOnly && profile?.id
            ? fusionIdeas.filter((f) => f.userId === profile.id)
            : fusionIdeas;
          // Apply search
          const fSearchLower = fusionSearch.toLowerCase();
          if (fSearchLower) {
            baseFusions = baseFusions.filter(
              (f) =>
                f.idea.toLowerCase().includes(fSearchLower) ||
                f.author.toLowerCase().includes(fSearchLower) ||
                f.ingredientA.toLowerCase().includes(fSearchLower) ||
                f.ingredientB.toLowerCase().includes(fSearchLower)
            );
          }
          // Group fusions by ingredient pair
          const groupedFusions: Record<string, FusionIdea[]> = {};
          baseFusions.forEach((idea) => {
            const pairKey = `${idea.ingredientA} + ${idea.ingredientB}`;
            if (!groupedFusions[pairKey]) groupedFusions[pairKey] = [];
            groupedFusions[pairKey].push(idea);
          });
          const pairKeys = Object.keys(groupedFusions).sort();
          const uniqueContributors = new Set(fusionIdeas.map((i) => i.userId || i.author)).size;
          return (
          <motion.div
            key="fusions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search bar */}
            {!loading && fusionIdeas.length > 0 && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-xl px-3 py-2 border border-border/50 focus-within:ring-1 focus-within:ring-gold/40 transition-all">
                <Search className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
                <input
                  type="text"
                  value={fusionSearch}
                  onChange={(e) => setFusionSearch(e.target.value)}
                  placeholder="Search by ingredient, idea, or author..."
                  className="flex-1 bg-transparent text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none min-w-0"
                  style={bodyFont}
                />
                {fusionSearch && (
                  <button
                    onClick={() => setFusionSearch("")}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 text-[0.75rem] cursor-pointer"
                    style={bodyFont}
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Summary stats */}
            {!loading && fusionIdeas.length > 0 && !showMineOnly && (
              <div
                className="flex items-center gap-4 px-4 py-3 rounded-xl"
                style={{ backgroundColor: "rgba(205,168,138,0.04)", border: "1px solid rgba(205,168,138,0.1)" }}
              >
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" style={{ color: "#CDA88A" }} />
                  <span className="text-[0.6875rem] text-foreground/70" style={bodyFont}>
                    <strong style={{ color: "#CDA88A" }}>{fusionIdeas.length}</strong> ideas
                  </span>
                </div>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-[0.6875rem] text-foreground/70" style={bodyFont}>
                  <strong style={{ color: "#C9A96E" }}>{Object.keys(groupedFusions).length}</strong> unique pairings
                </span>
                <div className="w-px h-3 bg-border/50" />
                <span className="text-[0.6875rem] text-foreground/70" style={bodyFont}>
                  <strong style={{ color: "#3B6298" }}>{uniqueContributors}</strong> contributors
                </span>
              </div>
            )}

            {/* Expand All / Collapse All */}
            {!loading && pairKeys.length > 1 && !fusionSearch && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const allExpanded = pairKeys.every((pk) => expandedFusionPairs.has(pk));
                    if (allExpanded) {
                      setExpandedFusionPairs(new Set());
                    } else {
                      setExpandedFusionPairs(new Set(pairKeys));
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.625rem] text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                  style={{ border: "1px solid transparent", ...bodyFont }}
                >
                  <ChevronsUpDown className="w-3 h-3" />
                  {pairKeys.every((pk) => expandedFusionPairs.has(pk)) ? "Collapse all" : "Expand all"}
                </button>
              </div>
            )}

            {loading && (
              <p className="text-muted-foreground/30 text-[0.75rem] text-center py-8" style={bodyFont}>
                Loading fusion ideas...
              </p>
            )}

            {!loading && fusionIdeas.length === 0 && (
              <div className="text-center py-10">
                <Lightbulb className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-muted-foreground/40 text-[0.875rem]" style={headingFont}>
                  No fusion ideas submitted
                </p>
                <p className="text-muted-foreground/30 text-[0.75rem] mt-1" style={bodyFont}>
                  Use the Flavor Fusion widget to submit a fusion idea.
                </p>
              </div>
            )}

            {!loading && fusionIdeas.length > 0 && pairKeys.length === 0 && (
              <p className="text-muted-foreground/40 text-[0.75rem] text-center py-6" style={bodyFont}>
                {fusionSearch ? "No matching fusion ideas." : showMineOnly ? "No fusion ideas from you yet." : "No fusion ideas found."}
              </p>
            )}

            {pairKeys.map((pairKey) => {
              const ideas = groupedFusions[pairKey];
              const isPairExpanded = expandedFusionPairs.has(pairKey) || fusionSearch.length > 0;
              const togglePair = () => {
                setExpandedFusionPairs((prev) => {
                  const next = new Set(prev);
                  if (next.has(pairKey)) next.delete(pairKey);
                  else next.add(pairKey);
                  return next;
                });
              };
              return (
                <div
                  key={pairKey}
                  className="bg-card rounded-xl overflow-hidden"
                  style={{ border: "1px solid var(--border)" }}
                >
                  {/* Collapsible pair header */}
                  <button
                    onClick={togglePair}
                    className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
                    style={{ backgroundColor: "rgba(205,168,138,0.04)" }}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronDown
                        className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-200"
                        style={{ transform: isPairExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                      />
                      <span
                        className="text-[0.6875rem] px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: "#CDA88A", color: "#fff", ...bodyFont }}
                      >
                        {pairKey}
                      </span>
                    </div>
                    <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                      {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
                    </span>
                  </button>
                  {/* Collapsible content */}
                  <AnimatePresence initial={false}>
                    {isPairExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div style={{ borderTop: "1px solid var(--border)" }}>
                          <div className="divide-y divide-border/50">
                            {ideas.map((idea) => {
                              const av = getAvatar(idea.avatarId);
                              return (
                                <div key={idea.id} className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.875rem] shrink-0"
                                      style={{ backgroundColor: av.bg }}
                                    >
                                      {av.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="text-[0.8125rem]" style={{ color: av.color, ...bodyFont }}>
                                          {idea.author}
                                        </span>
                                        {profile?.id && idea.userId === profile.id && (
                                          <span
                                            className="text-[0.5rem] px-1 py-0.5 rounded-full"
                                            style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", ...bodyFont }}
                                          >
                                            you
                                          </span>
                                        )}
                                        <span className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
                                          {idea.timestamp}
                                        </span>
                                      </div>
                                      <p className="text-foreground/80 text-[0.8125rem] leading-relaxed" style={bodyFont}>
                                        {idea.idea}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Community")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(205,168,138,0.06)",
              border: "1px solid rgba(205,168,138,0.12)",
              ...bodyFont,
            }}
          >
            <Heart className="w-4 h-4" style={{ color: "#C9A96E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#CDA88A" }}>
              Community
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#CDA88A", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Menu & Courses")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(205,168,138,0.06)",
              border: "1px solid rgba(205,168,138,0.12)",
              ...bodyFont,
            }}
          >
            <UtensilsCrossed className="w-4 h-4" style={{ color: "#CDA88A" }} />
            <span className="text-[0.8125rem]" style={{ color: "#CDA88A" }}>
              Menu & Courses
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#CDA88A", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Chef Roster")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(126,158,120,0.06)",
              border: "1px solid rgba(126,158,120,0.12)",
              ...bodyFont,
            }}
          >
            <Users className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.8125rem]" style={{ color: "#7E9E78" }}>
              Chef Roster
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}