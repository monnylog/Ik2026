import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  ChevronDown,
  Server,
  Zap,
} from "lucide-react";
import { useHealthCheck, type HealthStatus } from "../../lib/use-health-check";
import { bodyFont, headingFont } from "../../lib/fonts";

const statusConfig: Record<
  HealthStatus,
  { label: string; color: string; bgColor: string; icon: typeof Activity }
> = {
  checking: {
    label: "Checking",
    color: "#8A857F",
    bgColor: "rgba(138,133,127,0.08)",
    icon: RefreshCw,
  },
  healthy: {
    label: "All Systems Go",
    color: "#7E9E78",
    bgColor: "rgba(126,158,120,0.06)",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Slow Response",
    color: "#C9A96E",
    bgColor: "rgba(201,169,110,0.06)",
    icon: AlertTriangle,
  },
  offline: {
    label: "Offline",
    color: "#A45A46",
    bgColor: "rgba(164,90,70,0.06)",
    icon: WifiOff,
  },
};

export function BackendHealthIndicator() {
  const { status, latencyMs, lastChecked, error, recheck } = useHealthCheck(true);
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-secondary/30"
        style={bodyFont}
        aria-expanded={expanded}
        aria-label={`Backend status: ${cfg.label}`}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: cfg.bgColor }}
        >
          <StatusIcon
            className={`w-3 h-3 ${status === "checking" ? "animate-spin" : ""}`}
            style={{ color: cfg.color }}
          />
        </div>
        <span
          className="text-[0.6875rem] text-muted-foreground flex-1 text-left"
          style={bodyFont}
        >
          {cfg.label}
        </span>
        {latencyMs !== null && status === "healthy" && (
          <span
            className="text-[0.5625rem] text-muted-foreground/40"
            style={bodyFont}
          >
            {latencyMs}ms
          </span>
        )}
        <ChevronDown
          className={`w-3 h-3 text-muted-foreground/30 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mx-2 mt-1 p-3 rounded-lg space-y-2.5"
              style={{
                backgroundColor: cfg.bgColor,
                border: `1px solid ${cfg.color}15`,
              }}
            >
              {/* Status rows */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Server className="w-3 h-3 text-muted-foreground/40" />
                  <span
                    className="text-[0.625rem] text-muted-foreground/60"
                    style={bodyFont}
                  >
                    Edge Function
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        status === "healthy"
                          ? "#7E9E78"
                          : status === "degraded"
                            ? "#C9A96E"
                            : status === "offline"
                              ? "#A45A46"
                              : "#8A857F",
                    }}
                  />
                  <span
                    className="text-[0.625rem]"
                    style={{ color: cfg.color, ...bodyFont }}
                  >
                    {cfg.label}
                  </span>
                </div>
              </div>

              {latencyMs !== null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-muted-foreground/40" />
                    <span
                      className="text-[0.625rem] text-muted-foreground/60"
                      style={bodyFont}
                    >
                      Latency
                    </span>
                  </div>
                  <span
                    className="text-[0.625rem] font-mono"
                    style={{ color: cfg.color }}
                  >
                    {latencyMs}ms
                  </span>
                </div>
              )}

              {lastChecked && (
                <div className="flex items-center justify-between">
                  <span
                    className="text-[0.5625rem] text-muted-foreground/40"
                    style={bodyFont}
                  >
                    Last checked
                  </span>
                  <span
                    className="text-[0.5625rem] text-muted-foreground/40"
                    style={bodyFont}
                  >
                    {lastChecked.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {error && (
                <p
                  className="text-[0.5625rem] font-mono break-all"
                  style={{ color: "#A45A46" }}
                >
                  {error}
                </p>
              )}

              {/* Recheck button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  recheck();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md cursor-pointer text-[0.625rem]"
                style={{
                  backgroundColor: "rgba(126,158,120,0.08)",
                  color: "#7E9E78",
                  border: "1px solid rgba(126,158,120,0.12)",
                  ...bodyFont,
                }}
                disabled={status === "checking"}
              >
                <RefreshCw
                  className={`w-2.5 h-2.5 ${status === "checking" ? "animate-spin" : ""}`}
                />
                {status === "checking" ? "Checking…" : "Re-check"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}