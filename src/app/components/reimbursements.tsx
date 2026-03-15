import { useState } from "react";
import { motion } from "motion/react";
import {
  Receipt,
  ExternalLink,
  ArrowRight,
  FileText,
  CheckCircle2,
  Clock,
  CreditCard,
  Send,
  Info,
  Maximize2,
  Minimize2,
  Mail,
} from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

const EXPENSE_FORM_URL = "https://docs.google.com/forms/d/1h3iMlUVQ-YfVazDIBKdH_pR4BDjk1S2UKpFUvBYNotg/viewform";
const TRACKER_SHEET_URL = "https://docs.google.com/spreadsheets/d/13l95vLKDvOvrgjwRtXY05T8Y2QGa_Uh8ntNP2SKsr9U/edit#gid=431459323";
const TRACKER_EMBED_URL = "https://docs.google.com/spreadsheets/d/13l95vLKDvOvrgjwRtXY05T8Y2QGa_Uh8ntNP2SKsr9U/htmlview?gid=431459323&widget=true";

const workflowSteps = [
  {
    icon: Send,
    label: "Submit Expense",
    description: "Fill out the Google Form with expense details & receipt",
    color: "#C9A96E",
  },
  {
    icon: FileText,
    label: "Auto-Upload",
    description: "Receipt auto-uploads to shared Google Drive folder",
    color: "#5DA06B",
  },
  {
    icon: CheckCircle2,
    label: "Finance Review",
    description: "Finance team reviews & approves in Google Sheets",
    color: "#4A7FB5",
  },
  {
    icon: CreditCard,
    label: "Reimbursement",
    description: "Status updates visible below — payment via Zelle/Venmo",
    color: "#7E9E78",
  },
];

interface ReimbursementsProps {
  onNavigate?: (page: string) => void;
}

export function Reimbursements({ onNavigate }: ReimbursementsProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <Receipt className="w-5 h-5" style={{ color: "#C9A96E" }} />
          <h2 className="text-foreground text-[1.25rem]" style={headingFont}>
            Reimbursements
          </h2>
        </div>
        <p
          className="text-muted-foreground text-[0.8125rem] leading-relaxed max-w-2xl"
          style={bodyFont}
        >
          Submit event expenses for reimbursement and track your submission status.
          All receipts are automatically organized in the shared Drive.
        </p>
      </motion.div>

      {/* Submit CTA */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.4 }}
      >
        <a
          href={EXPENSE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between p-5 rounded-xl transition-all duration-200 no-underline"
          style={{
            background: "linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(93,160,107,0.06) 100%)",
            border: "1px solid rgba(201,169,110,0.18)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.08))",
                border: "1px solid rgba(201,169,110,0.2)",
              }}
            >
              <Send className="w-5 h-5" style={{ color: "#C9A96E" }} />
            </div>
            <div>
              <h3
                className="text-foreground text-[1rem] mb-0.5"
                style={headingFont}
              >
                Submit New Expense
              </h3>
              <p
                className="text-muted-foreground text-[0.75rem]"
                style={bodyFont}
              >
                Opens the expense submission form in a new tab — attach your receipt photo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden sm:inline text-[0.6875rem] px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: "rgba(201,169,110,0.08)",
                color: "#C9A96E",
                border: "1px solid rgba(201,169,110,0.15)",
                ...bodyFont,
              }}
            >
              Google Form
            </span>
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              style={{ color: "#C9A96E" }}
            />
          </div>
        </a>
      </motion.div>

      {/* Workflow Steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-card rounded-xl p-5"
        style={{ border: "1px solid rgba(107,127,142,0.08)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-3.5 h-3.5" style={{ color: "#6B7F8E" }} />
          <h3
            className="text-foreground text-[0.875rem]"
            style={headingFont}
          >
            How It Works
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {workflowSteps.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + idx * 0.05 }}
                className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center p-3 rounded-lg"
                style={{ backgroundColor: `${step.color}04` }}
              >
                {/* Step number + icon */}
                <div className="relative shrink-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: `${step.color}0A`,
                      border: `1px solid ${step.color}18`,
                    }}
                  >
                    <StepIcon className="w-4.5 h-4.5" style={{ color: step.color }} />
                  </div>
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[0.5rem] font-bold"
                    style={{
                      backgroundColor: step.color,
                      color: "#1a1a1a",
                    }}
                  >
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <p
                    className="text-foreground text-[0.75rem] font-medium mb-0.5"
                    style={bodyFont}
                  >
                    {step.label}
                  </p>
                  <p
                    className="text-muted-foreground text-[0.625rem] leading-relaxed"
                    style={bodyFont}
                  >
                    {step.description}
                  </p>
                </div>
                {/* Connector arrow (desktop only, not on last item) */}
                {idx < workflowSteps.length - 1 && (
                  <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-3 h-3 text-muted-foreground/20" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Reimbursement Tracker Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgba(93,160,107,0.15)",
            boxShadow: "0 4px 20px rgba(93,160,107,0.04)",
          }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              background: "linear-gradient(90deg, rgba(93,160,107,0.06), rgba(93,160,107,0.02))",
              borderBottom: "1px solid rgba(93,160,107,0.1)",
            }}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: "#5DA06B" }} />
              <span
                className="text-foreground text-[0.8125rem]"
                style={headingFont}
              >
                Reimbursement Tracker
              </span>
              <span
                className="text-[0.5625rem] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(93,160,107,0.06)",
                  color: "#5DA06B",
                  border: "1px solid rgba(93,160,107,0.12)",
                  ...bodyFont,
                }}
              >
                Live
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSheetExpanded(!sheetExpanded)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                aria-label={sheetExpanded ? "Collapse" : "Expand"}
              >
                {sheetExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={TRACKER_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50 transition-colors"
                aria-label="Open in Google Sheets"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Embedded Sheet */}
          <div
            style={{
              height: sheetExpanded ? "80vh" : "480px",
              transition: "height 0.3s ease",
            }}
          >
            <iframe
              src={TRACKER_EMBED_URL}
              width="100%"
              height="100%"
              className="border-0"
              style={{
                backgroundColor: "#fff",
                borderRadius: "0 0 0.75rem 0.75rem",
              }}
              title="Reimbursement Tracker"
              loading="lazy"
            >
              Loading tracker…
            </iframe>
          </div>
        </div>

        {/* Fallback link below iframe */}
        <div className="flex items-center justify-center mt-2">
          <a
            href={TRACKER_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[0.6875rem] hover:opacity-80 transition-opacity"
            style={{ color: "#5DA06B", ...bodyFont }}
          >
            <ExternalLink className="w-3 h-3" />
            Open Reimbursement Tracker in Google Sheets
          </a>
        </div>
      </motion.div>

      {/* QuickBooks Tip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{
          backgroundColor: "rgba(74,127,181,0.04)",
          border: "1px solid rgba(74,127,181,0.1)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: "rgba(74,127,181,0.08)",
            border: "1px solid rgba(74,127,181,0.12)",
          }}
        >
          <Mail className="w-4 h-4" style={{ color: "#4A7FB5" }} />
        </div>
        <div>
          <p
            className="text-foreground text-[0.75rem] font-medium mb-0.5"
            style={bodyFont}
          >
            QuickBooks Auto-Sync
          </p>
          <p
            className="text-muted-foreground text-[0.6875rem] leading-relaxed"
            style={bodyFont}
          >
            Forward receipts to{" "}
            <span
              className="font-medium"
              style={{ color: "#4A7FB5" }}
            >
              receipts@qbooks.intuit.com
            </span>{" "}
            for automatic sync with our QuickBooks account. Include the expense
            category in the subject line for faster processing.
          </p>
        </div>
      </motion.div>

      {/* Quick links row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.32 }}
        className="flex flex-wrap gap-2"
      >
        {onNavigate && (
          <button
            onClick={() => onNavigate("Expenses")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(201,169,110,0.06)",
              color: "#C9A96E",
              border: "1px solid rgba(201,169,110,0.12)",
              ...bodyFont,
            }}
          >
            <Receipt className="w-3 h-3" />
            Expense Tracker
          </button>
        )}
        {onNavigate && (
          <button
            onClick={() => onNavigate("Finance")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(93,160,107,0.06)",
              color: "#5DA06B",
              border: "1px solid rgba(93,160,107,0.12)",
              ...bodyFont,
            }}
          >
            <CheckCircle2 className="w-3 h-3" />
            Finance Dashboard
          </button>
        )}
        <a
          href={EXPENSE_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] hover:opacity-80 transition-opacity no-underline"
          style={{
            backgroundColor: "rgba(74,127,181,0.06)",
            color: "#4A7FB5",
            border: "1px solid rgba(74,127,181,0.12)",
            ...bodyFont,
          }}
        >
          <ExternalLink className="w-3 h-3" />
          Expense Form
        </a>
      </motion.div>
    </div>
  );
}
