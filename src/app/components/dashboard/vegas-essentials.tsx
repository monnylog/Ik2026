import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sun,
  Thermometer,
  Clock,
  Shirt,
  CarFront,
  Phone,
  MapPin,
  ChevronDown,
  ExternalLink,
  Droplets,
} from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

import { bodyFont, headingFont } from "../../lib/fonts";

const VEGAS_IMG =
  "https://images.unsplash.com/photo-1758411623908-6a0edcf866c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMYXMlMjBWZWdhcyUyMHNreWxpbmUlMjBuaWdodCUyMHdhcm0lMjBnbG93fGVufDF8fHx8MTc3MzY0MzQ5MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

interface EssentialItem {
  icon: typeof Sun;
  label: string;
  value: string;
  detail?: string;
  color: string;
}

const essentials: EssentialItem[] = [
  {
    icon: Thermometer,
    label: "Weather",
    value: "High 90s \u00b0F / 32\u201335 \u00b0C",
    detail: "Late May is warm and dry \u2014 stay hydrated",
    color: "#D4A67D",
  },
  {
    icon: Droplets,
    label: "Humidity",
    value: "~15% \u2014 desert dry",
    detail: "Bring lip balm and moisturizer",
    color: "#7EAAB5",
  },
  {
    icon: Clock,
    label: "Time Zone",
    value: "PDT (UTC\u22127)",
    detail: "Las Vegas follows Pacific Daylight Time in May",
    color: "#8B7EC8",
  },
  {
    icon: Shirt,
    label: "Dress Code",
    value: "Smart casual evenings",
    detail: "Kitchen whites provided. Bring casual for rehearsals, smart casual for event night",
    color: "#C9A96E",
  },
  {
    icon: CarFront,
    label: "Airport Transfer",
    value: "LAS \u2192 Venue ~15 min",
    detail: "Ride share readily available. Team shuttle info coming closer to event",
    color: "#7E9E78",
  },
  {
    icon: Phone,
    label: "Emergency",
    value: "Event coordinator on-call",
    detail: "Direct number shared privately via Comms before travel",
    color: "#D0897A",
  },
];

interface VegasEssentialsProps {
  onNavigate?: (page: string) => void;
}

export function VegasEssentials({ onNavigate }: VegasEssentialsProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? essentials : essentials.slice(0, 3);

  return (
    <div
      className="bg-card rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(201,169,110,0.12)" }}
    >
      {/* Photo header */}
      <div className="relative h-28 overflow-hidden">
        <ImageWithFallback
          src={VEGAS_IMG}
          alt="Las Vegas skyline"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(26,47,35,0.3) 0%, rgba(26,47,35,0.75) 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <MapPin className="w-3 h-3 text-amber-300/80" />
                <span
                  className="text-[0.625rem] uppercase tracking-widest text-amber-200/60"
                  style={bodyFont}
                >
                  Las Vegas, Nevada
                </span>
              </div>
              <h3
                className="text-white text-[0.9375rem] leading-tight"
                style={headingFont}
              >
                Your Vegas Guide
              </h3>
            </div>
            <div className="flex items-center gap-1">
              <Sun className="w-3.5 h-3.5 text-amber-300/70" />
              <span
                className="text-amber-200/70 text-[0.6875rem]"
                style={bodyFont}
              >
                May 2026
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Essentials list */}
      <div className="p-3.5 space-y-0">
        <AnimatePresence initial={false}>
          {visibleItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, delay: i > 2 ? (i - 3) * 0.05 : 0 }}
              >
                <div
                  className="flex items-start gap-3 py-2.5"
                  style={{
                    borderBottom:
                      i < visibleItems.length - 1
                        ? "1px solid rgba(140,165,135,0.06)"
                        : "none",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${item.color}08`,
                      border: `1px solid ${item.color}15`,
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: item.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-muted-foreground text-[0.6875rem]"
                        style={bodyFont}
                      >
                        {item.label}
                      </span>
                    </div>
                    <span
                      className="text-foreground text-[0.8125rem] block leading-snug"
                      style={bodyFont}
                    >
                      {item.value}
                    </span>
                    {item.detail && (
                      <span
                        className="text-muted-foreground text-[0.6875rem] block mt-0.5 leading-relaxed"
                        style={bodyFont}
                      >
                        {item.detail}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Show more / less */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 mt-1 rounded-lg cursor-pointer transition-colors hover:bg-secondary/30"
          style={bodyFont}
        >
          <span className="text-muted-foreground text-[0.75rem]">
            {expanded ? "Show less" : `${essentials.length - 3} more essentials`}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </motion.button>
      </div>

      {/* Footer CTA */}
      <div
        className="px-4 py-3"
        style={{
          borderTop: "1px solid rgba(140,165,135,0.06)",
          background: "rgba(201,169,110,0.02)",
        }}
      >
        <button
          onClick={() => onNavigate?.("Travel & Lodging")}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg cursor-pointer transition-all hover:opacity-80"
          style={{
            backgroundColor: "rgba(201,169,110,0.08)",
            border: "1px solid rgba(201,169,110,0.15)",
            ...bodyFont,
          }}
        >
          <span className="text-[0.75rem]" style={{ color: "#C9A96E" }}>
            View full travel details
          </span>
          <ExternalLink className="w-3 h-3" style={{ color: "#C9A96E" }} />
        </button>
      </div>
    </div>
  );
}