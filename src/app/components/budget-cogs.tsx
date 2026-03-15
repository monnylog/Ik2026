import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Receipt,
  Clock,
  CreditCard,
  XCircle,
  Loader2,
} from "lucide-react";
import { EmptyState } from "./ui/empty-state";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { transformBudgetItem, groupBudgetItemsByCategory } from "../lib/notion-transforms";
import { apiFetch } from "../lib/supabase";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ReimbExpense {
  id: string;
  submitted_by: string;
  expense_category: string;
  description: string;
  amount: number;
  status: string;
  date_submitted: string;
  date_paid: string;
  receipt_url: string;
}

const reimbStatusConfig: Record<string, { color: string; bg: string; icon: typeof Clock }> = {
  Pending: { color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  Approved: { color: "#5DA06B", bg: "rgba(93,160,107,0.08)", icon: CheckCircle2 },
  Paid: { color: "#4A7FB5", bg: "rgba(74,127,181,0.08)", icon: CreditCard },
  Denied: { color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: XCircle },
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

export function BudgetCogs({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const { items: notionBudget, isLoading, refresh } = useNotionDatabase("budget");
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"budget" | "reimbursements">("budget");
  const [reimbExpenses, setReimbExpenses] = useState<ReimbExpense[]>([]);
  const [reimbLoading, setReimbLoading] = useState(false);

  const loadReimbursements = useCallback(async () => {
    setReimbLoading(true);
    try {
      const data = await apiFetch("/expenses");
      setReimbExpenses(data.expenses || []);
    } catch (err) {
      console.error("Failed to load reimbursement data:", err);
    } finally {
      setReimbLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reimbursements") loadReimbursements();
  }, [activeTab, loadReimbursements]);

  const reimbTotals = useMemo(() => {
    const paid = reimbExpenses.filter((e) => e.status === "Paid");
    const pending = reimbExpenses.filter((e) => e.status === "Pending" || e.status === "Approved");
    return {
      totalPaid: paid.reduce((s, e) => s + e.amount, 0),
      totalPending: pending.reduce((s, e) => s + e.amount, 0),
      paidCount: paid.length,
      pendingCount: pending.length,
    };
  }, [reimbExpenses]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  // Transform individual Notion items, then group by category
  const budgetItems = useMemo(() => notionBudget.map(transformBudgetItem), [notionBudget]);
  const groupedLines = useMemo(() => groupBudgetItemsByCategory(budgetItems), [budgetItems]);
  const isFromNotion = notionBudget.length > 0;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Show loading state
  if (isLoading && notionBudget.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Budget & COGS
            </h2>
          </div>
          <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
            Loading budget data from Notion...
          </p>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-card p-4 rounded-xl animate-pulse" style={{ border: "1px solid rgba(107,127,142,0.1)" }}>
              <div className="h-3 w-16 bg-muted-foreground/10 rounded mb-2" />
              <div className="h-6 w-20 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state — either no data from Notion, or all items are empty
  if (groupedLines.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Budget & COGS
            </h2>
          </div>
          <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
            Track event spending across all budget categories.
          </p>
        </motion.div>

        {/* Show individual items as a flat list if Notion data exists but grouping failed */}
        {budgetItems.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <NotionSyncBadge isLive={true} itemCount={budgetItems.length} />
              <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1.5 text-[0.75rem] px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer text-muted-foreground disabled:opacity-40" style={bodyFont}>
                <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
            <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid rgba(201,169,110,0.15)" }}>
              <div className="px-4 py-3 border-b border-border/30">
                <span className="text-foreground text-[0.875rem] font-medium" style={bodyFont}>All Budget Items ({budgetItems.length})</span>
              </div>
              <div className="divide-y divide-border/20">
                {budgetItems.map((item, idx) => (
                  <div key={item.id || idx} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground text-[0.8125rem] truncate" style={bodyFont}>{item.name || "Untitled"}</span>
                        {item.category && (
                          <span className="text-[0.625rem] px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: "rgba(201,169,110,0.1)", color: "#C9A96E", ...bodyFont }}>
                            {item.category}
                          </span>
                        )}
                      </div>
                      {item.notes && <span className="text-muted-foreground text-[0.6875rem] truncate block mt-0.5" style={bodyFont}>{item.notes}</span>}
                    </div>
                    <div className="text-right shrink-0">
                      {item.budget > 0 && <div className="text-foreground text-[0.8125rem]" style={bodyFont}>{formatCurrency(item.budget)}</div>}
                      {item.actuals > 0 && <div className="text-muted-foreground text-[0.625rem]" style={bodyFont}>Actual: {formatCurrency(item.actuals)}</div>}
                    </div>
                    {item._url && (
                      <a href={item._url} target="_blank" rel="noopener noreferrer" className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 transition-colors shrink-0" title="Open in Notion">
                        <ExternalLink className="w-3 h-3 text-muted-foreground/40" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            variant="budget"
            title="No budget data yet"
            description="Budget line items will appear here once they're added to the Money page in Notion. The system auto-syncs every 5 minutes."
            action={{
              label: "Add budget items in Notion \u2192",
              onClick: () => window.open("https://www.notion.so/964857d01c6647669a134a0375f6bcd2", "_blank"),
            }}
          />
        )}
      </div>
    );
  }

  // ─── Full budget view with grouped categories ─────────────────
  const totalAllocated = groupedLines.reduce((s, l) => s + l.allocated, 0);
  const totalSpent = groupedLines.reduce((s, l) => s + l.spent, 0);
  const remaining = totalAllocated - totalSpent;
  const spentPercent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
  const atRiskCount = groupedLines.filter((l) => l.status === "at-risk" || l.status === "over").length;

  const statusConfig = {
    "on-track": { label: "On Track", color: "#7E9E78", bg: "rgba(126,158,120,0.1)", icon: CheckCircle2 },
    "at-risk": { label: "At Risk", color: "#C9A96E", bg: "rgba(201,169,110,0.1)", icon: AlertTriangle },
    over: { label: "Over Budget", color: "#C75B3F", bg: "rgba(199,91,63,0.1)", icon: AlertTriangle },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Budget & COGS
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <NotionSyncBadge isLive={isFromNotion} itemCount={isFromNotion ? budgetItems.length : undefined} />
            <button onClick={handleRefresh} disabled={refreshing} className="w-6 h-6 rounded flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer disabled:opacity-40" title="Refresh from Notion">
              <RefreshCw className={`w-3 h-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          {isFromNotion
            ? `${budgetItems.length} line items across ${groupedLines.length} categories from Notion.`
            : "Track event spending across all budget categories."}
        </p>
      </motion.div>

      {/* Tab Switcher: Budget vs Reimbursements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03, duration: 0.4 }}
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: "rgba(107,127,142,0.04)", border: "1px solid rgba(107,127,142,0.06)" }}
      >
        <button
          onClick={() => setActiveTab("budget")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] flex-1 justify-center cursor-pointer transition-all"
          style={{
            backgroundColor: activeTab === "budget" ? "rgba(201,169,110,0.1)" : "transparent",
            color: activeTab === "budget" ? "#C9A96E" : "var(--muted-foreground)",
            border: activeTab === "budget" ? "1px solid rgba(201,169,110,0.2)" : "1px solid transparent",
            ...bodyFont,
          }}
        >
          <DollarSign className="w-3 h-3" />
          Budget & COGS
        </button>
        <button
          onClick={() => setActiveTab("reimbursements")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] flex-1 justify-center cursor-pointer transition-all"
          style={{
            backgroundColor: activeTab === "reimbursements" ? "rgba(74,127,181,0.1)" : "transparent",
            color: activeTab === "reimbursements" ? "#4A7FB5" : "var(--muted-foreground)",
            border: activeTab === "reimbursements" ? "1px solid rgba(74,127,181,0.2)" : "1px solid transparent",
            ...bodyFont,
          }}
        >
          <Receipt className="w-3 h-3" />
          Reimbursements
        </button>
      </motion.div>

      {activeTab === "reimbursements" ? (
        <motion.div
          key="reimb-tab"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Reimbursement summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(74,127,181,0.15)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <CreditCard className="w-3 h-3" style={{ color: "#4A7FB5" }} />
                <span className="text-muted-foreground text-[0.625rem] uppercase tracking-wide" style={bodyFont}>Total Paid</span>
              </div>
              <p className="text-foreground text-[1.25rem] font-semibold" style={headingFont}>{formatCurrency(reimbTotals.totalPaid)}</p>
              <p className="text-muted-foreground/50 text-[0.625rem] mt-0.5" style={bodyFont}>{reimbTotals.paidCount} expenses</p>
            </div>
            <div className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(201,169,110,0.15)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3 h-3" style={{ color: "#C9A96E" }} />
                <span className="text-muted-foreground text-[0.625rem] uppercase tracking-wide" style={bodyFont}>Pending/Approved</span>
              </div>
              <p className="text-foreground text-[1.25rem] font-semibold" style={headingFont}>{formatCurrency(reimbTotals.totalPending)}</p>
              <p className="text-muted-foreground/50 text-[0.625rem] mt-0.5" style={bodyFont}>{reimbTotals.pendingCount} expenses</p>
            </div>
          </div>

          {/* Reimbursement list */}
          <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid rgba(107,127,142,0.08)" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(107,127,142,0.06)" }}>
              <span className="text-foreground text-[0.875rem] font-medium" style={bodyFont}>All Expense Claims ({reimbExpenses.length})</span>
              {onNavigate && (
                <button
                  onClick={() => onNavigate("Expenses")}
                  className="flex items-center gap-1 text-[0.6875rem] cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ color: "#C9A96E", ...bodyFont }}
                >
                  Open Expense Tracker <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            {reimbLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : reimbExpenses.length === 0 ? (
              <div className="text-center py-10">
                <Receipt className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(107,127,142,0.2)" }} />
                <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>No expense claims submitted yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/10">
                {reimbExpenses.slice(0, 20).map((exp) => {
                  const sc = reimbStatusConfig[exp.status] || reimbStatusConfig.Pending;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={exp.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground text-[0.8125rem] font-medium" style={bodyFont}>{exp.submitted_by}</span>
                          <span
                            className="flex items-center gap-0.5 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: sc.bg, color: sc.color, ...bodyFont }}
                          >
                            <StatusIcon className="w-2.5 h-2.5" />
                            {exp.status}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-[0.6875rem] block mt-0.5" style={bodyFont}>
                          {exp.expense_category}{exp.description ? ` · ${exp.description}` : ""}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-foreground text-[0.875rem] font-semibold" style={bodyFont}>{formatCurrency(exp.amount)}</span>
                        {exp.date_submitted && (
                          <span className="text-muted-foreground/40 text-[0.5625rem] block" style={bodyFont}>
                            {new Date(exp.date_submitted).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link to Finance Dashboard */}
          {onNavigate && (
            <button
              onClick={() => onNavigate("Finance")}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
              style={{ backgroundColor: "rgba(74,127,181,0.06)", border: "1px solid rgba(74,127,181,0.12)" }}
            >
              <span className="text-[0.8125rem]" style={{ color: "#4A7FB5", ...bodyFont }}>
                Open Finance Dashboard
              </span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: "#4A7FB5", opacity: 0.5 }} />
            </button>
          )}
        </motion.div>
      ) : (
      <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(126,158,120,0.2)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Total Budget</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={headingFont}>{formatCurrency(totalAllocated)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(205,168,138,0.2)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Total Spent</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={headingFont}>{formatCurrency(totalSpent)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(201,169,110,0.2)" }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Remaining</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={{ ...headingFont, color: remaining < 0 ? "#C75B3F" : undefined }}>
            {formatCurrency(remaining)}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card p-4 rounded-xl" style={{ border: `1px solid ${atRiskCount > 0 ? "rgba(199,91,63,0.2)" : "rgba(126,158,120,0.2)"}` }}>
          <p className="text-muted-foreground text-[0.6875rem] mb-1" style={bodyFont}>Utilization</p>
          <p className="text-foreground text-[1.25rem] font-semibold" style={{ ...headingFont, color: spentPercent > 100 ? "#C75B3F" : spentPercent > 85 ? "#C9A96E" : "#7E9E78" }}>
            {spentPercent}%
          </p>
        </motion.div>
      </div>

      {/* Overall progress bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(201,169,110,0.1)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>Overall Spend</span>
          <span className="text-[0.75rem] text-foreground font-medium" style={bodyFont}>
            {formatCurrency(totalSpent)} / {formatCurrency(totalAllocated)}
          </span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(205,168,138,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: spentPercent > 100 ? "#C75B3F" : spentPercent > 85 ? "#C9A96E" : "#7E9E78" }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(spentPercent, 100)}%` }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      {/* Spending Breakdown by Category */}
      {groupedLines.length > 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card p-4 rounded-xl" style={{ border: "1px solid rgba(201,169,110,0.08)" }}>
          <h3 className="text-[0.8125rem] font-medium text-foreground mb-3" style={bodyFont}>Category Breakdown</h3>
          <div className="space-y-2.5">
            {groupedLines
              .filter(l => l.allocated > 0)
              .sort((a, b) => b.allocated - a.allocated)
              .map((line) => {
                const sc = statusConfig[line.status];
                const sharePercent = totalAllocated > 0 ? Math.round((line.allocated / totalAllocated) * 100) : 0;
                const spentPct = line.allocated > 0 ? Math.round((line.spent / line.allocated) * 100) : 0;
                return (
                  <div key={`breakdown-${line.category}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.6875rem] text-foreground" style={bodyFont}>{line.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.5625rem] text-muted-foreground" style={bodyFont}>
                          {formatCurrency(line.spent)} / {formatCurrency(line.allocated)}
                        </span>
                        <span className="text-[0.5625rem] px-1.5 py-0.5 rounded" style={{ backgroundColor: sc.bg, color: sc.color, ...bodyFont }}>
                          {spentPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(205,168,138,0.06)" }}>
                      <div className="h-full rounded-full relative">
                        {/* Allocated share (lighter) */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${sharePercent}%`, backgroundColor: `${sc.color}20` }}
                        />
                        {/* Spent within allocation */}
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ backgroundColor: sc.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(sharePercent * (spentPct / 100), 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      )}

      {/* Category Breakdown */}
      <div className="space-y-3">
        {groupedLines.map((line, idx) => {
          const sc = statusConfig[line.status];
          const StatusIcon = sc.icon;
          const pct = line.allocated > 0 ? Math.round((line.spent / line.allocated) * 100) : (line.spent > 0 ? 100 : 0);
          const isExpanded = expandedCategories[line.category];

          return (
            <motion.div
              key={line.category}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + idx * 0.03 }}
              className="bg-card rounded-xl overflow-hidden"
              style={{ border: `1px solid ${sc.color}20` }}
            >
              <button
                onClick={() => toggleCategory(line.category)}
                className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${sc.color}15` }}>
                  <DollarSign className="w-4 h-4" style={{ color: sc.color }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="text-foreground text-[0.875rem] block" style={bodyFont}>{line.category}</span>
                  <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                    {formatCurrency(line.spent)} / {formatCurrency(line.allocated)}
                    {line.items.length > 0 && ` · ${line.items.length} items`}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[0.625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: sc.bg, color: sc.color, ...bodyFont }}>
                    {sc.label}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground/30 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Progress bar */}
              <div className="px-4 pb-2">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(205,168,138,0.08)" }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: sc.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(pct, 100)}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-3 space-y-1.5">
                      {line.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-start gap-2 text-[0.75rem]">
                          <span className="text-foreground flex-1" style={bodyFont}>{item.name || "—"}</span>
                          <span className="text-muted-foreground shrink-0" style={bodyFont}>
                            {item.amount > 0 ? formatCurrency(item.amount) : "—"}
                          </span>
                        </div>
                      ))}
                      {line.items.some(i => i.note) && (
                        <div className="mt-2 pt-2 border-t border-border/20 space-y-1">
                          {line.items.filter(i => i.note).map((item, nIdx) => (
                            <div key={nIdx} className="text-[0.6875rem] text-muted-foreground/70" style={bodyFont}>
                              {item.name}: {item.note}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Link to Sponsors */}
      {onNavigate && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <button
            onClick={() => onNavigate("Sponsors & Partners")}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{ backgroundColor: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)" }}
          >
            <span className="text-[0.8125rem]" style={{ color: "#C9A96E", ...bodyFont }}>
              View Sponsors & Partners
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#C9A96E", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
      </>
      )}
    </div>
  );
}