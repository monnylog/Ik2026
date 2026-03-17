import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Receipt,
  Plus,
  Filter,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Upload,
  X,
  ChevronDown,
  FileText,
  Loader2,
  Trash2,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../lib/supabase";
import { useProfile } from "../lib/profile-context";
import type { UserRole } from "./onboarding/use-auth";
import { bodyFont, headingFont } from "../lib/fonts";

const EXPENSE_CATEGORIES = [
  "Travel-Flight",
  "Travel-Hotel",
  "Travel-Ground",
  "Food & Ingredients",
  "Equipment Rental",
  "Supplies",
  "Marketing & Print",
  "Venue & Event",
  "Misc",
] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
type ExpenseStatus = "Pending" | "Approved" | "Paid" | "Denied";

// Updated submitter list matching the confirmed 7-chef roster + team roles
const CHEF_NAMES = [
  "Chef Patrice Cleary",
  "Chef Justin Barnes",
  "Chef Aaron Verzosa",
  "Chef Cristina Quackenbush",
  "Chef Lord Maynard",
  "Chef Rachel Barril",
  "Chef Dio Buan",
];

const TEAM_NAMES = [
  "Walbert Castillo",
  "Monica Blanco",
  "Christine Antonio",
  "JJ Mayang",
  "Mariana",
  "Anjelique",
  "Cy",
  "Griselle",
  "Ayce Mangapit",
  "Jaryd Lucero",
  "Zwei",
  "Andrew",
  "Ava Carino",
  "Flerine Cruz Atienza",
  "Sarah Obal",
  "Jerjon",
  "Denise",
];

const SUBMITTER_NAMES = [...CHEF_NAMES, ...TEAM_NAMES];

// Map profile display names to their submitter-list counterpart
function resolveSubmitterName(displayName: string | undefined): string {
  if (!displayName) return "";
  // Direct match in submitter list
  if (SUBMITTER_NAMES.includes(displayName)) return displayName;
  // Check if display name maps to a chef (e.g. "Dio Buan" -> "Chef Dio Buan")
  const chefMatch = CHEF_NAMES.find((cn) => {
    const plain = cn.replace("Chef ", "");
    return displayName === plain || displayName.includes(plain) || plain.includes(displayName);
  });
  if (chefMatch) return chefMatch;
  // Check if display name partially matches a team name
  const teamMatch = TEAM_NAMES.find((tn) =>
    tn.toLowerCase() === displayName.toLowerCase() ||
    tn.toLowerCase().startsWith(displayName.toLowerCase()) ||
    displayName.toLowerCase().startsWith(tn.toLowerCase())
  );
  if (teamMatch) return teamMatch;
  // Fallback: return the display name as-is (user can correct in dropdown)
  return displayName;
}

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

export function ExpenseTracker({ role, onNavigate }: { role: UserRole; onNavigate?: (page: string) => void }) {
  const { profile } = useProfile();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ExpenseStatus | "All">("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCategory, setFormCategory] = useState<ExpenseCategory>("Misc");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formSubmittedBy, setFormSubmittedBy] = useState(resolveSubmitterName(profile?.displayName) || "");
  const [formNotes, setFormNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isLeadership = role === "leadership";

  // Auto-populate submitter when profile loads async
  useEffect(() => {
    if (profile?.displayName && !formSubmittedBy) {
      setFormSubmittedBy(resolveSubmitterName(profile.displayName));
    }
  }, [profile?.displayName]);

  // Fetch expenses
  const loadExpenses = useCallback(async () => {
    try {
      const data = await apiFetch("/expenses");
      setExpenses(data.expenses || []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5MB.");
      return;
    }
    setReceiptFile(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview("");
    }
  };

  // Submit expense
  const handleSubmit = async () => {
    if (!formCategory || !formAmount || parseFloat(formAmount) <= 0) {
      toast.error("Please fill in category and amount");
      return;
    }
    if (!formSubmittedBy.trim()) {
      toast.error("Please select who is submitting");
      return;
    }

    setSubmitting(true);
    try {
      let receipt_base64 = "";
      let receipt_filename = "";

      if (receiptFile) {
        receipt_filename = receiptFile.name;
        const buffer = await receiptFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        receipt_base64 = btoa(binary);
      }

      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          user_id: profile?.id || "",
          submitted_by: formSubmittedBy,
          role_team: role,
          expense_category: formCategory,
          description: formDescription,
          amount: formAmount,
          receipt_base64,
          receipt_filename,
          date_submitted: new Date(formDate + "T00:00:00").toISOString(),
          notes: formNotes,
        }),
      });

      toast.success("Expense submitted successfully");
      setShowForm(false);
      resetForm();
      loadExpenses();
    } catch (err) {
      console.error("Failed to submit expense:", err);
      toast.error("Failed to submit expense");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCategory("Misc");
    setFormDescription("");
    setFormAmount("");
    setFormNotes("");
    setReceiptFile(null);
    setReceiptPreview("");
  };

  // Update expense status (leadership only)
  const handleStatusChange = useCallback(async (expenseId: string, newStatus: ExpenseStatus) => {
    setUpdatingId(expenseId);
    try {
      await apiFetch(`/expenses/${expenseId}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: newStatus,
          approved_by: profile?.displayName || "Leadership",
        }),
      });
      toast.success(`Expense ${newStatus.toLowerCase()} successfully`);
      loadExpenses();
    } catch (err) {
      console.error(`Failed to update expense to ${newStatus}:`, err);
      toast.error(`Failed to update expense status`);
    } finally {
      setUpdatingId(null);
    }
  }, [profile?.displayName, loadExpenses]);

  // Get contextual action buttons for each expense status
  const getStatusActions = (expense: Expense): { label: string; status: ExpenseStatus; color: string; icon: typeof CheckCircle2 }[] => {
    switch (expense.status) {
      case "Pending":
        return [
          { label: "Approve", status: "Approved", color: "#5DA06B", icon: CheckCircle2 },
          { label: "Deny", status: "Denied", color: "#C85050", icon: XCircle },
          { label: "Pay", status: "Paid", color: "#4A7FB5", icon: CreditCard },
        ];
      case "Approved":
        return [
          { label: "Pay", status: "Paid", color: "#4A7FB5", icon: CreditCard },
          { label: "Revert", status: "Pending", color: "#C9A96E", icon: RotateCcw },
        ];
      case "Paid":
        return [
          { label: "Revert", status: "Approved", color: "#5DA06B", icon: RotateCcw },
        ];
      case "Denied":
        return [
          { label: "Revert", status: "Pending", color: "#C9A96E", icon: RotateCcw },
          { label: "Approve", status: "Approved", color: "#5DA06B", icon: CheckCircle2 },
        ];
      default:
        return [];
    }
  };

  // Filtered expenses
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (filterStatus !== "All" && e.status !== filterStatus) return false;
      if (filterCategory !== "All" && e.expense_category !== filterCategory) return false;
      return true;
    });
  }, [expenses, filterStatus, filterCategory]);

  // Running totals
  const totals = useMemo(() => {
    const myExpenses = expenses;
    return {
      total: myExpenses.reduce((s, e) => s + e.amount, 0),
      pending: myExpenses.filter((e) => e.status === "Pending").reduce((s, e) => s + e.amount, 0),
      approved: myExpenses.filter((e) => e.status === "Approved").reduce((s, e) => s + e.amount, 0),
      paid: myExpenses.filter((e) => e.status === "Paid").reduce((s, e) => s + e.amount, 0),
    };
  }, [expenses]);

  // CSV export for leadership
  const exportCSV = useCallback(() => {
    if (filtered.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    const headers = ["Date", "Submitted By", "Category", "Description", "Amount", "Status", "Notes"];
    const rows = filtered.map((e) => [
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
    toast.success(`Exported ${filtered.length} expenses to CSV`);
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gold" />
            <h2 className="text-foreground text-[1.25rem]" style={headingFont}>Expense Tracker</h2>
          </div>
          <div className="flex items-center gap-2">
            {isLeadership && (
              <button
                onClick={exportCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-opacity hover:opacity-80"
                style={{ backgroundColor: "rgba(201,169,110,0.06)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.12)", ...bodyFont }}
                title="Export filtered expenses as CSV for QuickBooks import"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: "rgba(201,169,110,0.1)",
                color: "#C9A96E",
                border: "1px solid rgba(201,169,110,0.2)",
                ...bodyFont,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Expense
            </motion.button>
          </div>
        </div>
        <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
          Submit and track event expenses & reimbursements
        </p>
      </motion.div>

      {/* Running Totals */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Total Submitted", value: totals.total, color: "#C9A96E", icon: DollarSign },
          { label: "Pending", value: totals.pending, color: "#C9A96E", icon: Clock },
          { label: "Approved", value: totals.approved, color: "#5DA06B", icon: CheckCircle2 },
          { label: "Paid Out", value: totals.paid, color: "#4A7FB5", icon: CreditCard },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04, duration: 0.35 }}
            className="bg-card rounded-xl p-3"
            style={{ border: `1px solid ${card.color}15` }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <card.icon className="w-3 h-3" style={{ color: card.color }} />
              <span className="text-muted-foreground text-[0.625rem] uppercase tracking-wide" style={bodyFont}>{card.label}</span>
            </div>
            <p className="text-foreground text-[1.125rem] font-semibold" style={headingFont}>{formatCurrency(card.value)}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.4 }}
        className="flex flex-wrap gap-2"
      >
        <div className="relative">
          <button
            onClick={() => { setStatusDropdownOpen(!statusDropdownOpen); setCategoryDropdownOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{
              backgroundColor: filterStatus !== "All" ? "rgba(201,169,110,0.08)" : "rgba(107,127,142,0.06)",
              color: filterStatus !== "All" ? "#C9A96E" : "var(--muted-foreground)",
              border: `1px solid ${filterStatus !== "All" ? "rgba(201,169,110,0.18)" : "rgba(107,127,142,0.1)"}`,
              ...bodyFont,
            }}
          >
            <Filter className="w-3 h-3" />
            Status: {filterStatus}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {statusDropdownOpen && (
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
                    onClick={() => { setFilterStatus(s); setStatusDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[0.75rem] hover:bg-secondary/50 transition-colors cursor-pointer"
                    style={{ color: s === filterStatus ? "#C9A96E" : "var(--foreground)", ...bodyFont }}
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => { setCategoryDropdownOpen(!categoryDropdownOpen); setStatusDropdownOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{
              backgroundColor: filterCategory !== "All" ? "rgba(93,160,107,0.08)" : "rgba(107,127,142,0.06)",
              color: filterCategory !== "All" ? "#5DA06B" : "var(--muted-foreground)",
              border: `1px solid ${filterCategory !== "All" ? "rgba(93,160,107,0.18)" : "rgba(107,127,142,0.1)"}`,
              ...bodyFont,
            }}
          >
            <Filter className="w-3 h-3" />
            Category: {filterCategory === "All" ? "All" : filterCategory}
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {categoryDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full mt-1 left-0 z-50 bg-card rounded-lg shadow-lg py-1 min-w-[180px]"
                style={{ border: "1px solid rgba(107,127,142,0.12)" }}
              >
                <button
                  onClick={() => { setFilterCategory("All"); setCategoryDropdownOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-[0.75rem] hover:bg-secondary/50 transition-colors cursor-pointer"
                  style={{ color: filterCategory === "All" ? "#5DA06B" : "var(--foreground)", ...bodyFont }}
                >
                  All Categories
                </button>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setFilterCategory(cat); setCategoryDropdownOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[0.75rem] hover:bg-secondary/50 transition-colors cursor-pointer"
                    style={{ color: filterCategory === cat ? "#5DA06B" : "var(--foreground)", ...bodyFont }}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isLeadership && onNavigate && (
          <button
            onClick={() => onNavigate("Finance")}
            className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(93,160,107,0.06)",
              color: "#5DA06B",
              border: "1px solid rgba(93,160,107,0.12)",
              ...bodyFont,
            }}
          >
            Finance Dashboard
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        {!isLeadership && onNavigate && (
          <button
            onClick={() => onNavigate("Reimbursements")}
            className="flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(126,158,120,0.06)",
              color: "#7E9E78",
              border: "1px solid rgba(126,158,120,0.12)",
              ...bodyFont,
            }}
          >
            Reimbursement Info
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </motion.div>

      {/* Expense Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.4 }}
        className="bg-card rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(107,127,142,0.08)" }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: "rgba(201,169,110,0.08)" }}>
              <Receipt className="w-6 h-6" style={{ color: "#C9A96E" }} />
            </div>
            <p className="text-foreground text-[0.875rem] font-medium mb-1" style={bodyFont}>No expenses yet</p>
            <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              {filterStatus !== "All" || filterCategory !== "All" ? "No expenses match your filters" : "Click 'New Expense' to submit your first expense"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop table */}
            <table className="w-full hidden sm:table">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(107,127,142,0.08)" }}>
                  {[...(["Date", "Submitted By", "Category", "Description", "Amount", "Status", "Receipt"] as const), ...(isLeadership ? ["Actions" as const] : [])].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[0.625rem] uppercase tracking-wider text-muted-foreground font-medium" style={bodyFont}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((expense, i) => {
                    const sc = statusConfig[expense.status as ExpenseStatus] || statusConfig.Pending;
                    const StatusIcon = sc.icon;
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
                        <td className="px-4 py-2.5 text-[0.75rem] text-foreground max-w-[200px] truncate" style={bodyFont}>{expense.description || "-"}</td>
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
                          {expense.receipt_url ? (
                            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] hover:opacity-80 transition-opacity" style={{ color: "#4A7FB5", ...bodyFont }}>
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground/30 text-[0.625rem]">-</span>
                          )}
                        </td>
                        {isLeadership && (
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              {updatingId === expense.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                              ) : (
                                getStatusActions(expense).map((action) => {
                                  const ActionIcon = action.icon;
                                  return (
                                    <button
                                      key={action.label}
                                      onClick={() => handleStatusChange(expense.id, action.status)}
                                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                      style={{
                                        backgroundColor: `${action.color}0A`,
                                        color: action.color,
                                        border: `1px solid ${action.color}20`,
                                        ...bodyFont,
                                      }}
                                      title={`${action.label} → ${action.status}`}
                                    >
                                      <ActionIcon className="w-2.5 h-2.5" />
                                      {action.label}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-2 p-3">
              {filtered.map((expense, i) => {
                const sc = statusConfig[expense.status as ExpenseStatus] || statusConfig.Pending;
                const StatusIcon = sc.icon;
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl p-3"
                    style={{ border: "1px solid rgba(107,127,142,0.06)" }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-foreground text-[0.8125rem] font-semibold" style={bodyFont}>{expense.submitted_by}</span>
                      <span
                        className="flex items-center gap-1 text-[0.5625rem] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, ...bodyFont }}
                      >
                        <StatusIcon className="w-2.5 h-2.5" />
                        {expense.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>{expense.expense_category}</span>
                        {expense.description && <p className="text-[0.75rem] text-foreground/80 truncate max-w-[180px]" style={bodyFont}>{expense.description}</p>}
                      </div>
                      <span className="text-foreground text-[1rem] font-semibold" style={headingFont}>{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-muted-foreground/50 text-[0.625rem]" style={bodyFont}>{formatDate(expense.date_submitted)}</span>
                      {expense.receipt_url && (
                        <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-[0.625rem] flex items-center gap-1 hover:opacity-80" style={{ color: "#4A7FB5", ...bodyFont }}>
                          <FileText className="w-3 h-3" /> Receipt
                        </a>
                      )}
                    </div>
                    {isLeadership && (
                      <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: "1px solid rgba(107,127,142,0.06)" }}>
                        {updatingId === expense.id ? (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        ) : (
                          getStatusActions(expense).map((action) => {
                            const ActionIcon = action.icon;
                            return (
                              <button
                                key={action.label}
                                onClick={() => handleStatusChange(expense.id, action.status)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[0.5625rem] cursor-pointer transition-all hover:opacity-80"
                                style={{
                                  backgroundColor: `${action.color}0A`,
                                  color: action.color,
                                  border: `1px solid ${action.color}20`,
                                  ...bodyFont,
                                }}
                              >
                                <ActionIcon className="w-2.5 h-2.5" />
                                {action.label}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* New Expense Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(40,54,24,0.4)", backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10"
              style={{ border: "1px solid rgba(201,169,110,0.12)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(107,127,142,0.08)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(201,169,110,0.08)" }}>
                    <Receipt className="w-4 h-4" style={{ color: "#C9A96E" }} />
                  </div>
                  <h3 className="text-foreground text-[1rem]" style={headingFont}>New Expense</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary/50 transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Submitted By */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Submitted By</label>
                  <select
                    value={formSubmittedBy}
                    onChange={(e) => setFormSubmittedBy(e.target.value)}
                    className="w-full bg-secondary/30 text-foreground text-[0.8125rem] rounded-lg px-3 py-2 outline-none"
                    style={{ border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                  >
                    <option value="">Select person...</option>
                    <optgroup label="Chefs">
                      {CHEF_NAMES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Team">
                      {TEAM_NAMES.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-secondary/30 text-foreground text-[0.8125rem] rounded-lg px-3 py-2 outline-none"
                    style={{ border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Expense Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full bg-secondary/30 text-foreground text-[0.8125rem] rounded-lg px-3 py-2 outline-none"
                    style={{ border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Description</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Round-trip LAX to LAS"
                    className="w-full bg-secondary/30 text-foreground text-[0.8125rem] rounded-lg px-3 py-2 outline-none placeholder:text-muted-foreground/30"
                    style={{ border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Amount (USD)</label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-secondary/30 text-foreground text-[0.8125rem] rounded-lg pl-8 pr-3 py-2 outline-none placeholder:text-muted-foreground/30"
                      style={{ border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Notes (optional)</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Additional details..."
                    rows={2}
                    className="w-full bg-secondary/30 text-foreground text-[0.8125rem] rounded-lg px-3 py-2 outline-none placeholder:text-muted-foreground/30 resize-none"
                    style={{ border: "1px solid rgba(107,127,142,0.12)", ...bodyFont }}
                  />
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground uppercase tracking-wide mb-1 block" style={bodyFont}>Receipt (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {receiptFile ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(93,160,107,0.06)", border: "1px solid rgba(93,160,107,0.12)" }}>
                      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "#5DA06B" }} />
                      <span className="text-[0.75rem] text-foreground truncate flex-1" style={bodyFont}>{receiptFile.name}</span>
                      <button onClick={() => { setReceiptFile(null); setReceiptPreview(""); }} className="cursor-pointer hover:opacity-80">
                        <X className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-[0.75rem] cursor-pointer transition-colors hover:bg-secondary/50"
                      style={{ border: "1px dashed rgba(107,127,142,0.2)", color: "var(--muted-foreground)", ...bodyFont }}
                    >
                      <Upload className="w-4 h-4" />
                      Upload receipt (image or PDF)
                    </button>
                  )}
                  {receiptPreview && (
                    <img src={receiptPreview} alt="Receipt preview" className="mt-2 rounded-lg max-h-32 object-cover" />
                  )}
                  <p className="text-[0.5625rem] text-muted-foreground/50 mt-1.5 leading-relaxed" style={bodyFont}>
                    Tip: Forward receipts to <span className="text-muted-foreground/70">receipts@qbooks.intuit.com</span> for QuickBooks sync
                  </p>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[0.875rem] font-medium cursor-pointer transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: "rgba(201,169,110,0.12)",
                    color: "#C9A96E",
                    border: "1px solid rgba(201,169,110,0.25)",
                    ...bodyFont,
                  }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  {submitting ? "Submitting..." : "Submit Expense"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}