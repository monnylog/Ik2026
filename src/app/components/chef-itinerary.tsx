import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plane,
  Hotel,
  MapPin,
  Car,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  Phone,
  Sun,
  Utensils,
  Info,
  Megaphone,
  Navigation,
  RefreshCw,
  Loader2,
  ThermometerSun,
  Landmark,
  ShoppingBag,
  Coffee,
} from "lucide-react";
import { apiFetch } from "../lib/supabase";
import { useProfile } from "../lib/profile-context";
import { getConfirmedChef } from "./onboarding/chef-directory";
import { toast } from "sonner";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface TravelRecord {
  id: string;
  name: string;
  role: string;
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

interface VegasGuide {
  weather?: string;
  dressCode?: string;
  transportation?: string;
  neighborhoods?: { name: string; description: string }[];
  restaurants?: { name: string; cuisine: string; note: string }[];
  tips?: string[];
  emergencyContacts?: { label: string; phone: string }[];
  updatedAt?: string;
}

interface Announcement {
  id: string;
  date: string;
  message: string;
  priority?: "info" | "urgent";
}

const flightStatusCfg = {
  booked: { label: "Confirmed", color: "#2D5F2D", bg: "rgba(45,95,45,0.08)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  "needs-booking": { label: "In Progress", color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: AlertCircle },
};

const lodgingStatusCfg = {
  confirmed: { label: "Confirmed", color: "#2D5F2D", bg: "rgba(45,95,45,0.08)", icon: CheckCircle2 },
  pending: { label: "Pending", color: "#C9A96E", bg: "rgba(201,169,110,0.08)", icon: Clock },
  "needs-booking": { label: "In Progress", color: "#C85050", bg: "rgba(200,80,80,0.08)", icon: AlertCircle },
};

// Event dates — static, always true
const EVENT_DATES = [
  { date: "May 20", label: "Early Setup & Walk-through", detail: "Venue prep begins at KMA Kitchen" },
  { date: "May 21", label: "Chef Arrival & Rehearsal Day", detail: "Kitchen rehearsal, family dinner" },
  { date: "May 22", label: "Event Night", detail: "Isang Kusina 2026 dinner service" },
  { date: "May 23", label: "Day After Brunch", detail: "Casual team brunch & farewell" },
];

const VENUE_INFO = {
  name: "KMA Kitchen & Events",
  address: "Las Vegas, NV",
  mapUrl: "https://maps.google.com/?q=KMA+Kitchen+Events+Las+Vegas+NV",
};

const EMERGENCY_CONTACTS = [
  { label: "Monica Blanco (EP)", phone: "+16166357057" },
  { label: "Walbert Castillo (EP)", phone: "+18478903063" },
];

interface ChefItineraryProps {
  onNavigate?: (page: string) => void;
}

export function ChefItinerary({ onNavigate }: ChefItineraryProps) {
  const { profile } = useProfile();
  const [itinerary, setItinerary] = useState<TravelRecord | null>(null);
  const [vegasGuide, setVegasGuide] = useState<VegasGuide | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("travel");

  const chefId = profile?.chefDirectoryId;
  const chef = chefId ? getConfirmedChef(chefId) : null;

  const loadData = useCallback(async () => {
    if (!chefId) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch(`/travel/my-itinerary?chefId=${encodeURIComponent(chefId)}`);
      setItinerary(data.itinerary || null);
      setVegasGuide(data.vegasGuide || null);
      setAnnouncements(data.announcements?.items || []);
    } catch (err) {
      console.error("Failed to load itinerary:", err);
    } finally {
      setLoading(false);
    }
  }, [chefId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    toast.success("Itinerary updated");
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "TBD";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gold" />
      </div>
    );
  }

  const fCfg = itinerary ? flightStatusCfg[itinerary.flightStatus] || flightStatusCfg.pending : null;
  const lCfg = itinerary ? lodgingStatusCfg[itinerary.lodgingStatus] || lodgingStatusCfg.pending : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Plane className="w-5 h-5" style={{ color: "#6B9EC2" }} />
              <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
                Your Trip to Vegas
              </h2>
            </div>
            <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
              {chef ? `Welcome, Chef ${chef.name.split(" ")[0]}. Here's everything you need for IK26.` : "Your personal travel details and Las Vegas info."}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.75rem] cursor-pointer transition-colors"
            style={{ border: "1px solid var(--border)", ...bodyFont, color: "var(--muted-foreground)" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Announcements from leadership */}
      {announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4 }}
          className="space-y-2"
        >
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="flex items-start gap-3 rounded-xl p-4"
              style={{
                backgroundColor: ann.priority === "urgent" ? "rgba(200,80,80,0.06)" : "rgba(107,158,194,0.06)",
                border: `1px solid ${ann.priority === "urgent" ? "rgba(200,80,80,0.15)" : "rgba(107,158,194,0.15)"}`,
              }}
            >
              <Megaphone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ann.priority === "urgent" ? "#C85050" : "#6B9EC2" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[0.8125rem] text-foreground" style={bodyFont}>{ann.message}</p>
                <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>{ann.date}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ YOUR TRAVEL DETAILS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("travel")}
          className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(107,158,194,0.1)" }}>
            <Plane className="w-4.5 h-4.5" style={{ color: "#6B9EC2" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Your Travel Details</h3>
            <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              {itinerary ? "Flight, lodging & transport info" : "Details will appear here once confirmed by the team"}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "travel" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {expandedSection === "travel" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                {itinerary ? (
                  <>
                    {/* Flight */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Plane className="w-3.5 h-3.5" style={{ color: fCfg!.color }} />
                        <span className="text-[0.8125rem] font-medium text-foreground" style={bodyFont}>Flight</span>
                        <span
                          className="ml-auto text-[0.625rem] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: fCfg!.bg, color: fCfg!.color, ...bodyFont }}
                        >
                          {fCfg!.label}
                        </span>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3 space-y-1.5">
                        {itinerary.origin && (
                          <div className="flex items-center gap-2 text-[0.8125rem]" style={bodyFont}>
                            <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-foreground">From: <span className="text-muted-foreground">{itinerary.origin}</span></span>
                          </div>
                        )}
                        {itinerary.flightDetails && (
                          <div className="flex items-start gap-2 text-[0.8125rem]" style={bodyFont}>
                            <Info className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-foreground">{itinerary.flightDetails}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-[0.75rem] text-muted-foreground" style={bodyFont}>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Arrive: {formatDate(itinerary.arrivalDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Depart: {formatDate(itinerary.departureDate)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Lodging */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Hotel className="w-3.5 h-3.5" style={{ color: lCfg!.color }} />
                        <span className="text-[0.8125rem] font-medium text-foreground" style={bodyFont}>Lodging</span>
                        <span
                          className="ml-auto text-[0.625rem] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: lCfg!.bg, color: lCfg!.color, ...bodyFont }}
                        >
                          {lCfg!.label}
                        </span>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        {itinerary.lodgingDetails ? (
                          <p className="text-[0.8125rem] text-foreground" style={bodyFont}>{itinerary.lodgingDetails}</p>
                        ) : (
                          <p className="text-[0.8125rem] text-muted-foreground italic" style={bodyFont}>Your lodging is being arranged by the team.</p>
                        )}
                      </div>
                    </div>

                    {/* Ground Transport */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="w-3.5 h-3.5" style={{ color: "#8AAD84" }} />
                        <span className="text-[0.8125rem] font-medium text-foreground" style={bodyFont}>Ground Transport</span>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        {itinerary.groundTransport ? (
                          <p className="text-[0.8125rem] text-foreground" style={bodyFont}>{itinerary.groundTransport}</p>
                        ) : (
                          <p className="text-[0.8125rem] text-muted-foreground italic" style={bodyFont}>Transport details will be shared closer to the event.</p>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {itinerary.notes && (
                      <div className="bg-gold/5 rounded-lg p-3 border border-gold/10">
                        <span className="text-[0.6875rem] uppercase tracking-wider text-gold/70 block mb-1" style={bodyFont}>Note from the team</span>
                        <p className="text-[0.8125rem] text-foreground" style={bodyFont}>{itinerary.notes}</p>
                      </div>
                    )}

                    {/* Last updated */}
                    {itinerary.updatedAt && (
                      <p className="text-[0.625rem] text-muted-foreground/50 text-right" style={bodyFont}>
                        Last updated: {new Date(itinerary.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="pt-4 text-center py-8">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                    <h4 className="text-foreground text-[0.9375rem] mb-1" style={headingFont}>Details Coming Soon</h4>
                    <p className="text-muted-foreground text-[0.8125rem] max-w-sm mx-auto" style={bodyFont}>
                      The team is working on your travel arrangements. Your flight, lodging, and transport details will appear here as they are confirmed.
                    </p>
                    {onNavigate && (
                      <button
                        onClick={() => onNavigate("Comms")}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer text-[0.8125rem]"
                        style={{ backgroundColor: "rgba(26,92,56,0.08)", border: "1px solid rgba(26,92,56,0.15)", color: "#1A5C38", ...bodyFont }}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Message the team
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ EVENT SCHEDULE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("schedule")}
          className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(201,169,110,0.1)" }}>
            <Calendar className="w-4.5 h-4.5 text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Key Event Dates</h3>
            <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>May 20 - 23, 2026 in Las Vegas</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "schedule" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {expandedSection === "schedule" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                {EVENT_DATES.map((evt, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div className="w-14 text-center shrink-0">
                      <span className="text-[0.8125rem] font-semibold text-gold block" style={bodyFont}>{evt.date}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-[0.8125rem] text-foreground block" style={bodyFont}>{evt.label}</span>
                      <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>{evt.detail}</span>
                    </div>
                  </div>
                ))}

                {/* Venue */}
                <div className="pt-2">
                  <a
                    href={VENUE_INFO.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:opacity-80"
                    style={{ backgroundColor: "rgba(107,158,194,0.06)", border: "1px solid rgba(107,158,194,0.12)" }}
                  >
                    <Navigation className="w-4 h-4 shrink-0" style={{ color: "#6B9EC2" }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[0.8125rem] text-foreground block" style={bodyFont}>{VENUE_INFO.name}</span>
                      <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>{VENUE_INFO.address}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ LAS VEGAS GUIDE ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <button
          onClick={() => toggleSection("vegas")}
          className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(217,119,6,0.08)" }}>
            <Sun className="w-4.5 h-4.5" style={{ color: "#D97706" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Las Vegas Visitor Guide</h3>
            <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
              {vegasGuide ? "Weather, dining, and local tips" : "Guide content coming soon"}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedSection === "vegas" ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {expandedSection === "vegas" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 pt-1 space-y-4" style={{ borderTop: "1px solid var(--border)" }}>
                {vegasGuide ? (
                  <>
                    {/* Weather */}
                    {vegasGuide.weather && (
                      <div className="flex items-start gap-3 pt-3">
                        <ThermometerSun className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#D97706" }} />
                        <div>
                          <span className="text-[0.75rem] font-medium text-foreground block" style={bodyFont}>Weather in May</span>
                          <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>{vegasGuide.weather}</span>
                        </div>
                      </div>
                    )}

                    {/* Dress Code */}
                    {vegasGuide.dressCode && (
                      <div className="flex items-start gap-3">
                        <ShoppingBag className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C9A96E" }} />
                        <div>
                          <span className="text-[0.75rem] font-medium text-foreground block" style={bodyFont}>Dress Code</span>
                          <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>{vegasGuide.dressCode}</span>
                        </div>
                      </div>
                    )}

                    {/* Transportation */}
                    {vegasGuide.transportation && (
                      <div className="flex items-start gap-3">
                        <Car className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#6B9EC2" }} />
                        <div>
                          <span className="text-[0.75rem] font-medium text-foreground block" style={bodyFont}>Getting Around</span>
                          <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>{vegasGuide.transportation}</span>
                        </div>
                      </div>
                    )}

                    {/* Neighborhoods */}
                    {vegasGuide.neighborhoods && vegasGuide.neighborhoods.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Landmark className="w-3.5 h-3.5" style={{ color: "#8AAD84" }} />
                          <span className="text-[0.75rem] font-medium text-foreground" style={bodyFont}>Neighborhoods to Explore</span>
                        </div>
                        <div className="space-y-2">
                          {vegasGuide.neighborhoods.map((n, i) => (
                            <div key={i} className="bg-secondary/30 rounded-lg p-3">
                              <span className="text-[0.8125rem] font-medium text-foreground block" style={bodyFont}>{n.name}</span>
                              <span className="text-[0.75rem] text-muted-foreground" style={bodyFont}>{n.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restaurant Recommendations */}
                    {vegasGuide.restaurants && vegasGuide.restaurants.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Utensils className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
                          <span className="text-[0.75rem] font-medium text-foreground" style={bodyFont}>Where to Eat</span>
                        </div>
                        <div className="space-y-2">
                          {vegasGuide.restaurants.map((r, i) => (
                            <div key={i} className="flex items-start gap-3 bg-secondary/30 rounded-lg p-3">
                              <Coffee className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                              <div>
                                <span className="text-[0.8125rem] font-medium text-foreground" style={bodyFont}>{r.name}</span>
                                <span className="text-[0.6875rem] text-muted-foreground ml-2" style={bodyFont}>{r.cuisine}</span>
                                {r.note && <p className="text-[0.6875rem] text-muted-foreground/70 mt-0.5" style={bodyFont}>{r.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {vegasGuide.tips && vegasGuide.tips.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Info className="w-3.5 h-3.5" style={{ color: "#6B9EC2" }} />
                          <span className="text-[0.75rem] font-medium text-foreground" style={bodyFont}>Good to Know</span>
                        </div>
                        <ul className="space-y-1.5">
                          {vegasGuide.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-[0.8125rem] text-muted-foreground" style={bodyFont}>
                              <span className="text-gold mt-0.5 shrink-0">-</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {vegasGuide.updatedAt && (
                      <p className="text-[0.625rem] text-muted-foreground/50 text-right pt-1" style={bodyFont}>
                        Guide updated: {new Date(vegasGuide.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 pt-4">
                    <Sun className="w-8 h-8 mx-auto mb-3 text-muted-foreground/20" />
                    <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                      The team is putting together a Las Vegas visitor guide for you. Check back soon!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ EMERGENCY CONTACTS ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-gold" />
          <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>Emergency Contacts</h3>
        </div>
        <div className="space-y-2">
          {EMERGENCY_CONTACTS.map((contact, i) => (
            <a
              key={i}
              href={`tel:${contact.phone}`}
              className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:opacity-80"
              style={{ backgroundColor: "rgba(201,169,110,0.04)", border: "1px solid rgba(201,169,110,0.1)" }}
            >
              <Phone className="w-3.5 h-3.5 text-gold" />
              <div className="flex-1 min-w-0">
                <span className="text-[0.8125rem] text-foreground block" style={bodyFont}>{contact.label}</span>
                <span className="text-[0.6875rem] text-muted-foreground" style={bodyFont}>{contact.phone}</span>
              </div>
            </a>
          ))}
        </div>
      </motion.div>

      {/* ═══ QUICK LINKS ═══ */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Event Schedule")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80 min-h-[44px]"
            style={{ backgroundColor: "rgba(107,158,194,0.06)", border: "1px solid rgba(107,158,194,0.12)", ...bodyFont }}
          >
            <Calendar className="w-4 h-4" style={{ color: "#6B9EC2" }} />
            <span className="text-[0.8125rem]" style={{ color: "#6B9EC2" }}>Event Schedule</span>
          </button>
          <button
            onClick={() => onNavigate("Comms")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80 min-h-[44px]"
            style={{ backgroundColor: "rgba(26,92,56,0.06)", border: "1px solid rgba(26,92,56,0.12)", ...bodyFont }}
          >
            <MessageCircle className="w-4 h-4" style={{ color: "#1A5C38" }} />
            <span className="text-[0.8125rem]" style={{ color: "#1A5C38" }}>Team Comms</span>
          </button>
          <button
            onClick={() => onNavigate("Community")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer hover:opacity-80 min-h-[44px]"
            style={{ backgroundColor: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.12)", ...bodyFont }}
          >
            <MapPin className="w-4 h-4 text-gold" />
            <span className="text-[0.8125rem] text-gold">Community</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default ChefItinerary;
