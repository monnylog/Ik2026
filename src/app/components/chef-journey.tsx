// Chef Journey — narrative storytelling view showing each chef's arc
// from invitation through event night
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  MapPin,
  Quote,
  ArrowRight,
  ArrowLeft,
  Star,
  Award,
  UtensilsCrossed,
  Plane,
  BookOpen,
  Heart,
  Globe,
  Instagram,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import type { ViewMode } from "./onboarding/use-auth";
import { bodyFont, headingFont } from "../lib/fonts";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useChefProfiles, useJourneyProgress } from "../lib/notion-domain-hooks";

// ── Chef data (same source as chef-roster) ──────────────────────

interface ChefStory {
  id: string;
  name: string;
  city: string;
  course: number;
  year: string;
  bio: string;
  specialties: string[];
  signatureDish: string;
  storySnippet: string;
  restaurant: string;
  restaurantUrl: string;
  restaurantLogoUrl: string;
  instagram: string;
  accolades: string[];
  jamesBearStatus: "winner" | "finalist" | null;
  journeyMilestones: JourneyMilestone[];
  dishInspo: string;
  colorAccent: string;
}

interface JourneyMilestone {
  label: string;
  status: "complete" | "active" | "upcoming";
  detail: string;
}

const chefStories: ChefStory[] = [
  {
    id: "patrice",
    name: "Chef Patrice Cleary",
    city: "Washington, D.C.",
    course: 1,
    year: "1903",
    bio: "Chef-owner of Purple Patch, one of DC's first Filipino restaurants. Former Marine, self-taught chef, and DC's pioneering Filipino-American culinary voice.",
    specialties: ["Filipino-American", "Modern Filipino", "Pastry"],
    signatureDish: "Bibingka Soufflé",
    storySnippet: "Filipino food doesn't need permission to sit at the table. It already belongs there.",
    restaurant: "Purple Patch",
    restaurantUrl: "https://purplepatchdc.com",
    restaurantLogoUrl: "https://logo.clearbit.com/purplepatchdc.com",
    instagram: "@cupcakecleary",
    accolades: ["Washington Post Dining Guide staple", "Tom Sietsema's Favorite Restaurant 2023"],
    jamesBearStatus: null,
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Confirmed Jan 2026" },
      { label: "Concept Submitted", status: "complete", detail: "Bibingka Soufflé — a Filipino dessert reimagined" },
      { label: "Research Paired", status: "active", detail: "Partnered with research team on DC Filipino history" },
      { label: "Menu Finalized", status: "upcoming", detail: "Final plating & ingredients" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026" },
    ],
    dishInspo: "A dessert that bridges generations — my lola's bibingka meets French soufflé technique, served tableside.",
    colorAccent: "#C08E7E",
  },
  {
    id: "justin",
    name: "Chef Justin Barnes",
    city: "Las Vegas / Hawaii",
    course: 2,
    year: "1906",
    bio: "Las Vegas-based chef collaborating with Istorya on Filipino-Spanish pop-up experiences. Heritage-driven cooking rooted in Filipino tradition.",
    specialties: ["Filipino-Spanish", "Heritage Cuisine", "Pop-Up"],
    signatureDish: "Lechon Belly with Pineapple Atchara",
    storySnippet: "In Hawaii, every potluck tells a migration story. I cook so that story doesn't get lost.",
    restaurant: "Galeón / Istorya",
    restaurantUrl: "https://istoryalv.com",
    restaurantLogoUrl: "https://logo.clearbit.com/istoryalv.com",
    instagram: "@justinbarnes_chef",
    accolades: [],
    jamesBearStatus: null,
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Founding team member" },
      { label: "Concept Submitted", status: "complete", detail: "Lechon Belly — a Hawaii-meets-Manila centerpiece" },
      { label: "Research Paired", status: "complete", detail: "Sakada labor history of 1906 Hawaii" },
      { label: "Menu Finalized", status: "active", detail: "Sourcing whole-hog locally" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026" },
    ],
    dishInspo: "The lechon is the gathering. In Hawaii, we say 'come eat' and that means 'you're family now.'",
    colorAccent: "#CBA47A",
  },
  {
    id: "aaron",
    name: "Chef Aaron Verzosa",
    city: "Seattle, Washington",
    course: 3,
    year: "1883",
    bio: "Chef-owner of Archipelago, an intimate 12-seat counter in Seattle's Hillman City. Pacific NW cuisine through progressive Filipino American flavors.",
    specialties: ["Progressive Filipino", "Tasting Menu", "PNW Ingredients"],
    signatureDish: "Pacific Northwest Tinola",
    storySnippet: "Every dish I make is a letter home to a place I've never been but always knew.",
    restaurant: "Archipelago",
    restaurantUrl: "https://archipelagoseattle.com",
    restaurantLogoUrl: "https://logo.clearbit.com/archipelagoseattle.com",
    instagram: "@archipelagoseattle",
    accolades: ["James Beard semifinalist", "Eater Seattle Chef of the Year"],
    jamesBearStatus: null,
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Confirmed Feb 2026" },
      { label: "Concept Submitted", status: "complete", detail: "PNW Tinola with foraged ingredients" },
      { label: "Research Paired", status: "active", detail: "1883 Alaskero and PNW Filipino migration" },
      { label: "Menu Finalized", status: "upcoming", detail: "Seasonal foraging dependent" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026" },
    ],
    dishInspo: "Tinola is comfort — but what if that comfort was shaped by the cedar and rain of the Pacific Northwest?",
    colorAccent: "#4E8282",
  },
  {
    id: "cristina",
    name: "Chef Cristina Quackenbush",
    city: "New Orleans, Louisiana",
    course: 4,
    year: "1763",
    bio: "Pioneer of Filipino cuisine in New Orleans. Opened Milkfish in 2013, now running Tatlo — a Filipino witch bar and immersive dining experience in the French Quarter.",
    specialties: ["Cajun-Filipino", "Immersive Dining", "Storytelling"],
    signatureDish: "Shrimp & Bagoong Étouffée",
    storySnippet: "The bayou remembers. Filipino fishermen were here before Louisiana was even a state.",
    restaurant: "Tatlo (formerly Milkfish)",
    restaurantUrl: "https://milkfish.co",
    restaurantLogoUrl: "https://logo.clearbit.com/milkfish.co",
    instagram: "@milkfishnola",
    accolades: ["Eater NOLA recognition", "Food & Wine feature"],
    jamesBearStatus: null,
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Confirmed Dec 2025" },
      { label: "Concept Submitted", status: "complete", detail: "Étouffée meets bagoong — NOLA × Manila" },
      { label: "Research Paired", status: "complete", detail: "1763 Manila Men of Saint Malo" },
      { label: "Menu Finalized", status: "active", detail: "Shrimp sourcing from Gulf" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026" },
    ],
    dishInspo: "What if the roux was fish sauce? What if the holy trinity included calamansi? That's what I'm exploring.",
    colorAccent: "#9FB0D4",
  },
  {
    id: "lord",
    name: "Chef Lord Maynard Llera",
    city: "Los Angeles, California",
    course: 5,
    year: "1587",
    bio: "Chef-owner of Kuya Lord, elevated fast-casual Filipino in LA's Melrose Hills. Born in Lucena City, CIA Hyde Park graduate. 2024 James Beard Award — Best Chef California.",
    specialties: ["Elevated Filipino", "Fast-Casual", "Open Fire"],
    signatureDish: "Galleon-Spiced Crispy Pata",
    storySnippet: "1587. That's when we arrived. Before Jamestown, before Plymouth Rock. California was already Filipino.",
    restaurant: "Kuya Lord",
    restaurantUrl: "https://kuyalord.com",
    restaurantLogoUrl: "https://logo.clearbit.com/kuyalord.com",
    instagram: "@kuyalordla",
    accolades: ["2024 James Beard Award — Best Chef California", "CIA Hyde Park graduate"],
    jamesBearStatus: "winner",
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Confirmed Jan 2026" },
      { label: "Concept Submitted", status: "complete", detail: "Crispy Pata — Manila Galleon trade route spices" },
      { label: "Research Paired", status: "complete", detail: "1587 Morro Bay — first Filipinos in America" },
      { label: "Menu Finalized", status: "complete", detail: "Whole pata with galleon-era spice blend" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026" },
    ],
    dishInspo: "The galleon carried spices, but it also carried people. This dish is about both.",
    colorAccent: "#CBA47A",
  },
  {
    id: "rachel",
    name: "Chef Rachel Barril",
    city: "Juneau, Alaska",
    course: 6,
    year: "1911",
    bio: "Chef de Cuisine at In Bocca al Lupo, a 2019 James Beard finalist. Third-generation Alaskero blending Filipino technique with Alaskan foraging.",
    specialties: ["Filipino-Alaskan", "Foraging", "Fermentation"],
    signatureDish: "Smoked Salmon Sinigang",
    storySnippet: "When you're this far north, you learn quickly that Filipino food and Alaskan food share the same soul — survival through flavor.",
    restaurant: "In Bocca al Lupo",
    restaurantUrl: "https://inboccaalupojuneau.com",
    restaurantLogoUrl: "https://logo.clearbit.com/inboccaalupojuneau.com",
    instagram: "@inboccaalupojuneau",
    accolades: ["In Bocca al Lupo — 2019 James Beard Award finalist"],
    jamesBearStatus: "finalist",
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Confirmed Mar 2026" },
      { label: "Concept Submitted", status: "complete", detail: "Sinigang with Alaskan salmon" },
      { label: "Research Paired", status: "active", detail: "Alaskero cannery workers of 1911" },
      { label: "Menu Finalized", status: "upcoming", detail: "Wild salmon sourcing TBD" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026" },
    ],
    dishInspo: "Sinigang is sour soup. Alaskan smoke adds depth. Together they tell the story of people who survived by adapting.",
    colorAccent: "#8AAD84",
  },
  {
    id: "dio",
    name: "Chef Dio Buan",
    city: "Las Vegas, Nevada",
    course: 7,
    year: "1911",
    bio: "Master Cook at Joël Robuchon Las Vegas. Born in Manila. Trained under Bobby Flay and Thomas Keller lineage. Founder of Isang Kusina.",
    specialties: ["Fine Dining", "French-Filipino", "Pop-Up"],
    signatureDish: "Kare-Kare with Smoked Oxtail Marrow",
    storySnippet: "My lola would say the kitchen is the loudest room in the house — but also the most honest.",
    restaurant: "Istorya / Joël Robuchon",
    restaurantUrl: "https://istoryalv.com",
    restaurantLogoUrl: "https://logo.clearbit.com/istoryalv.com",
    instagram: "@dangerously_delicious702",
    accolades: ["Joël Robuchon Las Vegas", "Trained under Thomas Keller lineage"],
    jamesBearStatus: null,
    journeyMilestones: [
      { label: "Invited", status: "complete", detail: "Founder — conceived IK26" },
      { label: "Concept Submitted", status: "complete", detail: "Kare-Kare — the soul of the event" },
      { label: "Research Paired", status: "complete", detail: "Full IK26 historical narrative lead" },
      { label: "Menu Finalized", status: "complete", detail: "Oxtail marrow with bagoong foam" },
      { label: "Event Night", status: "upcoming", detail: "May 22, 2026 — Grand Finale" },
    ],
    dishInspo: "Kare-Kare is the dish my lola made when she wanted everyone to stay a little longer. That's what this event is.",
    colorAccent: "#C08E7E",
  },
];

// ── Palette for journey timeline dots ────────────────────────────
const statusColors = {
  complete: "#4E8282",
  active: "#CBA47A",
  upcoming: "rgba(159,176,212,0.3)",
};

interface ChefJourneyProps {
  viewMode: ViewMode;
  onNavigate: (page: string) => void;
}

// ── Map Notion milestone status → UI status ──────────────────────
function notionMsToUI(s: string): JourneyMilestone["status"] {
  if (s === "Complete") return "complete";
  if (s === "In progress") return "active";
  return "upcoming";
}

// ── Hook: live Notion milestone data with hardcoded editorial fallback ──
function useChefJourneyData() {
  const { chefs: notionChefs, isLoading: chefsLoading, refresh: refreshChefs } = useChefProfiles();
  const { journey, isLoading: journeyLoading, refresh: refreshJourney } = useJourneyProgress();

  const refresh = useCallback(async () => {
    await Promise.all([refreshChefs(), refreshJourney()]);
  }, [refreshChefs, refreshJourney]);

  // Build journey progress lookup by chefId
  const journeyById = new Map(journey.map((j) => [j.chefId, j]));

  // Overlay Notion live data onto hardcoded editorial stories
  const mergedChefs = chefStories.map((story) => {
    const notionRec = notionChefs.find((c) => c.chefId === story.id);
    const journeyRec = journeyById.get(story.id);
    const merged = { ...story };

    if (notionRec) {
      if (notionRec.fullName) merged.name = notionRec.fullName.startsWith("Chef ") ? notionRec.fullName : `Chef ${notionRec.fullName}`;
      if (notionRec.city) merged.city = notionRec.city;
      if (notionRec.bio) merged.bio = notionRec.bio;
      if (notionRec.dishConcept) merged.signatureDish = notionRec.dishConcept;
      if (notionRec.restaurant) merged.restaurant = notionRec.restaurant;
      if (notionRec.instagram) merged.instagram = notionRec.instagram;
    }

    if (journeyRec) {
      merged.journeyMilestones = [
        { label: "Invited",          status: notionMsToUI(journeyRec.milestone1), detail: story.journeyMilestones[0]?.detail || "" },
        { label: "Concept Submitted",status: notionMsToUI(journeyRec.milestone2), detail: story.journeyMilestones[1]?.detail || "" },
        { label: "Research Paired",  status: notionMsToUI(journeyRec.milestone3), detail: story.journeyMilestones[2]?.detail || "" },
        { label: "Menu Finalized",   status: notionMsToUI(journeyRec.milestone4), detail: story.journeyMilestones[3]?.detail || "" },
        { label: "Event Night",      status: "upcoming" as const,                 detail: "May 22, 2026" },
      ];
    }

    return merged;
  });

  const isLive = notionChefs.length > 0;
  const isLoading = chefsLoading || journeyLoading;
  return { chefs: mergedChefs, isLive, isLoading, refresh };
}

export function ChefJourney({ viewMode, onNavigate }: ChefJourneyProps) {
  const { chefs, isLive, isLoading, refresh } = useChefJourneyData();
  const [selectedChefIdx, setSelectedChefIdx] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await refresh();
    } finally {
      setIsSyncing(false);
    }
  };

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(46,79,82,0.1)", minHeight: 200 }}>
          <div className="p-6 sm:p-8 animate-pulse">
            <div className="h-3 w-48 bg-white/10 rounded mb-3" />
            <div className="h-8 w-2/3 bg-white/20 rounded mb-2" />
            <div className="h-4 w-3/4 bg-white/10 rounded" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-10 w-32 bg-muted/30 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="rounded-2xl p-6 bg-muted/20 animate-pulse" style={{ minHeight: 400 }} />
      </div>
    );
  }

  const chef = chefs[selectedChefIdx] || chefStories[0];

  const completedMilestones = chef.journeyMilestones.filter(
    (m) => m.status === "complete"
  ).length;
  const totalMilestones = chef.journeyMilestones.length;
  const progressPct = Math.round((completedMilestones / totalMilestones) * 100);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(46,79,82,0.95) 0%, rgba(46,79,82,0.85) 100%)`,
          minHeight: 200,
        }}
      >
        {/* Ambient gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 80% 20%, ${chef.colorAccent}15 0%, transparent 60%)`,
          }}
        />
        <div className="relative p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-white/50" />
            <span className="text-[0.6875rem] text-white/50 uppercase tracking-widest" style={bodyFont}>
              Chef Journey — Isang Kusina 2026
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl text-white mb-2" style={headingFont}>
            Seven Chefs. Seven Histories. One Table.
          </h1>
          <p className="text-white/60 text-sm max-w-xl leading-relaxed" style={bodyFont}>
            Follow each chef's journey from invitation to event night — their dish, their history,
            and the story they're bringing to Las Vegas on May 22, 2026.
          </p>
          {/* Data source indicator + Sync button */}
          <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              {isLoading ? (
                <Loader2 className="w-3 h-3 text-white/30 animate-spin" />
              ) : isLive ? (
                <Wifi className="w-3 h-3 text-white/40" />
              ) : (
                <WifiOff className="w-3 h-3 text-white/25" />
              )}
              <span className="text-[0.5625rem] text-white/30" style={bodyFont}>
                {isLoading ? "Syncing live data..." : isLive ? "Synced with Notion & KV" : "Using local data"}
              </span>
            </div>
            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                ...bodyFont,
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Chef selector pills */}
      <div className="flex flex-wrap gap-2">
        {chefStories.map((c, idx) => {
          const isActive = idx === selectedChefIdx;
          return (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedChefIdx(idx)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${c.colorAccent}18, ${c.colorAccent}08)`
                  : "rgba(46,79,82,0.03)",
                border: `1px solid ${isActive ? c.colorAccent + "30" : "rgba(46,79,82,0.08)"}`,
                color: isActive ? c.colorAccent : undefined,
                ...bodyFont,
              }}
            >
              <span className="font-medium text-[0.75rem]">
                Course {c.course}
              </span>
              <span className="text-muted-foreground text-[0.6875rem]">
                {c.name.replace("Chef ", "")}
              </span>
              {c.jamesBearStatus === "winner" && (
                <Award className="w-3 h-3" style={{ color: "#CBA47A" }} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Main narrative card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={chef.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="ik26-card-elevated rounded-2xl overflow-hidden"
        >
          {/* Chef header with accent */}
          <div
            className="relative px-6 pt-6 pb-5"
            style={{
              background: `linear-gradient(135deg, ${chef.colorAccent}08, transparent)`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[3px]"
              style={{
                background: `linear-gradient(90deg, ${chef.colorAccent}60, ${chef.colorAccent}20, transparent)`,
              }}
            />
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Restaurant logo */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                style={{
                  background: "white",
                  border: `1px solid ${chef.colorAccent}15`,
                  boxShadow: `0 4px 16px ${chef.colorAccent}10`,
                }}
              >
                <ImageWithFallback
                  src={chef.restaurantLogoUrl}
                  alt={chef.restaurant}
                  className="w-12 h-12 object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl text-foreground" style={headingFont}>
                    {chef.name}
                  </h2>
                  {chef.jamesBearStatus === "winner" && (
                    <span
                      className="flex items-center gap-1 text-[0.6rem] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(203,164,122,0.12)",
                        color: "#CBA47A",
                        border: "1px solid rgba(203,164,122,0.2)",
                        ...bodyFont,
                      }}
                    >
                      <Award className="w-3 h-3" /> James Beard Winner
                    </span>
                  )}
                  {chef.jamesBearStatus === "finalist" && (
                    <span
                      className="flex items-center gap-1 text-[0.6rem] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "rgba(159,176,212,0.12)",
                        color: "#9FB0D4",
                        border: "1px solid rgba(159,176,212,0.2)",
                        ...bodyFont,
                      }}
                    >
                      <Star className="w-3 h-3" /> JB Finalist
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground text-[0.75rem]" style={bodyFont}>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {chef.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <UtensilsCrossed className="w-3 h-3" />
                    {chef.restaurant}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Course {chef.course}
                  </span>
                </div>
                <p className="text-muted-foreground text-[0.75rem] mt-2 leading-relaxed" style={bodyFont}>
                  {chef.bio}
                </p>
              </div>
            </div>
          </div>

          {/* Quote block */}
          <div
            className="mx-6 px-5 py-4 rounded-xl relative"
            style={{
              background: `linear-gradient(135deg, ${chef.colorAccent}06, rgba(46,79,82,0.03))`,
              border: `1px solid ${chef.colorAccent}10`,
            }}
          >
            <Quote
              className="absolute top-3 left-3 w-5 h-5 opacity-20"
              style={{ color: chef.colorAccent }}
            />
            <p
              className="text-foreground/80 text-[0.8125rem] italic pl-6 leading-relaxed"
              style={headingFont}
            >
              "{chef.storySnippet}"
            </p>
          </div>

          {/* Two-column: Dish & Journey */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-6">
            {/* The Dish */}
            <div>
              <h3
                className="text-[0.8125rem] text-foreground mb-3 flex items-center gap-2"
                style={headingFont}
              >
                <UtensilsCrossed className="w-4 h-4" style={{ color: chef.colorAccent }} />
                The Dish
              </h3>
              <div
                className="rounded-xl p-4"
                style={{
                  background: `${chef.colorAccent}06`,
                  border: `1px solid ${chef.colorAccent}10`,
                }}
              >
                <p className="text-foreground font-medium text-[0.875rem] mb-1" style={headingFont}>
                  {chef.signatureDish}
                </p>
                <p className="text-muted-foreground text-[0.75rem] mb-3" style={bodyFont}>
                  Historical anchor: <strong>{chef.year}</strong>
                </p>
                <p className="text-muted-foreground text-[0.6875rem] italic leading-relaxed" style={bodyFont}>
                  "{chef.dishInspo}"
                </p>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {chef.specialties.map((s) => (
                    <span
                      key={s}
                      className="text-[0.6rem] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${chef.colorAccent}0A`,
                        color: chef.colorAccent,
                        border: `1px solid ${chef.colorAccent}15`,
                        ...bodyFont,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex items-center gap-3 mt-3">
                {chef.restaurantUrl && (
                  <a
                    href={chef.restaurantUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground hover:text-foreground transition-colors"
                    style={bodyFont}
                  >
                    <Globe className="w-3 h-3" /> Website
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
                {chef.instagram && (
                  <span
                    className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground"
                    style={bodyFont}
                  >
                    <Instagram className="w-3 h-3" /> {chef.instagram}
                  </span>
                )}
              </div>
            </div>

            {/* Journey Timeline */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-[0.8125rem] text-foreground flex items-center gap-2"
                  style={headingFont}
                >
                  <Sparkles className="w-4 h-4" style={{ color: chef.colorAccent }} />
                  Journey Progress
                </h3>
                <span
                  className="text-[0.625rem] font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${chef.colorAccent}12`,
                    color: chef.colorAccent,
                    ...bodyFont,
                  }}
                >
                  {progressPct}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full mb-4" style={{ backgroundColor: "rgba(46,79,82,0.06)" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${chef.colorAccent}, ${chef.colorAccent}80)`,
                  }}
                />
              </div>

              {/* Timeline items */}
              <div className="space-y-0">
                {chef.journeyMilestones.map((m, idx) => (
                  <div key={m.label} className="flex items-start gap-3">
                    {/* Vertical line + dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className="w-3 h-3 rounded-full border-2 shrink-0"
                        style={{
                          borderColor: statusColors[m.status],
                          backgroundColor:
                            m.status === "complete"
                              ? statusColors.complete
                              : m.status === "active"
                                ? "white"
                                : "transparent",
                          boxShadow: m.status === "active" ? `0 0 8px ${chef.colorAccent}40` : undefined,
                        }}
                      />
                      {idx < chef.journeyMilestones.length - 1 && (
                        <div
                          className="w-[1.5px] h-8"
                          style={{
                            backgroundColor:
                              m.status === "complete"
                                ? statusColors.complete + "40"
                                : "rgba(46,79,82,0.08)",
                          }}
                        />
                      )}
                    </div>
                    <div className="pb-4">
                      <p
                        className="text-[0.75rem] font-medium"
                        style={{
                          color: m.status === "upcoming" ? "var(--muted-foreground)" : "var(--foreground)",
                          opacity: m.status === "upcoming" ? 0.6 : 1,
                          ...bodyFont,
                        }}
                      >
                        {m.label}
                        {m.status === "complete" && (
                          <CheckCircle2
                            className="w-3 h-3 inline ml-1"
                            style={{ color: statusColors.complete }}
                          />
                        )}
                      </p>
                      <p
                        className="text-[0.6875rem] text-muted-foreground mt-0.5"
                        style={{
                          opacity: m.status === "upcoming" ? 0.5 : 0.8,
                          ...bodyFont,
                        }}
                      >
                        {m.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Accolades footer */}
          {chef.accolades.length > 0 && (
            <div
              className="px-6 py-3 border-t flex flex-wrap items-center gap-2"
              style={{ borderColor: "rgba(46,79,82,0.06)" }}
            >
              <Award className="w-3.5 h-3.5 text-muted-foreground/40" />
              {chef.accolades.map((a) => (
                <span
                  key={a}
                  className="text-[0.625rem] text-muted-foreground/60"
                  style={bodyFont}
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedChefIdx((prev) => (prev - 1 + chefStories.length) % chefStories.length)}
          className="flex items-center gap-2 text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={bodyFont}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous Chef
        </button>
        <button
          onClick={() => onNavigate("Chef Roster")}
          className="text-[0.6875rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1"
          style={bodyFont}
        >
          View Full Roster <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={() => setSelectedChefIdx((prev) => (prev + 1) % chefStories.length)}
          className="flex items-center gap-2 text-[0.75rem] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={bodyFont}
        >
          Next Chef
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}