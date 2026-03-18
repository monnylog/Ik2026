import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { TrendingUp, Users, MessageCircle, Brain, Heart, Loader2, RefreshCw } from "lucide-react";
import { apiFetch } from "../../lib/supabase";
import { bodyFont, headingFont } from "../../lib/fonts";

interface EngagementMetrics {
  triviaAnswered: number;
  memoriesShared: number;
  messagesPosted: number;
  activeUsers: number;
  totalInteractions: number;
}

export function EngagementMetrics() {
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await apiFetch("/analytics/engagement-summary");
      setMetrics(data.metrics);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load engagement metrics:", err);
      if (!metrics) {
        setMetrics({
          triviaAnswered: 0,
          memoriesShared: 0,
          messagesPosted: 0,
          activeUsers: 0,
          totalInteractions: 0,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => fetchMetrics(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-gold" />
      </div>
    );
  }

  if (!metrics) return null;

  const stats = [
    {
      label: "Trivia Answered",
      value: metrics.triviaAnswered,
      icon: Brain,
      color: "#3B6298",
      bg: "rgba(59,98,152,0.08)",
    },
    {
      label: "Memories Shared",
      value: metrics.memoriesShared,
      icon: Heart,
      color: "#C9A96E",
      bg: "rgba(201,169,110,0.08)",
    },
    {
      label: "Messages Posted",
      value: metrics.messagesPosted,
      icon: MessageCircle,
      color: "#2E4F52",
      bg: "rgba(46,79,82,0.08)",
    },
    {
      label: "Active Users",
      value: metrics.activeUsers,
      icon: Users,
      color: "#7E9E78",
      bg: "rgba(126,158,120,0.08)",
    },
  ];

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
          style={{ backgroundColor: "rgba(201,169,110,0.08)" }}
        >
          <TrendingUp className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
        </div>
        <h3 className="text-foreground text-[0.9375rem] flex-1" style={headingFont}>
          Engagement Metrics
        </h3>
        <button
          onClick={() => fetchMetrics(true)}
          disabled={refreshing}
          className="p-1 rounded hover:bg-muted/50 transition-colors disabled:opacity-40"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-3 h-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
        </button>
        <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>
          {lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Last 7 days"}
        </span>
      </div>

      {/* Stats grid */}
      <div className="p-5 space-y-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: stat.bg }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[0.6875rem] text-muted-foreground mb-0.5" style={bodyFont}>
                  {stat.label}
                </p>
                <p className="text-foreground text-[1.125rem] font-semibold" style={headingFont}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}

        {/* Total interactions */}
        <div
          className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between"
        >
          <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
            Total Interactions
          </span>
          <span className="text-[1rem] font-semibold" style={{ ...headingFont, color: "#C9A96E" }}>
            {metrics.totalInteractions.toLocaleString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
}