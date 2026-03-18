import { useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  Database,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileJson,
  Shield,
} from "lucide-react";
import { apiFetch } from "../../lib/supabase";
import { bodyFont, headingFont } from "../../lib/fonts";

interface BackupResult {
  exportedAt: string;
  version: string;
  counts: Record<string, number>;
}

export function DataBackup() {
  const [downloading, setDownloading] = useState(false);
  const [lastBackup, setLastBackup] = useState<BackupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setError(null);
    try {
      const data = await apiFetch("/export/full");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ik26-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastBackup({
        exportedAt: data.exportedAt,
        version: data.version,
        counts: data.counts,
      });
    } catch (err: any) {
      console.error("Backup failed:", err);
      setError(err.message || "Backup failed");
    } finally {
      setDownloading(false);
    }
  }, []);

  const totalRecords = lastBackup
    ? Object.values(lastBackup.counts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "rgba(46,79,82,0.08)" }}
        >
          <Database className="w-3.5 h-3.5" style={{ color: "#2E4F52" }} />
        </div>
        <h3
          className="text-foreground text-[0.9375rem] flex-1"
          style={headingFont}
        >
          Data Backup
        </h3>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-muted-foreground/50" />
          <span
            className="text-[0.5625rem] text-muted-foreground/50"
            style={bodyFont}
          >
            Leadership only
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Download button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleDownload}
          disabled={downloading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-[0.8125rem] font-medium cursor-pointer disabled:opacity-50 transition-all"
          style={{ backgroundColor: "#2E4F52", ...bodyFont }}
        >
          {downloading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Exporting data...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Full Backup (JSON)
            </>
          )}
        </motion.button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span
              className="text-[0.75rem] text-red-600 dark:text-red-400"
              style={bodyFont}
            >
              {error}
            </span>
          </div>
        )}

        {/* Last backup info */}
        {lastBackup && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "#7E9E78" }}
              />
              <span
                className="text-[0.75rem] text-muted-foreground"
                style={bodyFont}
              >
                Backup downloaded at{" "}
                {new Date(lastBackup.exportedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(lastBackup.counts).map(([key, count]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "rgba(46,79,82,0.04)" }}
                >
                  <FileJson
                    className="w-3 h-3 shrink-0"
                    style={{ color: "#4E8282" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[0.625rem] text-muted-foreground capitalize truncate"
                      style={bodyFont}
                    >
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </p>
                    <p
                      className="text-[0.875rem] font-semibold text-foreground"
                      style={headingFont}
                    >
                      {count}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span
                className="text-[0.6875rem] text-muted-foreground"
                style={bodyFont}
              >
                Total records
              </span>
              <span
                className="text-[0.875rem] font-semibold"
                style={{ ...headingFont, color: "#2E4F52" }}
              >
                {totalRecords.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        {!lastBackup && !error && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/10">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p
              className="text-[0.6875rem] text-muted-foreground leading-relaxed"
              style={bodyFont}
            >
              Downloads all profiles, messages, submissions, engagement data,
              and Notion config as a single JSON file. Recommended before major
              changes.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
