import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  Download,
  X,
  ChefHat,
  CalendarDays,
  Users,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { confirmedChefs } from "../onboarding/chef-directory";
import { apiFetch } from "../../lib/supabase";
import { useNotion } from "../../lib/notion-context";
import { bodyFont, headingFont } from "../../lib/fonts";

interface ExportSummaryProps {
  onClose: () => void;
}

export function ExportSummary({ onClose }: ExportSummaryProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { milestones, stats, isLive } = useNotion();
  const [submissionStats, setSubmissionStats] = useState<any>(null);
  const [profileCount, setProfileCount] = useState(0);
  const [engagementStats, setEngagementStats] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const [subRes, profRes, engRes] = await Promise.allSettled([
          apiFetch("/submission-stats"),
          apiFetch("/admin/profiles"),
          apiFetch("/engagement-stats"),
        ]);
        if (subRes.status === "fulfilled") setSubmissionStats(subRes.value);
        if (profRes.status === "fulfilled") setProfileCount(profRes.value?.profiles?.length || 0);
        if (engRes.status === "fulfilled") setEngagementStats(engRes.value);
      } catch {}
    })();
  }, []);

  const handlePrint = useCallback(() => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Isang Kusina 2026 — Event Summary</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; color: #283618; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 4px; color: #7E9E78; }
          h2 { font-size: 16px; margin: 24px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #CDA88A; color: #7E9E78; }
          h3 { font-size: 13px; margin-bottom: 4px; color: #7E9E78; }
          p { font-size: 12px; line-height: 1.6; color: #6B6952; }
          .subtitle { font-size: 13px; color: #6B6952; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
          .card { padding: 12px 16px; border: 1px solid #E6E0D2; border-radius: 8px; background: #FAFAF5; }
          .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6952; margin-bottom: 4px; }
          .card-value { font-size: 20px; font-weight: 600; color: #7E9E78; }
          .card-sub { font-size: 10px; color: #6B6952; margin-top: 2px; }
          .chef-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #F0EDE6; }
          .chef-row:last-child { border-bottom: none; }
          .chef-course { width: 28px; height: 28px; border-radius: 6px; background: #F0EDE6; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #7E9E78; flex-shrink: 0; }
          .milestone-row { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; border-bottom: 1px solid #F0EDE6; }
          .milestone-row:last-child { border-bottom: none; }
          .status-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
          .status-done { background: #7E9E78; }
          .status-progress { background: #CDA88A; }
          .status-critical { background: #C75B3F; }
          .status-upcoming { background: #D0CCC0; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E6E0D2; text-align: center; font-size: 10px; color: #A0997E; }
          @media print { body { padding: 20px; } @page { margin: 1cm; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }, []);

  const today = new Date("2026-03-11");
  const eventDate = new Date("2026-05-22");
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Milestone stats
  const criticalMilestones = milestones.filter((m) =>
    m.status?.includes("CRITICAL") || m.status?.includes("Overdue")
  );
  const doneMilestones = milestones.filter((m) => m.status?.includes("Done"));
  const inProgressMilestones = milestones.filter((m) => m.status?.includes("In Progress"));
  const overdueMilestones = milestones.filter((m) => m.status?.includes("Overdue"));

  // Phase-level breakdown
  const weekPhases = [
    { label: "Week 1: Launch", week: "Week 1: Launch", start: "2026-03-07", end: "2026-03-14" },
    { label: "Week 2: Numbers", week: "Week 2: Numbers", start: "2026-03-14", end: "2026-03-21" },
    { label: "Week 3: Go Live", week: "Week 3: Go Live", start: "2026-03-21", end: "2026-03-28" },
    { label: "Week 4: Lock", week: "Week 4: Lock", start: "2026-03-28", end: "2026-04-07" },
    { label: "Weeks 5-6: Build", week: "Weeks 5-6: Build", start: "2026-04-07", end: "2026-04-28" },
    { label: "Weeks 7-8: Rehearse", week: "Weeks 7-8: Rehearse", start: "2026-04-18", end: "2026-05-02" },
    { label: "Weeks 9-10: Final Sprint", week: "Weeks 9-10: Final Sprint", start: "2026-05-01", end: "2026-05-23" },
  ];

  const phaseBreakdowns = weekPhases.map((phase) => {
    const phaseMilestones = milestones.filter((m) => {
      if (m.week === phase.week) return true;
      if (m.dueDate && m.dueDate >= phase.start && m.dueDate < phase.end) return true;
      return false;
    });
    const done = phaseMilestones.filter((m) => m.status?.includes("Done")).length;
    const total = phaseMilestones.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const hasCritical = phaseMilestones.some((m) => m.status?.includes("CRITICAL") || m.status?.includes("Overdue"));
    return { ...phase, done, total, pct, hasCritical };
  }).filter((p) => p.total > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-card rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-gold" />
              <h2 className="text-foreground text-[1rem]" style={headingFont}>
                Export Event Summary
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] text-white cursor-pointer"
                style={{ backgroundColor: "#7E9E78", ...bodyFont }}
              >
                <Download className="w-3.5 h-3.5" />
                Print / Save PDF
              </motion.button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto p-5">
            <div ref={printRef}>
              <h1>Isang Kusina 2026</h1>
              <p className="subtitle">Event Summary — Generated March 11, 2026 | {daysUntil} days to event</p>

              <h2>Overview</h2>
              <div className="grid">
                <div className="card">
                  <div className="card-label">Event Date</div>
                  <div className="card-value">May 22, 2026</div>
                  <div className="card-sub">Las Vegas, NV</div>
                </div>
                <div className="card">
                  <div className="card-label">Days Remaining</div>
                  <div className="card-value">{daysUntil}</div>
                  <div className="card-sub">From today</div>
                </div>
                <div className="card">
                  <div className="card-label">Team Members</div>
                  <div className="card-value">{profileCount}</div>
                  <div className="card-sub">Active profiles</div>
                </div>
                <div className="card">
                  <div className="card-label">Milestones</div>
                  <div className="card-value">{isLive ? stats.total : "—"}</div>
                  <div className="card-sub">{isLive ? `${stats.completionPct}% complete` : "Notion not synced"}</div>
                </div>
              </div>

              <h2>Chef Roster</h2>
              {confirmedChefs.map((chef) => (
                <div key={chef.id} className="chef-row">
                  <div className="chef-course">{chef.course}</div>
                  <div>
                    <h3>{chef.name}</h3>
                    <p>{chef.courseTitle} — {chef.signatureDish}</p>
                    <p style={{ fontSize: "10px" }}>{chef.city}{chef.state ? `, ${chef.state}` : ""} | Specialties: {chef.specialties.join(", ")}</p>
                  </div>
                </div>
              ))}

              <h2>Submission Status</h2>
              <div className="grid-3">
                <div className="card">
                  <div className="card-label">Completion Rate</div>
                  <div className="card-value">{submissionStats?.completionRate ?? "—"}%</div>
                </div>
                <div className="card">
                  <div className="card-label">Concepts Submitted</div>
                  <div className="card-value">{submissionStats?.conceptCount ?? "—"}/{submissionStats?.totalChefs ?? "—"}</div>
                </div>
                <div className="card">
                  <div className="card-label">Ingredients Filed</div>
                  <div className="card-value">{submissionStats?.ingredientCount ?? "—"}/{submissionStats?.totalChefs ?? "—"}</div>
                </div>
              </div>

              {engagementStats && (
                <>
                  <h2>Engagement Summary</h2>
                  <div className="grid">
                    <div className="card">
                      <div className="card-label">Chat Messages</div>
                      <div className="card-value">{engagementStats.chatMessages}</div>
                    </div>
                    <div className="card">
                      <div className="card-label">Prompt Responses</div>
                      <div className="card-value">{engagementStats.promptResponses}</div>
                    </div>
                    <div className="card">
                      <div className="card-label">Memory Wall Posts</div>
                      <div className="card-value">{engagementStats.memoryWallPosts}</div>
                    </div>
                    <div className="card">
                      <div className="card-label">Flavor Fusion Ideas</div>
                      <div className="card-value">{engagementStats.flavorFusionIdeas}</div>
                    </div>
                  </div>
                </>
              )}

              {isLive && (
                <>
                  <h2>Milestone Progress</h2>
                  <div className="grid">
                    <div className="card">
                      <div className="card-label">Completed</div>
                      <div className="card-value" style={{ color: "#7E9E78" }}>{stats.done}</div>
                    </div>
                    <div className="card">
                      <div className="card-label">In Progress</div>
                      <div className="card-value" style={{ color: "#CDA88A" }}>{stats.inProgress}</div>
                    </div>
                    <div className="card">
                      <div className="card-label">Critical / Overdue</div>
                      <div className="card-value" style={{ color: "#C75B3F" }}>{stats.critical + stats.overdue}</div>
                    </div>
                    <div className="card">
                      <div className="card-label">Upcoming</div>
                      <div className="card-value" style={{ color: "#6B7F8E" }}>{stats.upcoming}</div>
                    </div>
                  </div>
                </>
              )}

              {isLive && phaseBreakdowns.length > 0 && (
                <>
                  <h2>Phase-by-Phase Completion</h2>
                  {phaseBreakdowns.map((phase) => (
                    <div key={phase.label} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 0", borderBottom: "1px solid #F0EDE6" }}>
                      <div style={{ width: "140px", fontSize: "11px", color: phase.hasCritical ? "#C75B3F" : "#7E9E78", fontWeight: 500 }}>
                        {phase.label}
                      </div>
                      <div style={{ flex: 1, height: "8px", borderRadius: "4px", background: "#F0EDE6", overflow: "hidden" }}>
                        <div style={{
                          width: `${phase.pct}%`,
                          height: "100%",
                          borderRadius: "4px",
                          background: phase.pct === 100 ? "#7E9E78" : phase.hasCritical ? "#C75B3F" : "#CDA88A",
                        }} />
                      </div>
                      <div style={{ width: "70px", fontSize: "10px", color: "#6B6952", textAlign: "right" }}>
                        {phase.done}/{phase.total} ({phase.pct}%)
                      </div>
                    </div>
                  ))}
                </>
              )}

              {isLive && overdueMilestones.length > 0 && (
                <>
                  <h2>Overdue Items ({overdueMilestones.length})</h2>
                  {overdueMilestones.map((m) => (
                    <div key={m.id} className="milestone-row">
                      <div className="status-dot" style={{ background: "#C75B3F" }} />
                      <div>
                        <h3>{m.milestone}</h3>
                        <p>
                          {m.dueDate ? `Due: ${m.dueDate}` : ""}
                          {m.owner ? ` · Owner: ${m.owner}` : ""}
                          {m.division ? ` · ${m.division}` : ""}
                        </p>
                        {m.blocksAndDeps && <p style={{ fontStyle: "italic", color: "#C75B3F" }}>Blocker: {m.blocksAndDeps}</p>}
                      </div>
                    </div>
                  ))}
                </>
              )}

              <h2>Budget Overview (Estimated)</h2>
              <div className="grid">
                <div className="card">
                  <div className="card-label">Target Revenue</div>
                  <div className="card-value">$38,000</div>
                  <div className="card-sub">150 guests × $250 avg</div>
                </div>
                <div className="card">
                  <div className="card-label">Projected Costs</div>
                  <div className="card-value">$32,500</div>
                  <div className="card-sub">Venue + F&B + Travel + AV</div>
                </div>
                <div className="card">
                  <div className="card-label">Net Margin</div>
                  <div className="card-value" style={{ color: "#7E9E78" }}>$5,500</div>
                  <div className="card-sub">14.5% margin</div>
                </div>
                <div className="card">
                  <div className="card-label">Sponsorships</div>
                  <div className="card-value">$8,000</div>
                  <div className="card-sub">3 confirmed, 5 pending</div>
                </div>
              </div>

              <h2>Task Summary</h2>
              <div className="grid">
                <div className="card">
                  <div className="card-label">Total Tasks</div>
                  <div className="card-value">18</div>
                  <div className="card-sub">Across 4 categories</div>
                </div>
                <div className="card">
                  <div className="card-label">Completed</div>
                  <div className="card-value" style={{ color: "#7E9E78" }}>2</div>
                  <div className="card-sub">11% complete</div>
                </div>
                <div className="card">
                  <div className="card-label">Critical</div>
                  <div className="card-value" style={{ color: "#C75B3F" }}>3</div>
                  <div className="card-sub">Venue AV, Menu Drafts, Hotel</div>
                </div>
                <div className="card">
                  <div className="card-label">Categories</div>
                  <div className="card-value" style={{ fontSize: "14px" }}>V·M·L·Mk</div>
                  <div className="card-sub">Venue, Menu, Logistics, Marketing</div>
                </div>
              </div>

              <h2>Travel Status</h2>
              <div className="grid-3">
                <div className="card">
                  <div className="card-label">Total Travelers</div>
                  <div className="card-value">14</div>
                  <div className="card-sub">10 chefs + 4 team</div>
                </div>
                <div className="card">
                  <div className="card-label">Flights Booked</div>
                  <div className="card-value" style={{ color: "#7E9E78" }}>12/14</div>
                  <div className="card-sub">86% confirmed</div>
                </div>
                <div className="card">
                  <div className="card-label">Lodging Confirmed</div>
                  <div className="card-value" style={{ color: "#7E9E78" }}>12/14</div>
                  <div className="card-sub">Hotel block at The Venetian</div>
                </div>
              </div>

              <div className="footer">
                <p>Isang Kusina 2026 — isangkusina.com — Confidential</p>
                <p>8 chefs | 8 courses | 1 kitchen | May 22, 2026</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}