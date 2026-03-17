import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Handshake,
  CheckCircle2,
  ExternalLink,
  Star,
  RefreshCw,
  DollarSign,
  Mail,
  User,
  ChevronDown,
  Target,
  TrendingUp,
  Filter,
  ArrowRight,
  Building2,
  Download,
  LayoutGrid,
  BarChart3,
} from "lucide-react";
import { EmptyState } from "./ui/empty-state";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { transformSponsor } from "../lib/notion-transforms";
import { bodyFont, headingFont } from "../lib/fonts";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

// Try to extract a domain from contact email or sponsor name for Clearbit logo
function getClearbitLogoUrl(name: string, contact: string): string | null {
  // Try email domain first
  if (contact && contact.includes("@")) {
    const domain = contact.split("@")[1];
    if (domain && !domain.includes("gmail") && !domain.includes("yahoo") && !domain.includes("hotmail") && !domain.includes("outlook") && !domain.includes("icloud") && !domain.includes("aol")) {
      return `https://logo.clearbit.com/${domain}`;
    }
  }
  // Try company name as domain
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/inc$|llc$|corp$|co$|group$/i, "");
  if (cleanName.length > 2) {
    return `https://logo.clearbit.com/${cleanName}.com`;
  }
  return null;
}

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Star; order: number }> = {
  platinum: { label: "Platinum", color: "#9B8EC4", bg: "rgba(155,142,196,0.1)", icon: Star, order: 1 },
  gold: { label: "Gold", color: "#C9A96E", bg: "rgba(201,169,110,0.1)", icon: Star, order: 2 },
  silver: { label: "Silver", color: "#8A857F", bg: "rgba(138,133,127,0.1)", icon: Star, order: 3 },
  bronze: { label: "Bronze", color: "#CDA88A", bg: "rgba(205,168,138,0.1)", icon: Star, order: 4 },
  "in-kind": { label: "In-Kind", color: "#7E9E78", bg: "rgba(126,158,120,0.1)", icon: Handshake, order: 5 },
  pending: { label: "Pending", color: "#6B7F8E", bg: "rgba(107,127,142,0.1)", icon: Handshake, order: 6 },
};

// Pipeline stages for funnel view
const pipelineStages = [
  { key: "lead", label: "Lead", color: "#6B7F8E", bg: "rgba(107,127,142,0.08)" },
  { key: "contacted", label: "Contacted", color: "#4A7FB5", bg: "rgba(74,127,181,0.08)" },
  { key: "proposal", label: "Proposal Sent", color: "#C9A96E", bg: "rgba(201,169,110,0.08)" },
  { key: "confirmed", label: "Confirmed", color: "#7E9E78", bg: "rgba(126,158,120,0.08)" },
  { key: "fulfilled", label: "Fulfilled", color: "#5DA06B", bg: "rgba(93,160,107,0.08)" },
];

function getSponsorStage(sponsor: { status: string; confirmed: boolean }): string {
  const s = sponsor.status.toLowerCase();
  if (s.includes("fulfill") || s.includes("complete") || s.includes("delivered") || s.includes("paid")) return "fulfilled";
  if (sponsor.confirmed || s.includes("confirm") || s.includes("signed") || s.includes("committed")) return "confirmed";
  if (s.includes("proposal") || s.includes("sent") || s.includes("pitched") || s.includes("presented")) return "proposal";
  if (s.includes("contact") || s.includes("reach") || s.includes("follow") || s.includes("email") || s.includes("called") || s.includes("intro")) return "contacted";
  return "lead";
}

// Clearbit logo component with fallback to initial
function SponsorAvatar({ name, contact, tierColor, tierBg }: { name: string; contact: string; tierColor: string; tierBg: string }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = getClearbitLogoUrl(name, contact);

  if (logoUrl && !imgError) {
    return (
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: tierBg, border: `1px solid ${tierColor}20` }}
      >
        <img
          src={logoUrl}
          alt={name}
          className="w-6 h-6 object-contain"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[1rem] font-semibold"
      style={{ backgroundColor: tierBg, color: tierColor }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface SponsorsPartnersProps {
  onNavigate?: (page: string) => void;
}

export function SponsorsPartners({ onNavigate }: SponsorsPartnersProps) {
  const { items: notionSponsors, isLoading, refresh } = useNotionDatabase("sponsors");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTier, setExpandedTier] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"tier" | "pipeline">("tier");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const sponsors = notionSponsors.map(transformSponsor).filter((s) => s.name);
  const isFromNotion = sponsors.length > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Stats
  const confirmedCount = sponsors.filter((s) => s.confirmed).length;
  const totalValue = sponsors.reduce((s, sp) => s + sp.estValue, 0);
  const confirmedValue = sponsors.filter((s) => s.confirmed).reduce((s, sp) => s + sp.estValue, 0);
  const sponsorshipGoal = 50000; // Target sponsorship revenue
  const goalProgress = Math.min((confirmedValue / sponsorshipGoal) * 100, 100);

  // Categories for filtering
  const categories = useMemo(() => {
    const cats = new Set(sponsors.map((s) => s.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [sponsors]);

  // Filtered sponsors
  const filteredSponsors = filterCategory
    ? sponsors.filter((s) => s.category === filterCategory)
    : sponsors;

  // Group by tier
  const tierOrder = ["platinum", "gold", "silver", "bronze", "in-kind", "pending"];
  const grouped = tierOrder
    .map((tier) => ({ tier, items: filteredSponsors.filter((s) => s.tier === tier) }))
    .filter((g) => g.items.length > 0);

  // Pipeline groups
  const pipelineGroups = pipelineStages.map((stage) => ({
    ...stage,
    items: filteredSponsors.filter((s) => getSponsorStage(s) === stage.key),
  }));

  // CSV Export
  const exportCSV = () => {
    const headers = ["Name", "Tier", "Status", "Category", "Contact", "Owner", "Est. Value", "Confirmed", "Notes"];
    const rows = sponsors.map((s) => [
      `"${s.name}"`,
      tierConfig[s.tier]?.label || s.tier,
      `"${s.status}"`,
      `"${s.category}"`,
      `"${s.contact}"`,
      `"${s.owner}"`,
      s.estValue,
      s.confirmed ? "Yes" : "No",
      `"${(s.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ik26-sponsors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && sponsors.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="w-5 h-5" style={{ color: "#C9A96E" }} />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>Sponsors & Partners</h2>
          </div>
          <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>Loading sponsor data...</p>
        </motion.div>
        {/* Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl p-4 animate-pulse" style={{ border: "1px solid rgba(201,169,110,0.1)" }}>
              <div className="h-3 w-16 bg-muted-foreground/10 rounded mb-2" />
              <div className="h-5 w-12 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="w-5 h-5" style={{ color: "#C9A96E" }} />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>Sponsors & Partners</h2>
          </div>
          <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>Manage sponsorships and partnerships.</p>
        </motion.div>
        <EmptyState
          title="No sponsors yet"
          description="Sponsors will appear here once they're added to the IK26 Comms Tracker in Notion."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5" style={{ color: "#C9A96E" }} />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>Sponsors & Partners</h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[0.75rem] cursor-pointer transition-colors"
              style={{ backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont }}
              aria-label="Export sponsors as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </motion.button>
            <NotionSyncBadge isLive={isFromNotion} itemCount={sponsors.length} />
            <button onClick={handleRefresh} disabled={refreshing} className="w-6 h-6 rounded flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-40" title="Refresh">
              <RefreshCw className={`w-3 h-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""} across {grouped.length} tier{grouped.length !== 1 ? "s" : ""}.
          {confirmedCount > 0 && ` ${confirmedCount} confirmed.`}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(201,169,110,0.15)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Total Sponsors</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={headingFont}>{sponsors.length}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(126,158,120,0.15)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Confirmed</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={{ ...headingFont, color: "#7E9E78" }}>
            {confirmedCount}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(155,142,196,0.15)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Est. Value</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={headingFont}>
            {totalValue > 0 ? formatCurrency(totalValue) : "\u2014"}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(93,160,107,0.15)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Confirmed Value</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={{ ...headingFont, color: "#5DA06B" }}>
            {confirmedValue > 0 ? formatCurrency(confirmedValue) : "\u2014"}
          </p>
        </motion.div>
      </div>

      {/* Revenue Goal Progress */}
      {totalValue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl p-4"
          style={{ border: "1px solid rgba(201,169,110,0.12)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: "#C9A96E" }} />
              <span className="text-[0.8125rem] text-foreground font-medium" style={bodyFont}>
                Sponsorship Goal
              </span>
            </div>
            <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
              {formatCurrency(confirmedValue)} / {formatCurrency(sponsorshipGoal)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(201,169,110,0.08)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              className="h-full rounded-full"
              style={{
                background: goalProgress >= 100
                  ? "linear-gradient(90deg, #5DA06B, #7E9E78)"
                  : goalProgress >= 60
                  ? "linear-gradient(90deg, #C9A96E, #D4A843)"
                  : "linear-gradient(90deg, #C49370, #C9A96E)",
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[0.6875rem] text-muted-foreground/60" style={bodyFont}>
              {goalProgress.toFixed(0)}% of goal
            </span>
            {goalProgress >= 100 && (
              <span className="text-[0.6875rem] flex items-center gap-1" style={{ color: "#5DA06B", ...bodyFont }}>
                <CheckCircle2 className="w-3 h-3" /> Goal reached
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* View Toggle + Category Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.1)" }}>
          <button
            onClick={() => setViewMode("tier")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors cursor-pointer ${
              viewMode === "tier" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            style={viewMode === "tier" ? { backgroundColor: "rgba(201,169,110,0.15)", ...bodyFont } : bodyFont}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Tiers
          </button>
          <button
            onClick={() => setViewMode("pipeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] transition-colors cursor-pointer ${
              viewMode === "pipeline" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            style={viewMode === "pipeline" ? { backgroundColor: "rgba(201,169,110,0.15)", ...bodyFont } : bodyFont}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Pipeline
          </button>
        </div>

        {/* Category Filter Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <button
              onClick={() => setFilterCategory(null)}
              className={`px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer transition-colors ${
                !filterCategory ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              style={!filterCategory ? { backgroundColor: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont } : { border: "1px solid transparent", ...bodyFont }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                className={`px-2.5 py-1 rounded-lg text-[0.6875rem] cursor-pointer transition-colors ${
                  filterCategory === cat ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                style={filterCategory === cat ? { backgroundColor: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont } : { border: "1px solid transparent", ...bodyFont }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pipeline Funnel View */}
      <AnimatePresence mode="wait">
        {viewMode === "pipeline" && (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Funnel Overview Bar */}
            <div className="mb-5 bg-card rounded-xl p-4" style={{ border: "1px solid rgba(201,169,110,0.1)" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: "#C9A96E" }} />
                <span className="text-[0.8125rem] text-foreground font-medium" style={bodyFont}>Pipeline Funnel</span>
              </div>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                {pipelineGroups.map((stage) => {
                  const pct = filteredSponsors.length > 0 ? (stage.items.length / filteredSponsors.length) * 100 : 0;
                  if (pct === 0) return null;
                  return (
                    <motion.div
                      key={stage.key}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                      className="flex items-center justify-center min-w-[2rem]"
                      style={{ backgroundColor: stage.bg, borderLeft: `2px solid ${stage.color}` }}
                      title={`${stage.label}: ${stage.items.length}`}
                    >
                      <span className="text-[0.5625rem] font-medium truncate px-1" style={{ color: stage.color, ...bodyFont }}>
                        {stage.items.length}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {pipelineGroups.filter((s) => s.items.length > 0).map((stage) => (
                  <span key={stage.key} className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                    {stage.label} ({stage.items.length})
                  </span>
                ))}
              </div>
            </div>

            {/* Pipeline Stage Cards */}
            <div className="space-y-4">
              {pipelineGroups.filter((s) => s.items.length > 0).map((stage, stageIdx) => (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * stageIdx }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <span className="text-[0.875rem] font-medium" style={{ ...bodyFont, color: stage.color }}>
                      {stage.label}
                    </span>
                    <span className="text-[0.6875rem] text-muted-foreground/50" style={bodyFont}>
                      ({stage.items.length})
                    </span>
                    {stage.key !== "fulfilled" && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground/20 ml-auto" />
                    )}
                  </div>
                  <div className="space-y-2">
                    {stage.items.map((sponsor, idx) => {
                      const tc = tierConfig[sponsor.tier] || tierConfig.pending;
                      return (
                        <SponsorCard
                          key={sponsor.id}
                          sponsor={sponsor}
                          tc={tc}
                          idx={idx}
                          stageColor={stage.color}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tier View */}
        {viewMode === "tier" && (
          <motion.div
            key="tier"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Tier Distribution Bar */}
            <div className="bg-card rounded-xl p-4" style={{ border: "1px solid rgba(201,169,110,0.1)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4" style={{ color: "#C9A96E" }} />
                <span className="text-[0.8125rem] text-foreground font-medium" style={bodyFont}>Tier Distribution</span>
              </div>
              <div className="space-y-2">
                {grouped.map(({ tier, items }) => {
                  const tc = tierConfig[tier] || tierConfig.pending;
                  const pct = (items.length / filteredSponsors.length) * 100;
                  const tierValue = items.reduce((sum, s) => sum + s.estValue, 0);
                  return (
                    <div key={tier} className="flex items-center gap-3">
                      <span className="text-[0.6875rem] w-16 text-right shrink-0" style={{ color: tc.color, ...bodyFont }}>
                        {tc.label}
                      </span>
                      <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ backgroundColor: `${tc.color}08` }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                          className="h-full rounded-md flex items-center px-2"
                          style={{ backgroundColor: `${tc.color}18`, minWidth: "2rem" }}
                        >
                          <span className="text-[0.5625rem] font-medium" style={{ color: tc.color, ...bodyFont }}>
                            {items.length}
                          </span>
                        </motion.div>
                      </div>
                      {tierValue > 0 && (
                        <span className="text-[0.6875rem] text-muted-foreground/50 w-20 text-right shrink-0" style={bodyFont}>
                          {formatCurrency(tierValue)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sponsor Cards by Tier */}
            {grouped.map(({ tier, items }) => {
              const tc = tierConfig[tier] || tierConfig.pending;
              const TierIcon = tc.icon;
              const isExpanded = expandedTier[tier] !== false; // default expanded

              return (
                <motion.div key={tier} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  {/* Tier Header */}
                  <button
                    onClick={() => setExpandedTier((prev) => ({ ...prev, [tier]: !isExpanded }))}
                    className="flex items-center gap-2 mb-2 w-full cursor-pointer"
                  >
                    <TierIcon className="w-4 h-4" style={{ color: tc.color }} />
                    <span className="text-[0.875rem] font-medium" style={{ ...bodyFont, color: tc.color }}>
                      {tc.label}
                    </span>
                    <span className="text-[0.6875rem] text-muted-foreground/50" style={bodyFont}>
                      ({items.length})
                    </span>
                    <div className="flex-1" />
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>

                  {/* Cards */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          {items.map((sponsor, idx) => (
                            <SponsorCard
                              key={sponsor.id}
                              sponsor={sponsor}
                              tc={tc}
                              idx={idx}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer nav */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Comms")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)", ...bodyFont }}
          >
            <Mail className="w-4 h-4" style={{ color: "#C9A96E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#C9A96E" }}>Comms Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#C9A96E", opacity: 0.5 }} />
          </button>
          <button
            onClick={() => onNavigate("Finance")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(93,160,107,0.06)", border: "1px solid rgba(93,160,107,0.12)", ...bodyFont }}
          >
            <DollarSign className="w-4 h-4" style={{ color: "#5DA06B" }} />
            <span className="text-[0.8125rem]" style={{ color: "#5DA06B" }}>Finance Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#5DA06B", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Extracted Sponsor Card ──────────────────────────────────────

function SponsorCard({
  sponsor,
  tc,
  idx,
  stageColor,
}: {
  sponsor: ReturnType<typeof transformSponsor>;
  tc: { label: string; color: string; bg: string };
  idx: number;
  stageColor?: string;
}) {
  const borderColor = stageColor || tc.color;
  const stage = getSponsorStage(sponsor);
  const stageCfg = pipelineStages.find((s) => s.key === stage);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 * idx }}
      className="bg-card rounded-xl px-4 py-3.5"
      style={{ border: `1px solid ${borderColor}18` }}
    >
      <div className="flex items-center gap-3">
        {/* Clearbit Logo Avatar */}
        <SponsorAvatar
          name={sponsor.name}
          contact={sponsor.contact}
          tierColor={tc.color}
          tierBg={tc.bg}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-[0.875rem] font-medium truncate" style={bodyFont}>
              {sponsor.name}
            </span>
            {sponsor.confirmed && (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "#7E9E78" }} />
            )}
            {/* Tier Badge (in pipeline view) */}
            {stageColor && (
              <span
                className="text-[0.5625rem] px-1.5 py-0.5 rounded-md shrink-0"
                style={{ backgroundColor: tc.bg, color: tc.color, ...bodyFont }}
              >
                {tc.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[0.6875rem] text-muted-foreground mt-0.5 flex-wrap" style={bodyFont}>
            {sponsor.status && (
              <span className="flex items-center gap-1">
                {stageCfg && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: stageCfg.color }} />
                )}
                {sponsor.status}
              </span>
            )}
            {sponsor.category && sponsor.category !== "General" && (
              <>
                <span className="opacity-30">&middot;</span>
                <span>{sponsor.category}</span>
              </>
            )}
            {sponsor.owner && (
              <>
                <span className="opacity-30">&middot;</span>
                <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{sponsor.owner}</span>
              </>
            )}
            {sponsor.estValue > 0 && (
              <>
                <span className="opacity-30">&middot;</span>
                <span className="flex items-center gap-1" style={{ color: tc.color }}>
                  <DollarSign className="w-2.5 h-2.5" />{formatCurrency(sponsor.estValue)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {sponsor.contact && (
            <a
              href={`mailto:${sponsor.contact}`}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors"
              title={`Contact: ${sponsor.contact}`}
            >
              <Mail className="w-3.5 h-3.5 text-muted-foreground/40" />
            </a>
          )}
          {sponsor._url && (
            <a
              href={sponsor._url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors"
              title="Open in Notion"
            >
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40" />
            </a>
          )}
        </div>
      </div>

      {/* Notes row */}
      {sponsor.notes && (
        <div className="mt-2 pt-2 border-t border-border/20">
          <p className="text-[0.6875rem] text-muted-foreground/70" style={bodyFont}>
            {sponsor.notes}
          </p>
        </div>
      )}
    </motion.div>
  );
}