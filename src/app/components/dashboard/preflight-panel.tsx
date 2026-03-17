import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Rocket,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  Database,
  Shield,
  Globe,
  Users,
  FileText,
  HardDrive,
  Download,
  Zap,
} from "lucide-react";
import { runPreflightCheck, type PreflightResult, type PreflightCheck } from "../../lib/api-tools";
import { downloadFullExport } from "../../lib/api-tools";
import { apiError, exportToast, preflightToast } from "../../lib/api-toast";
import { bodyFont, headingFont } from "../../lib/fonts";

const checkMeta: Record<
  string,
  { label: string; icon: typeof Database; description: string }
> = {
  kvStore: {
    label: "KV Store",
    icon: Database,
    description: "Supabase key-value storage for app data",
  },
  supabaseAuth: {
    label: "Auth Service",
    icon: Shield,
    description: "User authentication and session management",
  },
  supabaseStorage: {
    label: "File Storage",
    icon: HardDrive,
    description: "Photo uploads and receipt storage buckets",
  },
  notionApi: {
    label: "Notion API",
    icon: Globe,
    description: "Notion integration bot connection",
  },
  notionContent: {
    label: "Content Sync",
    icon: Zap,
    description: "11 content types mapped to Notion databases",
  },
  profiles: {
    label: "User Profiles",
    icon: Users,
    description: "Registered team, chef, and leadership accounts",
  },
  formUrls: {
    label: "Form URLs",
    icon: FileText,
    description: "Google Form/Doc production URLs",
  },
};

export function PreflightPanel() {
  const [result, setResult] = useState<PreflightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);

  const runCheck = useCallback(async () => {
    setLoading(true);
    try {
      const res = await runPreflightCheck();
      setResult(res);
      setExpanded(true);
      preflightToast(res.score, res.ready);
    } catch (err: any) {
      apiError("Pre-flight check failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await downloadFullExport();
      exportToast();
    } catch (err: any) {
      apiError("Export failed", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const statusIcon = (check: PreflightCheck) => {
    if (check.ok) return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />;
    if (check.error) return <XCircle className="w-3.5 h-3.5" style={{ color: "#A45A46" }} />;
    return <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(74,127,181,0.12)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(74,127,181,0.04) 0%, rgba(74,127,181,0.02) 100%)",
          borderBottom: "1px solid rgba(74,127,181,0.08)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(74,127,181,0.08)" }}
            >
              <Rocket className="w-3.5 h-3.5" style={{ color: "#4A7FB5" }} />
            </div>
            <h3 className="text-foreground" style={headingFont}>
              Pre-flight Check
            </h3>
            {result && (
              <span
                className="text-[0.625rem] px-2 py-0.5 rounded-full font-mono"
                style={{
                  backgroundColor: result.ready
                    ? "rgba(126,158,120,0.12)"
                    : "rgba(201,169,110,0.12)",
                  color: result.ready ? "#7E9E78" : "#C9A96E",
                }}
              >
                {result.score}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-[0.6875rem] disabled:opacity-50"
              style={{
                backgroundColor: "rgba(126,158,120,0.06)",
                color: "#7E9E78",
                border: "1px solid rgba(126,158,120,0.12)",
                ...bodyFont,
              }}
              title="Download full data backup"
            >
              {exporting ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              Export
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={runCheck}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer text-[0.6875rem] disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #4A7FB5, #3d6d9f)",
                color: "#F5F0E8",
                border: "1px solid rgba(74,127,181,0.3)",
                fontWeight: 600,
                ...bodyFont,
              }}
            >
              {loading ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Rocket className="w-3 h-3" />
              )}
              {loading ? "Checking…" : result ? "Re-check" : "Run Check"}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1.5">
              {Object.entries(result.checks).map(([key, check]) => {
                const meta = checkMeta[key] || {
                  label: key,
                  icon: Database,
                  description: "",
                };
                const Icon = meta.icon;

                return (
                  <div
                    key={key}
                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg"
                    style={{
                      backgroundColor: check.ok
                        ? "rgba(126,158,120,0.03)"
                        : check.error
                          ? "rgba(164,90,70,0.03)"
                          : "rgba(201,169,110,0.03)",
                    }}
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">{statusIcon(check)}</div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className="w-3 h-3 text-muted-foreground/40" />
                        <span
                          className="text-foreground text-[0.8125rem]"
                          style={bodyFont}
                        >
                          {meta.label}
                        </span>
                        {check.latencyMs !== undefined && (
                          <span className="text-[0.5625rem] text-muted-foreground/30 font-mono">
                            {check.latencyMs}ms
                          </span>
                        )}
                      </div>
                      <p
                        className="text-[0.6875rem] leading-relaxed"
                        style={{
                          color: check.ok ? "#7E9E78" : check.error ? "#A45A46" : "#C9A96E",
                          ...bodyFont,
                        }}
                      >
                        {check.detail || check.error || meta.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timestamp */}
            <div className="px-5 pb-3 flex items-center justify-between">
              <span
                className="text-[0.5625rem] text-muted-foreground/30"
                style={bodyFont}
              >
                v{result.version} • Checked{" "}
                {new Date(result.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-[0.625rem] text-muted-foreground/40 cursor-pointer hover:text-muted-foreground/60 flex items-center gap-1"
                style={bodyFont}
              >
                Collapse
                <ChevronDown className="w-3 h-3 rotate-180" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed summary */}
      {result && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            {result.ready ? (
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#7E9E78" }} />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
            )}
            <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
              {result.ready ? "All systems go" : `${result.score} checks passed`}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-muted-foreground/30" />
        </button>
      )}
    </motion.div>
  );
}