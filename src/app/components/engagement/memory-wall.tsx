import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bookmark, Send, ChevronDown, Users, Tag, ExternalLink } from "lucide-react";
import { getAvatar, getSavedAvatar, getSavedName } from "./avatars";
import { apiFetch } from "../../lib/supabase";
import { useProfile } from "../../lib/profile-context";
import { toast } from "sonner";

import { bodyFont, headingFont } from "../../lib/fonts";

const memoryTags = [
  { id: "food-memory", label: "Food Memory", color: "#C9A96E" },
  { id: "family-story", label: "Family Story", color: "#CDA88A" },
  { id: "kitchen-wisdom", label: "Kitchen Wisdom", color: "#7E9E78" },
  { id: "place-taste", label: "Place & Taste", color: "#3B6298" },
  { id: "gratitude", label: "Gratitude", color: "#C9A96E" },
] as const;

type TagId = (typeof memoryTags)[number]["id"];

interface MemoryPost {
  id: string;
  author: string;
  avatarId: string;
  text: string;
  tagId: TagId;
  timestamp: string;
  userId?: string;
}

export function MemoryWall({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { profile } = useProfile();
  const [posts, setPosts] = useState<MemoryPost[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedTag, setSelectedTag] = useState<TagId>("food-memory");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const userName = getSavedName();
  const userAvatar = getSavedAvatar();

  const loadPosts = useCallback(async () => {
    try {
      const data = await apiFetch("/memory-wall");
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to load memory wall posts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSubmit = async () => {
    const text = inputText.trim();
    if (!text || !userName) return;

    setSending(true);
    const post: MemoryPost = {
      id: `mw-${Date.now()}`,
      author: userName,
      avatarId: userAvatar,
      text,
      tagId: selectedTag,
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
      await apiFetch("/memory-wall", {
        method: "POST",
        body: JSON.stringify(post),
      });
      setPosts((prev) => [post, ...prev]);
      setInputText("");
      toast.success("Memory shared!");
    } catch (err) {
      console.error("Failed to save memory wall post:", err);
      toast.error("Failed to share memory.");
    } finally {
      setSending(false);
    }
  };

  const tagMap = Object.fromEntries(memoryTags.map((t) => [t.id, t]));
  const visiblePosts = showAll ? posts : posts.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(205,168,138,0.15)" }}
    >
      <div
        className="p-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(205,168,138,0.05) 0%, rgba(201,169,110,0.03) 100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(205,168,138,0.12)" }}
          >
            <Bookmark className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
          </div>
          <div>
            <span
              className="text-foreground text-[0.8125rem]"
              style={headingFont}
            >
              Memory Wall
            </span>
            <span
              className="text-muted-foreground/40 text-[0.5625rem] ml-2"
              style={bodyFont}
            >
              Share a memory
            </span>
          </div>
        </div>

        {/* Compose area */}
        {userName ? (
          <div className="mb-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="A dish that takes you home, a kitchen lesson, a taste you carry with you..."
                  rows={2}
                  maxLength={500}
                  className="w-full bg-secondary/50 rounded-xl px-3 py-2 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 border border-border/50 focus:outline-none focus:ring-1 focus:ring-gold/40 transition-all resize-none"
                  style={bodyFont}
                />
              </div>
            </div>

            {/* Tag selector + submit */}
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3 h-3 text-muted-foreground/30 shrink-0" />
              {memoryTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setSelectedTag(tag.id)}
                  className="text-[0.625rem] px-2 py-0.5 rounded-full transition-all cursor-pointer"
                  style={{
                    backgroundColor:
                      selectedTag === tag.id
                        ? `${tag.color}15`
                        : "transparent",
                    border: `1px solid ${selectedTag === tag.id ? `${tag.color}30` : "var(--border)"}`,
                    color:
                      selectedTag === tag.id
                        ? tag.color
                        : "var(--muted-foreground)",
                    ...bodyFont,
                  }}
                >
                  {tag.label}
                </button>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                disabled={!inputText.trim() || sending}
                className={`ml-auto w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  inputText.trim()
                    ? "text-white"
                    : "bg-secondary/60 text-muted-foreground/30"
                }`}
                style={inputText.trim() ? { backgroundColor: "#C9A96E" } : {}}
              >
                <Send className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </div>
        ) : (
          <p
            className="text-muted-foreground/50 text-[0.75rem] mb-3"
            style={bodyFont}
          >
            Set your display name in Comms to share a memory.
          </p>
        )}

        {/* Posts */}
        {loading && posts.length === 0 && (
          <p
            className="text-muted-foreground/30 text-[0.625rem] text-center py-3"
            style={bodyFont}
          >
            Loading memories
          </p>
        )}

        {!loading && posts.length === 0 && (
          <p
            className="text-muted-foreground/30 text-[0.75rem] text-center py-4"
            style={bodyFont}
          >
            No memories shared yet. Be the first to add one.
          </p>
        )}

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {visiblePosts.map((post) => {
              const av = getAvatar(post.avatarId);
              const tag = tagMap[post.tagId] || memoryTags[0];
              const isOwn = profile?.id && post.userId === profile.id;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[0.75rem] shrink-0 mt-0.5"
                    style={{ backgroundColor: av.bg }}
                  >
                    {av.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span
                        className="text-[0.75rem]"
                        style={{ color: av.color, ...bodyFont }}
                      >
                        {post.author}
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
                        className="text-[0.5625rem] px-1.5 py-0 rounded-full"
                        style={{
                          backgroundColor: `${tag.color}0D`,
                          color: tag.color,
                          ...bodyFont,
                        }}
                      >
                        {tag.label}
                      </span>
                      <span
                        className="text-muted-foreground/25 text-[0.5625rem]"
                        style={bodyFont}
                      >
                        {post.timestamp}
                      </span>
                    </div>
                    <p
                      className="text-foreground/80 text-[0.75rem] leading-relaxed mt-0.5"
                      style={bodyFont}
                    >
                      {post.text}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show more / collapse */}
        {posts.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 mt-2 w-full justify-center cursor-pointer group"
          >
            <Users className="w-3 h-3 text-muted-foreground/30" />
            <span
              className="text-[0.625rem] text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors"
              style={bodyFont}
            >
              {showAll
                ? "Show less"
                : `View all ${posts.length} memories`}
            </span>
            <ChevronDown
              className={`w-3 h-3 text-muted-foreground/25 transition-transform duration-200 ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        )}

        {/* Archive link */}
        {onNavigate && posts.length > 0 && (
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