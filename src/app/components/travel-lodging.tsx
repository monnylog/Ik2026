import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plane,
  Hotel,
  MapPin,
  ChefHat,
  Users,
  Map,
  List,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Calendar,
  Plus,
  X,
  Save,
  Trash2,
  RefreshCw,
  Loader2,
  Pencil,
  Megaphone,
  BookOpen,
  Sun,
} from "lucide-react";
import type { UserRole } from "./onboarding/use-auth";
import { confirmedChefs } from "./onboarding/chef-directory";
import { apiFetch } from "../lib/supabase";
import { toast } from "sonner";
import { ChefItinerary } from "./chef-itinerary";
import { bodyFont, headingFont } from "../lib/fonts";

interface TravelRecord {
  id: string;
  name: string;
  role: "chef" | "team" | "guest";
  chefDirectoryId: string | null;
  origin: string;
  flightStatus: "booked" | "pending" | "needs-booking";
  flightDetails: string;
  arrivalDate: string;
  departureDate: string;
  lodgingStatus: "confirmed" | "pending" | "needs-booking";
  lodgingDetails: string;
  groundTransport: string;
  notes: string;
  contactPhone: string;
  contactEmail: string;
  updatedAt: string;
}

const flightStatusCfg = {
  booked: { label: "Booked", color: "#2D5F2D", bg: "rgba(45,95,45,0.08)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  "needs-booking": { label: "Needs Booking", color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: AlertCircle },
};

const lodgingStatusCfg = {
  confirmed: { label: "Confirmed", color: "#2D5F2D", bg: "rgba(45,95,45,0.08)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  "needs-booking": { label: "Needs Booking", color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: AlertCircle },
};

const emptyRecord: Omit<TravelRecord, "updatedAt"> = {
  id: "",
  name: "",
  role: "chef",
  chefDirectoryId: null,
  origin: "",
  flightStatus: "pending",
  flightDetails: "",
  arrivalDate: "",
  departureDate: "",
  lodgingStatus: "pending",
  lodgingDetails: "",
  groundTransport: "",
  notes: "",
  contactPhone: "",
  contactEmail: "",
};

interface TravelLodgingProps {
  role: UserRole;
  onNavigate?: (page: string) => void;
}

export function TravelLodging({ role, onNavigate }: TravelLodgingProps) {
  // Chef view → personal itinerary
  if (role === "chef") {
    return <ChefItinerary onNavigate={onNavigate} />;
  }

  // Leadership & team → manager view
  return <TravelManagerView role={role} onNavigate={onNavigate} />;
}

export default TravelLodging;

/* ═══════════════════════════════════════════════════════════════════
   MANAGER VIEW — Full travel roster (leadership & team)
   ═══════════════════════════════════════════════════════════════════ */

function TravelManagerView({ role, onNavigate }: { role: UserRole; onNavigate?: (page: string) => void }) {
  const [records, setRecords] = useState<TravelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [filterRole, setFilterRole] = useState<"all" | "chef" | "team" | "guest">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<Omit<TravelRecord, "updatedAt"> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [vegasGuideEditor, setVegasGuideEditor] = useState(false);
  const [announcementEditor, setAnnouncementEditor] = useState(false);

  // Vegas guide state
  const [vegasGuide, setVegasGuide] = useState<any>(null);
  const [vegasForm, setVegasForm] = useState({
    weather: "",
    dressCode: "",
    transportation: "",
    tips: "",
    neighborhoods: "",
    restaurants: "",
  });

  // Announcements state
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ message: "", priority: "info" as "info" | "urgent" });

  const loadRecords = useCallback(async () => {
    try {
      const data = await apiFetch("/travel/records");
      setRecords(data.records || []);
    } catch (err) {
      console.error("Failed to load travel records:", err);
      toast.error("Failed to load travel records");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadVegasGuide = useCallback(async () => {
    try {
      const data = await apiFetch("/travel/vegas-guide");
      if (data.guide) {
        setVegasGuide(data.guide);
        setVegasForm({
          weather: data.guide.weather || "",
          dressCode: data.guide.dressCode || "",
          transportation: data.guide.transportation || "",
          tips: (data.guide.tips || []).join("\n"),
          neighborhoods: (data.guide.neighborhoods || []).map((n: any) => `${n.name}: ${n.description}`).join("\n"),
          restaurants: (data.guide.restaurants || []).map((r: any) => `${r.name} | ${r.cuisine} | ${r.note || ""}`).join("\n"),
        });
      }
    } catch (err) {
      console.error("Failed to load vegas guide:", err);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    try {
      const data = await apiFetch("/travel/announcements");
      setAnnouncements(data.announcements?.items || []);
    } catch (err) {
      console.error("Failed to load announcements:", err);
    }
  }, []);

  useEffect(() => {
    loadRecords();
    loadVegasGuide();
    loadAnnouncements();
  }, [loadRecords, loadVegasGuide, loadAnnouncements]);

  const handleSaveRecord = async () => {
    if (!editingRecord || !editingRecord.name) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const recordToSave = {
        ...editingRecord,
        id: editingRecord.id || editingRecord.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
      };
      await apiFetch("/travel/records", {
        method: "POST",
        body: JSON.stringify(recordToSave),
      });
      
      // TIER 2C: Mirror to Notion for chef records
      if (editingRecord.role === "chef" && editingRecord.chefDirectoryId) {
        try {
          await apiFetch("/chef/travel-mirror", {
            method: "POST",
            body: JSON.stringify({
              chefId: editingRecord.chefDirectoryId,
              travelData: {
                arrival: editingRecord.arrivalDate,
                departure: editingRecord.departureDate,
                flightDetails: editingRecord.flightDetails,
                lodgingDetails: editingRecord.lodgingDetails,
                groundTransport: editingRecord.groundTransport,
              },
            }),
          });
        } catch (mirrorErr) {
          console.error("Failed to mirror to Notion:", mirrorErr);
          // Don't fail the whole save, just log it
        }
      }
      
      toast.success(`Travel record saved for ${editingRecord.name}`);
      setEditingRecord(null);
      setShowForm(false);
      await loadRecords();
    } catch (err) {
      console.error("Failed to save record:", err);
      toast.error("Failed to save travel record");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await apiFetch(`/travel/records/${id}`, { method: "DELETE" });
      toast.success("Travel record deleted");
      await loadRecords();
    } catch (err) {
      console.error("Failed to delete record:", err);
      toast.error("Failed to delete travel record");
    }
  };

  const handleSaveVegasGuide = async () => {
    setSaving(true);
    try {
      const guide = {
        weather: vegasForm.weather,
        dressCode: vegasForm.dressCode,
        transportation: vegasForm.transportation,
        tips: vegasForm.tips.split("\n").filter((t) => t.trim()),
        neighborhoods: vegasForm.neighborhoods.split("\n").filter((n) => n.trim()).map((n) => {
          const [name, ...desc] = n.split(":");
          return { name: name.trim(), description: desc.join(":").trim() };
        }),
        restaurants: vegasForm.restaurants.split("\n").filter((r) => r.trim()).map((r) => {
          const [name, cuisine, note] = r.split("|").map((s) => s.trim());
          return { name: name || "", cuisine: cuisine || "", note: note || "" };
        }),
      };
      await apiFetch("/travel/vegas-guide", {
        method: "POST",
        body: JSON.stringify(guide),
      });
      toast.success("Las Vegas visitor guide updated");
      setVegasGuideEditor(false);
      await loadVegasGuide();
    } catch (err) {
      console.error("Failed to save vegas guide:", err);
      toast.error("Failed to save visitor guide");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.message.trim()) return;
    setSaving(true);
    try {
      const updated = [
        {
          id: `ann-${Date.now()}`,
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          message: newAnnouncement.message.trim(),
          priority: newAnnouncement.priority,
        },
        ...announcements,
      ];
      await apiFetch("/travel/announcements", {
        method: "POST",
        body: JSON.stringify({ items: updated }),
      });
      toast.success("Announcement posted");
      setNewAnnouncement({ message: "", priority: "info" });
      setAnnouncements(updated);
    } catch (err) {
      console.error("Failed to save announcement:", err);
      toast.error("Failed to post announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const updated = announcements.filter((a) => a.id !== id);
    try {
      await apiFetch("/travel/announcements", {
        method: "POST",
        body: JSON.stringify({ items: updated }),
      });
      setAnnouncements(updated);
      toast.success("Announcement removed");
    } catch (err) {
      toast.error("Failed to remove announcement");
    }
  };

  const filtered = filterRole === "all" ? records : records.filter((r) => r.role === filterRole);
  const chefCount = records.filter((r) => r.role === "chef").length;
  const teamCount = records.filter((r) => r.role === "team").length;
  const flightsBooked = records.filter((r) => r.flightStatus === "booked").length;
  const lodgingConfirmed = records.filter((r) => r.lodgingStatus === "confirmed").length;
  const isLeadership = role === "leadership";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-5 h-5" style={{ color: "#6B9EC2" }} />
              <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>Travel & Lodging</h2>
            </div>
            <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
              Manage flights, accommodations, and ground transport for all participants.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadRecords}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
              style={{ border: "1px solid var(--border)", ...bodyFont, color: "var(--muted-foreground)" }}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
            <div className="flex items-center gap-1 bg-card rounded-lg p-0.5" style={{ border: "1px solid var(--border)" }}>
              <button
                onClick={() => setViewMode("grid")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] cursor-pointer transition-colors"
                style={{
                  backgroundColor: viewMode === "grid" ? "rgba(107,158,194,0.08)" : "rgba(0,0,0,0)",
                  color: viewMode === "grid" ? "#6B9EC2" : "var(--muted-foreground)",
                  ...bodyFont,
                }}
              >
                <Map className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[0.75rem] cursor-pointer transition-colors"
                style={{
                  backgroundColor: viewMode === "list" ? "rgba(107,158,194,0.08)" : "rgba(0,0,0,0)",
                  color: viewMode === "list" ? "#6B9EC2" : "var(--muted-foreground)",
                  ...bodyFont,
                }}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary pills */}
      {records.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <ChefHat className="w-3.5 h-3.5" style={{ color: "#8AAD84" }} />
            <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{chefCount} chefs</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <Users className="w-3.5 h-3.5" style={{ color: "#6B9EC2" }} />
            <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{teamCount} team</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <Plane className="w-3.5 h-3.5" style={{ color: "#D4B896" }} />
            <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{flightsBooked}/{records.length} flights booked</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-card rounded-xl" style={{ border: "1px solid var(--border)" }}>
            <Hotel className="w-3.5 h-3.5" style={{ color: "#CEB47A" }} />
            <span className="text-[0.8125rem] text-foreground" style={bodyFont}>{lodgingConfirmed}/{records.length} lodging confirmed</span>
          </div>
        </div>
      )}

      {/* Filter & Add */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {([
            { id: "all" as const, label: "All", count: records.length },
            { id: "chef" as const, label: "Chefs", count: chefCount },
            { id: "team" as const, label: "Team", count: teamCount },
          ]).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterRole(f.id)}
              className="px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer transition-all"
              style={{
                ...bodyFont,
                backgroundColor: filterRole === f.id ? "rgba(107,158,194,0.1)" : "transparent",
                color: filterRole === f.id ? "#6B9EC2" : "#8A857F",
                border: filterRole === f.id ? "1px solid rgba(107,158,194,0.25)" : "1px solid rgba(0,0,0,0.06)",
                fontWeight: filterRole === f.id ? 600 : 400,
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        {isLeadership && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAnnouncementEditor(!announcementEditor)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
              style={{ border: "1px solid rgba(201,169,110,0.2)", color: "#C9A96E", backgroundColor: "rgba(201,169,110,0.04)", ...bodyFont }}
            >
              <Megaphone className="w-3 h-3" />
              Announcements
            </button>
            <button
              onClick={() => setVegasGuideEditor(!vegasGuideEditor)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
              style={{ border: "1px solid rgba(217,119,6,0.2)", color: "#D97706", backgroundColor: "rgba(217,119,6,0.04)", ...bodyFont }}
            >
              <Sun className="w-3 h-3" />
              Vegas Guide
            </button>
            <button
              onClick={() => { setEditingRecord({ ...emptyRecord }); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.75rem] cursor-pointer"
              style={{ border: "1px solid rgba(107,158,194,0.25)", color: "#6B9EC2", backgroundColor: "rgba(107,158,194,0.06)", ...bodyFont }}
            >
              <Plus className="w-3 h-3" />
              Add Record
            </button>
          </div>
        )}
      </div>

      {/* Announcement Editor (leadership) */}
      <AnimatePresence>
        {announcementEditor && isLeadership && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Travel Announcements</h3>
                <button onClick={() => setAnnouncementEditor(false)} className="cursor-pointer"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
                Post announcements visible to chefs on their personal itinerary page.
              </p>
              <div className="flex gap-2">
                <input
                  value={newAnnouncement.message}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  placeholder="e.g. Shuttle pickup schedule confirmed for May 21"
                  className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none border border-border/50"
                  style={bodyFont}
                />
                <select
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value as "info" | "urgent" })}
                  className="bg-secondary/50 rounded-lg px-2 py-2 text-[0.75rem] text-foreground border border-border/50"
                  style={bodyFont}
                >
                  <option value="info">Info</option>
                  <option value="urgent">Urgent</option>
                </select>
                <button
                  onClick={handleAddAnnouncement}
                  disabled={saving || !newAnnouncement.message.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "rgba(107,158,194,0.1)", color: "#6B9EC2", ...bodyFont }}
                >
                  Post
                </button>
              </div>
              {announcements.length > 0 && (
                <div className="space-y-2">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <span className={`text-[0.625rem] px-1.5 py-0.5 rounded ${ann.priority === "urgent" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"}`} style={bodyFont}>
                        {ann.priority}
                      </span>
                      <span className="flex-1 text-[0.8125rem] text-foreground" style={bodyFont}>{ann.message}</span>
                      <span className="text-[0.625rem] text-muted-foreground" style={bodyFont}>{ann.date}</span>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="cursor-pointer"><Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vegas Guide Editor (leadership) */}
      <AnimatePresence>
        {vegasGuideEditor && isLeadership && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Edit Las Vegas Visitor Guide</h3>
                <button onClick={() => setVegasGuideEditor(false)} className="cursor-pointer"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
                This content is visible to chefs on their personal itinerary page.
              </p>

              <div className="space-y-3">
                <Field label="Weather (May)" value={vegasForm.weather} onChange={(v) => setVegasForm({ ...vegasForm, weather: v })} placeholder="e.g. Highs around 95°F, dry heat..." />
                <Field label="Dress Code" value={vegasForm.dressCode} onChange={(v) => setVegasForm({ ...vegasForm, dressCode: v })} placeholder="e.g. Smart casual for event, comfortable for prep days" />
                <Field label="Getting Around" value={vegasForm.transportation} onChange={(v) => setVegasForm({ ...vegasForm, transportation: v })} placeholder="e.g. Rideshare recommended, team shuttle available..." />
                <TextAreaField label="Tips (one per line)" value={vegasForm.tips} onChange={(v) => setVegasForm({ ...vegasForm, tips: v })} placeholder="Stay hydrated\nSunscreen is essential\nWater bottles provided at venue" rows={4} />
                <TextAreaField label="Neighborhoods (Name: Description, one per line)" value={vegasForm.neighborhoods} onChange={(v) => setVegasForm({ ...vegasForm, neighborhoods: v })} placeholder="Arts District: Galleries, coffee shops, local dining\nChinatown: Pan-Asian restaurants, late-night food" rows={3} />
                <TextAreaField label="Restaurants (Name | Cuisine | Note, one per line)" value={vegasForm.restaurants} onChange={(v) => setVegasForm({ ...vegasForm, restaurants: v })} placeholder="Lotus of Siam | Thai | James Beard Award winner\nSen of Japan | Japanese | Late night sushi" rows={4} />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setVegasGuideEditor(false)}
                  className="px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", ...bodyFont }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVegasGuide}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "rgba(217,119,6,0.1)", color: "#D97706", ...bodyFont }}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Guide"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {records.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>Overall Travel Readiness</span>
            <span className="text-[0.8125rem] font-semibold" style={{ ...bodyFont, color: "#C9A96E" }}>
              {records.length > 0 ? Math.round(((flightsBooked + lodgingConfirmed) / (records.length * 2)) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(221,207,195,0.4)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${records.length > 0 ? Math.round(((flightsBooked + lodgingConfirmed) / (records.length * 2)) * 100) : 0}%`,
                background: "linear-gradient(90deg, #6B9EC2, #4A7FB5)",
              }}
            />
          </div>
        </div>
      )}

      {/* ═══ ADD / EDIT FORM ═══ */}
      <AnimatePresence>
        {showForm && editingRecord && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>
                  {editingRecord.id ? "Edit Travel Record" : "New Travel Record"}
                </h3>
                <button onClick={() => { setShowForm(false); setEditingRecord(null); }} className="cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Quick-fill from chef directory */}
              {!editingRecord.id && (
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground block mb-1" style={bodyFont}>Quick-fill from Chef Directory</label>
                  <select
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground border border-border/50"
                    style={bodyFont}
                    onChange={(e) => {
                      const chef = confirmedChefs.find((c) => c.id === e.target.value);
                      if (chef) {
                        setEditingRecord({
                          ...editingRecord,
                          id: chef.id,
                          name: chef.name,
                          role: "chef",
                          chefDirectoryId: chef.id,
                          origin: chef.state ? `${chef.city}, ${chef.state}` : chef.city,
                        });
                      }
                    }}
                  >
                    <option value="">Select a chef...</option>
                    {confirmedChefs.map((c) => (
                      <option key={c.id} value={c.id}>Chef {c.name} — {c.city}{c.state ? `, ${c.state}` : ""}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Name *" value={editingRecord.name} onChange={(v) => setEditingRecord({ ...editingRecord, name: v })} placeholder="Full name" />
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground block mb-1" style={bodyFont}>Role</label>
                  <select
                    value={editingRecord.role}
                    onChange={(e) => setEditingRecord({ ...editingRecord, role: e.target.value as any })}
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground border border-border/50"
                    style={bodyFont}
                  >
                    <option value="chef">Chef</option>
                    <option value="team">Team</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>
                <Field label="Origin City" value={editingRecord.origin} onChange={(v) => setEditingRecord({ ...editingRecord, origin: v })} placeholder="e.g. Seattle, WA" />
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground block mb-1" style={bodyFont}>Flight Status</label>
                  <select
                    value={editingRecord.flightStatus}
                    onChange={(e) => setEditingRecord({ ...editingRecord, flightStatus: e.target.value as any })}
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground border border-border/50"
                    style={bodyFont}
                  >
                    <option value="booked">Booked</option>
                    <option value="pending">Pending</option>
                    <option value="needs-booking">Needs Booking</option>
                  </select>
                </div>
                <Field label="Flight Details" value={editingRecord.flightDetails} onChange={(v) => setEditingRecord({ ...editingRecord, flightDetails: v })} placeholder="e.g. Alaska AS 1422, May 21 8:15AM" />
                <Field label="Arrival Date" value={editingRecord.arrivalDate} onChange={(v) => setEditingRecord({ ...editingRecord, arrivalDate: v })} placeholder="YYYY-MM-DD" type="date" />
                <Field label="Departure Date" value={editingRecord.departureDate} onChange={(v) => setEditingRecord({ ...editingRecord, departureDate: v })} placeholder="YYYY-MM-DD" type="date" />
                <div>
                  <label className="text-[0.6875rem] text-muted-foreground block mb-1" style={bodyFont}>Lodging Status</label>
                  <select
                    value={editingRecord.lodgingStatus}
                    onChange={(e) => setEditingRecord({ ...editingRecord, lodgingStatus: e.target.value as any })}
                    className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground border border-border/50"
                    style={bodyFont}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="needs-booking">Needs Booking</option>
                  </select>
                </div>
                <Field label="Lodging Details" value={editingRecord.lodgingDetails} onChange={(v) => setEditingRecord({ ...editingRecord, lodgingDetails: v })} placeholder="e.g. The Venetian — Suite 2204" />
                <Field label="Ground Transport" value={editingRecord.groundTransport} onChange={(v) => setEditingRecord({ ...editingRecord, groundTransport: v })} placeholder="e.g. Shuttle from LAS" />
                <Field label="Contact Phone" value={editingRecord.contactPhone} onChange={(v) => setEditingRecord({ ...editingRecord, contactPhone: v })} placeholder="+1..." />
                <Field label="Contact Email" value={editingRecord.contactEmail} onChange={(v) => setEditingRecord({ ...editingRecord, contactEmail: v })} placeholder="chef@example.com" />
              </div>
              <Field label="Notes" value={editingRecord.notes} onChange={(v) => setEditingRecord({ ...editingRecord, notes: v })} placeholder="Any special notes..." />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setShowForm(false); setEditingRecord(null); }}
                  className="px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer"
                  style={{ border: "1px solid var(--border)", color: "var(--muted-foreground)", ...bodyFont }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRecord}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: "rgba(107,158,194,0.1)", color: "#6B9EC2", ...bodyFont }}
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ EMPTY STATE ═══ */}
      {records.length === 0 && !showForm && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-card border border-border rounded-xl"
        >
          <Plane className="w-10 h-10 mx-auto mb-4 text-muted-foreground/20" />
          <h3 className="text-foreground text-[1rem] mb-2" style={headingFont}>No Travel Records Yet</h3>
          <p className="text-muted-foreground text-[0.875rem] max-w-md mx-auto mb-4" style={bodyFont}>
            Start adding travel records for chefs and team members. Each record will be visible to the corresponding chef on their personal itinerary page.
          </p>
          {isLeadership && (
            <button
              onClick={() => { setEditingRecord({ ...emptyRecord }); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer text-[0.875rem]"
              style={{ backgroundColor: "rgba(107,158,194,0.1)", border: "1px solid rgba(107,158,194,0.2)", color: "#6B9EC2", ...bodyFont }}
            >
              <Plus className="w-4 h-4" />
              Add First Travel Record
            </button>
          )}
        </motion.div>
      )}

      {/* ═══ TRAVEL GRID ═══ */}
      {filtered.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((record, idx) => {
            const fCfg = flightStatusCfg[record.flightStatus] || flightStatusCfg.pending;
            const lCfg = lodgingStatusCfg[record.lodgingStatus] || lodgingStatusCfg.pending;
            const FlightIcon = fCfg.icon;
            const LodgingIcon = lCfg.icon;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[0.9375rem] text-foreground" style={headingFont}>{record.name}</h3>
                      <div className="flex items-center gap-1 text-[0.75rem] text-muted-foreground" style={bodyFont}>
                        <MapPin className="w-3 h-3" />
                        {record.origin || "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[0.5625rem] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold"
                        style={{
                          backgroundColor: record.role === "chef" ? "rgba(201,169,110,0.1)" : "rgba(107,158,194,0.1)",
                          color: record.role === "chef" ? "#C9A96E" : "#6B9EC2",
                          ...bodyFont,
                        }}
                      >
                        {record.role}
                      </span>
                      {isLeadership && (
                        <button
                          onClick={() => { setEditingRecord({ ...record }); setShowForm(true); }}
                          className="w-6 h-6 flex items-center justify-center rounded cursor-pointer hover:bg-secondary"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Flight */}
                  <div className="flex items-start gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: fCfg.bg }}>
                    <FlightIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: fCfg.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.6875rem] font-medium block" style={{ ...bodyFont, color: fCfg.color }}>
                        Flight: {fCfg.label}
                      </span>
                      {record.flightDetails && (
                        <span className="text-[0.625rem] text-muted-foreground block truncate" style={bodyFont}>
                          {record.flightDetails}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lodging */}
                  <div className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: lCfg.bg }}>
                    <LodgingIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: lCfg.color }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.6875rem] font-medium block" style={{ ...bodyFont, color: lCfg.color }}>
                        Lodging: {lCfg.label}
                      </span>
                      {record.lodgingDetails && (
                        <span className="text-[0.625rem] text-muted-foreground block truncate" style={bodyFont}>
                          {record.lodgingDetails}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dates */}
                  {(record.arrivalDate || record.departureDate) && (
                    <div className="flex items-center gap-3 mt-2 text-[0.625rem] text-muted-foreground" style={bodyFont}>
                      {record.arrivalDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Arr: {record.arrivalDate}
                        </div>
                      )}
                      {record.departureDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          Dep: {record.departureDate}
                        </div>
                      )}
                    </div>
                  )}

                  {record.notes && (
                    <p className="text-[0.625rem] text-muted-foreground/60 mt-2 italic" style={bodyFont}>
                      {record.notes}
                    </p>
                  )}

                  {isLeadership && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleDeleteRecord(record.id)}
                        className="text-[0.625rem] text-red-500/50 hover:text-red-500 cursor-pointer flex items-center gap-1"
                        style={bodyFont}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ TRAVEL LIST ═══ */}
      {filtered.length > 0 && viewMode === "list" && (
        <div className="space-y-2">
          {filtered.map((record, idx) => {
            const fCfg = flightStatusCfg[record.flightStatus] || flightStatusCfg.pending;
            const lCfg = lodgingStatusCfg[record.lodgingStatus] || lodgingStatusCfg.pending;
            const isExpanded = expandedId === record.id;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-[0.875rem] font-medium block" style={{ ...bodyFont, color: "var(--foreground)" }}>
                      {record.name}
                    </span>
                    <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>
                      {record.origin || "Origin TBD"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: fCfg.bg, color: fCfg.color, ...bodyFont }}>
                      {fCfg.label}
                    </span>
                    <span className="text-[0.5625rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: lCfg.bg, color: lCfg.color, ...bodyFont }}>
                      {lCfg.label}
                    </span>
                    {isLeadership && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingRecord({ ...record }); setShowForm(true); }}
                        className="w-6 h-6 flex items-center justify-center rounded cursor-pointer hover:bg-secondary"
                      >
                        <Pencil className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                    <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                        {record.flightDetails && (
                          <div className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--foreground)" }}>
                            <strong>Flight:</strong> {record.flightDetails}
                          </div>
                        )}
                        {record.lodgingDetails && (
                          <div className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--foreground)" }}>
                            <strong>Lodging:</strong> {record.lodgingDetails}
                          </div>
                        )}
                        {record.groundTransport && (
                          <div className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--foreground)" }}>
                            <strong>Ground:</strong> {record.groundTransport}
                          </div>
                        )}
                        {(record.arrivalDate || record.departureDate) && (
                          <div className="text-[0.75rem] text-muted-foreground" style={bodyFont}>
                            {record.arrivalDate || "TBD"} → {record.departureDate || "TBD"}
                          </div>
                        )}
                        {record.notes && (
                          <p className="text-[0.6875rem] text-muted-foreground/60 italic" style={bodyFont}>
                            {record.notes}
                          </p>
                        )}
                        {isLeadership && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleDeleteRecord(record.id)}
                              className="text-[0.625rem] text-red-500/50 hover:text-red-500 cursor-pointer flex items-center gap-1"
                              style={bodyFont}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
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
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORM FIELD HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function Field({ label, value, onChange, placeholder, type }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-[0.6875rem] text-muted-foreground block mb-1" style={bodyFont}>{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none border border-border/50 focus:ring-1 focus:ring-gold/30"
        style={bodyFont}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-[0.6875rem] text-muted-foreground block mb-1" style={bodyFont}>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows || 3}
        className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-[0.8125rem] text-foreground placeholder:text-muted-foreground/30 focus:outline-none border border-border/50 focus:ring-1 focus:ring-gold/30 resize-none"
        style={bodyFont}
      />
    </div>
  );
}