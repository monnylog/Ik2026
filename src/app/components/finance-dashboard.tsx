import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart3,
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  ArrowRight,
  Users,
  TrendingUp,
  Filter,
  Check,
  X as XIcon,
  Banknote,
  AlertCircle,
  Download,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../lib/supabase";
import { useProfile } from "../lib/profile-context";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const GOOGLE_SHEETS_URL = "https://docs.google.com/spreadsheets/d/13l95vLKDvOvrgjwRtXY05T8Y2QGa_Uh8ntNP2SKsr9U/edit";
const QUICKBOOKS_URL = "https://quickbooks.intuit.com";

type ExpenseStatus = "Pending" | "Approved" | "Paid" | "Denied";

interface Expense {
  id: string;
  user_id: string;
  submitted_by: string;
  role_team: string;
  expense_category: string;
  description: string;
  amount: number;
  receipt_url: string;
  status: ExpenseStatus;
  approved_by: string;
  date_submitted: string;
  date_paid: string;
  notes: string;
  created_at: string;
}

interface ExpenseSummary {
  total: number;
  totalAmount: number;
  pending: { count: number; amount: number };
  approved: { count: number; amount: number };
  paid: { count: number; amount: number };
  denied: { count: number; amount: number };
  byCategory: Record<string, number>;
  byPerson: Record<string, { total: number; pending: number; approved: number; paid: number; denied: number; count: number }>;
}

const statusConfig: Record<ExpenseStatus, { color: string; bg: string; border: string; icon: typeof Clock }> = {
  Pending: { color: "#C9A96E", bg: "rgba(201,169,110,0.08)", border: "rgba(201,169,110,0.18)", icon: Clock },
  Approved: { color: "#5DA06B", bg: "rgba(93,160,107,0.08)", border: "rgba(93,160,107,0.18)", icon: CheckCircle2 },
  Paid: { color: "#4A7FB5", bg: "rgba(74,127,181,0.08)", border: "rgba(74,127,181,0.18)", icon: CreditCard },
  Denied: { color: "#C85050", bg: "rgba(200,80,80,0.08)", border: "rgba(200,80,80,0.18)", icon: XCircle },
};

const categoryColors: Record<string, string> = {
  "Travel-Flight": "#4A7FB5",
  "Travel-Hotel": "#6B9EC2",
  "Travel-Ground": "#5A8FA8",
  "Food & Ingredients": "#5DA06B",
  "Equipment Rental": "#C9A96E",
  "Supplies": "#CDA88A",
  "Marketing & Print": "#A45A46",
  "Venue & Event": "#8B6F5A",
  "Misc": "#6B7F8E",
};

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

export function FinanceDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { profile } = useProfile();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "pending" | "all">("overview");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [allFilterStatus, setAllFilterStatus] = useState<ExpenseStatus | "All">("All");
  const [allFilterDropdownOpen, setAllFilterDropdownOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [summaryData, expensesData] = await Promise.all([
        apiFetch("/expenses/summary"),
        apiFetch("/expenses"),
      ]);
      setSummary(summaryData);
      setExpenses(expensesData.expenses || []);
    } catch (err) {
      console.error("Failed to load finance data:", err);
      toast.error("Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const updateExpenseStatus = async (id: string, newStatus: ExpenseStatus) => {
    setUpdatingId(id);
    try {
      await apiFetch(`/expenses/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          approved_by: profile?.displayName || "Leadership",
        }),
      });
      toast.success(`Expense ${newStatus.toLowerCase()}`);
      loadData();
    } catch (err) {
      console.error("Failed to update expense:", err);
      toast.error("Failed to update expense status");
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingExpenses = useMemo(() => expenses.filter((e) => e.status === "Pending"), [expenses]);
  const filteredAllExpenses = useMemo(() => {
    if (allFilterStatus === "All") return expenses;
    return expenses.filter((e) => e.status === allFilterStatus);
  }, [expenses, allFilterStatus]);
  const maxCategoryAmount = useMemo(() => {
    if (!summary) return 1;
    return Math.max(...Object.values(summary.byCategory), 1);
  }, [summary]);

  // Export CSV function for QBO import
  const exportCSV = useCallback(() => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    const headers = ["Date", "Submitted By", "Category", "Description", "Amount", "Status", "Notes"];
    const rows = expenses.map((e) => [
      e.date_submitted ? new Date(e.date_submitted).toISOString().split("T")[0] : "",
      `"${(e.submitted_by || "").replace(/"/g, '""')}"`,
      `"${(e.expense_category || "").replace(/"/g, '""')}"`,
      `"${(e.description || "").replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      e.status,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ik26-expenses-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${expenses.length} expenses to CSV`);
  }, [expenses]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gold" />
          <h2 className="text-foreground text-[1.25rem]" style={headingFont}>Finance Dashboard</h2>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gold" />
            <h2 className="text-foreground text-[1.25rem]" style={headingFont}>Finance Dashboard</h2>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={GOOGLE_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(93,160,107,0.06)", color: "#5DA06B", border: "1px solid rgba(93,160,107,0.12)", ...bodyFont }}
            >
              <ExternalLink className="w-3 h-3" />
              Google Sheets
            </a>
            <a
              href={QUICKBOOKS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "rgba(74,127,181,0.06)", color: "#4A7FB5", border: "1px solid rgba(74,127,181,0.12)", ...bodyFont }}
            >
              <ExternalLink className="w-3 h-3" />
              QuickBooks
            </a>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] hover:opacity-80 transition-opacity cursor-pointer"
              style={{ backgroundColor: "rgba(201,169,110,0.06)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.12)", ...bodyFont }}
              title="Export all expenses as CSV for QuickBooks import"
            >
              <Download className="w-3 h-3" />
              Export CSV
            </button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
          Manage expense approvals and track reimbursements
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { label: "Total Expenses", value: summary?.totalAmount || 0, count: summary?.total || 0, color: "#C9A96E", icon: DollarSign },
          { label: "Pending Review", value: summary?.pending.amount || 0, count: summary?.pending.count || 0, color: "#C9A96E", icon: Clock },
          { label: "Approved", value: summary?.approved.amount || 0, count: summary?.approved.count || 0, color: "#5DA06B", icon: CheckCircle2 },
          { label: "Paid Out", value: summary?.paid.amount || 0, count: summary?.paid.count || 0, color: "#4A7FB5", icon: CreditCard },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04, duration: 0.35 }}
            className="bg-card rounded-xl p-4"
            style={{ border: `1px solid ${card.color}15` }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}10` }}>
                <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-foreground text-[1.25rem] font-bold" style={headingFont}>{formatCurrency(card.value)}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-muted-foreground text-[0.625rem] uppercase tracking-wide" style={bodyFont}>{card.label}</span>
              <span className="text-muted-foreground/60 text-[0.625rem]" style={bodyFont}>{card.count} items</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4 }}
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: "rgba(107,127,142,0.04)", border: "1px solid rgba(107,127,142,0.06)" }}
      >
        {[
          { id: "overview" as const, label: "Overview", icon: TrendingUp },
          { id: "pending" as const, label: `Pending (${pendingExpenses.length})`, icon: Clock },
          { id: "all" as const, label: "All Expenses", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] flex-1 justify-center cursor-pointer transition-all"
            style={{
              backgroundColor: activeTab === tab.id ? "rgba(201,169,110,0.1)" : "transparent",
              color: activeTab === tab.id ? "#C9A96E" : "var(--muted-foreground)",
              border: activeTab === tab.id ? "1px solid rgba(201,169,110,0.2)" : "1px solid transparent",
              ...bodyFont,
            }}
          >
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Per-Category Progress Bars */}
            <div className="bg-card rounded-xl p-5" style={{ border: "1px solid rgba(107,127,142,0.08)" }}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4" style={{ color: "#C9A96E" }} />
                <h3 className="text-foreground text-[0.9375rem] font-medium" style={headingFont}>Spend by Category</h3>
              </div>
              {summary && Object.keys(summary.byCategory).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(summary.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amount], i) => {
                      const pct = (amount / maxCategoryAmount) * 100;
                      const color = categoryColors[cat] || "#6B7F8E";
                      return (
                        <motion.div
                          key={cat}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[0.75rem] text-foreground" style={bodyFont}>{cat}</span>
                            <span className="text-[0.75rem] text-foreground font-semibold" style={bodyFont}>{formatCurrency(amount)}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${color}10` }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.2 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-muted-foreground text-[0.75rem] text-center py-4" style={bodyFont}>No expenses recorded yet</p>
              )}
            </div>

            {/* Per-Person Table */}
            <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid rgba(107,127,142,0.08)" }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid rgba(107,127,142,0.06)" }}>
                <Users className="w-4 h-4" style={{ color: "#5DA06B" }} />
                <h3 className="text-foreground text-[0.9375rem] font-medium" style={headingFont}>Per-Person Summary</h3>
              </div>
              {summary && Object.keys(summary.byPerson).length > 0 ? (
                <div>
                  {Object.entries(summary.byPerson)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([person, data], i) => (
                      <motion.div
                        key={person}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <button
                          onClick={() => setExpandedPerson(expandedPerson === person ? null : person)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                          style={{ borderBottom: "1px solid rgba(107,127,142,0.04)" }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center text-[0.625rem] font-bold"
                              style={{ backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E" }}
                            >
                              {person.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left">
                              <span className="text-foreground text-[0.8125rem] font-medium block" style={bodyFont}>{person}</span>
                              <span className="text-muted-foreground/50 text-[0.625rem]" style={bodyFont}>{data.count} expense{data.count !== 1 ? "s" : ""}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-foreground text-[0.875rem] font-semibold" style={bodyFont}>{formatCurrency(data.total)}</span>
                            {expandedPerson === person ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedPerson === person && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ backgroundColor: "rgba(107,127,142,0.02)" }}>
                                {[
                                  { label: "Pending", val: data.pending, color: "#C9A96E" },
                                  { label: "Approved", val: data.approved, color: "#5DA06B" },
                                  { label: "Paid", val: data.paid, color: "#4A7FB5" },
                                  { label: "Denied", val: data.denied, color: "#C85050" },
                                ].map((s) => (
                                  <div key={s.label} className="text-center px-2 py-1.5 rounded-lg" style={{ backgroundColor: `${s.color}06` }}>
                                    <p className="text-[0.6875rem] font-medium" style={{ color: s.color, ...bodyFont }}>{formatCurrency(s.val)}</p>
                                    <p className="text-[0.5625rem] text-muted-foreground/50" style={bodyFont}>{s.label}</p>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-[0.75rem] text-center py-6" style={bodyFont}>No expenses submitted yet</p>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "pending" && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {pendingExpenses.length === 0 ? (
              <div className="bg-card rounded-xl flex flex-col items-center justify-center py-12 text-center" style={{ border: "1px solid rgba(107,127,142,0.08)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(93,160,107,0.08)" }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: "#5DA06B" }} />
                </div>
                <p className="text-foreground text-[0.875rem] font-medium mb-1" style={bodyFont}>All caught up!</p>
                <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>No expenses awaiting review</p>
              </div>
            ) : (
              pendingExpenses.map((expense, i) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-xl p-4"
                  style={{ border: "1px solid rgba(201,169,110,0.1)" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-foreground text-[0.875rem] font-semibold" style={bodyFont}>{expense.submitted_by}</span>
                        <span
                          className="text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${categoryColors[expense.expense_category] || "#6B7F8E"}10`,
                            color: categoryColors[expense.expense_category] || "#6B7F8E",
                            border: `1px solid ${categoryColors[expense.expense_category] || "#6B7F8E"}25`,
                            ...bodyFont,
                          }}
                        >
                          {expense.expense_category}
                        </span>
                      </div>
                      {expense.description && <p className="text-foreground/80 text-[0.75rem] mb-1" style={bodyFont}>{expense.description}</p>}
                      <p className="text-muted-foreground/50 text-[0.625rem]" style={bodyFont}>
                        Submitted {formatDate(expense.date_submitted)}
                        {expense.notes && ` · ${expense.notes}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-foreground text-[1.125rem] font-bold" style={headingFont}>{formatCurrency(expense.amount)}</p>
                      {expense.receipt_url && (
                        <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] flex items-center gap-1 justify-end hover:opacity-80 mt-1" style={{ color: "#4A7FB5", ...bodyFont }}>
                          <FileText className="w-3 h-3" /> View Receipt
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(107,127,142,0.06)" }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateExpenseStatus(expense.id, "Approved")}
                      disabled={updatingId === expense.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium cursor-pointer transition-colors flex-1 justify-center disabled:opacity-50"
                      style={{ backgroundColor: "rgba(93,160,107,0.08)", color: "#5DA06B", border: "1px solid rgba(93,160,107,0.18)", ...bodyFont }}
                    >
                      {updatingId === expense.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Approve
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateExpenseStatus(expense.id, "Denied")}
                      disabled={updatingId === expense.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium cursor-pointer transition-colors flex-1 justify-center disabled:opacity-50"
                      style={{ backgroundColor: "rgba(200,80,80,0.06)", color: "#C85050", border: "1px solid rgba(200,80,80,0.15)", ...bodyFont }}
                    >
                      <XIcon className="w-3 h-3" />
                      Deny
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateExpenseStatus(expense.id, "Paid")}
                      disabled={updatingId === expense.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium cursor-pointer transition-colors flex-1 justify-center disabled:opacity-50"
                      style={{ backgroundColor: "rgba(74,127,181,0.06)", color: "#4A7FB5", border: "1px solid rgba(74,127,181,0.15)", ...bodyFont }}
                    >
                      <Banknote className="w-3 h-3" />
                      Pay
                    </motion.button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "all" && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {/* Status Filter Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setAllFilterDropdownOpen(!allFilterDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
                  style={{
                    backgroundColor: allFilterStatus !== "All" ? "rgba(201,169,110,0.08)" : "rgba(107,127,142,0.06)",
                    color: allFilterStatus !== "All" ? "#C9A96E" : "var(--muted-foreground)",
                    border: `1px solid ${allFilterStatus !== "All" ? "rgba(201,169,110,0.18)" : "rgba(107,127,142,0.1)"}`,
                    ...bodyFont,
                  }}
                >
                  <Filter className="w-3 h-3" />
                  Status: {allFilterStatus}
                  <ChevronDown className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {allFilterDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute top-full mt-1 left-0 z-50 bg-card rounded-lg shadow-lg py-1 min-w-[140px]"
                      style={{ border: "1px solid rgba(107,127,142,0.12)" }}
                    >
                      {(["All", "Pending", "Approved", "Paid", "Denied"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setAllFilterStatus(s); setAllFilterDropdownOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-[0.75rem] hover:bg-secondary/50 transition-colors cursor-pointer"
                          style={{ color: s === allFilterStatus ? "#C9A96E" : "var(--foreground)", ...bodyFont }}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-muted-foreground/50 text-[0.6875rem] ml-auto" style={bodyFont}>
                {filteredAllExpenses.length} expense{filteredAllExpenses.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="bg-card rounded-xl overflow-hidden" style={{ border: "1px solid rgba(107,127,142,0.08)" }}>
              {filteredAllExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                    {allFilterStatus !== "All" ? `No ${allFilterStatus.toLowerCase()} expenses` : "No expenses submitted yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(107,127,142,0.08)" }}>
                        {["Date", "Person", "Category", "Description", "Amount", "Status", "Actions"].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-[0.625rem] uppercase tracking-wider text-muted-foreground font-medium" style={bodyFont}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAllExpenses.map((expense, i) => {
                        const sc = statusConfig[expense.status as ExpenseStatus] || statusConfig.Pending;
                        const StatusIcon = sc.icon;
                        const isUpdating = updatingId === expense.id;
                        return (
                          <motion.tr
                            key={expense.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.02 }}
                            style={{ borderBottom: "1px solid rgba(107,127,142,0.04)" }}
                            className="hover:bg-secondary/30 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-[0.75rem] text-muted-foreground whitespace-nowrap" style={bodyFont}>{formatDate(expense.date_submitted)}</td>
                            <td className="px-4 py-2.5 text-[0.8125rem] text-foreground font-medium" style={bodyFont}>{expense.submitted_by}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className="text-[0.625rem] px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${categoryColors[expense.expense_category] || "#6B7F8E"}10`,
                                  color: categoryColors[expense.expense_category] || "#6B7F8E",
                                  border: `1px solid ${categoryColors[expense.expense_category] || "#6B7F8E"}25`,
                                  ...bodyFont,
                                }}
                              >
                                {expense.expense_category}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[0.75rem] text-foreground max-w-[180px] truncate" style={bodyFont}>{expense.description || "-"}</td>
                            <td className="px-4 py-2.5 text-[0.8125rem] text-foreground font-semibold whitespace-nowrap" style={bodyFont}>{formatCurrency(expense.amount)}</td>
                            <td className="px-4 py-2.5">
                              <span
                                className="flex items-center gap-1 text-[0.625rem] px-2 py-0.5 rounded-full w-fit"
                                style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, ...bodyFont }}
                              >
                                <StatusIcon className="w-2.5 h-2.5" />
                                {expense.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  {expense.status === "Pending" && (
                                    <>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Approved")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(93,160,107,0.08)", color: "#5DA06B", border: "1px solid rgba(93,160,107,0.2)", ...bodyFont }}
                                        title="Approve"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Denied")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(200,80,80,0.08)", color: "#C85050", border: "1px solid rgba(200,80,80,0.2)", ...bodyFont }}
                                        title="Deny"
                                      >
                                        <XCircle className="w-2.5 h-2.5" />
                                        Deny
                                      </button>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Paid")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(74,127,181,0.08)", color: "#4A7FB5", border: "1px solid rgba(74,127,181,0.2)", ...bodyFont }}
                                        title="Mark Paid"
                                      >
                                        <CreditCard className="w-2.5 h-2.5" />
                                        Pay
                                      </button>
                                    </>
                                  )}
                                  {expense.status === "Approved" && (
                                    <>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Paid")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(74,127,181,0.08)", color: "#4A7FB5", border: "1px solid rgba(74,127,181,0.2)", ...bodyFont }}
                                        title="Mark Paid"
                                      >
                                        <CreditCard className="w-2.5 h-2.5" />
                                        Pay
                                      </button>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Pending")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont }}
                                        title="Revert to Pending"
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        Revert
                                      </button>
                                    </>
                                  )}
                                  {expense.status === "Paid" && (
                                    <button
                                      onClick={() => updateExpenseStatus(expense.id, "Approved")}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                      style={{ backgroundColor: "rgba(93,160,107,0.08)", color: "#5DA06B", border: "1px solid rgba(93,160,107,0.2)", ...bodyFont }}
                                      title="Revert to Approved"
                                    >
                                      <RotateCcw className="w-2.5 h-2.5" />
                                      Revert
                                    </button>
                                  )}
                                  {expense.status === "Denied" && (
                                    <>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Pending")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(201,169,110,0.08)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)", ...bodyFont }}
                                        title="Revert to Pending"
                                      >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        Revert
                                      </button>
                                      <button
                                        onClick={() => updateExpenseStatus(expense.id, "Approved")}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                        style={{ backgroundColor: "rgba(93,160,107,0.08)", color: "#5DA06B", border: "1px solid rgba(93,160,107,0.2)", ...bodyFont }}
                                        title="Approve"
                                      >
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        Approve
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}