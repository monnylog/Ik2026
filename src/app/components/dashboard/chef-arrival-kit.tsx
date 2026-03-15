import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Thermometer,
  Car,
  CheckSquare,
  Square,
  ChevronDown,
  Navigation,
  Clock,
  Utensils,
  Shirt,
  Briefcase,
  Building2,
  Wifi,
  ParkingCircle,
  MessageCircle,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { useUserData } from "../../lib/use-user-data";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ChecklistItem {
  id: string;
  text: string;
  category: string;
}

const checklist: ChecklistItem[] = [
  { id: "knives", text: "Personal knife kit & tools", category: "Kitchen" },
  { id: "coat", text: "Chef coat (white, provided if needed)", category: "Kitchen" },
  { id: "apron", text: "Apron(s)", category: "Kitchen" },
  { id: "shoes", text: "Non-slip kitchen shoes", category: "Kitchen" },
  { id: "recipes", text: "Finalized dish recipe & notes", category: "Menu" },
  { id: "ingredients", text: "Specialty ingredients (if sourcing yourself)", category: "Menu" },
  { id: "plating", text: "Plating reference photos or sketches", category: "Menu" },
  { id: "casual", text: "Casual wear for rehearsal & team dinners", category: "Personal" },
  { id: "event-outfit", text: "Event night attire (smart casual)", category: "Personal" },
  { id: "id", text: "Government ID for hotel check-in", category: "Personal" },
  { id: "meds", text: "Personal medications / dietary supplements", category: "Personal" },
];

interface ChefArrivalKitProps {
  onNavigate?: (page: string) => void;
}

export function ChefArrivalKit({ onNavigate }: ChefArrivalKitProps) {
  const [expanded, setExpanded] = useState(true);
  const [checkedItemsList, setCheckedItemsList] = useUserData<string[]>("arrival-checklist", []);
  const checkedItems = new Set(checkedItemsList);

  const toggleItem = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItemsList([...next]);
  };

  const completedCount = checkedItems.size;
  const totalCount = checklist.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(205,168,138,0.15)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4"
        style={{
          background: "linear-gradient(135deg, rgba(205,168,138,0.05) 0%, rgba(201,169,110,0.03) 100%)",
          borderBottom: "1px solid rgba(205,168,138,0.1)",
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-full" style={{ backgroundColor: "#CDA88A" }} />
          <h3 className="text-foreground" style={headingFont}>
            Arrival Kit
          </h3>
          <span
            className="text-[0.625rem] px-2 py-0.5 rounded-full ml-auto"
            style={{
              backgroundColor: "rgba(205,168,138,0.1)",
              color: "#CDA88A",
              ...bodyFont,
            }}
          >
            For traveling chefs
          </span>
        </div>
        <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
          Pre-arrival logistics and packing information for Las Vegas.
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Venue info */}
        <div
          className="p-3.5 rounded-xl"
          style={{
            backgroundColor: "rgba(43,68,100,0.03)",
            border: "1px solid rgba(43,68,100,0.08)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4" style={{ color: "#CDA88A" }} />
            <span className="text-foreground text-[0.8125rem]" style={headingFont}>
              Venue
            </span>
          </div>
          <div className="space-y-2 text-[0.75rem]" style={bodyFont}>
            <div className="flex items-start gap-2">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="text-foreground block">TBD — Event Space, Las Vegas, NV</span>
                <span className="text-muted-foreground text-[0.6875rem]">Full address will be shared once confirmed</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ParkingCircle className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Parking available on-site — details TBD</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Wi-Fi credentials shared at check-in</span>
            </div>
          </div>
        </div>

        {/* Key dates */}
        <div
          className="p-3.5 rounded-xl"
          style={{
            backgroundColor: "rgba(126,158,120,0.04)",
            border: "1px solid rgba(126,158,120,0.12)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-foreground text-[0.8125rem]" style={headingFont}>
              Key Dates
            </span>
          </div>
          <div className="space-y-1.5 text-[0.75rem]" style={bodyFont}>
            {[
              { date: "May 19 (Tue)", label: "Arrival Day", desc: "Check in, team dinner" },
              { date: "May 20 (Wed)", label: "Kitchen Rehearsal", desc: "Full run-through, timing" },
              { date: "May 21 (Thu)", label: "Prep Day", desc: "Mise en place, final setup" },
              { date: "May 22 (Fri)", label: "Event Night", desc: "200+ guests, 8 courses" },
              { date: "May 23 (Sat)", label: "Departure", desc: "Checkout, optional brunch" },
            ].map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span
                  className="text-[0.625rem] w-20 shrink-0"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: "#7E9E78" }}
                >
                  {d.date}
                </span>
                <span className="text-foreground">{d.label}</span>
                <span className="text-muted-foreground text-[0.6875rem] ml-auto hidden sm:block">{d.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather & transport */}
        <div className="grid grid-cols-2 gap-2">
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: "rgba(201,169,110,0.04)",
              border: "1px solid rgba(201,169,110,0.12)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Thermometer className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
              <span className="text-foreground text-[0.75rem]" style={bodyFont}>Weather</span>
            </div>
            <span className="text-muted-foreground text-[0.6875rem] block" style={bodyFont}>
              May avg: 90°F / 32°C. Dry heat. Plan accordingly.
            </span>
          </div>
          <div
            className="p-3 rounded-xl"
            style={{
              backgroundColor: "rgba(74,127,181,0.04)",
              border: "1px solid rgba(74,127,181,0.12)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Car className="w-3.5 h-3.5" style={{ color: "#4A7FB5" }} />
              <span className="text-foreground text-[0.75rem]" style={bodyFont}>Transport</span>
            </div>
            <span className="text-muted-foreground text-[0.6875rem] block mb-1.5" style={bodyFont}>
              Airport pickups coordinated. Confirm your slot in Comms.
            </span>
            {onNavigate && (
              <button
                onClick={() => onNavigate("Comms")}
                className="inline-flex items-center gap-1 text-[0.625rem] cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: "#1A5C38", ...bodyFont }}
              >
                <MessageCircle className="w-2.5 h-2.5" />
                Open Comms
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick links to related pages */}
        <div className="flex gap-2">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate("Event Timeline")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "rgba(107,127,142,0.06)",
                  border: "1px solid rgba(107,127,142,0.12)",
                  ...bodyFont,
                }}
              >
                <CalendarDays className="w-3 h-3" style={{ color: "#6B7F8E" }} />
                <span className="text-[0.6875rem]" style={{ color: "#6B7F8E" }}>Full Timeline</span>
              </button>
              <button
                onClick={() => onNavigate("Travel & Lodging")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl cursor-pointer transition-colors hover:opacity-80"
                style={{
                  backgroundColor: "rgba(74,127,181,0.06)",
                  border: "1px solid rgba(74,127,181,0.12)",
                  ...bodyFont,
                }}
              >
                <Car className="w-3 h-3" style={{ color: "#4A7FB5" }} />
                <span className="text-[0.6875rem]" style={{ color: "#4A7FB5" }}>Travel Details</span>
              </button>
            </>
          )}
        </div>

        {/* Packing checklist */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full cursor-pointer group mb-2"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" style={{ color: "#6B7F8E" }} />
              <span className="text-foreground text-[0.8125rem]" style={headingFont}>
                Packing Checklist
              </span>
              <span
                className="text-[0.625rem] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: completedCount === totalCount ? "rgba(126,158,120,0.1)" : "rgba(205,168,138,0.1)",
                  color: completedCount === totalCount ? "#7E9E78" : "#CDA88A",
                  ...bodyFont,
                }}
              >
                {completedCount}/{totalCount}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground/30 transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ backgroundColor: "rgba(221,207,195,0.5)" }}>
                  <motion.div
                    animate={{ width: `${(completedCount / totalCount) * 100}%` }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #CDA88A, #7E9E78)" }}
                  />
                </div>

                {/* Completion celebration */}
                {completedCount === totalCount && totalCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl mb-3 text-center"
                    style={{ backgroundColor: "rgba(126,158,120,0.08)", border: "1px solid rgba(126,158,120,0.15)" }}
                  >
                    <p className="text-[0.8125rem]" style={{ color: "#7E9E78", ...headingFont }}>
                      All packed! You're ready for Las Vegas.
                    </p>
                    <p className="text-[0.6875rem] text-muted-foreground mt-0.5" style={bodyFont}>
                      Safe travels, Chef.
                    </p>
                  </motion.div>
                )}

                <div className="space-y-1">
                  {checklist.map((item) => {
                    const isChecked = checkedItems.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg transition-colors cursor-pointer text-left ${
                          isChecked ? "opacity-50" : "hover:bg-secondary/50"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 shrink-0" style={{ color: "#7E9E78" }} />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        )}
                        <span
                          className={`text-[0.75rem] flex-1 ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}
                          style={bodyFont}
                        >
                          {item.text}
                        </span>
                        <span
                          className="text-[0.5rem] px-1.5 py-0.5 rounded shrink-0 text-muted-foreground/50"
                          style={{ backgroundColor: "rgba(221,207,195,0.3)", ...bodyFont }}
                        >
                          {item.category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}