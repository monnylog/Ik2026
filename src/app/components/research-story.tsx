import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  MapPin,
  Clock,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Quote,
  List,
  Columns,
  CheckCircle2,
  ArrowRight,
  UtensilsCrossed,
  Mic,
  Map,
  CalendarPlus,
  Download,
  ChefHat,
  Search,
  Filter,
} from "lucide-react";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ResearchTopic {
  id: string;
  region: string;
  year: string;
  title: string;
  summary: string;
  keyFacts: string[];
  sources: { title: string; type: string }[];
  assignedTo: string;
  status: "complete" | "in-progress" | "not-started";
  pullQuote?: string;
  chef?: string;
  researcher?: string;
  courseNumber?: number;
}

const topics: ResearchTopic[] = [
  {
    id: "california",
    region: "California",
    year: "1587",
    title: "Manila Galleons & First Contact",
    summary: "On October 18, 1587, Filipino crew members aboard the Manila galleon Nuestra Señora de Esperanza stepped ashore at Morro Bay, California — the first documented Asian landing in the continental United States.",
    keyFacts: [
      "Filipino sailors (Luzonians) were essential crew on Manila galleons",
      "The landing predates Jamestown (1607) by 20 years",
      "The Manila-Acapulco galleon trade lasted from 1565 to 1815",
      "California's Filipino history spans over 400 years",
    ],
    sources: [
      { title: "The Manila Galleon Trade", type: "Book" },
      { title: "Morro Bay Historical Society", type: "Archive" },
    ],
    assignedTo: "Flerine Cruz Atienza · Chef Lord",
    chef: "Chef Lord",
    researcher: "Flerine Cruz Atienza",
    courseNumber: 7,
    status: "complete",
    pullQuote: "1587. Before Plymouth Rock. Before Jamestown. Filipinos were already here.",
  },
  {
    id: "nola",
    region: "New Orleans, LA",
    year: "1763",
    title: "Manila Village & the Bayou Filipinos",
    summary: "The oldest Filipino settlement in the Americas — Manila Village in St. Malo, Louisiana — was founded by Filipino sailors who jumped ship from Spanish galleons in the 1760s.",
    keyFacts: [
      "Manila Village existed from approximately 1763 to the 1960s",
      "Residents pioneered the shrimp-drying industry in Louisiana",
      "The community was destroyed by Hurricane Betsy in 1965",
      "Lafcadio Hearn documented the village in 1883, calling it 'a strange settlement'",
    ],
    sources: [
      { title: "Filipino Settlements in Louisiana", type: "Book" },
      { title: "Lafcadio Hearn's Gulf Coast Writings", type: "Primary Source" },
    ],
    assignedTo: "Flerine Cruz Atienza · Chef Christina",
    chef: "Chef Christina",
    researcher: "Flerine Cruz Atienza",
    courseNumber: 6,
    status: "in-progress",
    pullQuote: "Before America was America, Filipinos were already here — drying shrimp in the bayou.",
  },
  {
    id: "seattle",
    region: "Seattle, WA",
    year: "1883",
    title: "Labor, Unions & the International District",
    summary: "Seattle's Filipino community has roots stretching back to the 1880s. The city became a center for cannery union organizing, civil rights, and the creation of one of America's most vibrant Filipino-American neighborhoods.",
    keyFacts: [
      "Filipino workers organized the Cannery Workers' and Farm Laborers' Union in the 1930s",
      "The International District became a cultural hub for Filipino, Chinese, and Japanese communities",
      "Filipino labor leaders like Philip Vera Cruz fought alongside César Chávez",
    ],
    sources: [
      { title: "Seattle Civil Rights & Labor History Project", type: "Archive" },
      { title: "Wing Luke Museum Collections", type: "Museum" },
    ],
    assignedTo: "Ava Carino · Chef Aaron",
    chef: "Chef Aaron",
    researcher: "Ava Carino",
    courseNumber: 5,
    status: "not-started",
  },
  {
    id: "dc",
    region: "Washington D.C.",
    year: "1903",
    title: "Pensionados & the Scholar Generation",
    summary: "The Pensionado Act of 1903 sent Filipino students to American universities on government scholarships. Many settled in D.C., forming the earliest Filipino professional class in America.",
    keyFacts: [
      "Over 200 pensionados studied in the U.S. between 1903–1910",
      "Many became teachers, lawyers, and diplomats upon return to the Philippines",
      "D.C.'s Filipino community established the first Filipino social clubs in America",
    ],
    sources: [
      { title: "The Pensionado Act and Filipino Education", type: "Academic Paper" },
      { title: "Smithsonian Asian Pacific American Center", type: "Archive" },
    ],
    assignedTo: "Ava Carino · Chef Patrice",
    chef: "Chef Patrice",
    researcher: "Ava Carino",
    courseNumber: 4,
    status: "in-progress",
    pullQuote: "They sent us to learn. We came back to lead.",
  },
  {
    id: "hawaii",
    region: "Hawaii",
    year: "1906",
    title: "Sakadas & the Sugar Plantation Era",
    summary: "The sakada generation — contract laborers recruited from the Philippines to work Hawaii's sugar and pineapple plantations — fundamentally shaped Hawaiian culture, cuisine, and identity.",
    keyFacts: [
      "First wave of 15 sakadas arrived in 1906 aboard the SS Doric",
      "By 1946, Filipinos were 60% of Hawaii's plantation labor force",
      "Filipino food traditions — adobo, pancit, lechon — became staples of Hawaiian plate lunch",
    ],
    sources: [
      { title: "Sakada: Filipino Adaptation in Hawaii", type: "Book" },
      { title: "Filipino Community Center Hawaii Archives", type: "Archive" },
    ],
    assignedTo: "Armida · Chef Justin",
    chef: "Chef Justin",
    researcher: "Armida",
    courseNumber: 3,
    status: "complete",
  },
  {
    id: "alaska",
    region: "Alaska",
    year: "1911",
    title: "Cannery Workers & the Alaskero Generation",
    summary: "Filipino men — known as Alaskeros — were among the first to work the salmon canneries of Alaska. They endured brutal conditions, racial segregation, and isolation, yet built a tight-knit community that influenced labor rights across the Pacific Northwest.",
    keyFacts: [
      "By 1930, Filipinos were the largest non-white workforce in Alaska canneries",
      "The Alaska Cannery Workers Union was founded in 1933",
      "Alaskeros sent remittances home that built schools and churches in the Philippines",
    ],
    sources: [
      { title: "Alaskeros: A Documentary History", type: "Film" },
      { title: "University of Washington Filipino Archives", type: "Archive" },
    ],
    assignedTo: "Armida · Chef Rachel",
    chef: "Chef Rachel",
    researcher: "Armida",
    courseNumber: 2,
    status: "complete",
    pullQuote: "They called us seasonal workers. But we were year-round survivors.",
  },
  {
    id: "las-vegas",
    region: "Las Vegas, NV",
    year: "1911",
    title: "Filipino Workers in the Desert Economy",
    summary: "Las Vegas grew as a crossroads city — built by outsiders, sustained by service. Filipino immigrants arrived as part of the broader labor migration, finding work in hospitality, construction, and the military bases that dotted the Nevada desert.",
    keyFacts: [
      "Nellis AFB became a major draw for Filipino military families post-1965",
      "Las Vegas Filipino community grew 300% between 1990–2020",
      "Filipino nurses comprise one of the largest healthcare demographics in Clark County",
    ],
    sources: [
      { title: "Filipino Americans in Nevada: A History", type: "Book" },
      { title: "UNLV Oral History Project", type: "Archive" },
    ],
    assignedTo: "Dio Buan (local) · Andrew (lead)",
    chef: "Chef Dio",
    researcher: "Andrew",
    courseNumber: 1,
    status: "in-progress",
    pullQuote: "We built this city too. Not the casinos — the community behind them.",
  },
];

type ViewMode = "list" | "kanban" | "timeline";

// Status badge styling
function StatusBadge({ status }: { status: ResearchTopic["status"] }) {
  if (status === "complete") {
    return (
      <span
        className="flex items-center gap-1 text-[0.6875rem] px-2.5 py-0.5 rounded-full shrink-0"
        style={{ backgroundColor: "rgba(126,158,120,0.1)", color: "#7E9E78", ...bodyFont }}
      >
        <CheckCircle2 className="w-3 h-3" />
        Complete
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span
        className="flex items-center gap-1 text-[0.6875rem] px-2.5 py-0.5 rounded-full shrink-0"
        style={{ backgroundColor: "rgba(205,168,138,0.1)", color: "#CDA88A", ...bodyFont }}
      >
        <Clock className="w-3 h-3" />
        In Progress
      </span>
    );
  }
  return (
    <span
      className="flex items-center gap-1 text-[0.6875rem] px-2.5 py-0.5 rounded-full shrink-0"
      style={{
        backgroundColor: "transparent",
        color: "#6B7F8E",
        border: "1.5px dashed rgba(107,127,142,0.4)",
        ...bodyFont,
      }}
    >
      Not Started
    </span>
  );
}

// CSV export
function exportResearchCSV(data: ResearchTopic[]) {
  const headers = ["Region", "Year", "Title", "Status", "Chef", "Researcher", "Course #", "Summary"];
  const rows = data.map((t) => [
    `"${t.region}"`,
    t.year,
    `"${t.title}"`,
    t.status,
    `"${t.chef || ""}"`,
    `"${t.researcher || ""}"`,
    t.courseNumber || "",
    `"${(t.summary || "").replace(/"/g, '""')}"`,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `research-story-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Visual Story Map Timeline ──────────────────────────────────────────
function StoryTimeline({ topics: items, onSelectTopic }: { topics: ResearchTopic[]; onSelectTopic: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(
    () => [...items].sort((a, b) => parseInt(a.year) - parseInt(b.year)),
    [items]
  );

  const statusColor = (s: ResearchTopic["status"]) =>
    s === "complete" ? "#7E9E78" : s === "in-progress" ? "#CDA88A" : "#6B7F8E";

  const minYear = parseInt(sorted[0]?.year || "1587");
  const maxYear = 2026;
  const range = maxYear - minYear;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Narrative arc header */}
      <div className="px-5 pt-5 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2 mb-1">
          <Map className="w-4 h-4 text-gold" />
          <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
            Visual Story Map
          </h3>
        </div>
        <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
          Trace the Filipino-American story from 1587 to today — each dot is a course, a city, a chapter.
        </p>
      </div>

      {/* Scrollable timeline */}
      <div ref={scrollRef} className="overflow-x-auto px-5 py-6">
        <div className="relative" style={{ minWidth: `${sorted.length * 160}px`, height: "220px" }}>
          {/* Main timeline line */}
          <div
            className="absolute top-[100px] left-0 right-0 h-[2px]"
            style={{ background: "linear-gradient(90deg, rgba(201,169,110,0.3), rgba(126,158,120,0.3))" }}
          />

          {/* Era markers */}
          {[
            { year: 1587, label: "Colonial Era" },
            { year: 1763, label: "Settlement" },
            { year: 1900, label: "Migration Wave" },
            { year: 2000, label: "Modern Era" },
          ].map((era) => {
            const leftPct = ((era.year - minYear) / range) * 100;
            return (
              <div
                key={era.year}
                className="absolute top-[108px] text-[0.5rem] text-muted-foreground/30 uppercase tracking-wider"
                style={{ left: `${Math.min(leftPct, 95)}%`, ...bodyFont }}
              >
                {era.label}
              </div>
            );
          })}

          {/* Topic nodes */}
          {sorted.map((topic, idx) => {
            const leftPct = ((parseInt(topic.year) - minYear) / range) * 100;
            // Alternate above/below
            const isAbove = idx % 2 === 0;
            const sc = statusColor(topic.status);

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + idx * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
                style={{
                  left: `${Math.min(Math.max(leftPct, 2), 95)}%`,
                  top: isAbove ? "12px" : "120px",
                }}
              >
                {/* Connector line */}
                <div
                  className="absolute w-[1px]"
                  style={{
                    backgroundColor: `${sc}40`,
                    left: "50%",
                    transform: "translateX(-50%)",
                    top: isAbove ? "80px" : "-18px",
                    height: isAbove ? "22px" : "18px",
                  }}
                />

                {/* Dot on the timeline */}
                <motion.div
                  className="absolute w-3 h-3 rounded-full border-2 cursor-pointer"
                  style={{
                    backgroundColor: sc,
                    borderColor: "var(--card)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    top: isAbove ? "88px" : "-6px",
                    boxShadow: `0 0 0 3px ${sc}20`,
                  }}
                  whileHover={{ scale: 1.5 }}
                  onClick={() => onSelectTopic(topic.id)}
                />

                {/* Card */}
                <motion.button
                  onClick={() => onSelectTopic(topic.id)}
                  whileHover={{ scale: 1.04, y: isAbove ? -2 : 2 }}
                  className="w-[140px] p-2.5 rounded-xl text-left cursor-pointer transition-shadow hover:shadow-md"
                  style={{
                    backgroundColor: `${sc}08`,
                    border: `1px solid ${sc}20`,
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {topic.courseNumber && (
                      <span
                        className="text-[0.5rem] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ backgroundColor: `${sc}15`, color: sc, ...bodyFont }}
                      >
                        C{topic.courseNumber}
                      </span>
                    )}
                    <span className="text-[0.5625rem] font-mono text-muted-foreground" style={bodyFont}>
                      {topic.year}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-foreground font-medium leading-tight truncate" style={bodyFont}>
                    {topic.region}
                  </p>
                  <p className="text-[0.5625rem] text-muted-foreground truncate mt-0.5" style={bodyFont}>
                    {topic.title}
                  </p>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-5 pb-4 flex items-center gap-4 text-[0.6875rem]" style={bodyFont}>
        <span className="text-muted-foreground/50">Status:</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7E9E78" }} /> Complete</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#CDA88A" }} /> In Progress</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#6B7F8E]/40" /> Not Started</span>
      </div>
    </motion.div>
  );
}

// ─── Chef-Researcher Pairing Cards ──────────────────────────────────────
function PairingCards({ topics: items }: { topics: ResearchTopic[] }) {
  const pairings = useMemo(
    () => items.filter((t) => t.chef && t.researcher).sort((a, b) => (a.courseNumber || 99) - (b.courseNumber || 99)),
    [items]
  );
  if (pairings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.4 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-gold" />
        <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Chef ↔ Researcher Pairings</h3>
        <span className="text-muted-foreground text-[0.6875rem] ml-auto" style={bodyFont}>
          {pairings.length} pairs assigned
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pairings.map((t, idx) => {
          const sc = t.status === "complete" ? "#7E9E78" : t.status === "in-progress" ? "#CDA88A" : "#6B7F8E";
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05, duration: 0.3 }}
              className="p-3.5 rounded-xl relative overflow-hidden"
              style={{
                backgroundColor: `${sc}06`,
                border: `1px solid ${sc}18`,
              }}
            >
              {/* Course number badge */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${sc}15`, color: sc, ...bodyFont }}>
                    Course {t.courseNumber}
                  </span>
                  <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>{t.region}</span>
                </div>
                <StatusBadge status={t.status} />
              </div>

              {/* Pairing */}
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: `${sc}08` }}>
                  <ChefHat className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: sc }} />
                  <p className="text-[0.6875rem] text-foreground font-medium truncate" style={bodyFont}>{t.chef}</p>
                  <p className="text-[0.5rem] text-muted-foreground uppercase tracking-wider" style={bodyFont}>Chef</p>
                </div>
                <ArrowRight className="w-3 h-3 text-muted-foreground/30 shrink-0" />
                <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: `${sc}08` }}>
                  <BookOpen className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: sc }} />
                  <p className="text-[0.6875rem] text-foreground font-medium truncate" style={bodyFont}>{t.researcher}</p>
                  <p className="text-[0.5rem] text-muted-foreground uppercase tracking-wider" style={bodyFont}>Researcher</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ResearchStory({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "complete" | "in-progress" | "not-started">("all");

  // Notion integration
  const { items: notionItems, isLoading: notionLoading } = useNotionDatabase("courses");

  const notionTopics: ResearchTopic[] = notionItems.length > 0
    ? notionItems
        .filter((item: any) => item.Name || item.Title || item.Region)
        .map((item: any, idx: number) => ({
          id: item._notionId || `notion-${idx}`,
          region: item.Region || item.region || item.City || "Unknown",
          year: item.Year || item.year || "",
          title: item.Name || item.Title || item.title || "Untitled Research",
          summary: item.Summary || item.Description || item.summary || "",
          keyFacts: item["Key Facts"] ? (Array.isArray(item["Key Facts"]) ? item["Key Facts"] : [item["Key Facts"]]) : [],
          sources: [],
          assignedTo: item["Assigned To"] || item.Researcher || item.assignedTo || "",
          status: (item.Status || "").toLowerCase().includes("complete") ? "complete" as const
            : (item.Status || "").toLowerCase().includes("progress") ? "in-progress" as const
            : "not-started" as const,
          pullQuote: item["Pull Quote"] || item.pullQuote || undefined,
          chef: item.Chef || item.chef || undefined,
          researcher: item.Researcher || item.researcher || undefined,
          courseNumber: parseInt(item["Course Number"] || item.courseNumber || "0") || undefined,
        }))
    : [];

  const activeTopics = notionTopics.length > 0 ? notionTopics : topics;
  const isFromNotion = notionTopics.length > 0;

  // Filter and search
  const filteredTopics = useMemo(() => {
    let result = activeTopics;
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.region.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          (t.chef || "").toLowerCase().includes(q) ||
          (t.researcher || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeTopics, statusFilter, searchQuery]);

  const doneCount = activeTopics.filter((t) => t.status === "complete").length;
  const inProgressCount = activeTopics.filter((t) => t.status === "in-progress").length;
  const notStartedCount = activeTopics.filter((t) => t.status === "not-started").length;
  const progressPct = activeTopics.length > 0 ? (doneCount / activeTopics.length) * 100 : 0;

  const handleSelectFromTimeline = (id: string) => {
    setViewMode("list");
    setExpanded(id);
    // Scroll to the element after a brief delay
    setTimeout(() => {
      const el = document.getElementById(`research-${id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Research & Story
            </h2>
            <NotionSyncBadge isLive={isFromNotion} itemCount={isFromNotion ? activeTopics.length : undefined} />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => exportResearchCSV(activeTopics)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] cursor-pointer"
              style={{ backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont }}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </motion.button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          The historical research powering each course — from 1587 to today.
        </p>
      </motion.div>

      {/* Progress + Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <span className="text-foreground text-[0.875rem]" style={headingFont}>Research Progress</span>
          <div className="flex items-center gap-4 text-[0.8125rem]" style={bodyFont}>
            <span className="flex items-center gap-1.5" style={{ color: "#7E9E78" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#7E9E78" }} /> {doneCount} Done
            </span>
            <span className="flex items-center gap-1.5" style={{ color: "#CDA88A" }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#CDA88A" }} /> {inProgressCount} Active
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-2 h-2 rounded-full border border-muted-foreground/40" /> {notStartedCount} Pending
            </span>
          </div>
        </div>
        <div className="relative h-3 rounded-full bg-border overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #7E9E78, #8BAD84)" }}
          />
          {/* In-progress segment */}
          {inProgressCount > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(inProgressCount / activeTopics.length) * 100}%` }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="h-full rounded-r-full absolute top-0"
              style={{
                left: `${progressPct}%`,
                background: "linear-gradient(90deg, #CDA88A, #D4B89A)",
                opacity: 0.6,
              }}
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
            {doneCount} of {activeTopics.length} research chapters complete
          </span>
          <span className="text-[0.6875rem] font-mono text-gold" style={bodyFont}>
            {Math.round(progressPct)}%
          </span>
        </div>
      </motion.div>

      {/* Search + View toggle + Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[180px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search regions, chefs, topics..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-[0.8125rem] bg-secondary border border-border focus:outline-none focus:border-gold/40 text-foreground"
            style={bodyFont}
          />
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1">
          {(["all", "complete", "in-progress", "not-started"] as const).map((s) => {
            const isActive = statusFilter === s;
            const label = s === "all" ? "All" : s === "complete" ? "Done" : s === "in-progress" ? "Active" : "Pending";
            const color = s === "complete" ? "#7E9E78" : s === "in-progress" ? "#CDA88A" : s === "not-started" ? "#6B7F8E" : undefined;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(isActive ? "all" : s)}
                className={`px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer transition-colors ${isActive ? "font-medium" : "hover:opacity-80"}`}
                style={{
                  backgroundColor: isActive && color ? `${color}15` : "transparent",
                  color: isActive && color ? color : undefined,
                  border: isActive && color ? `1px solid ${color}30` : "1px solid transparent",
                  ...bodyFont,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 border border-border">
          {([
            { mode: "timeline" as const, icon: Map, label: "Map" },
            { mode: "list" as const, icon: List, label: "List" },
            { mode: "kanban" as const, icon: Columns, label: "Board" },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[0.75rem] transition-colors cursor-pointer ${
                viewMode === mode
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={bodyFont}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Timeline View ─── */}
      {viewMode === "timeline" && (
        <>
          <StoryTimeline topics={filteredTopics} onSelectTopic={handleSelectFromTimeline} />
          <PairingCards topics={filteredTopics} />
        </>
      )}

      {/* ─── List view ─── */}
      {viewMode === "list" && (
        <div className="space-y-3">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground/50 text-[0.875rem]" style={bodyFont}>
              No topics match your search.
            </div>
          ) : (
            filteredTopics.map((topic, idx) => {
              const isOpen = expanded === topic.id;
              const sc = topic.status === "complete" ? "#7E9E78" : topic.status === "in-progress" ? "#CDA88A" : "#6B7F8E";
              return (
                <motion.div
                  key={topic.id}
                  id={`research-${topic.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.04 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : topic.id)}
                    className="w-full p-5 flex items-center gap-4 text-left cursor-pointer hover:bg-secondary/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${sc}10`, border: `1px solid ${sc}20` }}>
                      <MapPin className="w-4 h-4" style={{ color: sc }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {topic.courseNumber && (
                          <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-semibold shrink-0" style={{ backgroundColor: `${sc}12`, color: sc, ...bodyFont }}>
                            C{topic.courseNumber}
                          </span>
                        )}
                        <h4 className="text-foreground text-[0.9375rem] truncate" style={headingFont}>
                          {topic.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-[0.75rem]" style={bodyFont}>
                        <span>{topic.region}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Est. {topic.year}</span>
                        {topic.chef && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="flex items-center gap-1">
                              <ChefHat className="w-3 h-3" />
                              {topic.chef}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={topic.status} />
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Expandable body */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                          {/* Summary */}
                          <p className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>
                            {topic.summary}
                          </p>

                          {/* Chef-Researcher pairing badge */}
                          {(topic.chef || topic.researcher) && (
                            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${sc}06`, border: `1px solid ${sc}15` }}>
                              {topic.chef && (
                                <div className="flex items-center gap-1.5">
                                  <ChefHat className="w-3.5 h-3.5" style={{ color: sc }} />
                                  <span className="text-[0.75rem] text-foreground" style={bodyFont}>{topic.chef}</span>
                                </div>
                              )}
                              {topic.chef && topic.researcher && (
                                <ArrowRight className="w-3 h-3 text-muted-foreground/30" />
                              )}
                              {topic.researcher && (
                                <div className="flex items-center gap-1.5">
                                  <BookOpen className="w-3.5 h-3.5" style={{ color: sc }} />
                                  <span className="text-[0.75rem] text-foreground" style={bodyFont}>{topic.researcher}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Pull quote */}
                          {topic.pullQuote && (
                            <div className="p-4 rounded-xl border border-gold/15" style={{ background: "linear-gradient(to bottom, rgba(192,209,177,0.15), rgba(205,168,138,0.08))" }}>
                              <div className="flex gap-3">
                                <Quote className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                <p className="text-foreground text-[0.875rem] italic leading-relaxed" style={headingFont}>
                                  {topic.pullQuote}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Key facts */}
                          {topic.keyFacts.length > 0 && (
                            <div>
                              <h5 className="text-foreground text-[0.8125rem] mb-2" style={headingFont}>Key Facts</h5>
                              <div className="space-y-1.5">
                                {topic.keyFacts.map((fact) => (
                                  <div key={fact} className="flex items-start gap-2 p-2.5 rounded-lg bg-secondary/50">
                                    <Sparkles className="w-3 h-3 text-gold shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>{fact}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sources */}
                          {topic.sources.length > 0 && (
                            <div>
                              <h5 className="text-foreground text-[0.8125rem] mb-2" style={headingFont}>Sources</h5>
                              <div className="flex flex-wrap gap-2">
                                {topic.sources.map((src) => (
                                  <div key={src.title} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/5 border border-gold/15">
                                    <FileText className="w-3 h-3 text-gold" />
                                    <span className="text-foreground text-[0.75rem]" style={bodyFont}>{src.title}</span>
                                    <span className="text-[0.625rem] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded" style={bodyFont}>{src.type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Add to calendar */}
                          {topic.status !== "complete" && (
                            <a
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`[IK26] Research: ${topic.title}`)}&details=${encodeURIComponent(`Region: ${topic.region}\nAssigned: ${topic.assignedTo}\n\n${topic.summary}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[0.6875rem] px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                              style={{ backgroundColor: "rgba(93,160,107,0.06)", color: "#5DA06B", ...bodyFont }}
                            >
                              <CalendarPlus className="w-3 h-3" />
                              Add research deadline to Calendar
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ─── Kanban view ─── */}
      {viewMode === "kanban" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {(["not-started", "in-progress", "complete"] as const).map((status) => {
            const columnTopics = filteredTopics.filter((t) => t.status === status);
            const columnLabel = status === "not-started" ? "Not Started" : status === "in-progress" ? "In Progress" : "Complete";
            const columnColor = status === "complete" ? "#7E9E78" : status === "in-progress" ? "#CDA88A" : "#6B7F8E";

            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: status === "not-started" ? "transparent" : columnColor,
                      border: status === "not-started" ? `1.5px dashed ${columnColor}` : "none",
                    }}
                  />
                  <span className="text-foreground text-[0.875rem]" style={headingFont}>{columnLabel}</span>
                  <span className="text-muted-foreground text-[0.6875rem] ml-auto" style={bodyFont}>
                    {columnTopics.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {columnTopics.map((topic, idx) => (
                    <motion.div
                      key={topic.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="bg-card border border-border rounded-xl p-4"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {topic.courseNumber && (
                          <span className="text-[0.5625rem] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: `${columnColor}12`, color: columnColor, ...bodyFont }}>
                            C{topic.courseNumber}
                          </span>
                        )}
                        <h4 className="text-foreground text-[0.8125rem] truncate" style={headingFont}>
                          {topic.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[0.6875rem] mb-2" style={bodyFont}>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{topic.region}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{topic.year}</span>
                      </div>
                      {(topic.chef || topic.researcher) && (
                        <div className="flex items-center gap-2 text-[0.625rem] text-muted-foreground mb-2" style={bodyFont}>
                          {topic.chef && <span className="flex items-center gap-1"><ChefHat className="w-2.5 h-2.5" />{topic.chef}</span>}
                          {topic.researcher && <span className="flex items-center gap-1"><BookOpen className="w-2.5 h-2.5" />{topic.researcher}</span>}
                        </div>
                      )}
                      {topic.pullQuote && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-muted-foreground text-[0.6875rem] italic line-clamp-2 leading-relaxed" style={headingFont}>
                            "{topic.pullQuote}"
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {columnTopics.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground/40 text-[0.75rem]" style={bodyFont}>
                      No topics
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

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
            onClick={() => onNavigate("Our Istoryas")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.12)",
              ...bodyFont,
            }}
          >
            <Mic className="w-4 h-4" style={{ color: "#C9A96E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#C9A96E" }}>
              Our Istoryas
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#C9A96E", opacity: 0.5 }} />
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
