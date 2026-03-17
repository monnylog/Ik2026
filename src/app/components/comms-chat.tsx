import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Smartphone,
  Sparkles,
  Loader2,
  ArrowLeft,
  ChevronLeft,
  Lock,
  Shield,
  Leaf,
  BookOpen,
  Settings,
  Camera,
  X,
  Pencil,
  Database,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import {
  avatarOptions,
  getAvatar,
  getSavedAvatar,
  saveAvatar,
  getSavedName,
  saveName,
  buildDisplayIdentity,
} from "./engagement/avatars";
import { getConfirmedChef } from "./onboarding/chef-directory";
import { supabase, apiFetch } from "../lib/supabase";
import { useProfile } from "../lib/profile-context";
import { toast } from "sonner";
import { EmptyState } from "./ui/empty-state";
import { useNotificationSound } from "./ui/notification-sound";
import { NotionCommsTracker } from "./notion-comms-tracker";
import { bodyFont, headingFont } from "../lib/fonts";

/* ═══════════════════════════════════════════════════════════════════
   ALOHA TROPICAL PALETTE
   Deep Green #1A5C38  ·  Warm Orange #E8652B  ·  Blush Pink #F0C4C0
   Cream #FAF5ED  ·  Leaf Accent #2D7A4A  ·  Fern #3A8B55
   ═══════════════════════════════════════════════════════════════════ */

const P = {
  deepGreen: "#1A5C38",
  leafGreen: "#2D7A4A",
  fern: "#3A8B55",
  lightFern: "#4CA068",
  warmOrange: "#E8652B",
  softOrange: "#F07D4A",
  blushPink: "#F0C4C0",
  rosePink: "#E8ADA8",
  cream: "#FAF5ED",
  warmCream: "#F5EDE2",
  ivory: "#FFFBF5",
  darkText: "#1C3B2A",
  mutedText: "#5E7D6A",
  borderLight: "rgba(26,92,56,0.1)",
} as const;

/* ═══════════════════════════════════════════════════════════════════
   DATA MODELS
   ═══════════════════════════════════════════════════════════════════ */

interface ChatChannel {
  id: string;
  name: string;
  description: string;
  color: string;
  emoji: string;
}

const channels: ChatChannel[] = [
  { id: "general", name: "Updates & Announcements", description: "Priority updates, announcements & key decisions", color: P.warmOrange, emoji: "📢" },
  { id: "kitchen-prep", name: "Kitchen Prep", description: "Menu development & kitchen coordination", color: P.deepGreen, emoji: "🔪" },
  { id: "logistics", name: "Logistics", description: "Travel, lodging & equipment", color: P.leafGreen, emoji: "✈️" },
  { id: "introductions", name: "Introductions", description: "Team intros & background", color: P.softOrange, emoji: "👋" },
];

type TapbackType = "heart" | "thumbsUp" | "thumbsDown" | "laugh" | "emphasis" | "question";

const tapbackOptions: { type: TapbackType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "thumbsUp", emoji: "👍", label: "Like" },
  { type: "thumbsDown", emoji: "👎", label: "Dislike" },
  { type: "laugh", emoji: "😂", label: "Laugh" },
  { type: "emphasis", emoji: "‼️", label: "Emphasize" },
  { type: "question", emoji: "❓", label: "Question" },
];

function getTapbackEmoji(type: string): string {
  return tapbackOptions.find((t) => t.type === type)?.emoji || "❤️";
}

interface ChatMessage {
  id: string;
  channelId: string;
  avatarId: string;
  author: string;
  text: string;
  timestamp: string;
  userId?: string;
}

const SMS_GROUP_URI = "sms:+16166357057,+18478903063";
const DISCORD_INVITE_URL = "https://discord.gg/eQyaK4Pd";

/* ═══════════════════════════════════════════════════════════════════
   SAMPLE SEED MESSAGES — displayed when channels have no server data
   ═══════════════════════════════════════════════════════════════════ */

const sampleMessages: Record<string, ChatMessage[]> = {
  general: [
    { id: "seed-g1", channelId: "general", avatarId: "coconut", author: "Walbert", text: "Team — we are officially in Week 1. Concept is locked: 7 chefs, 7 cities, 7 courses. Let's make Year 3 the best one yet.", timestamp: "Mar 7, 9:00 AM", userId: "walbert" },
    { id: "seed-g2", channelId: "general", avatarId: "mango", author: "Monny", text: "Save-the-date graphic is live on IG and Facebook! Huge thanks to Denise and Kara for the quick turnaround. Looks incredible.", timestamp: "Mar 7, 10:30 AM", userId: "monny" },
    { id: "seed-g3", channelId: "general", avatarId: "leaf", author: "Denise", text: "Thank you! Kara nailed the typography. We kept the Allure 2023 palette — Fern Green and Antique Brass. Wanted it to feel warm and inviting.", timestamp: "Mar 7, 11:15 AM", userId: "denise" },
    { id: "seed-g4", channelId: "general", avatarId: "coconut", author: "Walbert", text: "Chef participation agreements go out today. $500 honorarium, travel covered, dish deadline April 29th. Sending via DocuSign.", timestamp: "Mar 11, 8:00 AM", userId: "walbert" },
    { id: "seed-g5", channelId: "general", avatarId: "mango", author: "Monny", text: "Reminder: F&B Director assignment is CRITICAL — we need this locked by tomorrow. Mariana is our top candidate. Who's reaching out?", timestamp: "Mar 11, 2:45 PM", userId: "monny" },
    { id: "seed-g6", channelId: "general", avatarId: "coconut", author: "Walbert", text: "I'll call Mariana tonight. If she's in, we can finalize the kitchen org chart this weekend.", timestamp: "Mar 11, 3:10 PM", userId: "walbert" },
  ],
  "kitchen-prep": [
    { id: "seed-k1", channelId: "kitchen-prep", avatarId: "coconut", author: "Walbert", text: "Kitchen walkthrough at KMA is set for March 23rd. Need to count stations, check cold storage capacity, and map out the loading dock flow.", timestamp: "Mar 8, 11:00 AM", userId: "walbert" },
    { id: "seed-k2", channelId: "kitchen-prep", avatarId: "star", author: "Chef Dio", text: "I can help coordinate the walkthrough since I'm local. I've cooked at KMA before — the main kitchen has 6 stations but the prep area is tight.", timestamp: "Mar 8, 12:30 PM", userId: "dio" },
    { id: "seed-k3", channelId: "kitchen-prep", avatarId: "mango", author: "Monny", text: "Good to know, Dio. Let's plan for shared prep times so nobody's waiting. Each chef gets a 2-hour window for their mise en place.", timestamp: "Mar 8, 1:15 PM", userId: "monny" },
    { id: "seed-k4", channelId: "kitchen-prep", avatarId: "sun", author: "Chef Rachel", text: "Quick question — is there a smoker available at the venue? My Smoked Salmon Sinigang needs about 3 hours of cold smoke for the salmon.", timestamp: "Mar 9, 9:45 AM", userId: "rachel" },
    { id: "seed-k5", channelId: "kitchen-prep", avatarId: "coconut", author: "Walbert", text: "We'll check during the walkthrough, Rachel. If not, we can rent a portable smoker. Adding it to the equipment list.", timestamp: "Mar 9, 10:20 AM", userId: "walbert" },
    { id: "seed-k6", channelId: "kitchen-prep", avatarId: "flame", author: "Chef Aaron", text: "For my Pacific Northwest Tinola, I'm thinking of doing a live geoduck breakdown at the station. Would need a cutting board setup visible to guests.", timestamp: "Mar 10, 3:00 PM", userId: "aaron" },
    { id: "seed-k7", channelId: "kitchen-prep", avatarId: "star", author: "Chef Dio", text: "That would be amazing, Aaron. Let's talk about the timing — we might be able to do a chef's table moment where guests can watch.", timestamp: "Mar 10, 3:45 PM", userId: "dio" },
  ],
  logistics: [
    { id: "seed-l1", channelId: "logistics", avatarId: "leaf", author: "Sarah", text: "Hotel block confirmed at The Venetian — 10 rooms at group rate, May 17-24. Confirmation numbers coming to each traveler by end of week.", timestamp: "Mar 8, 2:00 PM", userId: "sarah" },
    { id: "seed-l2", channelId: "logistics", avatarId: "mango", author: "Monny", text: "Chef Renato is flying in from Manila — arriving May 17, two days early. Can we arrange kitchen access for him on May 18 so he can test his prep?", timestamp: "Mar 9, 10:00 AM", userId: "monny" },
    { id: "seed-l3", channelId: "logistics", avatarId: "leaf", author: "Sarah", text: "On it. I'll coordinate with KMA for early kitchen access. Also, Maria offered to do the airport pickup for Renato since she's local.", timestamp: "Mar 9, 10:30 AM", userId: "sarah" },
    { id: "seed-l4", channelId: "logistics", avatarId: "coconut", author: "Walbert", text: "Still waiting on Christina Q's flight booking. She's between Spirit and Southwest out of New Orleans. Travel team — can you send her the booking link?", timestamp: "Mar 10, 11:00 AM", userId: "walbert" },
    { id: "seed-l5", channelId: "logistics", avatarId: "leaf", author: "Sarah", text: "Sent! Also checking if the Santos or Reyes families can host her. Hotel block is the backup. Will confirm by Friday.", timestamp: "Mar 10, 11:30 AM", userId: "sarah" },
    { id: "seed-l6", channelId: "logistics", avatarId: "mango", author: "Monny", text: "Chef Marco from NYC is bringing a specialized knife kit — needs checked bag allowance. His JetBlue Mint seat includes that, right?", timestamp: "Mar 11, 9:15 AM", userId: "monny" },
    { id: "seed-l7", channelId: "logistics", avatarId: "leaf", author: "Sarah", text: "Yes, JetBlue Mint includes 2 free checked bags. He's all set. I'll add a note to his itinerary about the knife kit.", timestamp: "Mar 11, 9:45 AM", userId: "sarah" },
  ],
  introductions: [
    { id: "seed-i1", channelId: "introductions", avatarId: "coconut", author: "Walbert", text: "Welcome everyone to the Isang Kusina 2026 team channel! Let's do quick intros. I'm Walbert — co-founder and operations lead. Year 3, let's go!", timestamp: "Mar 7, 8:30 AM", userId: "walbert" },
    { id: "seed-i2", channelId: "introductions", avatarId: "mango", author: "Monny", text: "Hey team! Monny here — co-founder, handling partnerships, budget, and making sure we don't lose money this year. Excited for what's ahead.", timestamp: "Mar 7, 8:45 AM", userId: "monny" },
    { id: "seed-i3", channelId: "introductions", avatarId: "leaf", author: "Denise", text: "Hi everyone! I'm Denise — creative lead for graphics and branding. Been with IK since Year 1. Can't wait to design the program booklet this year.", timestamp: "Mar 7, 9:00 AM", userId: "denise" },
    { id: "seed-i4", channelId: "introductions", avatarId: "star", author: "Chef Dio", text: "Chef Dio here, representing Las Vegas — Course 1. My lola's kare-kare is getting a fine dining makeover this year. Salamat for having me back!", timestamp: "Mar 7, 10:00 AM", userId: "dio" },
    { id: "seed-i5", channelId: "introductions", avatarId: "sun", author: "Chef Rachel", text: "Kumusta! Chef Rachel from Alaska. Course 2 — bringing the intersection of Filipino and Indigenous Alaskan food traditions. Honored to be here.", timestamp: "Mar 7, 10:30 AM", userId: "rachel" },
    { id: "seed-i6", channelId: "introductions", avatarId: "wave", author: "Chef Patrice", text: "Chef Patrice, Washington D.C. — Course 4. Filipino food belongs on every table, from diplomatic dinners to family reunions. Let's show the world.", timestamp: "Mar 7, 11:00 AM", userId: "patrice" },
    { id: "seed-i7", channelId: "introductions", avatarId: "flame", author: "Chef Marco", text: "Hey fam! Chef Marco from Brooklyn, NY. I'm the new addition this year — bringing my Filipino-Italian fusion to the table. So pumped to be part of this.", timestamp: "Mar 8, 8:00 AM", userId: "marco" },
  ],
};

/* ═══════════════════════════════════════════════════════════════════
   DECORATIVE LEAF SVG (tropical accent)
   ═══════════════════════════════════════════════════════════════════ */

function LeafDecor({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 2C30 2 8 20 8 45C8 60 18 75 30 78C42 75 52 60 52 45C52 20 30 2 30 2Z" fill="currentColor" opacity="0.07" />
      <path d="M30 10C30 10 30 78 30 78" stroke="currentColor" opacity="0.06" strokeWidth="1" />
      <path d="M30 25C22 30 15 38 14 48" stroke="currentColor" opacity="0.05" strokeWidth="0.8" fill="none" />
      <path d="M30 35C38 40 45 48 46 55" stroke="currentColor" opacity="0.05" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

function TapbackPill({ reactions, isOwn }: { reactions: Record<string, string>; isOwn: boolean }) {
  const grouped: Record<string, number> = {};
  Object.values(reactions).forEach((t) => { grouped[t] = (grouped[t] || 0) + 1; });
  if (Object.keys(grouped).length === 0) return null;
  return (
    <div
      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[0.6875rem] shadow-sm ${isOwn ? "ml-auto" : ""}`}
      style={{
        backgroundColor: P.ivory,
        border: `1px solid ${P.borderLight}`,
        marginTop: "-6px",
        position: "relative",
        zIndex: 2,
        width: "fit-content",
      }}
    >
      {Object.entries(grouped).map(([type, count]) => (
        <span key={type} className="flex items-center gap-0.5">
          <span className="text-[0.75rem]">{getTapbackEmoji(type)}</span>
          {count > 1 && <span className="text-[0.5625rem]" style={{ color: P.mutedText, ...bodyFont }}>{count}</span>}
        </span>
      ))}
    </div>
  );
}

function TapbackMenu({
  onSelect, onClose, position,
}: {
  onSelect: (type: TapbackType) => void;
  onClose: () => void;
  position: { x: number; y: number };
}) {
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 8 }}
        transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="fixed z-50 flex items-center gap-0.5 px-2 py-1.5 rounded-2xl shadow-xl"
        style={{
          backgroundColor: "rgba(250,245,237,0.97)",
          border: `1px solid rgba(26,92,56,0.15)`,
          backdropFilter: "blur(20px)",
          left: Math.min(position.x, window.innerWidth - 260),
          top: Math.max(8, position.y - 52),
        }}
      >
        {tapbackOptions.map((opt) => (
          <motion.button
            key={opt.type}
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { onSelect(opt.type); onClose(); }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[1.25rem] cursor-pointer"
            style={{ }}
            title={opt.label}
          >
            {opt.emoji}
          </motion.button>
        ))}
      </motion.div>
    </>
  );
}

function MessageBubble({
  msg, isOwn, isFirst, isLast, reactions, onTapback,
}: {
  msg: ChatMessage;
  isOwn: boolean;
  isFirst: boolean;
  isLast: boolean;
  reactions: Record<string, string>;
  onTapback: (msgId: string, position: { x: number; y: number }) => void;
  currentUserId?: string;
}) {
  const avatar = getAvatar(msg.avatarId);
  const hasReactions = Object.keys(reactions).length > 0;
  const openTapback = (e: React.MouseEvent) => { e.preventDefault(); onTapback(msg.id, { x: e.clientX, y: e.clientY }); };

  // iMessage-style progressive radius
  const ownR = `${isFirst ? "20px" : "6px"} 6px 6px ${isLast ? "20px" : "6px"}`;
  const otherR = `6px ${isFirst ? "20px" : "6px"} ${isLast ? "20px" : "6px"} 6px`;

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      {isFirst && !isOwn && (
        <div className="flex items-center gap-1.5 mb-1 px-1">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[0.625rem]" style={{ backgroundColor: avatar.bg }}>
            {avatar.emoji}
          </div>
          <span className="text-[0.6875rem]" style={{ color: P.deepGreen, ...bodyFont }}>{msg.author}</span>
        </div>
      )}
      <motion.div
        onContextMenu={openTapback}
        onDoubleClick={openTapback}
        className={`relative max-w-[75%] sm:max-w-[65%] px-3.5 py-2.5 cursor-pointer select-none ${isOwn ? "ml-auto" : "mr-auto"}`}
        style={{
          backgroundColor: isOwn ? P.deepGreen : P.blushPink,
          borderRadius: isOwn ? ownR : otherR,
          color: isOwn ? P.cream : P.darkText,
          marginBottom: hasReactions ? "2px" : undefined,
          boxShadow: isOwn
            ? "0 1px 3px rgba(26,92,56,0.15)"
            : "0 1px 3px rgba(240,196,192,0.3)",
        }}
        whileTap={{ scale: 0.98 }}
        layout="position"
      >
        <p className="text-[0.875rem] leading-[1.5] break-words" style={bodyFont}>{msg.text}</p>
        {isLast && (
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? "justify-end" : ""}`}>
            <span className="text-[0.5625rem]" style={{ color: isOwn ? "rgba(250,245,237,0.55)" : "rgba(28,59,42,0.35)", ...bodyFont }}>
              {msg.timestamp}
            </span>
            {isOwn && <span className="text-[0.5rem]" style={{ color: "rgba(250,245,237,0.45)" }}>✓</span>}
          </div>
        )}
      </motion.div>
      {hasReactions && (
        <div className={`${isOwn ? "pr-2" : "pl-2"} -mt-1`}>
          <TapbackPill reactions={reactions} isOwn={isOwn} />
        </div>
      )}
    </div>
  );
}

function ThreadItem({ channel, messages, isActive, onClick }: {
  channel: ChatChannel; messages: ChatMessage[]; isActive: boolean; onClick: () => void;
}) {
  const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
  const isPriority = channel.id === "general";

  return (
    <motion.button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 cursor-pointer text-left relative"
      style={{
        borderBottom: `1px solid ${P.borderLight}`,
        backgroundColor: isActive
          ? "rgba(26,92,56,0.05)"
          : isPriority
            ? "rgba(232,101,43,0.03)"
            : "rgba(0,0,0,0)",
      }}
      whileHover={!isActive ? { backgroundColor: isPriority ? "rgba(232,101,43,0.05)" : "rgba(26,92,56,0.02)" } : {}}
      whileTap={{ scale: 0.98 }}
    >
      {/* Priority left accent bar */}
      {isPriority && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
          style={{ backgroundColor: P.warmOrange }}
        />
      )}

      {/* Thread avatar — tropical circle, priority gets special ring */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-[1.375rem] shrink-0 relative"
        style={{
          backgroundColor: isPriority ? "rgba(232,101,43,0.1)" : `${channel.color}12`,
          border: isPriority ? `2px solid ${P.warmOrange}40` : `1.5px solid ${channel.color}25`,
          boxShadow: isPriority ? "0 0 0 3px rgba(232,101,43,0.06)" : "none",
        }}
      >
        {channel.emoji}
        {/* Signal leaf badge */}
        <div
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: P.deepGreen,
            border: `2px solid ${P.cream}`,
            width: "18px",
            height: "18px",
          }}
        >
          <Lock className="w-2 h-2" style={{ color: P.cream }} />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[0.875rem] font-semibold truncate" style={{ color: isPriority ? P.warmOrange : P.darkText, ...bodyFont }}>{channel.name}</span>
            {isPriority && (
              <span
                className="text-[0.5rem] px-1.5 py-0.5 rounded-full font-semibold shrink-0 uppercase tracking-wider"
                style={{
                  backgroundColor: "rgba(232,101,43,0.1)",
                  color: P.warmOrange,
                  border: "1px solid rgba(232,101,43,0.15)",
                  ...bodyFont,
                }}
              >
                Priority
              </span>
            )}
          </div>
          {lastMsg && <span className="text-[0.6875rem] shrink-0" style={{ color: P.mutedText, ...bodyFont }}>{lastMsg.timestamp.split(",").pop()?.trim() || lastMsg.timestamp}</span>}
        </div>
        <p className="text-[0.8125rem] truncate mt-0.5" style={{ color: P.mutedText, ...bodyFont }}>
          {lastMsg ? (<><span style={{ opacity: 0.6 }}>{lastMsg.author}:</span> {lastMsg.text}</>) : isPriority ? (<span style={{ color: P.warmOrange, opacity: 0.6, fontStyle: "italic" }}>Start here if short on time</span>) : (<span style={{ opacity: 0.4, fontStyle: "italic" }}>No messages yet</span>)}
        </p>
        {/* Channel description subtitle */}
        <p className="text-[0.625rem] truncate mt-0.5" style={{ color: P.mutedText, opacity: 0.5, ...bodyFont }}>
          {channel.description}
        </p>
      </div>

      {messages.length > 0 && (
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div
            className="min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-[0.5625rem] font-semibold px-1.5"
            style={{ backgroundColor: isPriority ? P.warmOrange : P.deepGreen, color: "#fff" }}
          >
            {messages.length > 99 ? "99+" : messages.length}
          </div>
        </div>
      )}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

interface CommsChatProps { role: UserRole; onBack?: () => void; onNavigate?: (page: string) => void; }

export function CommsChat({ role, onBack, onNavigate }: CommsChatProps) {
  const { profile, updateProfile } = useProfile();
  const { playIfEnabled } = useNotificationSound();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [reactions, setReactions] = useState<Record<string, Record<string, string>>>({});
  const [inputText, setInputText] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(() => profile?.avatarId || getSavedAvatar());
  const [userName, setUserName] = useState<string>(() => profile?.displayName || getSavedName());
  const [nameInputVisible, setNameInputVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tapbackTarget, setTapbackTarget] = useState<{ msgId: string; position: { x: number; y: number } } | null>(null);
  const [mobileView, setMobileView] = useState<"threads" | "conversation">("threads");
  const [commsTrackerOpen, setCommsTrackerOpen] = useState(false);
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState<string>(profile?.customPhotoUrl || "");
  const [editingName, setEditingName] = useState(false);
  const nameEditRef = useRef<HTMLInputElement>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [readCounts, setReadCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("ik26-chat-read-counts");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const channelMessages = activeChannel ? (messages[activeChannel] || []) : [];
  const currentChannel = channels.find((c) => c.id === activeChannel);
  const currentAvatarObj = getAvatar(selectedAvatar);

  // Confirmed chef info
  const confirmedChef = profile?.chefDirectoryId ? getConfirmedChef(profile.chefDirectoryId) : null;
  const displayPhotoUrl = profile?.customPhotoUrl || confirmedChef?.logoUrl || undefined;

  // Keep comms identity in sync with global profile (bidirectional)
  useEffect(() => {
    if (profile?.displayName && profile.displayName !== userName) {
      setUserName(profile.displayName);
    }
    if (profile?.avatarId && profile.avatarId !== selectedAvatar) {
      setSelectedAvatar(profile.avatarId);
    }
    if (profile?.customPhotoUrl !== undefined && profile.customPhotoUrl !== photoUrlInput) {
      setPhotoUrlInput(profile.customPhotoUrl || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.displayName, profile?.avatarId, profile?.customPhotoUrl]);

  // Sync comms identity changes back to global profile
  const syncIdentityToProfile = useCallback(() => {
    if (!profile) return;
    const updates: Partial<typeof profile> = {};
    const trimmedName = userName.trim();
    if (trimmedName && trimmedName !== profile.displayName) updates.displayName = trimmedName;
    if (selectedAvatar !== profile.avatarId) updates.avatarId = selectedAvatar;
    const trimmedPhoto = photoUrlInput.trim() || undefined;
    if (trimmedPhoto !== (profile.customPhotoUrl || undefined)) updates.customPhotoUrl = trimmedPhoto;
    if (Object.keys(updates).length > 0) {
      updateProfile(updates);
    }
  }, [profile, userName, selectedAvatar, photoUrlInput, updateProfile]);

  const loadMessages = useCallback(async (chId: string) => {
    try {
      const d = await apiFetch(`/messages/${chId}`);
      const serverMsgs: ChatMessage[] = d.messages || [];
      setMessages((p) => ({ ...p, [chId]: serverMsgs }));
    } catch (e) {
      console.error(`Failed to load messages for ${chId}:`, e);
      setMessages((p) => ({ ...p, [chId]: [] }));
    }
  }, []);

  const loadReactions = useCallback(async (chId: string) => {
    try { const d = await apiFetch(`/reactions/${chId}`); setReactions((p) => ({ ...p, ...d.reactions })); }
    catch (e) { console.error(`Failed to load reactions for ${chId}:`, e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all(channels.map((c) => Promise.all([loadMessages(c.id), loadReactions(c.id)]))).finally(() => setLoading(false));
  }, [loadMessages, loadReactions]);

  useEffect(() => {
    const subs = channels.map((ch) => {
      const sub = supabase.channel(`ik26-chat-${ch.id}`);
      sub.on("broadcast", { event: "message" }, (p) => {
        const m = p.payload as ChatMessage;
        if (m?.channelId === ch.id) {
          // Play notification sound for messages from other users
          if (m.userId !== profile?.id) {
            playIfEnabled();
          }
          setMessages((prev) => {
            const e = prev[ch.id] || [];
            if (e.some((x) => x.id === m.id)) return prev;
            return { ...prev, [ch.id]: [...e, m] };
          });
        }
      });
      sub.on("broadcast", { event: "reaction" }, (p) => {
        const { messageId, reactions: r } = p.payload as { messageId: string; reactions: Record<string, string> };
        if (messageId) setReactions((prev) => ({ ...prev, [messageId]: r }));
      });
      sub.on("broadcast", { event: "typing" }, (p) => {
        const { channelId, userName: typingName, userId: typingUid } = p.payload as { channelId: string; userName: string; userId: string };
        if (typingUid === profile?.id) return; // don't show own typing
        setTypingUsers((prev) => {
          const existing = prev[channelId] || [];
          if (!existing.includes(typingName)) return { ...prev, [channelId]: [...existing, typingName] };
          return prev;
        });
        // Auto-clear after 3s
        const tKey = `${channelId}:${typingUid}`;
        if (typingTimeoutRef.current[tKey]) clearTimeout(typingTimeoutRef.current[tKey]);
        typingTimeoutRef.current[tKey] = setTimeout(() => {
          setTypingUsers((prev) => {
            const existing = prev[channelId] || [];
            return { ...prev, [channelId]: existing.filter((n) => n !== typingName) };
          });
        }, 3000);
      });
      sub.subscribe();
      return sub;
    });
    return () => { subs.forEach((s) => supabase.removeChannel(s)); };
  }, [profile?.id, playIfEnabled]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [channelMessages.length, activeChannel]);
  useEffect(() => { saveAvatar(selectedAvatar); }, [selectedAvatar]);
  useEffect(() => { saveName(userName); }, [userName]);

  const selectChannel = (id: string) => { setActiveChannel(id); setMobileView("conversation"); loadMessages(id); loadReactions(id); };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeChannel) return;
    if (!userName.trim()) { setNameInputVisible(true); return; }
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      channelId: activeChannel, avatarId: selectedAvatar, author: userName.trim(), text,
      timestamp: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
      userId: profile?.id,
    };
    setMessages((p) => ({ ...p, [activeChannel]: [...(p[activeChannel] || []), newMsg] }));
    setInputText(""); inputRef.current?.focus();
    try { await apiFetch("/messages", { method: "POST", body: JSON.stringify(newMsg) }); } catch (e) { console.error("Persist failed:", e); toast.error("Message may not have saved."); }
    try { await supabase.channel(`ik26-chat-${activeChannel}`).send({ type: "broadcast", event: "message", payload: newMsg }); } catch (e) { console.error("Broadcast failed:", e); }
  };

  const sendReaction = async (msgId: string, type: TapbackType) => {
    const uid = profile?.id || "anonymous";
    setReactions((p) => { const e = { ...(p[msgId] || {}) }; if (e[uid] === type) delete e[uid]; else e[uid] = type; return { ...p, [msgId]: e }; });
    try {
      const d = await apiFetch("/reactions", { method: "POST", body: JSON.stringify({ messageId: msgId, userId: uid, reaction: type }) });
      if (activeChannel) await supabase.channel(`ik26-chat-${activeChannel}`).send({ type: "broadcast", event: "reaction", payload: { messageId: msgId, reactions: d.reactions } });
    } catch (e) { console.error("Reaction failed:", e); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Broadcast typing indicator (debounced)
  const lastTypingBroadcast = useRef<number>(0);
  const broadcastTyping = useCallback(() => {
    if (!activeChannel || !userName || !profile?.id) return;
    const now = Date.now();
    if (now - lastTypingBroadcast.current < 2000) return; // Throttle to every 2s
    lastTypingBroadcast.current = now;
    try {
      supabase.channel(`ik26-chat-${activeChannel}`).send({
        type: "broadcast",
        event: "typing",
        payload: { channelId: activeChannel, userName, userId: profile.id },
      });
    } catch {}
  }, [activeChannel, userName, profile?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (e.target.value.trim()) broadcastTyping();
  };

  function getMessageGroups(msgs: ChatMessage[]) {
    return msgs.map((msg, i) => {
      const prev = i > 0 ? msgs[i - 1] : null;
      const next = i < msgs.length - 1 ? msgs[i + 1] : null;
      return { msg, isOwn: !!(profile?.id && msg.userId === profile.id), isFirst: !prev || prev.userId !== msg.userId, isLast: !next || next.userId !== msg.userId };
    });
  }

  /* ─── RENDER ─────────────────────────────────────────────── */

  return (
    <div
      className="flex h-[calc(100vh-7.5rem)] rounded-xl overflow-hidden relative"
      style={{ backgroundColor: P.cream, border: `1px solid ${P.borderLight}` }}
    >

      {/* ═══ THREAD LIST ═══ */}
      <div
        className={`w-full md:w-80 lg:w-[22rem] flex-col shrink-0 ${mobileView === "threads" ? "flex" : "hidden md:flex"}`}
        style={{
          backgroundColor: P.ivory,
          borderRight: `1px solid ${P.borderLight}`,
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 shrink-0 relative overflow-hidden">
          {/* Subtle leaf decoration */}
          <LeafDecor
            className="absolute -top-2 -right-3 w-16 h-20 pointer-events-none"
            style={{ color: P.deepGreen }}
          />

          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer -ml-1 shrink-0" style={{ backgroundColor: "transparent" }} title="Back">
                  <ArrowLeft className="w-3.5 h-3.5" style={{ color: P.deepGreen }} />
                </button>
              )}
              <div>
                <h2 className="text-[1.125rem]" style={{ color: P.deepGreen, ...headingFont }}>Messages</h2>
                <button
                  onClick={() => onNavigate?.("Dashboard")}
                  className="text-[0.625rem] mt-0.5 cursor-pointer hover:underline transition-colors"
                  style={{ color: P.mutedText, ...bodyFont }}
                  title="Go to Dashboard"
                >
                  Isang Kusina 2026
                </button>
              </div>
            </div>
            <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[0.875rem] cursor-pointer transition-all" style={{ backgroundColor: currentAvatarObj.bg, border: `1.5px solid rgba(26,92,56,0.12)` }} title="Identity">
              {currentAvatarObj.emoji}
            </button>
          </div>

          {/* Encrypted badge — tropical green */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2"
            style={{
              background: `linear-gradient(135deg, rgba(26,92,56,0.06) 0%, rgba(45,122,74,0.03) 100%)`,
              border: `1px solid rgba(26,92,56,0.1)`,
            }}
          >
            <Leaf className="w-3.5 h-3.5" style={{ color: P.deepGreen }} />
            <span className="text-[0.6875rem]" style={{ color: P.deepGreen, ...bodyFont }}>End-to-end encrypted</span>
            <Lock className="w-2.5 h-2.5 ml-auto" style={{ color: P.leafGreen }} />
          </div>

          {/* Identity card — interactive, shows photo/chef badge */}
          <button
            onClick={() => setShowIdentityEditor(!showIdentityEditor)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all hover:opacity-90 text-left"
            style={{
              background: userName
                ? `linear-gradient(135deg, rgba(232,101,43,0.04) 0%, rgba(240,196,192,0.06) 100%)`
                : `linear-gradient(135deg, rgba(232,101,43,0.08) 0%, rgba(240,196,192,0.1) 100%)`,
              border: `1px solid ${userName ? "rgba(232,101,43,0.08)" : "rgba(232,101,43,0.2)"}`,
            }}
          >
            {/* Avatar — photo or emoji */}
            <div className="relative shrink-0">
              {displayPhotoUrl ? (
                <img
                  src={displayPhotoUrl}
                  alt=""
                  className="w-8 h-8 rounded-xl object-cover"
                  style={{ border: `1.5px solid rgba(26,92,56,0.12)` }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[0.875rem]" style={{ backgroundColor: currentAvatarObj.bg, border: `1.5px solid rgba(26,92,56,0.12)` }}>
                  {currentAvatarObj.emoji}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: P.ivory, border: `1px solid ${P.borderLight}` }}>
                <Pencil className="w-2 h-2" style={{ color: P.mutedText }} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {userName ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.8125rem] truncate" style={{ color: P.darkText, ...bodyFont, fontWeight: 500 }}>{userName}</span>
                    {confirmedChef && (
                      <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: "rgba(26,92,56,0.08)", color: P.deepGreen, ...bodyFont }}>Chef</span>
                    )}
                  </div>
                  <span className="text-[0.5625rem] block" style={{ color: P.mutedText, ...bodyFont }}>
                    Tap to edit identity
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[0.75rem]" style={{ color: P.warmOrange, ...bodyFont, fontWeight: 500 }}>Set up your identity</span>
                  <span className="text-[0.5625rem] block" style={{ color: P.mutedText, ...bodyFont }}>Add your name to start messaging</span>
                </>
              )}
            </div>
            <Sparkles className="w-3 h-3 shrink-0" style={{ color: userName ? P.mutedText : P.warmOrange, opacity: 0.5 }} />
          </button>

          {/* Research Partner banner — chef only */}
          {role === "chef" && (
            <div
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl mt-2"
              style={{
                background: `linear-gradient(135deg, rgba(107,127,142,0.06) 0%, rgba(74,127,181,0.04) 100%)`,
                border: `1px solid rgba(107,127,142,0.15)`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(107,127,142,0.12)" }}
              >
                <BookOpen className="w-3.5 h-3.5" style={{ color: "#6B7F8E" }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[0.6875rem] block" style={{ color: "#4A6B7F", ...bodyFont, fontWeight: 600 }}>
                  Your Research Partner
                </span>
                <span className="text-[0.625rem] block mt-0.5" style={{ color: P.mutedText, ...bodyFont }}>
                  Use Kitchen Prep or Introductions to connect with your assigned researcher for historical context.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Identity editor panel */}
        <AnimatePresence>
          {showIdentityEditor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="px-4 pb-2 overflow-hidden shrink-0">
              <div className="p-3 rounded-xl space-y-3" style={{ backgroundColor: P.warmCream, border: `1px solid ${P.borderLight}` }}>
                {/* Section title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3" style={{ color: P.deepGreen }} />
                    <p className="text-[0.6875rem]" style={{ color: P.deepGreen, ...bodyFont, fontWeight: 600 }}>Your messaging identity</p>
                  </div>
                  <button onClick={() => { setShowIdentityEditor(false); syncIdentityToProfile(); }} className="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/50 transition-colors">
                    <X className="w-3 h-3" style={{ color: P.mutedText }} />
                  </button>
                </div>

                {/* Display name input */}
                <div>
                  <label className="text-[0.5625rem] uppercase tracking-wider block mb-1" style={{ color: P.mutedText, ...bodyFont }}>Display name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onBlur={syncIdentityToProfile}
                    placeholder="Your first name"
                    className="w-full h-8 px-3 rounded-lg text-[0.8125rem] focus:outline-none focus:ring-1"
                    style={{ backgroundColor: P.ivory, border: `1px solid ${P.borderLight}`, color: P.darkText, ...bodyFont, outlineColor: P.deepGreen }}
                  />
                </div>

                {/* Photo URL input */}
                <div>
                  <label className="text-[0.5625rem] uppercase tracking-wider block mb-1" style={{ color: P.mutedText, ...bodyFont }}>
                    Profile photo
                    <span className="normal-case tracking-normal ml-1" style={{ opacity: 0.6 }}>(paste URL)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      {(photoUrlInput || displayPhotoUrl) ? (
                        <img
                          src={photoUrlInput || displayPhotoUrl}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                          style={{ border: `1px solid ${P.borderLight}` }}
                          onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(26,92,56,0.04)", border: `1px dashed ${P.borderLight}` }}>
                          <Camera className="w-3.5 h-3.5" style={{ color: P.mutedText, opacity: 0.4 }} />
                        </div>
                      )}
                    </div>
                    <input
                      type="url"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      onBlur={syncIdentityToProfile}
                      placeholder="https://yoursite.com/logo.png"
                      className="flex-1 h-8 px-3 rounded-lg text-[0.75rem] focus:outline-none focus:ring-1 min-w-0"
                      style={{ backgroundColor: P.ivory, border: `1px solid ${P.borderLight}`, color: P.darkText, ...bodyFont }}
                    />
                  </div>
                  {confirmedChef && !photoUrlInput && (
                    <p className="text-[0.5625rem] mt-1" style={{ color: P.mutedText, ...bodyFont }}>
                      Tip: Paste your restaurant logo or headshot URL to use across the hub.
                    </p>
                  )}
                </div>

                {/* Emoji avatar fallback */}
                <div>
                  <label className="text-[0.5625rem] uppercase tracking-wider block mb-1.5" style={{ color: P.mutedText, ...bodyFont }}>
                    {(photoUrlInput || displayPhotoUrl) ? "Fallback icon" : "Icon"}
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {avatarOptions.map((av) => (
                      <button key={av.id} onClick={() => { setSelectedAvatar(av.id); if (profile && av.id !== profile.avatarId) updateProfile({ avatarId: av.id }); }} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[0.875rem] transition-all cursor-pointer ${selectedAvatar === av.id ? "scale-110 ring-2 ring-offset-1" : "hover:scale-105"}`} style={{ backgroundColor: av.bg, border: selectedAvatar === av.id ? `2px solid ${P.deepGreen}` : "2px solid transparent", ringColor: P.deepGreen }} title={av.label}>{av.emoji}</button>
                    ))}
                  </div>
                </div>

                {/* Go to Settings link */}
                <button
                  onClick={() => { setShowIdentityEditor(false); onNavigate?.("Settings"); }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg cursor-pointer transition-colors hover:opacity-80"
                  style={{ backgroundColor: "rgba(26,92,56,0.04)", border: `1px solid ${P.borderLight}` }}
                >
                  <Settings className="w-3 h-3" style={{ color: P.deepGreen }} />
                  <span className="text-[0.6875rem]" style={{ color: P.deepGreen, ...bodyFont }}>Full profile settings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legacy avatar picker (kept for backward compat, hidden when identity editor is open) */}
        <AnimatePresence>
          {showAvatarPicker && !showIdentityEditor && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-2 overflow-hidden shrink-0">
              <div className="p-3 rounded-xl" style={{ backgroundColor: P.warmCream, border: `1px solid ${P.borderLight}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[0.6875rem]" style={{ color: P.mutedText, ...bodyFont }}>Your identity:</p>
                  <button onClick={() => { setShowAvatarPicker(false); syncIdentityToProfile(); }} className="text-[0.625rem] cursor-pointer" style={{ color: P.deepGreen, ...bodyFont }}>Done</button>
                </div>
                <div className="grid grid-cols-6 gap-1.5 mb-2.5">
                  {avatarOptions.map((av) => (
                    <button key={av.id} onClick={() => { setSelectedAvatar(av.id); if (profile && av.id !== profile.avatarId) updateProfile({ avatarId: av.id }); }} className={`w-9 h-9 rounded-xl flex items-center justify-center text-[1rem] transition-all cursor-pointer ${selectedAvatar === av.id ? "scale-110" : "hover:scale-105"}`} style={{ backgroundColor: av.bg, border: selectedAvatar === av.id ? `2px solid ${P.deepGreen}` : "2px solid transparent" }} title={av.label}>{av.emoji}</button>
                  ))}
                </div>
                <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} onBlur={syncIdentityToProfile} placeholder="Your first name" className="w-full h-8 px-3 rounded-lg text-[0.8125rem] focus:outline-none" style={{ backgroundColor: P.ivory, border: `1px solid ${P.borderLight}`, color: P.darkText, ...bodyFont }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread items */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: P.leafGreen }} />
              <span className="text-[0.75rem] ml-2" style={{ color: P.mutedText, ...bodyFont }}>Loading</span>
            </div>
          ) : channels.map((ch) => (
            <ThreadItem key={ch.id} channel={ch} messages={messages[ch.id] || []} isActive={activeChannel === ch.id} onClick={() => selectChannel(ch.id)} />
          ))}
        </div>

        {/* Notion Comms Tracker + SMS emergency */}
        <div className="p-3 shrink-0 space-y-2" style={{ borderTop: `1px solid ${P.borderLight}` }}>
          {role !== "chef" && (
            <button
              onClick={() => setCommsTrackerOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors cursor-pointer hover:opacity-90"
              style={{
                background: `linear-gradient(135deg, rgba(74,127,181,0.06) 0%, rgba(126,158,120,0.04) 100%)`,
                border: `1px solid rgba(74,127,181,0.15)`,
              }}
            >
              <Database className="w-3.5 h-3.5" style={{ color: "#4A7FB5" }} />
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[0.75rem] block" style={{ color: P.darkText, ...bodyFont }}>Comms Tracker</span>
                <span className="text-[0.6875rem]" style={{ color: P.mutedText, ...bodyFont }}>Notion contacts & follow-ups</span>
              </div>
            </button>
          )}
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors hover:opacity-80" style={{ border: `1px solid rgba(88,101,242,0.2)`, backgroundColor: "rgba(88,101,242,0.04)" }}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
            <div className="flex-1 min-w-0">
              <span className="text-[0.75rem] block" style={{ color: P.darkText, ...bodyFont }}>Discord Server</span>
              <span className="text-[0.6875rem]" style={{ color: P.mutedText, ...bodyFont }}>Join the IK26 community</span>
            </div>
          </a>
          <a href={SMS_GROUP_URI} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-colors" style={{ border: `1px solid ${P.borderLight}` }}>
            <Smartphone className="w-3.5 h-3.5" style={{ color: P.leafGreen }} />
            <div className="flex-1 min-w-0">
              <span className="text-[0.75rem] block" style={{ color: P.darkText, ...bodyFont }}>Urgent contact</span>
              <span className="text-[0.6875rem]" style={{ color: P.mutedText, ...bodyFont }}>Text Monny & Walbert</span>
            </div>
          </a>
        </div>
      </div>

      {/* ═══ CONVERSATION VIEW ═══ */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === "conversation" ? "flex" : "hidden md:flex"}`}>
        {!activeChannel ? (
          /* Empty state — tropical welcome */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <EmptyState
              variant="chat"
              title="Select a conversation"
              description="Choose a thread from the left to start messaging your team."
            />
          </div>
        ) : (
          <>
            {/* Conversation header */}
            <div
              className="px-4 py-3 shrink-0 flex items-center gap-3"
              style={{
                background: `linear-gradient(90deg, rgba(26,92,56,0.04) 0%, rgba(240,196,192,0.03) 50%, transparent 100%)`,
                borderBottom: `1px solid ${P.borderLight}`,
                backdropFilter: "blur(20px)",
              }}
            >
              <button onClick={() => setMobileView("threads")} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0">
                <ChevronLeft className="w-5 h-5" style={{ color: P.warmOrange }} />
              </button>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[1.125rem] shrink-0" style={{ backgroundColor: `${currentChannel?.color}12`, border: `1.5px solid ${currentChannel?.color}20` }}>{currentChannel?.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[0.9375rem]" style={{ color: P.darkText, ...bodyFont, fontWeight: 600 }}>{currentChannel?.name}</h3>
                  <Lock className="w-2.5 h-2.5" style={{ color: P.deepGreen }} />
                </div>
                <p className="text-[0.6875rem] truncate" style={{ color: P.mutedText, ...bodyFont }}>{currentChannel?.description}</p>
              </div>
              <div className="text-[0.6875rem] shrink-0" style={{ color: P.mutedText, ...bodyFont }}>{channelMessages.length} msg{channelMessages.length !== 1 ? "s" : ""}</div>
            </div>

            {/* Messages area */}
            <div
              className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1 relative"
              style={{
                background: `linear-gradient(180deg, ${P.cream} 0%, rgba(240,196,192,0.06) 40%, ${P.warmCream} 100%)`,
              }}
            >
              {/* Subtle leaf watermarks */}
              <LeafDecor className="absolute top-20 right-4 w-12 h-16 pointer-events-none opacity-30" style={{ color: P.deepGreen, transform: "rotate(20deg)" }} />
              <LeafDecor className="absolute bottom-32 left-6 w-10 h-14 pointer-events-none opacity-20" style={{ color: P.leafGreen, transform: "rotate(-30deg)" }} />

              {/* Encryption notice */}
              <div className="flex items-center justify-center py-3 mb-2 relative z-10">
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, rgba(26,92,56,0.05) 0%, rgba(45,122,74,0.03) 100%)`,
                    border: `1px solid rgba(26,92,56,0.08)`,
                  }}
                >
                  <Leaf className="w-2.5 h-2.5" style={{ color: P.deepGreen }} />
                  <span className="text-[0.625rem]" style={{ color: P.deepGreen, ...bodyFont }}>Messages are end-to-end encrypted. Only members can read them.</span>
                </div>
              </div>

              {loading && channelMessages.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: P.leafGreen }} />
                  <span className="text-[0.75rem] ml-2" style={{ color: P.mutedText, ...bodyFont }}>Loading</span>
                </div>
              )}

              {!loading && channelMessages.length === 0 && (
                <div className="text-center py-12 relative z-10">
                  <EmptyState
                    variant="chat"
                    title="Start the conversation"
                    description={`Be the first to send a message in #${currentChannel?.name || "this channel"}.`}
                  />
                </div>
              )}

              {/* Message bubbles */}
              <div className="relative z-10">
                {getMessageGroups(channelMessages).map(({ msg, isOwn, isFirst, isLast }) => (
                  <div key={msg.id} className={isFirst && !isOwn ? "mt-3" : isFirst ? "mt-2" : "mt-0.5"}>
                    <MessageBubble msg={msg} isOwn={isOwn} isFirst={isFirst} isLast={isLast} reactions={reactions[msg.id] || {}} onTapback={(id, pos) => setTapbackTarget({ msgId: id, position: pos })} currentUserId={profile?.id} />
                  </div>
                ))}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Name prompt */}
            <AnimatePresence>
              {nameInputVisible && !userName.trim() && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-2 overflow-hidden">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: `linear-gradient(135deg, rgba(232,101,43,0.06) 0%, rgba(240,196,192,0.08) 100%)`, border: `1px solid rgba(232,101,43,0.12)` }}>
                    <Sparkles className="w-4 h-4 shrink-0" style={{ color: P.warmOrange }} />
                    <div className="flex-1">
                      <p className="text-[0.75rem] mb-1.5" style={{ color: P.darkText, ...bodyFont }}>Enter your display name to begin:</p>
                      <div className="flex items-center gap-2">
                        <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Your first name" className="flex-1 h-8 px-3 rounded-lg text-[0.8125rem] focus:outline-none" style={{ backgroundColor: P.ivory, border: `1px solid ${P.borderLight}`, color: P.darkText, ...bodyFont }} onKeyDown={(e) => { if (e.key === "Enter" && userName.trim()) { setNameInputVisible(false); syncIdentityToProfile(); sendMessage(); } }} />
                        <button onClick={() => { if (userName.trim()) { setNameInputVisible(false); syncIdentityToProfile(); sendMessage(); } }} className="h-8 px-3 rounded-lg text-[0.75rem] text-white cursor-pointer" style={{ backgroundColor: P.deepGreen, ...bodyFont }}>Save</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input bar — tropical styled */}
            <div className="px-3 sm:px-4 py-2.5 shrink-0" style={{ backgroundColor: P.ivory, borderTop: `1px solid ${P.borderLight}` }}>
              {/* Typing indicator */}
              {activeChannel && (typingUsers[activeChannel] || []).length > 0 && (
                <div className="flex items-center gap-2 px-1 pb-1.5">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: P.leafGreen, animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: P.leafGreen, animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: P.leafGreen, animationDelay: "300ms" }} />
                  </div>
                  <span className="text-[0.625rem]" style={{ color: P.mutedText, ...bodyFont }}>
                    {(typingUsers[activeChannel] || []).join(", ")} {(typingUsers[activeChannel] || []).length === 1 ? "is" : "are"} typing...
                  </span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="w-8 h-8 rounded-xl flex items-center justify-center text-[0.8125rem] shrink-0 cursor-pointer transition-all mb-0.5" style={{ backgroundColor: currentAvatarObj.bg, border: `1.5px solid rgba(26,92,56,0.1)` }} title="Avatar">{currentAvatarObj.emoji}</button>

                <div
                  className="flex-1 flex items-center gap-2 rounded-2xl px-4 py-2 min-h-[2.5rem]"
                  style={{
                    backgroundColor: P.cream,
                    border: `1.5px solid rgba(26,92,56,0.08)`,
                  }}
                >
                  <input ref={inputRef} type="text" value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder={currentChannel ? `Message ${currentChannel.name}` : "Type a message"} className="flex-1 bg-transparent text-[0.875rem] focus:outline-none min-w-0" style={{ color: P.darkText, ...bodyFont }} />
                </div>

                <motion.button
                  whileHover={inputText.trim() ? { scale: 1.08 } : {}}
                  whileTap={inputText.trim() ? { scale: 0.92 } : {}}
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0 mb-0.5"
                  style={inputText.trim()
                    ? { backgroundColor: P.deepGreen, color: P.cream, boxShadow: "0 2px 8px rgba(26,92,56,0.25)" }
                    : { backgroundColor: P.warmCream, color: P.mutedText }
                  }
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <Leaf className="w-2.5 h-2.5" style={{ color: "rgba(26,92,56,0.25)" }} />
                <p className="text-[0.5625rem]" style={{ color: P.mutedText, opacity: 0.5, ...bodyFont }}>Encrypted{userName ? ` · ${userName}` : ""}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tapback overlay */}
      <AnimatePresence>
        {tapbackTarget && (
          <TapbackMenu position={tapbackTarget.position} onSelect={(t) => sendReaction(tapbackTarget.msgId, t)} onClose={() => setTapbackTarget(null)} />
        )}
      </AnimatePresence>

      {/* Notion Comms Tracker overlay */}
      <NotionCommsTracker isOpen={commsTrackerOpen} onClose={() => setCommsTrackerOpen(false)} />
    </div>
  );
}