// Chef Roster — v2.3.0
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  ChefHat,
  MapPin,
  Plane,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  UtensilsCrossed,
  BookOpen,
  ChevronDown,
  MessageCircle,
  ArrowRight,
  ChevronsUpDown,
  ExternalLink,
  Instagram,
  Award,
  Star,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { UserRole, ViewMode } from "./onboarding/use-auth";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { transformChef } from "../lib/notion-transforms";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { bodyFont, headingFont } from "../lib/fonts";
import { writeToNotion } from "../lib/notion-write";

// Simple loading skeleton
function ChefRosterSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#4E8282" }} />
        <p className="text-sm text-muted-foreground" style={bodyFont}>Loading chef roster...</p>
      </div>
    </div>
  );
}

interface Chef {
  id: string;
  name: string;
  city: string;
  course: number;
  courseLocation: string;
  year: string;
  travelStatus: "confirmed" | "pending" | "needs-booking";
  bio: string;
  specialties: string[];
  signatureDish: string;
  storySnippet: string;
  logoUrl?: string;
  restaurant: string;
  restaurantUrl: string;
  restaurantLogoUrl: string;
  instagram: string;
  accolades: string[];
  jamesBearStatus?: "winner" | "finalist" | null;
}

const chefs: Chef[] = [
  {
    id: "patrice",
    name: "Chef Patrice Cleary",
    city: "Washington, D.C.",
    course: 1,
    courseLocation: "Washington D.C.",
    year: "1903",
    travelStatus: "confirmed",
    bio: "Chef-owner of Purple Patch, one of the first Filipino restaurants in Washington DC (opened 2015). Former Marine and self-taught chef. DC's pioneering Filipino-American culinary voice.",
    specialties: ["Filipino-American", "Modern Filipino", "Pastry"],
    signatureDish: "Bibingka Soufflé",
    storySnippet: "\"Filipino food doesn't need permission to sit at the table. It already belongs there.\"",
    restaurant: "Purple Patch",
    restaurantUrl: "https://purplepatchdc.com",
    restaurantLogoUrl: "https://logo.clearbit.com/purplepatchdc.com",
    instagram: "@cupcakecleary",
    accolades: [
      "Washington Post Dining Guide staple",
      "Tom Sietsema's Favorite Restaurant 2023",
      "Best Filipino Restaurant — DC City Paper 2023 & 2024",
    ],
    jamesBearStatus: null,
  },
  {
    id: "justin",
    name: "Chef Justin Barnes",
    city: "Las Vegas / Hawaii",
    course: 2,
    courseLocation: "Las Vegas / Hawaii",
    year: "1906",
    travelStatus: "confirmed",
    bio: "Las Vegas-based chef collaborating with Istorya on Filipino-Spanish pop-up experiences. Known for heritage-driven cooking rooted in Filipino tradition.",
    specialties: ["Filipino-Spanish", "Heritage Cuisine", "Pop-Up"],
    signatureDish: "Lechon Belly with Pineapple Atchara",
    storySnippet: "\"In Hawaii, every potluck tells a migration story. I cook so that story doesn't get lost.\"",
    restaurant: "Galeón / Istorya",
    restaurantUrl: "https://istoryalv.com",
    restaurantLogoUrl: "https://logo.clearbit.com/istoryalv.com",
    instagram: "@justinbarnes_chef",
    accolades: [],
    jamesBearStatus: null,
  },
  {
    id: "aaron",
    name: "Chef Aaron Verzosa",
    city: "Seattle, Washington",
    course: 3,
    courseLocation: "Seattle, WA",
    year: "1883",
    travelStatus: "confirmed",
    bio: "Chef-owner of Archipelago, an intimate 12-seat chef's counter in Seattle's Hillman City. Pacific Northwest cuisine through progressive Filipino American flavors. Former R&D chef at Modernist Cuisine.",
    specialties: ["Progressive Filipino", "Tasting Menu", "PNW Ingredients"],
    signatureDish: "Pacific Northwest Tinola",
    storySnippet: "\"Every dish I make is a letter home to a place I've never been but always knew.\"",
    restaurant: "Archipelago",
    restaurantUrl: "https://archipelagoseattle.com",
    restaurantLogoUrl: "https://logo.clearbit.com/archipelagoseattle.com",
    instagram: "@archipelagoseattle",
    accolades: [
      "James Beard semifinalist",
      "Eater Seattle Chef of the Year",
    ],
    jamesBearStatus: null,
  },
  {
    id: "cristina",
    name: "Chef Cristina Quackenbush",
    city: "New Orleans, Louisiana",
    course: 4,
    courseLocation: "New Orleans, LA",
    year: "1763",
    travelStatus: "confirmed",
    bio: "Pioneer of Filipino cuisine in New Orleans. Opened Milkfish in 2013, the first Filipino restaurant in NOLA. Now running Tatlo in the French Quarter — a Filipino witch bar and immersive dining experience. Co-founder of Good Trouble Network nonprofit.",
    specialties: ["Cajun-Filipino", "Immersive Dining", "Storytelling"],
    signatureDish: "Shrimp & Bagoong Étouffée",
    storySnippet: "\"The bayou remembers. Filipino fishermen were here before Louisiana was even a state.\"",
    restaurant: "Tatlo (formerly Milkfish)",
    restaurantUrl: "https://milkfish.co",
    restaurantLogoUrl: "https://logo.clearbit.com/milkfish.co",
    instagram: "@milkfishnola",
    accolades: [
      "Eater NOLA recognition",
      "Food & Wine feature",
      "Zagat recognition",
    ],
    jamesBearStatus: null,
  },
  {
    id: "lord",
    name: "Chef Lord Maynard Llera",
    city: "Los Angeles, California",
    course: 5,
    courseLocation: "California",
    year: "1587",
    travelStatus: "confirmed",
    bio: "Chef-owner of Kuya Lord, elevated fast-casual Filipino in Melrose Hills LA. Born in Lucena City, Philippines. CIA Hyde Park graduate. Trained at Bestia before opening his own restaurant in 2022.",
    specialties: ["Elevated Filipino", "Fast-Casual", "Open Fire"],
    signatureDish: "Galleon-Spiced Crispy Pata",
    storySnippet: "\"1587. That's when we arrived. Before Jamestown, before Plymouth Rock. California was already Filipino.\"",
    restaurant: "Kuya Lord",
    restaurantUrl: "https://kuyalord.com",
    restaurantLogoUrl: "https://logo.clearbit.com/kuyalord.com",
    instagram: "@kuyalordla",
    accolades: [
      "2024 James Beard Award — Best Chef California",
      "CIA Hyde Park graduate",
    ],
    jamesBearStatus: "winner",
  },
  {
    id: "rachel",
    name: "Chef Rachel Barril",
    city: "Juneau, Alaska",
    course: 6,
    courseLocation: "Alaska",
    year: "1911",
    travelStatus: "confirmed",
    bio: "Chef de Cuisine at In Bocca al Lupo, a 2019 James Beard Award finalist in downtown Juneau. Third-generation Alaskero whose great-grandparents immigrated from the Philippines in the 1920s. Blends Filipino technique with Alaskan foraging — wild mushrooms, salmon, beach greens.",
    specialties: ["Filipino-Alaskan", "Foraging", "Fermentation"],
    signatureDish: "Smoked Salmon Sinigang",
    storySnippet: "\"When you're this far north, you learn quickly that Filipino food and Alaskan food share the same soul — survival through flavor.\"",
    restaurant: "In Bocca al Lupo",
    restaurantUrl: "https://inboccaalupojuneau.com",
    restaurantLogoUrl: "https://logo.clearbit.com/inboccaalupojuneau.com",
    instagram: "@inboccaalupojuneau",
    accolades: [
      "In Bocca al Lupo — 2019 James Beard Award finalist",
    ],
    jamesBearStatus: "finalist",
  },
  {
    id: "dio",
    name: "Chef Dio Buan",
    city: "Las Vegas, Nevada",
    course: 7,
    courseLocation: "Las Vegas, NV",
    year: "1911",
    travelStatus: "confirmed",
    bio: "Master Cook at Joël Robuchon Las Vegas. Trained under Bobby Flay, Thomas Keller, and chefs mentored by Robuchon himself. Born in Manila, now reimagining Filipino dishes with fine-dining precision through Istorya pop-ups. Founder/lead chef of Isang Kusina.",
    specialties: ["Fine Dining", "French-Filipino", "Pop-Up"],
    signatureDish: "Kare-Kare with Smoked Oxtail Marrow",
    storySnippet: "\"My lola would say the kitchen is the loudest room in the house — but also the most honest.\"",
    restaurant: "Istorya / Joël Robuchon",
    restaurantUrl: "https://istoryalv.com",
    restaurantLogoUrl: "https://logo.clearbit.com/istoryalv.com",
    instagram: "@dangerously_delicious702",
    accolades: [
      "Joël Robuchon Las Vegas",
      "Trained under Thomas Keller lineage",
    ],
    jamesBearStatus: null,
  },
];

const travelStatusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmed", color: "#2D5F2D", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", icon: Clock },
  "needs-booking": { label: "Needs Booking", color: "#C75B3F", icon: AlertCircle },
};

// Chef-to-course assignment mapping
const chefCourseAssignments: Record<string, string[]> = {
  patrice: ["Bibingka Soufflé", "Dessert Station"],
  justin: ["Lechon Belly", "Pork Station"],
  aaron: ["Pacific NW Tinola", "First Course"],
  cristina: ["Shrimp Étouffée", "Main Course"],
  lord: ["Crispy Pata", "Main Course"],
  rachel: ["Smoked Salmon Sinigang", "Second Course"],
  dio: ["Kare-Kare", "Final Course"],
};

interface ChefRosterProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
  viewMode?: ViewMode;
}

// James Beard badge component
function JamesBearBadge({ status }: { status: "winner" | "finalist" }) {
  const isWinner = status === "winner";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem] font-semibold shrink-0"
      style={{
        backgroundColor: isWinner ? "rgba(212,175,55,0.15)" : "rgba(212,175,55,0.08)",
        color: "#D4AF37",
        border: isWinner ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(212,175,55,0.2)",
        ...bodyFont,
      }}
      title={isWinner ? "James Beard Award Winner" : "James Beard Award Finalist"}
    >
      {isWinner ? (
        <Star className="w-2.5 h-2.5" style={{ fill: "#D4AF37", color: "#D4AF37" }} />
      ) : (
        <Award className="w-2.5 h-2.5" />
      )}
      {isWinner ? "James Beard Winner" : "JB Finalist"}
    </span>
  );
}

// Restaurant logo badge (small watermark in bottom-right)
function RestaurantLogoBadge({ url, name }: { url: string; name: string }) {
  return (
    <div
      className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center"
      style={{
        backgroundColor: "var(--card)",
        border: "2px solid var(--card)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }}
    >
      <ImageWithFallback
        src={url}
        alt={`${name} logo`}
        className="w-5 h-5 rounded object-contain"
        width={20}
        height={20}
        loading="lazy"
      />
    </div>
  );
}

// Chef initials avatar
function ChefInitials({ name }: { name: string }) {
  const parts = name.replace("Chef ", "").split(" ");
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].substring(0, 2).toUpperCase();
  return (
    <div
      className="w-full h-full rounded-xl flex items-center justify-center"
      style={{
        backgroundColor: "rgba(201,169,110,0.1)",
        border: "2px solid rgba(201,169,110,0.15)",
      }}
    >
      <span className="text-[0.875rem] font-semibold" style={{ color: "#C9A96E", ...headingFont }}>
        {initials}
      </span>
    </div>
  );
}

// Hook to get chef data from Notion or fallback to hardcoded
function useChefData(): { data: Chef[]; isLive: boolean; isLoading: boolean; refresh: () => Promise<void>; items: any[] } {
  const { items, isLoading, refresh } = useNotionDatabase("roster");
  if (items.length > 0) {
    const transformed = items.map(transformChef);
    return { data: transformed as unknown as Chef[], isLive: true, isLoading, refresh, items };
  }
  return { data: chefs, isLive: false, isLoading, refresh, items: [] };
}

export function ChefRoster({ role, onNavigate, viewMode }: ChefRosterProps) {
  const isTeamView = viewMode === "team" || (role === "team" && viewMode !== "leadership" && viewMode !== "chef");

  if (isTeamView) {
    return <ChefRosterTeamView onNavigate={onNavigate} />;
  }

  return <ChefRosterFullView role={role} onNavigate={onNavigate} />;
}

/* ========== TEAM VIEW: Simplified Read-Only Roster ========== */
function ChefRosterTeamView({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { data: chefData, isLoading } = useChefData();
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending">("all");

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <ChefRosterSkeleton />;
  }

  const filtered = filter === "all"
    ? chefData
    : filter === "confirmed"
      ? chefData.filter((c) => c.travelStatus === "confirmed")
      : chefData.filter((c) => c.travelStatus !== "confirmed");

  const confirmedCount = chefData.filter((c) => c.travelStatus === "confirmed").length;
  const pendingCount = chefData.length - confirmedCount;

  return (
    <div className="space-y-6" role="region" aria-label="Chef Roster - Team View">
      {/* Page heading */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2.5 mb-2">
          <ChefHat className="w-6 h-6" style={{ color: "#C9A96E" }} aria-hidden="true" />
          <h1 className="text-foreground" style={{ ...headingFont, fontSize: "1.625rem" }}>
            Chef Roster
          </h1>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.8125rem] ml-2"
            style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", ...bodyFont }}
          >
            {chefData.length} Chefs
          </span>
        </div>
        <p className="text-muted-foreground text-[1rem] leading-relaxed" style={bodyFont}>
          A Filipino Chefs Collaboration — 7 chefs from across the US coming together in Las Vegas, May 22, 2026
        </p>
      </motion.div>

      {/* Quick filter toggles - large touch targets */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="flex gap-3"
        role="toolbar"
        aria-label="Filter chefs by confirmation status"
      >
        {([
          { id: "all" as const, label: "All", count: chefData.length, color: "#6B7F8E" },
          { id: "confirmed" as const, label: "Confirmed", count: confirmedCount, color: "#7E9E78" },
          { id: "pending" as const, label: "Pending", count: pendingCount, color: "#CDA88A" },
        ]).map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[0.9375rem] cursor-pointer min-h-[48px]"
              style={{
                backgroundColor: isActive ? `${f.color}18` : "rgba(107,127,142,0.04)",
                border: isActive ? `2px solid ${f.color}40` : "2px solid transparent",
                color: isActive ? f.color : "#6B7F8E",
                fontWeight: isActive ? 600 : 400,
                ...bodyFont,
              }}
              aria-pressed={isActive}
              aria-label={`${f.label}: ${f.count} chefs`}
            >
              {f.id === "confirmed" && <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
              {f.id === "pending" && <Clock className="w-4 h-4" aria-hidden="true" />}
              {f.label}
              <span
                className="text-[0.8125rem] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isActive ? `${f.color}12` : "rgba(107,127,142,0.08)",
                }}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Chef list/grid - clean read-only cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" role="list" aria-label="Chefs">
        {filtered.map((chef, idx) => {
          const statusCfg = travelStatusConfig[chef.travelStatus];
          const StatusIcon = statusCfg.icon;

          return (
            <motion.article
              key={chef.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + idx * 0.03 }}
              className="bg-card rounded-xl p-5 flex flex-col gap-4"
              style={{ border: "1px solid var(--border)" }}
              role="listitem"
              aria-label={`${chef.name}, Course ${chef.course}. ${statusCfg.label}`}
            >
              {/* Chef avatar + info */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0 w-14 h-14">
                  <ChefInitials name={chef.name} />
                  {chef.restaurantLogoUrl && (
                    <RestaurantLogoBadge url={chef.restaurantLogoUrl} name={chef.restaurant} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-foreground text-[1.0625rem]" style={headingFont}>
                      {chef.name}
                    </h3>
                    {chef.jamesBearStatus && <JamesBearBadge status={chef.jamesBearStatus} />}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground text-[0.8125rem] mt-0.5" style={bodyFont}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{chef.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.75rem] mt-0.5" style={{ color: "#C9A96E", ...bodyFont }}>
                    <UtensilsCrossed className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{chef.restaurant}</span>
                  </div>
                </div>
              </div>

              {/* Cuisine focus / specialties */}
              <div>
                <p className="text-muted-foreground text-[0.8125rem] mb-2" style={bodyFont}>
                  Cuisine Focus
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(chef.specialties || []).map((s) => (
                    <span
                      key={s}
                      className="text-[0.8125rem] px-2.5 py-1 rounded-lg"
                      style={{
                        backgroundColor: "rgba(201,169,110,0.08)",
                        color: "#C9A96E",
                        ...bodyFont,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Course assignment + status + links */}
              <div className="mt-auto pt-2 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[0.9375rem] font-medium"
                    style={{ color: "#C9A96E", ...headingFont }}
                  >
                    Course {chef.course}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[0.8125rem]"
                    style={{
                      backgroundColor: `${statusCfg.color}12`,
                      color: statusCfg.color,
                      ...bodyFont,
                    }}
                  >
                    <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    {statusCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {chef.restaurantUrl && (
                    <a
                      href={chef.restaurantUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[0.6875rem] px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                      style={{ backgroundColor: "rgba(201,169,110,0.06)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.12)", ...bodyFont }}
                    >
                      <Globe className="w-3 h-3" />
                      View Restaurant
                    </a>
                  )}
                  {chef.instagram && (
                    <a
                      href={`https://instagram.com/${chef.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[0.6875rem] px-2 py-1 rounded-lg transition-colors hover:opacity-80"
                      style={{ backgroundColor: "rgba(107,127,142,0.06)", color: "#6B7F8E", border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                    >
                      <Instagram className="w-3 h-3" />
                      {chef.instagram}
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Menu & Courses")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: "rgba(205,168,138,0.06)",
              border: "1px solid rgba(205,168,138,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Course Lineup"
          >
            <UtensilsCrossed className="w-4 h-4" style={{ color: "#CDA88A" }} />
            <span className="text-[0.875rem]" style={{ color: "#CDA88A" }}>View Course Lineup</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#CDA88A", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Community")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: "rgba(74,127,181,0.06)",
              border: "1px solid rgba(74,127,181,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Team Directory"
          >
            <Users className="w-4 h-4" style={{ color: "#4A7FB5" }} />
            <span className="text-[0.875rem]" style={{ color: "#4A7FB5" }}>Team Directory</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#4A7FB5", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ========== FULL VIEW (Leadership / Chef) ========== */
function ChefRosterFullView({ role, onNavigate }: { role: UserRole; onNavigate?: (page: string) => void }) {
  const { data: chefData, isLive, isLoading, refresh, items } = useChefData();
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const showDetails = role === "leadership" || role === "chef";

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <ChefRosterSkeleton />;
  }

  const confirmedCount = chefData.filter((c) => c.travelStatus === "confirmed").length;
  const pendingCount = chefData.filter((c) => c.travelStatus !== "confirmed").length;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStatusChange = async (chef: Chef, newStatus: "pending" | "confirmed" | "needs-booking") => {
    // Find the raw Notion item for this chef
    const rawItem = items.find((item) => {
      const name = item.Name || item.Chef || item["Chef Name"] || item.name || item.Title || "";
      return name.toLowerCase().includes(chef.name.toLowerCase().replace("chef ", ""));
    });

    if (!rawItem || !rawItem._notionId) {
      console.error("Could not find Notion page ID for chef:", chef.name);
      return;
    }

    // Map status to Notion format
    let notionStatus = "Pending";
    if (newStatus === "confirmed") notionStatus = "Confirmed";
    else if (newStatus === "needs-booking") notionStatus = "Needs Booking";

    const success = await writeToNotion({
      contentType: "roster",
      pageId: rawItem._notionId,
      properties: {
        "Travel Status": { type: "status", value: notionStatus },
      },
      successMessage: `${chef.name.split(" ").pop()}'s status updated`,
    });

    if (success) {
      // Refresh the data
      await refresh();
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAllCards = () => {
    if (allCollapsed) {
      const all: Record<string, boolean> = {};
      chefData.forEach((c) => { all[c.id] = true; });
      setExpandedCards(all);
      setAllCollapsed(false);
    } else {
      setExpandedCards({});
      setAllCollapsed(true);
    }
  };

  const anyExpanded = Object.values(expandedCards).some(Boolean);

  return (
    <div className="space-y-5">
      {/* Header with compact inline badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Chef Roster
            </h2>
            <NotionSyncBadge isLive={isLive} compact />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Now button */}
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-all hover:opacity-80 disabled:opacity-50"
              style={{
                backgroundColor: "rgba(78,130,130,0.08)",
                border: "1px solid rgba(78,130,130,0.15)",
                color: "#4E8282",
                ...bodyFont,
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem]"
              style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", ...bodyFont }}
            >
              <Users className="w-3 h-3" />
              {chefData.length} Chefs
            </span>
            {role === "leadership" && (
              <>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem]"
                  style={{ backgroundColor: "rgba(126,158,120,0.08)", color: "#7E9E78", ...bodyFont }}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {confirmedCount} Confirmed
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem]"
                  style={{ backgroundColor: "rgba(205,168,138,0.1)", color: "#CDA88A", ...bodyFont }}
                >
                  <Clock className="w-3 h-3" />
                  {pendingCount} Pending
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
            7 chefs from across the US — Las Vegas, May 22, 2026.
          </p>
          {showDetails && (
            <button
              onClick={toggleAllCards}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] text-muted-foreground/60 cursor-pointer"
              style={bodyFont}
              aria-label={anyExpanded ? "Collapse all chef details" : "Expand all chef details"}
            >
              <ChevronsUpDown className="w-3.5 h-3.5" />
              {anyExpanded ? "Collapse All" : "Expand All"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Progress summary */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.35 }}
        className="bg-card border border-border rounded-xl p-4"
      >
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#2D5F2D" }} />
            <span className="text-[0.8125rem]" style={{ ...bodyFont, color: "#3D524D" }}>
              <strong>{confirmedCount}</strong> of {chefData.length} chefs confirmed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C9A96E" }} />
            <span className="text-[0.8125rem]" style={{ ...bodyFont, color: "#3D524D" }}>
              <strong>{chefData.filter(c => c.signatureDish).length}</strong> menus submitted
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4A7FB5" }} />
            <span className="text-[0.8125rem]" style={{ ...bodyFont, color: "#3D524D" }}>
              <strong>{chefData.filter(c => c.travelStatus === "confirmed").length}</strong> travel booked
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(221,207,195,0.4)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round((confirmedCount / chefData.length) * 100)}%`,
              background: "linear-gradient(90deg, #2D5F2D, #5DA06B)",
            }}
          />
        </div>
      </motion.div>

      {/* Chef grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {chefData.map((chef, idx) => {
          const statusCfg = travelStatusConfig[chef.travelStatus];
          const StatusIcon = statusCfg.icon;
          const isExpanded = expandedCards[chef.id] || false;

          return (
            <motion.div
              key={chef.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                y: -4,
                boxShadow: "0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(205,168,138,0.15)",
                transition: { duration: 0.25 },
              }}
              className="bg-card border rounded-xl overflow-hidden"
              style={{
                borderColor: chef.jamesBearStatus === "winner" ? "rgba(212,175,55,0.35)" : "rgba(205,168,138,0.3)",
                boxShadow: chef.jamesBearStatus === "winner"
                  ? "0 0 0 1px rgba(212,175,55,0.12), 0 4px 12px rgba(212,175,55,0.08)"
                  : "0 0 0 1px rgba(205,168,138,0.08), 0 4px 12px rgba(205,168,138,0.06)",
              }}
            >
              {/* James Beard winner banner */}
              {chef.jamesBearStatus === "winner" && (
                <div
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[0.6875rem] uppercase tracking-wider"
                  style={{
                    background: "linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06))",
                    color: "#D4AF37",
                    borderBottom: "1px solid rgba(212,175,55,0.15)",
                    ...bodyFont,
                  }}
                >
                  <Star className="w-3 h-3" style={{ fill: "#D4AF37" }} />
                  James Beard Award Winner
                </div>
              )}

              {isExpanded && !chef.jamesBearStatus && (
                <div
                  className="flex items-center gap-1.5 px-4 py-1.5 text-[0.6875rem] uppercase tracking-wider"
                  style={{
                    background: "linear-gradient(90deg, rgba(205,168,138,0.08), rgba(201,169,110,0.06))",
                    color: "#CDA88A",
                    borderBottom: "1px solid rgba(205,168,138,0.1)",
                    ...bodyFont,
                  }}
                >
                  <ChefHat className="w-3 h-3" />
                  Your Course
                </div>
              )}

              <div
                className={`p-4 ${showDetails ? "cursor-pointer" : "cursor-default"}`}
                onClick={() => showDetails && setSelectedChef(chef)}
              >
                <div className="flex items-start gap-3 mb-2.5">
                  <div className="relative shrink-0 w-10 h-10">
                    <ChefInitials name={chef.name} />
                    {chef.restaurantLogoUrl && (
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded overflow-hidden flex items-center justify-center"
                        style={{
                          backgroundColor: "var(--card)",
                          border: "1.5px solid var(--card)",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                        }}
                      >
                        <ImageWithFallback
                          src={chef.restaurantLogoUrl}
                          alt=""
                          className="w-4 h-4 rounded-sm object-contain"
                          width={16}
                          height={16}
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <h3 className="text-foreground text-[0.9375rem] truncate" style={headingFont}>
                        {chef.name}
                      </h3>
                      {chef.jamesBearStatus && <JamesBearBadge status={chef.jamesBearStatus} />}
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-[0.75rem]" style={bodyFont}>
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{chef.city}</span>
                      <span className="text-muted-foreground/30 mx-0.5">&middot;</span>
                      <span className="text-gold text-[0.6875rem]">C{chef.course}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[0.6875rem] mt-0.5" style={{ color: "#C9A96E", ...bodyFont }}>
                      <UtensilsCrossed className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{chef.restaurant}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {role === "leadership" ? (
                    /* Status Dropdown for Leadership */
                    <div className="relative inline-block">
                      <select
                        value={chef.travelStatus}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(chef, e.target.value as any);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem] cursor-pointer appearance-none pr-6"
                        style={{
                          backgroundColor: `${statusCfg.color}15`,
                          color: statusCfg.color,
                          border: `1px solid ${statusCfg.color}30`,
                          ...bodyFont,
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="needs-booking">Needs Booking</option>
                      </select>
                      <ChevronDown
                        className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: statusCfg.color }}
                      />
                    </div>
                  ) : (
                    /* Read-only status badge for non-leadership */
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem]"
                      style={{
                        backgroundColor: `${statusCfg.color}15`,
                        color: statusCfg.color,
                        ...bodyFont,
                      }}
                    >
                      <StatusIcon className="w-2.5 h-2.5" />
                      {statusCfg.label}
                    </span>
                  )}
                  {chef.instagram && (
                    <a
                      href={`https://instagram.com/${chef.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem] hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(107,127,142,0.08)",
                        color: "#6B7F8E",
                        ...bodyFont,
                      }}
                    >
                      <Instagram className="w-2.5 h-2.5" />
                      {chef.instagram}
                    </a>
                  )}
                  {chef.restaurantUrl && (
                    <a
                      href={chef.restaurantUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.5625rem] hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(201,169,110,0.08)",
                        color: "#C9A96E",
                        ...bodyFont,
                      }}
                    >
                      <Globe className="w-2.5 h-2.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>

              {showDetails && (
                <>
                  <button
                    onClick={(e) => toggleExpand(chef.id, e)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-border/50 text-[0.6875rem] text-muted-foreground/60 cursor-pointer min-h-[44px]"
                    style={bodyFont}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? "Hide" : "Show"} details for ${chef.name}`}
                  >
                    {isExpanded ? "Hide details" : "Show details"}
                    <ChevronDown
                      className={`w-3 h-3 ${isExpanded ? "rotate-180" : ""}`}
                      style={{ transition: "transform 0.2s" }}
                    />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-2 space-y-3" style={{ backgroundColor: "rgba(221,207,195,0.12)" }}>
                          <p className="text-[0.75rem] text-muted-foreground leading-relaxed" style={bodyFont}>
                            {chef.bio}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[0.6875rem] px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(205,168,138,0.1)", color: "#CDA88A", ...bodyFont }}>
                              Course {chef.course}
                            </span>
                            <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                              {chef.courseLocation} &middot; Est. {chef.year}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(chef.specialties || []).map((s) => (
                              <span key={s} className="text-[0.625rem] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full" style={bodyFont}>
                                {s}
                              </span>
                            ))}
                          </div>
                          {/* Course assignment chips */}
                          <div>
                            <span className="text-[0.625rem] text-muted-foreground/60 uppercase tracking-wider block mb-1.5" style={bodyFont}>
                              Assigned Courses
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(chefCourseAssignments[chef.id] || []).length > 0 ? (
                                (chefCourseAssignments[chef.id] || []).map((course) => (
                                  <span
                                    key={course}
                                    className="text-[0.625rem] px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: "rgba(201,169,110,0.12)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont }}
                                  >
                                    {course}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[0.625rem] text-muted-foreground/40 italic" style={bodyFont}>
                                  No courses assigned yet
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[0.75rem]" style={bodyFont}>
                            <UtensilsCrossed className="w-3 h-3 text-gold shrink-0" />
                            <span className="text-muted-foreground">{chef.signatureDish}</span>
                          </div>
                          {(chef.accolades?.length ?? 0) > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[0.6875rem]" style={{ color: "#D4AF37", ...bodyFont }}>
                                <Award className="w-3 h-3 shrink-0" />
                                <span className="font-medium">Accolades</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {(chef.accolades || []).map((a, i) => (
                                  <span key={i} className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(212,175,55,0.06)", color: "rgba(212,175,55,0.8)", border: "1px solid rgba(212,175,55,0.12)", ...bodyFont }}>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* View restaurant link */}
                          {chef.restaurantUrl && (
                            <a
                              href={chef.restaurantUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[0.6875rem] hover:opacity-80 transition-opacity"
                              style={{ color: "#C9A96E", ...bodyFont }}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Visit {chef.restaurant}
                            </a>
                          )}
                          <p className="text-[0.6875rem] text-muted-foreground/70 italic leading-relaxed pl-0.5" style={headingFont}>
                            {chef.storySnippet}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Chef detail modal */}
      <AnimatePresence>
        {selectedChef && showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedChef(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedChef.name} details`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden"
              style={{ border: `1px solid ${selectedChef.jamesBearStatus === "winner" ? "rgba(212,175,55,0.2)" : "rgba(205,168,138,0.15)"}` }}
            >
              {/* James Beard winner banner in modal */}
              {selectedChef.jamesBearStatus === "winner" && (
                <div
                  className="flex items-center justify-center gap-2 py-2 text-[0.75rem] font-semibold"
                  style={{
                    background: "linear-gradient(90deg, rgba(212,175,55,0.12), rgba(212,175,55,0.06), rgba(212,175,55,0.12))",
                    color: "#D4AF37",
                    borderBottom: "1px solid rgba(212,175,55,0.15)",
                    ...bodyFont,
                  }}
                >
                  <Star className="w-3.5 h-3.5" style={{ fill: "#D4AF37" }} />
                  2024 James Beard Award — Best Chef California
                  <Star className="w-3.5 h-3.5" style={{ fill: "#D4AF37" }} />
                </div>
              )}
              {selectedChef.jamesBearStatus === "finalist" && (
                <div
                  className="flex items-center justify-center gap-2 py-2 text-[0.75rem] font-medium"
                  style={{
                    background: "linear-gradient(90deg, rgba(212,175,55,0.08), rgba(212,175,55,0.04), rgba(212,175,55,0.08))",
                    color: "#D4AF37",
                    borderBottom: "1px solid rgba(212,175,55,0.1)",
                    ...bodyFont,
                  }}
                >
                  <Award className="w-3.5 h-3.5" />
                  James Beard Award Finalist
                </div>
              )}

              <div className="relative p-6 pb-4 border-b border-border">
                <button
                  onClick={() => setSelectedChef(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground cursor-pointer min-h-[44px] min-w-[44px]"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0 w-14 h-14">
                    <ChefInitials name={selectedChef.name} />
                    {selectedChef.restaurantLogoUrl && (
                      <RestaurantLogoBadge url={selectedChef.restaurantLogoUrl} name={selectedChef.restaurant} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-foreground text-[1.25rem]" style={headingFont}>
                        {selectedChef.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                      <MapPin className="w-3 h-3" />
                      {selectedChef.city}
                      <span className="text-muted-foreground/30">&middot;</span>
                      <span className="text-gold">Course {selectedChef.course}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[0.75rem]" style={{ color: "#C9A96E", ...bodyFont }}>
                      <UtensilsCrossed className="w-3 h-3" />
                      {selectedChef.restaurant}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Bio */}
                <div>
                  <h4 className="text-foreground text-[0.875rem] mb-2" style={headingFont}>About</h4>
                  <p className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>
                    {selectedChef.bio}
                  </p>
                </div>

                {/* Accolades */}
                {(selectedChef.accolades?.length ?? 0) > 0 && (
                  <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(212,175,55,0.04)", border: "1px solid rgba(212,175,55,0.12)" }}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Award className="w-4 h-4" style={{ color: "#D4AF37" }} />
                      <span className="text-foreground text-[0.875rem] font-medium" style={headingFont}>Accolades & Recognition</span>
                    </div>
                    <div className="space-y-1.5">
                      {(selectedChef.accolades || []).map((a, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Star className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "#D4AF37", fill: selectedChef.jamesBearStatus === "winner" && i === 0 ? "#D4AF37" : "none" }} />
                          <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signature Dish */}
                <div className="p-4 rounded-xl bg-gold/5 border border-gold/15">
                  <div className="flex items-center gap-2 mb-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-gold" />
                    <span className="text-foreground text-[0.8125rem]" style={headingFont}>Signature Dish</span>
                  </div>
                  <p className="text-gold text-[0.9375rem]" style={headingFont}>
                    {selectedChef.signatureDish}
                  </p>
                </div>

                {/* Story */}
                <div className="p-4 rounded-xl border border-gold/15" style={{ background: "linear-gradient(to bottom, rgba(192,209,177,0.15), rgba(205,168,138,0.08))" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                    <span className="text-foreground text-[0.8125rem]" style={headingFont}>Their Story</span>
                  </div>
                  <p className="text-foreground text-[0.8125rem] leading-relaxed italic" style={headingFont}>
                    {selectedChef.storySnippet}
                  </p>
                </div>

                {/* Specialties */}
                <div>
                  <h4 className="text-foreground text-[0.875rem] mb-2" style={headingFont}>Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedChef.specialties || []).map((s) => (
                      <span key={s} className="text-[0.75rem] bg-gold/8 text-gold px-3 py-1 rounded-full" style={bodyFont}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links: Restaurant + Instagram */}
                <div className="flex flex-wrap gap-2">
                  {selectedChef.restaurantUrl && (
                    <a
                      href={selectedChef.restaurantUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(201,169,110,0.06)",
                        border: "1px solid rgba(201,169,110,0.15)",
                        ...bodyFont,
                      }}
                    >
                      <Globe className="w-4 h-4" style={{ color: "#C9A96E" }} />
                      <span className="text-[0.8125rem]" style={{ color: "#C9A96E" }}>
                        View Restaurant
                      </span>
                      <ExternalLink className="w-3 h-3" style={{ color: "#C9A96E", opacity: 0.5 }} />
                    </a>
                  )}
                  {selectedChef.instagram && (
                    <a
                      href={`https://instagram.com/${selectedChef.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors hover:opacity-80"
                      style={{
                        backgroundColor: "rgba(107,127,142,0.06)",
                        border: "1px solid rgba(107,127,142,0.12)",
                        ...bodyFont,
                      }}
                    >
                      <Instagram className="w-4 h-4" style={{ color: "#6B7F8E" }} />
                      <span className="text-[0.8125rem]" style={{ color: "#6B7F8E" }}>
                        {selectedChef.instagram}
                      </span>
                      <ExternalLink className="w-3 h-3" style={{ color: "#6B7F8E", opacity: 0.5 }} />
                    </a>
                  )}
                </div>

                {/* Travel & Course Info */}
                {role === "leadership" && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                    <Plane className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <span className="text-foreground text-[0.8125rem]" style={bodyFont}>Travel Status</span>
                      <span
                        className="ml-2 text-[0.75rem]"
                        style={{ color: travelStatusConfig[selectedChef.travelStatus].color, ...bodyFont }}
                      >
                        {travelStatusConfig[selectedChef.travelStatus].label}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <MapPin className="w-4 h-4 text-gold" />
                  <div style={bodyFont}>
                    <span className="text-foreground text-[0.8125rem]">
                      Course {selectedChef.course} &mdash; {selectedChef.courseLocation}
                    </span>
                    <span className="text-muted-foreground text-[0.75rem] ml-2">
                      Est. {selectedChef.year}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                {onNavigate && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedChef(null);
                        onNavigate("Menu & Courses");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer min-h-[44px]"
                      style={{
                        backgroundColor: "rgba(205,168,138,0.06)",
                        border: "1px solid rgba(205,168,138,0.12)",
                        ...bodyFont,
                      }}
                      aria-label={`View Course ${selectedChef.course}`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: "#CDA88A" }} />
                      <span className="text-[0.75rem]" style={{ color: "#CDA88A" }}>
                        View Course {selectedChef.course}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChef(null);
                        onNavigate("Comms");
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer min-h-[44px]"
                      style={{
                        backgroundColor: "rgba(26,92,56,0.06)",
                        border: "1px solid rgba(26,92,56,0.12)",
                        ...bodyFont,
                      }}
                      aria-label="Message this chef"
                    >
                      <MessageCircle className="w-3.5 h-3.5" style={{ color: "#1A5C38" }} />
                      <span className="text-[0.75rem]" style={{ color: "#1A5C38" }}>
                        Message
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
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
            onClick={() => onNavigate("Menu & Courses")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(205,168,138,0.06)",
              border: "1px solid rgba(205,168,138,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Course Lineup"
          >
            <UtensilsCrossed className="w-4 h-4" style={{ color: "#CDA88A" }} />
            <span className="text-[0.8125rem]" style={{ color: "#CDA88A" }}>
              View Course Lineup
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#CDA88A", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Comms")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80"
            style={{
              backgroundColor: "rgba(26,92,56,0.06)",
              border: "1px solid rgba(26,92,56,0.12)",
              ...bodyFont,
            }}
            aria-label="Navigate to Team Chat"
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#1A5C38" }} />
            <span className="text-[0.8125rem]" style={{ color: "#1A5C38" }}>
              Chat with the Team
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#1A5C38", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}