import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Share2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Smartphone,
  Linkedin,
  ExternalLink,
  Sparkles,
  ChevronDown,
  X,
  Send,
  Camera,
  Globe,
  Users,
  Heart,
  Pencil,
  RotateCcw,
  BarChart3,
  User,
  type LucideIcon,
} from "lucide-react";

const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };

/* ── Share Analytics (localStorage) ── */
const ANALYTICS_KEY = "ik26_share_analytics";

interface ShareEvent {
  platform: string;
  templateType: string;
  action: "copy" | "open" | "native_share";
  timestamp: number;
}

function trackShare(platform: string, templateType: string, action: "copy" | "open" | "native_share") {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const events: ShareEvent[] = raw ? JSON.parse(raw) : [];
    events.push({ platform, templateType, action, timestamp: Date.now() });
    // Keep last 200 events
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(events.slice(-200)));
  } catch { /* ignore */ }
}

function getShareStats(): { totalShares: number; topPlatform: string | null; topTemplate: string | null; recentCount: number } {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return { totalShares: 0, topPlatform: null, topTemplate: null, recentCount: 0 };
    const events: ShareEvent[] = JSON.parse(raw);
    const totalShares = events.length;

    // Top platform
    const platformCounts: Record<string, number> = {};
    const templateCounts: Record<string, number> = {};
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let recentCount = 0;

    for (const e of events) {
      platformCounts[e.platform] = (platformCounts[e.platform] || 0) + 1;
      templateCounts[e.templateType] = (templateCounts[e.templateType] || 0) + 1;
      if (e.timestamp > weekAgo) recentCount++;
    }

    const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const topTemplate = Object.entries(templateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return { totalShares, topPlatform, topTemplate, recentCount };
  } catch {
    return { totalShares: 0, topPlatform: null, topTemplate: null, recentCount: 0 };
  }
}

/* ── Character Limits ── */
const CHAR_LIMITS: Partial<Record<Platform, number>> = {
  twitter: 280,
  sms: 320,
  whatsapp: 4096,
};

function getCharInfo(platform: Platform, text: string): { count: number; limit: number | null; overLimit: boolean; percentage: number } {
  const count = text.length;
  const limit = CHAR_LIMITS[platform] || null;
  const overLimit = limit !== null && count > limit;
  const percentage = limit !== null ? Math.min((count / limit) * 100, 100) : 0;
  return { count, limit, overLimit, percentage };
}

/* ── Platforms ── */
type Platform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "whatsapp"
  | "sms"
  | "email"
  | "linkedin"
  | "general";

interface PlatformConfig {
  id: Platform;
  label: string;
  icon: LucideIcon;
  color: string;
  colorRgba: string;
  description: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "email",
    label: "Email",
    icon: Mail,
    color: "#C49370",
    colorRgba: "rgba(196,147,112,1)",
    description: "Personal invite or formal outreach",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    color: "#25D366",
    colorRgba: "rgba(37,211,102,1)",
    description: "Quick share to friends and group chats",
  },
  {
    id: "sms",
    label: "Text Message",
    icon: Smartphone,
    color: "#5BC0EB",
    colorRgba: "rgba(91,192,235,1)",
    description: "Short and sweet, straight to their phone",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: Globe,
    color: "#1877F2",
    colorRgba: "rgba(24,119,242,1)",
    description: "Post or message for your Facebook community",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Camera,
    color: "#E1306C",
    colorRgba: "rgba(225,48,108,1)",
    description: "Caption or story text for the gram",
  },
  {
    id: "twitter",
    label: "X / Twitter",
    icon: Send,
    color: "#1DA1F2",
    colorRgba: "rgba(29,161,242,1)",
    description: "Tweet-ready, punchy and shareable",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    color: "#0A66C2",
    colorRgba: "rgba(10,102,194,1)",
    description: "Professional post for industry folks",
  },
  {
    id: "general",
    label: "General",
    icon: Share2,
    color: "#C49370",
    colorRgba: "rgba(196,147,112,1)",
    description: "Flexible blurb you can use anywhere",
  },
];

/* ── Template Types ── */
type TemplateType = "invite-guest" | "invite-partner" | "spread-the-word" | "chef-spotlight";

interface TemplateGroup {
  id: TemplateType;
  label: string;
  icon: LucideIcon;
  description: string;
}

const TEMPLATE_GROUPS: TemplateGroup[] = [
  { id: "invite-guest", label: "Invite a Guest", icon: Users, description: "Bring someone to the table" },
  { id: "invite-partner", label: "Partner Outreach", icon: Heart, description: "Reach potential sponsors or collaborators" },
  { id: "spread-the-word", label: "Spread the Word", icon: Sparkles, description: "General hype and awareness" },
  { id: "chef-spotlight", label: "Chef Spotlight", icon: Users, description: "Highlight our chefs and their work" },
];

const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  "invite-guest": "Invite a Guest",
  "invite-partner": "Partner Outreach",
  "spread-the-word": "Spread the Word",
  "chef-spotlight": "Chef Spotlight",
};

/* ── Templates ── */
function getTemplate(type: TemplateType, platform: Platform): { subject?: string; body: string } {
  const url = "https://isangkusina.com";

  const templates: Record<TemplateType, Record<Platform, { subject?: string; body: string }>> = {
    "invite-guest": {
      email: {
        subject: "You're invited: Isang Kusina 2026 in Las Vegas",
        body: `Hey!\n\nI wanted to tell you about something really special happening this May. It's called Isang Kusina, and it's a one-night collaboration dinner where seven Filipino chefs from across the US cook together in one kitchen.\n\nMay 22, 2026 in Las Vegas.\n\nSix courses. Each chef brings their own story, their own flavors. It's not a competition, it's a conversation through food. And honestly, it's going to be one of those nights you remember.\n\nI'd love for you to be there.\n\n${url}`,
      },
      whatsapp: {
        body: `Hey! Have you heard about Isang Kusina? Seven Filipino chefs, one kitchen, one incredible night in Las Vegas. May 22, 2026. Six courses, all heart. I think you'd really love it. ${url}`,
      },
      sms: {
        body: `Hey! There's a Filipino chef collab dinner happening in Vegas on May 22. Seven chefs, six courses, one amazing night. Check it out: ${url}`,
      },
      facebook: {
        body: `Something I'm really excited about: Isang Kusina 2026.\n\nSeven Filipino chefs from across the US are coming together for one night in Las Vegas to cook a six-course dinner. Each course tells a different story. It's about heritage, about community, about what happens when talented people choose collaboration over competition.\n\nMay 22, 2026. If this speaks to you, it's going to be unforgettable.\n\n${url}`,
      },
      instagram: {
        body: `Seven chefs. One kitchen. One night.\n\nIsang Kusina 2026 is a Filipino chefs collaboration dinner happening May 22 in Las Vegas. Six courses, each one a story. This is the kind of evening you feel in your bones.\n\nLink in bio or DM me for details.\n\n#IsangKusina #IsangKusina2026 #FilipinoCuisine #FilipinoChefs #OneKitchen #LasVegas`,
      },
      twitter: {
        body: `Seven Filipino chefs. One kitchen. One night in Las Vegas.\n\nIsang Kusina 2026 is happening May 22. Six courses that tell the story of where we come from.\n\n${url}`,
      },
      linkedin: {
        body: `I'm excited to share an event close to my heart: Isang Kusina 2026.\n\nSeven Filipino chefs from across the United States are collaborating on a six-course dinner in Las Vegas on May 22, 2026. Each course represents a different chef's story, their heritage, and their creative expression through Filipino cuisine.\n\nThis isn't just a dinner. It's a statement about what's possible when talented people choose to build together. If you're passionate about culinary arts, Filipino culture, or community-driven events, this is worth your attention.\n\n${url}`,
      },
      general: {
        body: `Isang Kusina 2026: Seven Filipino chefs, one kitchen, one unforgettable night in Las Vegas. May 22, 2026. Six courses, each one a story. Come be part of it. ${url}`,
      },
    },
    "invite-partner": {
      email: {
        subject: "Partnership opportunity: Isang Kusina 2026",
        body: `Hi there,\n\nI'm reaching out about Isang Kusina 2026, a Filipino chefs collaboration dinner happening May 22, 2026 in Las Vegas.\n\nHere's the short version: seven acclaimed Filipino chefs from across the US are coming together for one night to cook a six-course dinner. Each chef brings their own story, their own regional flavors, their own take on what Filipino food means today.\n\nWe're looking for partners who genuinely care about Filipino culture, food, and community. Not just logo placement, but real collaboration. People and brands who want to help us do this right.\n\nIf that sounds like something you'd be into, I'd love to chat.\n\n${url}`,
      },
      whatsapp: {
        body: `Hey! Quick question. Would you or your brand be interested in partnering with a Filipino chef collaboration dinner? Seven chefs, one night, Las Vegas, May 22. We're looking for partners who really get the culture. Let me know if you want details! ${url}`,
      },
      sms: {
        body: `Hey, wanted to run something by you. There's a Filipino chef collab dinner (Isang Kusina) in Vegas May 22 and we're looking for partners. Interested? ${url}`,
      },
      facebook: {
        body: `Looking for brands and people who care about Filipino food and culture.\n\nIsang Kusina 2026 brings seven Filipino chefs together for one incredible night in Las Vegas. We're building something special and we'd love partners who want to be part of the story, not just a logo on a banner.\n\nIf this resonates, reach out. Let's talk.\n\n${url}`,
      },
      instagram: {
        body: `We're looking for partners who get it.\n\nIsang Kusina 2026 is a Filipino chefs collaboration dinner in Las Vegas. Seven chefs, six courses, one night that matters. If your brand cares about culture, food, and community, let's build together.\n\nDM us or hit the link in bio.\n\n#IsangKusina #Partnership #FilipinoCuisine #CulturalPartnership`,
      },
      twitter: {
        body: `Looking for partners who care about Filipino food and culture. Isang Kusina 2026: seven chefs, one kitchen, one night in Las Vegas. Let's build something together.\n\n${url}`,
      },
      linkedin: {
        body: `We're seeking partnership opportunities for Isang Kusina 2026, a Filipino chefs collaboration dinner taking place May 22, 2026 in Las Vegas.\n\nSeven Filipino chefs from across the United States will collaborate on a six-course dinner celebrating heritage, innovation, and community. We're looking for presenting partners, cultural partners, community partners, and media partners who share our commitment to elevating Filipino cuisine.\n\nThis is a meaningful opportunity to connect with the Filipino culinary community and support something genuinely special. I'd welcome the chance to discuss how we might work together.\n\n${url}`,
      },
      general: {
        body: `Isang Kusina 2026 is looking for partners. Seven Filipino chefs, one kitchen, one night in Las Vegas. If you care about Filipino food and culture and want to be part of something real, let's connect. ${url}`,
      },
    },
    "spread-the-word": {
      email: {
        subject: "Something special: Isang Kusina 2026",
        body: `Hey,\n\nJust wanted to put this on your radar. There's a dinner happening in Las Vegas on May 22 called Isang Kusina. It translates to "One Kitchen."\n\nSeven Filipino chefs are cooking together for one night. Six courses. No competition, just collaboration. Each chef brings their own story, their own flavors, their own piece of home.\n\nEven if you can't make it, help me spread the word? It would mean a lot.\n\n${url}`,
      },
      whatsapp: {
        body: `Have you heard about Isang Kusina? It means "One Kitchen." Seven Filipino chefs are cooking together in Las Vegas on May 22. Would you mind sharing this with anyone who might be into it? ${url}`,
      },
      sms: {
        body: `Hey! Can you help spread the word? Isang Kusina: seven Filipino chefs, one night in Vegas, May 22. Share with anyone who'd be into it! ${url}`,
      },
      facebook: {
        body: `Help me spread the word about something I really believe in.\n\nIsang Kusina 2026 brings seven Filipino chefs together for one night in Las Vegas. Six courses. Stories told through food. No competition, just community.\n\nMay 22, 2026. Share this with someone who would love it.\n\n${url}`,
      },
      instagram: {
        body: `Pass it on.\n\nIsang Kusina 2026. Seven Filipino chefs. One kitchen. One night in Las Vegas. May 22.\n\nThis is the kind of thing that deserves to be shared. Tag someone who needs to know about this.\n\n#IsangKusina #IsangKusina2026 #FilipinoCuisine #SpreadTheWord #FilipinoFood #OneKitchen`,
      },
      twitter: {
        body: `Help me spread the word. Isang Kusina 2026: seven Filipino chefs cooking together for one night in Las Vegas. May 22. This one matters. RT appreciated.\n\n${url}`,
      },
      linkedin: {
        body: `I'd love your help getting the word out about Isang Kusina 2026.\n\nSeven Filipino chefs from across the United States are coming together for a collaborative six-course dinner in Las Vegas on May 22, 2026. It's a celebration of Filipino cuisine, heritage, and the power of working together.\n\nIf you know someone in the food industry, in the Filipino community, or anyone who appreciates what happens when talented people collaborate, please share this. It would mean a lot.\n\n${url}`,
      },
      general: {
        body: `Isang Kusina means "One Kitchen." Seven Filipino chefs, one night, six courses in Las Vegas on May 22, 2026. Help us spread the word. ${url}`,
      },
    },
    "chef-spotlight": {
      email: {
        subject: "Meet the chefs of Isang Kusina 2026",
        body: `Hey,\n\nI wanted to tell you about some incredible chefs who are doing something really cool together.\n\nIsang Kusina 2026 brings seven Filipino chefs from across the US to Las Vegas for one night. Each chef is cooking a course that tells their story. Where they grew up. What their lola taught them. How they found their voice in the kitchen.\n\nThese aren't just cooks. They're storytellers. And on May 22, they're sharing those stories with everyone at the table.\n\nThought you'd want to know about it.\n\n${url}`,
      },
      whatsapp: {
        body: `You need to know about these chefs. Seven Filipino chefs from across the US are cooking together for one night at Isang Kusina in Las Vegas. Each one brings their own story to the plate. May 22! ${url}`,
      },
      sms: {
        body: `Check out the chefs behind Isang Kusina! Seven Filipino chefs cooking together in Vegas on May 22. Each course is a different chef's story. ${url}`,
      },
      facebook: {
        body: `Let me tell you about some people who inspire me.\n\nThe chefs of Isang Kusina 2026 come from different cities, different backgrounds, different kitchens. But they all share something: a deep connection to Filipino food and the stories it carries.\n\nOn May 22 in Las Vegas, they're cooking together. One kitchen. Six courses. Each course is a window into who they are and where they come from.\n\nThese are the kind of people you want to root for.\n\n${url}`,
      },
      instagram: {
        body: `Meet the chefs of Isang Kusina 2026.\n\nSeven Filipino chefs. Seven stories. Seven different journeys that all lead to one kitchen in Las Vegas on May 22.\n\nFrom family recipes to fine dining, from the provinces to the professional stage. This is what it looks like when talent meets heart.\n\nStay tuned. You're going to want to know their names.\n\n#IsangKusina #FilipinoChefs #ChefSpotlight #FilipinoCuisine #OneKitchen`,
      },
      twitter: {
        body: `Seven Filipino chefs. Seven stories. One kitchen.\n\nThe chefs of Isang Kusina 2026 are cooking together in Las Vegas on May 22. Each course tells a different story. Keep your eyes on this crew.\n\n${url}`,
      },
      linkedin: {
        body: `I want to spotlight the chefs behind Isang Kusina 2026.\n\nSeven Filipino chefs from across the United States are coming together for a collaborative dinner in Las Vegas on May 22, 2026. Each chef brings a unique perspective shaped by their heritage, their training, and their personal journey with Filipino cuisine.\n\nWhat makes this special is the collaboration. These chefs chose to share one kitchen for one night, putting community above competition. That's the kind of leadership worth celebrating.\n\n${url}`,
      },
      general: {
        body: `Seven Filipino chefs. Seven stories. One kitchen. The chefs of Isang Kusina 2026 are coming together in Las Vegas on May 22 to cook a dinner you won't forget. ${url}`,
      },
    },
  };

  return templates[type][platform];
}

/* ── Share action helpers ── */
function getShareUrl(platform: Platform, template: { subject?: string; body: string }): string | null {
  const url = "https://isangkusina.com";
  const text = template.body;

  switch (platform) {
    case "email":
      return `mailto:?subject=${encodeURIComponent(template.subject || "Isang Kusina 2026")}&body=${encodeURIComponent(text)}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(text)}`;
    case "sms":
      return `sms:?body=${encodeURIComponent(text)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    case "instagram":
      return null;
    case "general":
      return null;
    default:
      return null;
  }
}

/* ── Character Count Indicator ── */
function CharCount({ platform, text }: { platform: Platform; text: string }) {
  const { count, limit, overLimit, percentage } = getCharInfo(platform, text);
  if (!limit) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(244,237,228,0.08)" }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: overLimit ? "rgba(220,80,60,0.8)" : percentage > 80 ? "rgba(201,169,110,0.8)" : "rgba(126,158,120,0.6)",
          }}
        />
      </div>
      <span
        className="text-[0.6875rem] tabular-nums shrink-0"
        style={{
          ...bodyFont,
          color: overLimit ? "rgba(220,80,60,0.9)" : "rgba(244,237,228,0.35)",
        }}
      >
        {count}/{limit}
      </span>
    </div>
  );
}

/* ── Copy Button ── */
function CopyButton({
  text,
  label = "Copy",
  fullWidth = false,
  platform,
  templateType,
}: {
  text: string;
  label?: string;
  fullWidth?: boolean;
  platform?: string;
  templateType?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (platform && templateType) trackShare(platform, templateType, "copy");
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      if (platform && templateType) trackShare(platform, templateType, "copy");
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${fullWidth ? "w-full justify-center" : ""}`}
      style={{
        ...bodyFont,
        backgroundColor: copied ? "rgba(122,134,92,0.2)" : "rgba(196,147,112,0.12)",
        color: copied ? "rgba(122,134,92,1)" : "rgba(196,147,112,1)",
        border: `1px solid ${copied ? "rgba(122,134,92,0.3)" : "rgba(196,147,112,0.25)"}`,
      }}
      aria-label={copied ? "Copied" : label}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </motion.button>
  );
}

/* ── Template Preview Card with inline editing ── */
function TemplatePreview({
  platform,
  templateType,
}: {
  platform: PlatformConfig;
  templateType: TemplateType;
}) {
  const template = getTemplate(templateType, platform.id);
  const [editing, setEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(template.body);
  const [editedSubject, setEditedSubject] = useState(template.subject || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isCustomized = editedBody !== template.body || editedSubject !== (template.subject || "");

  // Reset edits when template/platform changes
  useEffect(() => {
    setEditedBody(template.body);
    setEditedSubject(template.subject || "");
    setEditing(false);
  }, [template.body, template.subject]);

  // Auto-resize textarea
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
      textareaRef.current.focus();
    }
  }, [editing, editedBody]);

  const currentTemplate = {
    subject: editedSubject || template.subject,
    body: editedBody,
  };
  const shareUrl = getShareUrl(platform.id, currentTemplate);

  const handleReset = () => {
    setEditedBody(template.body);
    setEditedSubject(template.subject || "");
    toast("Reset to original template", { icon: <RotateCcw className="w-3.5 h-3.5" /> });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        border: `1px solid ${editing ? "rgba(196,147,112,0.35)" : "rgba(196,147,112,0.2)"}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid rgba(196,147,112,0.12)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${platform.colorRgba.replace(",1)", ",0.15)")}` }}
        >
          <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ ...bodyFont, color: "rgba(244,237,228,0.9)" }}>{platform.label}</p>
          <p className="text-xs" style={{ ...bodyFont, color: "rgba(244,237,228,0.4)" }}>{platform.description}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isCustomized && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleReset}
              className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: "rgba(244,237,228,0.06)" }}
              title="Reset to original"
              aria-label="Reset to original template"
            >
              <RotateCcw className="w-3 h-3" style={{ color: "rgba(244,237,228,0.4)" }} />
            </motion.button>
          )}
          <motion.button
            onClick={() => setEditing(!editing)}
            whileTap={{ scale: 0.95 }}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
            style={{
              backgroundColor: editing ? "rgba(196,147,112,0.15)" : "rgba(244,237,228,0.06)",
            }}
            title={editing ? "Done editing" : "Customize this template"}
            aria-label={editing ? "Done editing" : "Customize this template"}
          >
            {editing ? (
              <Check className="w-3 h-3" style={{ color: "rgba(196,147,112,1)" }} />
            ) : (
              <Pencil className="w-3 h-3" style={{ color: "rgba(244,237,228,0.4)" }} />
            )}
          </motion.button>
        </div>
      </div>

      {/* Customized badge */}
      <AnimatePresence>
        {isCustomized && !editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-1.5 flex items-center gap-1.5" style={{ backgroundColor: "rgba(126,158,120,0.08)" }}>
              <Pencil className="w-2.5 h-2.5" style={{ color: "rgba(126,158,120,0.7)" }} />
              <span className="text-[0.625rem] uppercase tracking-wider" style={{ ...bodyFont, color: "rgba(126,158,120,0.7)" }}>Customized</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject line for email */}
      {(template.subject || platform.id === "email") && (
        <div className="px-5 py-2.5" style={{ backgroundColor: "rgba(196,147,112,0.06)", borderBottom: "1px solid rgba(196,147,112,0.08)" }}>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}>Subject</p>
          {editing ? (
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              style={{ ...bodyFont, color: "rgba(244,237,228,0.8)" }}
              placeholder="Enter subject line..."
            />
          ) : (
            <p className="text-sm" style={{ ...bodyFont, color: "rgba(244,237,228,0.8)" }}>{editedSubject || template.subject}</p>
          )}
        </div>
      )}

      {/* Body */}
      <div className="px-5 py-4">
        {editing ? (
          <div>
            <textarea
              ref={textareaRef}
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none min-h-[100px]"
              style={{
                ...bodyFont,
                color: "rgba(244,237,228,0.75)",
              }}
              placeholder="Write your message..."
            />
            <CharCount platform={platform.id} text={editedBody} />
          </div>
        ) : (
          <>
            <pre
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
              style={{
                ...bodyFont,
                color: "rgba(244,237,228,0.65)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {editedBody}
            </pre>
            <CharCount platform={platform.id} text={editedBody} />
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3.5" style={{ borderTop: "1px solid rgba(196,147,112,0.1)" }}>
        <CopyButton
          text={editedSubject ? `Subject: ${editedSubject}\n\n${editedBody}` : editedBody}
          label="Copy Text"
          platform={platform.id}
          templateType={templateType}
        />
        {shareUrl && (
          <motion.a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => trackShare(platform.id, templateType, "open")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
            style={{
              ...bodyFont,
              backgroundColor: `${platform.colorRgba.replace(",1)", ",0.15)")}`,
              color: platform.color,
              border: `1px solid ${platform.colorRgba.replace(",1)", ",0.25)")}`,
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in {platform.label}
          </motion.a>
        )}
        {platform.id === "instagram" && (
          <span className="text-xs" style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}>
            Copy and paste into your IG story or caption
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ── Share Stats Mini Dashboard ── */
function ShareStats() {
  const [stats, setStats] = useState(getShareStats);
  const [expanded, setExpanded] = useState(false);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => setStats(getShareStats()), 5000);
    return () => clearInterval(interval);
  }, []);

  if (stats.totalShares === 0) return null;

  const platformLabel = PLATFORMS.find(p => p.id === stats.topPlatform)?.label || stats.topPlatform;
  const templateLabel = stats.topTemplate ? TEMPLATE_TYPE_LABELS[stats.topTemplate as TemplateType] || stats.topTemplate : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgba(196,147,112,0.05)",
        border: "1px solid rgba(196,147,112,0.12)",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(196,147,112,0.12)" }}>
          <BarChart3 className="w-3.5 h-3.5" style={{ color: "rgba(196,147,112,0.7)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ ...bodyFont, color: "rgba(244,237,228,0.6)" }}>
            Your sharing activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tabular-nums" style={{ ...headingFont, color: "rgba(196,147,112,0.8)" }}>
            {stats.totalShares}
          </span>
          <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>
            share{stats.totalShares !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
            style={{ color: "rgba(244,237,228,0.3)" }}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 gap-3 px-4 pb-3" style={{ borderTop: "1px solid rgba(196,147,112,0.08)" }}>
              <div className="pt-3">
                <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>This week</p>
                <p className="text-sm font-semibold" style={{ ...bodyFont, color: "rgba(244,237,228,0.7)" }}>{stats.recentCount}</p>
              </div>
              {platformLabel && (
                <div className="pt-3">
                  <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>Top platform</p>
                  <p className="text-sm font-semibold" style={{ ...bodyFont, color: "rgba(244,237,228,0.7)" }}>{platformLabel}</p>
                </div>
              )}
              {templateLabel && (
                <div className="pt-3">
                  <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>Most used</p>
                  <p className="text-sm font-semibold truncate" style={{ ...bodyFont, color: "rgba(244,237,228,0.7)" }}>{templateLabel}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════
   SHARE & INVITE PAGE
   ══════════════════════════════════════════════════ */
export function ShareInvite({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [selectedType, setSelectedType] = useState<TemplateType>("invite-guest");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | "all">("all");
  const [quickShareOpen, setQuickShareOpen] = useState(false);
  const quickShareRef = useRef<HTMLDivElement>(null);

  // Close quick share dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (quickShareRef.current && !quickShareRef.current.contains(e.target as Node)) {
        setQuickShareOpen(false);
      }
    }
    if (quickShareOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [quickShareOpen]);

  // Web Share API
  const handleNativeShare = async () => {
    const template = getTemplate(selectedType, "general");
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Isang Kusina 2026",
          text: template.body,
          url: "https://isangkusina.com",
        });
        trackShare("native", selectedType, "native_share");
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(template.body);
      trackShare("clipboard", selectedType, "copy");
      toast.success("Copied to clipboard! Paste it wherever you'd like.");
    }
  };

  const visiblePlatforms = selectedPlatform === "all"
    ? PLATFORMS
    : PLATFORMS.filter(p => p.id === selectedPlatform);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ ...headingFont, color: "var(--foreground)" }}>
          Share & Invite
        </h2>
        <p className="text-sm leading-relaxed max-w-xl" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
          Ready-to-send templates for every platform. Pick your message, pick your medium, and share the love. Hit the pencil icon on any card to make it your own before sending.
        </p>
      </div>

      {/* Share Stats */}
      <ShareStats />

      {/* Quick Share Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          onClick={handleNativeShare}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold cursor-pointer"
          style={{
            ...bodyFont,
            backgroundColor: "rgba(196,147,112,0.15)",
            color: "rgba(196,147,112,1)",
            border: "1px solid rgba(196,147,112,0.3)",
          }}
        >
          <Share2 className="w-4 h-4" />
          Quick Share
        </motion.button>

        {/* Quick share shortcuts for each platform */}
        <div className="relative" ref={quickShareRef}>
          <motion.button
            onClick={() => setQuickShareOpen(!quickShareOpen)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm cursor-pointer"
            style={{
              ...bodyFont,
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "rgba(244,237,228,0.6)",
              border: "1px solid rgba(244,237,228,0.1)",
            }}
          >
            Send directly to...
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${quickShareOpen ? "rotate-180" : ""}`} />
          </motion.button>

          <AnimatePresence>
            {quickShareOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 mt-2 w-56 rounded-xl overflow-hidden z-50 shadow-xl"
                style={{
                  backgroundColor: "rgba(42,51,40,0.98)",
                  border: "1px solid rgba(196,147,112,0.2)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {PLATFORMS.filter(p => getShareUrl(p.id, getTemplate(selectedType, p.id)) !== null).map((p) => {
                  const template = getTemplate(selectedType, p.id);
                  const shareUrl = getShareUrl(p.id, template);
                  return (
                    <a
                      key={p.id}
                      href={shareUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        setQuickShareOpen(false);
                        trackShare(p.id, selectedType, "open");
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer"
                      style={{
                        ...bodyFont,
                        color: "rgba(244,237,228,0.8)",
                        borderBottom: "1px solid rgba(244,237,228,0.05)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(196,147,112,0.1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0)"; }}
                    >
                      <p.icon className="w-4 h-4" style={{ color: p.color }} />
                      {p.label}
                    </a>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Template Type Selector */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-3" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
          What are you sharing?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TEMPLATE_GROUPS.map((g) => {
            const active = selectedType === g.id;
            return (
              <motion.button
                key={g.id}
                onClick={() => setSelectedType(g.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex flex-col items-start gap-1.5 p-4 rounded-xl text-left cursor-pointer"
                style={{
                  ...bodyFont,
                  backgroundColor: active ? "rgba(196,147,112,0.12)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(196,147,112,0.35)" : "rgba(244,237,228,0.08)"}`,
                }}
              >
                <g.icon className="w-4 h-4" style={{ color: active ? "rgba(196,147,112,1)" : "rgba(244,237,228,0.4)" }} />
                <span className="text-sm font-medium" style={{ color: active ? "rgba(196,147,112,1)" : "rgba(244,237,228,0.7)" }}>{g.label}</span>
                <span className="text-xs" style={{ color: active ? "rgba(196,147,112,0.6)" : "rgba(244,237,228,0.35)" }}>{g.description}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Platform Filter */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-3" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
          Platform
        </p>
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => setSelectedPlatform("all")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer"
            style={{
              ...bodyFont,
              backgroundColor: selectedPlatform === "all" ? "rgba(196,147,112,0.15)" : "rgba(255,255,255,0.04)",
              color: selectedPlatform === "all" ? "rgba(196,147,112,1)" : "rgba(244,237,228,0.5)",
              border: `1px solid ${selectedPlatform === "all" ? "rgba(196,147,112,0.3)" : "rgba(244,237,228,0.1)"}`,
            }}
          >
            All Platforms
          </motion.button>
          {PLATFORMS.map((p) => {
            const active = selectedPlatform === p.id;
            return (
              <motion.button
                key={p.id}
                onClick={() => setSelectedPlatform(p.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium cursor-pointer"
                style={{
                  ...bodyFont,
                  backgroundColor: active ? `${p.colorRgba.replace(",1)", ",0.15)")}` : "rgba(255,255,255,0.04)",
                  color: active ? p.color : "rgba(244,237,228,0.5)",
                  border: `1px solid ${active ? p.colorRgba.replace(",1)", ",0.25)") : "rgba(244,237,228,0.1)"}`,
                }}
              >
                <p.icon className="w-3 h-3" />
                {p.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedType}-${selectedPlatform}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {visiblePlatforms.map((p) => (
              <TemplatePreview key={p.id} platform={p} templateType={selectedType} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pro Tips */}
      <div
        className="rounded-2xl p-5 sm:p-6"
        style={{
          backgroundColor: "rgba(196,147,112,0.06)",
          border: "1px solid rgba(196,147,112,0.15)",
        }}
      >
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ ...bodyFont, color: "rgba(196,147,112,1)" }}>
          <Sparkles className="w-4 h-4" />
          Sharing Tips
        </h3>
        <ul className="space-y-2">
          {[
            "Tap the pencil icon on any template to customize it before copying. Add your own touch, mention why it matters to you.",
            "For Instagram Stories, copy the text and paste it as a text overlay on your story. Pair it with a warm photo.",
            "WhatsApp and SMS work best when sent to people individually. It feels more personal than a group blast.",
            "On LinkedIn, add a personal note about why Filipino cuisine matters to you. People connect with real stories.",
            "When emailing potential partners, reference something specific about their brand. Show you've done your homework.",
            "Watch the character counter on Twitter and SMS templates. It'll turn gold when you're getting close to the limit.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed" style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}>
              <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: "rgba(196,147,112,0.5)" }} />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   FLOATING SHARE BUTTON (for use on any page)
   ══════════════════════════════════════════════════ */
export function FloatingShareButton({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const defaultType: TemplateType = "spread-the-word";

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleQuickShare = async (platform: PlatformConfig) => {
    const template = getTemplate(defaultType, platform.id);
    const shareUrl = getShareUrl(platform.id, template);

    if (shareUrl) {
      trackShare(platform.id, defaultType, "open");
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    } else {
      // Copy to clipboard for platforms without direct links
      try {
        await navigator.clipboard.writeText(template.body);
        trackShare(platform.id, defaultType, "copy");
        toast.success(`${platform.label} text copied to clipboard!`);
      } catch {
        toast.error("Couldn't copy to clipboard");
      }
    }
    setOpen(false);
  };

  const handleNativeShare = async () => {
    const template = getTemplate(defaultType, "general");
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Isang Kusina 2026",
          text: template.body,
          url: "https://isangkusina.com",
        });
        trackShare("native", defaultType, "native_share");
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(template.body);
      trackShare("clipboard", defaultType, "copy");
      toast.success("Copied to clipboard!");
    }
    setOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40" ref={panelRef}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-14 right-0 w-64 rounded-2xl overflow-hidden shadow-2xl mb-2"
            style={{
              backgroundColor: "rgba(42,51,40,0.98)",
              border: "1px solid rgba(196,147,112,0.25)",
              backdropFilter: "blur(16px)",
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(196,147,112,0.12)" }}>
              <p className="text-xs font-semibold" style={{ ...bodyFont, color: "rgba(244,237,228,0.7)" }}>Quick Share</p>
              <button
                onClick={() => {
                  setOpen(false);
                  onNavigate("Share Invite");
                }}
                className="text-[0.625rem] font-medium px-2 py-1 rounded-md cursor-pointer"
                style={{
                  ...bodyFont,
                  color: "rgba(196,147,112,0.8)",
                  backgroundColor: "rgba(196,147,112,0.1)",
                }}
              >
                All Templates
              </button>
            </div>

            {/* Native share */}
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer text-left"
              style={{
                ...bodyFont,
                color: "rgba(244,237,228,0.8)",
                borderBottom: "1px solid rgba(244,237,228,0.06)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(196,147,112,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0)"; }}
            >
              <Share2 className="w-4 h-4" style={{ color: "rgba(196,147,112,0.7)" }} />
              Share via device...
            </button>

            {/* Platform shortcuts */}
            <div className="grid grid-cols-4 gap-1 p-3">
              {PLATFORMS.filter(p => p.id !== "general").map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleQuickShare(p)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer"
                  style={{ minHeight: "44px" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(244,237,228,0.05)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,0,0,0)"; }}
                  title={p.label}
                  aria-label={`Share via ${p.label}`}
                >
                  <p.icon className="w-4 h-4" style={{ color: p.color }} />
                  <span className="text-[0.5625rem] leading-tight text-center" style={{ ...bodyFont, color: "rgba(244,237,228,0.4)" }}>
                    {p.label.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        style={{
          backgroundColor: "rgba(196,147,112,0.9)",
          boxShadow: "0 4px 20px rgba(196,147,112,0.3), 0 0 0 1px rgba(196,147,112,0.4)",
        }}
        aria-label={open ? "Close share menu" : "Share Isang Kusina"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-5 h-5" style={{ color: "rgba(42,51,40,1)" }} />
            </motion.div>
          ) : (
            <motion.div key="share" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Share2 className="w-5 h-5" style={{ color: "rgba(42,51,40,1)" }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
