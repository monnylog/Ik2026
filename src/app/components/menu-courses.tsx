import type { UserRole } from "./onboarding/use-auth";
import { ChefSubmissions } from "./chef-submissions";
import { SubmissionTracker } from "./submission-tracker";
import { OverlapAnalysis } from "./overlap-analysis";
import { CompareSubmissions } from "./compare-submissions";
import { apiFetch } from "../lib/supabase";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UtensilsCrossed,
  MapPin,
  ChefHat,
  BookOpen,
  Wine,
  Leaf,
  Sparkles,
  X,
  Clock,
  ArrowRight,
  Users,
  DollarSign,
} from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface Course {
  number: number;
  title: string;
  location: string;
  year: string | null;
  chef: string;
  description: string;
  historicalContext: string;
  suggestedDishes: string[];
  pairing: string;
  keyIngredients: string[];
  prepTime: string;
  special?: boolean;
}

const courses: Course[] = [
  {
    number: 1,
    title: "Arrival",
    location: "Las Vegas, NV",
    year: "1911",
    chef: "Chef Dio Buan",
    description: "An opening course that grounds the meal in the present — Las Vegas as the gathering point, the starting line for everything that follows.",
    historicalContext: "By 1911, Filipino laborers were arriving in mainland U.S. cities, drawn by promises of work. Las Vegas, a crossroads city built by outsiders, mirrors the Filipino-American journey of building something from nothing.",
    suggestedDishes: ["Amuse-bouche trio", "Lumpia Shanghai with truffle salt", "Calamansi gel shooter"],
    pairing: "Sparkling Lambanog Cocktail",
    keyIngredients: ["Lumpia wrappers", "Ground pork", "Truffle salt", "Calamansi"],
    prepTime: "2 hrs",
  },
  {
    number: 2,
    title: "The Cold North",
    location: "Alaska",
    year: "1911",
    chef: "Chef Rachel Barril",
    description: "A course that speaks to isolation, adaptation, and the freezing landscapes where Filipino cannery workers carved out a life.",
    historicalContext: "Filipino workers arrived in Alaskan canneries as early as 1911, laboring in brutal conditions. They adapted their cooking to local ingredients — salmon, halibut, foraged greens — creating a fusion born of survival.",
    suggestedDishes: ["Smoked salmon sinigang", "Kelp and kamote salad", "Fermented berry sawsawan"],
    pairing: "Chilled Sake with Yuzu",
    keyIngredients: ["Wild salmon", "Tamarind", "Kelp", "Sweet potato"],
    prepTime: "3 hrs",
  },
  {
    number: 3,
    title: "Island Roots",
    location: "Hawaii",
    year: "1906",
    chef: "Chef Justin Barnes",
    description: "A celebration of the sakada generation — the plantation workers who brought Filipino food traditions to Hawaii and transformed the islands' cuisine forever.",
    historicalContext: "Starting in 1906, waves of Filipino sakadas (contract laborers) arrived in Hawaii's sugar plantations. They brought adobo, pancit, and lechon, which became cornerstones of Hawaiian plate lunch culture.",
    suggestedDishes: ["Lechon belly with pineapple atchara", "Poi-infused kare-kare", "Haupia bibingka"],
    pairing: "Tropical Guava Mimosa",
    keyIngredients: ["Pork belly", "Pineapple", "Taro", "Coconut milk"],
    prepTime: "4 hrs",
  },
  {
    number: 4,
    title: "The Capital Table",
    location: "Washington D.C.",
    year: "1903",
    chef: "Chef Patrice Cleary",
    description: "Where Filipino food meets diplomacy — the pensionados (scholars) who came to D.C. and brought their culinary traditions into the corridors of power.",
    historicalContext: "The Pensionado Act of 1903 brought Filipino students to American universities. In D.C., they established communities, hosted gatherings, and used food as a bridge between cultures.",
    suggestedDishes: ["Bibingka soufflé", "Duck adobo confit", "Ube panna cotta"],
    pairing: "Virginia Sparkling Rosé",
    keyIngredients: ["Rice flour", "Duck", "Ube", "Salted egg"],
    prepTime: "3.5 hrs",
  },
  {
    number: 5,
    title: "Pacific Gateway",
    location: "Seattle, WA",
    year: "1883",
    chef: "Chef Aaron Versoza",
    description: "Seattle's deep Filipino roots, from the cannery unions to the International District — a course about community, labor, and the Pacific as a highway home.",
    historicalContext: "Filipino immigration to Seattle dates to the 1880s. The city became a hub for cannery union organizing, civil rights activism, and one of the largest Filipino-American communities outside of California.",
    suggestedDishes: ["Pacific Northwest tinola", "Dungeness crab with coconut vinegar", "Smoked oyster paksiw"],
    pairing: "Washington State Riesling",
    keyIngredients: ["Dungeness crab", "Malunggay", "Ginger", "Coconut vinegar"],
    prepTime: "2.5 hrs",
  },
  {
    number: 6,
    title: "Bayou Manila",
    location: "New Orleans, LA",
    year: "1763",
    chef: "Chef Christina Quackenbush",
    description: "The oldest Filipino settlement in the U.S. — Manila Village in the Louisiana bayous, where Filipino fishermen dried shrimp and built a community that lasted centuries.",
    historicalContext: "In 1763, Filipino sailors jumped ship from Spanish galleons and settled in the bayous of Louisiana, creating Manila Village — the first permanent Filipino settlement in America. They pioneered the shrimp-drying industry.",
    suggestedDishes: ["Shrimp & bagoong étouffée", "Gumbo with moringa", "Beignet with ube sugar"],
    pairing: "Creole-spiced Rum Punch",
    keyIngredients: ["Gulf shrimp", "Bagoong", "Okra", "Moringa"],
    prepTime: "3 hrs",
  },
  {
    number: 7,
    title: "First Contact",
    location: "California",
    year: "1587",
    chef: "Chef Lord Maynard",
    description: "The earliest documented Filipino presence in the Americas — the Manila galleon trade route that brought Filipino sailors to California shores in 1587.",
    historicalContext: "On October 18, 1587, Filipino crew members aboard the Manila galleon Nuestra Señora de Esperanza landed at Morro Bay, California — 20 years before Jamestown, 33 years before Plymouth Rock.",
    suggestedDishes: ["Galleon-spiced crispy pata", "Adobe-roasted whole fish", "Heritage rice with bone marrow"],
    pairing: "California Old Vine Zinfandel",
    keyIngredients: ["Pork knuckle", "Heritage rice", "Bone marrow", "Galleon spices"],
    prepTime: "5 hrs",
  },
  {
    number: 8,
    title: "One Table",
    location: "Shared Dessert",
    year: null,
    chef: "All Chefs",
    description: "A collaborative finale — every chef contributes a component to a communal Halo-Halo that represents the blending of all their stories, regions, and traditions into one bowl.",
    historicalContext: "Halo-Halo means 'mix-mix' — a perfect metaphor for the Filipino-American experience. Every ingredient distinct, every flavor its own, but together creating something that could only exist because of the blend.",
    suggestedDishes: ["Collaborative Halo-Halo with 7 chef components", "Turon bites", "Leche flan shooters"],
    pairing: "Filipino Coffee Service",
    keyIngredients: ["Shaved ice", "Ube ice cream", "Leche flan", "Sweet beans", "Jackfruit"],
    prepTime: "1.5 hrs",
    special: true,
  },
];

interface MenuCoursesProps {
  role?: UserRole;
  onNavigate?: (page: string) => void;
}

export function MenuCourses({ role, onNavigate }: MenuCoursesProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const chefCount = new Set(courses.filter(c => !c.special).map(c => c.chef)).size;
  const isChef = role === "chef";
  const isLeadership = role === "leadership";

  // Load submissions for overlap/compare (leadership only)
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  useEffect(() => {
    if (!isLeadership) return;
    (async () => {
      try {
        const res = await apiFetch("/chef-submissions");
        setAllSubmissions(res.submissions || []);
      } catch (e) {
        console.error("Failed to load submissions for analysis:", e);
      }
    })();
  }, [isLeadership]);

  return (
    <div className="space-y-6">
      {/* Chef submissions panel — top of page for chefs */}
      {isChef && <ChefSubmissions onNavigate={onNavigate} />}

      {/* Leadership submission tracker */}
      {isLeadership && <SubmissionTracker />}

      {/* Leadership tools: overlap analysis + compare */}
      {isLeadership && allSubmissions.length >= 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <CompareSubmissions submissions={allSubmissions} />
          </div>
          <OverlapAnalysis submissions={allSubmissions} />
        </div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="w-5 h-5 text-gold" />
          <h2 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
            Menu & Courses
          </h2>
        </div>
        <p className="text-muted-foreground text-[0.875rem]" style={bodyFont}>
          8 courses tracing Filipino presence in America — 1587 to today.
        </p>
      </motion.div>

      {/* Quick summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03, duration: 0.4 }}
        className="flex gap-4 flex-wrap"
      >
        {[
          { label: "Courses", value: courses.length.toString(), color: "text-gold" },
          { label: "Chefs", value: chefCount.toString(), color: "text-gold" },
          { label: "Regions", value: chefCount.toString(), color: "text-info" },
          { label: "Collaborative Finale", value: "1", color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <span className={`text-[1.25rem] ${stat.color}`} style={headingFont}>{stat.value}</span>
            <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>{stat.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Journey Timeline Strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.4 }}
        className="bg-card border border-border rounded-xl p-4 overflow-x-auto"
      >
        <p className="text-[0.6875rem] text-muted-foreground mb-3 uppercase tracking-wider" style={bodyFont}>
          Journey Through Filipino America
        </p>
        <div className="flex items-center min-w-[600px]">
          {courses.map((course, idx) => {
            const isLast = idx === courses.length - 1;
            return (
              <div key={course.number} className="flex items-center flex-1">
                <button
                  onClick={() => setSelectedCourse(course)}
                  className="flex flex-col items-center gap-1.5 cursor-pointer group relative"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.75rem] transition-all group-hover:scale-110 ${
                      course.special
                        ? "bg-gold/20 text-gold ring-2 ring-gold/30"
                        : "bg-foreground/5 text-muted-foreground group-hover:bg-gold/10 group-hover:text-gold"
                    }`}
                    style={headingFont}
                  >
                    {course.number}
                  </div>
                  <span className="text-[0.5625rem] text-muted-foreground group-hover:text-foreground transition-colors text-center max-w-[70px] leading-tight" style={bodyFont}>
                    {course.title}
                  </span>
                  {course.year && (
                    <span className="text-[0.5rem] text-muted-foreground/50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {course.year}
                    </span>
                  )}
                </button>
                {!isLast && (
                  <div className="flex-1 h-px mx-1" style={{ background: "linear-gradient(90deg, rgba(201,169,110,0.3), rgba(201,169,110,0.08))" }} />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Course cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {courses.map((course, idx) => (
          <motion.div
            key={course.number}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + idx * 0.05 }}
            whileHover={{
              y: -4,
              boxShadow: course.special
                ? "0 12px 32px rgba(205,168,138,0.15), 0 0 0 1px rgba(205,168,138,0.4)"
                : "0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(205,168,138,0.2)",
            }}
            onClick={() => setSelectedCourse(course)}
            className={`group relative rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden ${
              course.special
                ? ""
                : "border-border bg-card"
            }`}
            style={
              course.special
                ? { borderColor: "rgba(205,168,138,0.3)", background: "linear-gradient(to bottom right, rgba(205,168,138,0.05), rgba(205,168,138,0.1))" }
                : undefined
            }
          >
            {/* Course number */}
            <div className="absolute top-3 right-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.8125rem] transition-colors ${
                course.special
                  ? "bg-gold/20 text-gold"
                  : "bg-foreground/5 text-muted-foreground group-hover:bg-gold/10 group-hover:text-gold"
              }`} style={headingFont}>
                {course.number}
              </div>
            </div>

            <div className="p-5">
              {/* Title */}
              <h3 className="text-foreground text-[1rem] mb-1 pr-8" style={headingFont}>
                {course.title}
              </h3>

              {/* Location */}
              <div className="flex items-center gap-1.5 mb-2">
                {course.special ? (
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-gold/70" />
                )}
                <span className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                  {course.location}
                </span>
              </div>

              {/* Year */}
              {course.year && (
                <span className="inline-block text-[0.6875rem] text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full mb-3 tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Est. {course.year}
                </span>
              )}
              {course.special && (
                <span className="inline-block text-[0.6875rem] text-gold bg-gold/10 px-2 py-0.5 rounded-full mb-3">
                  Halo-Halo
                </span>
              )}

              {/* Description preview */}
              <p className="text-muted-foreground text-[0.75rem] mb-3 line-clamp-2 leading-relaxed" style={bodyFont}>
                {course.description}
              </p>

              {/* Chef */}
              <div className="flex items-center gap-1.5 pt-3 border-t border-border/60 group-hover:border-gold/20 transition-colors">
                <ChefHat className={`w-3.5 h-3.5 ${course.special ? "text-gold" : "text-muted-foreground group-hover:text-gold/70"} transition-colors`} />
                <span className="text-[0.8125rem] text-muted-foreground" style={bodyFont}>
                  {course.chef}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              style={{ border: "1px solid rgba(205,168,138,0.15)" }}
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-border flex-shrink-0">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[1.125rem] ${
                    selectedCourse.special ? "bg-gold/20 text-gold" : "bg-gold/10 text-gold"
                  }`} style={headingFont}>
                    {selectedCourse.number}
                  </div>
                  <div>
                    <h3 className="text-foreground text-[1.25rem]" style={headingFont}>
                      {selectedCourse.title}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                      <MapPin className="w-3 h-3" />
                      {selectedCourse.location}
                      {selectedCourse.year && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Est. {selectedCourse.year}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {/* Description */}
                <p className="text-foreground text-[0.875rem] leading-relaxed" style={bodyFont}>
                  {selectedCourse.description}
                </p>

                {/* Historical context */}
                <div className="p-4 rounded-xl border border-gold/15" style={{ background: "linear-gradient(to bottom, rgba(192,209,177,0.15), rgba(205,168,138,0.08))" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                    <span className="text-foreground text-[0.875rem]" style={headingFont}>Historical Context</span>
                  </div>
                  <p className="text-foreground/80 text-[0.8125rem] leading-relaxed" style={bodyFont}>
                    {selectedCourse.historicalContext}
                  </p>
                </div>

                {/* Suggested dishes */}
                <div>
                  <h4 className="text-foreground text-[0.875rem] mb-2" style={headingFont}>Suggested Dishes</h4>
                  <div className="space-y-2">
                    {selectedCourse.suggestedDishes.map(dish => (
                      <div key={dish} className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
                        <UtensilsCrossed className="w-3 h-3 text-gold shrink-0" />
                        <span className="text-foreground text-[0.8125rem]" style={bodyFont}>{dish}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grid: pairing, prep time, chef */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
                    <Wine className="w-3.5 h-3.5 text-gold mb-1.5" />
                    <span className="text-[0.6875rem] text-muted-foreground block mb-0.5" style={bodyFont}>Pairing</span>
                    <span className="text-foreground text-[0.8125rem]" style={bodyFont}>{selectedCourse.pairing}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
                    <Clock className="w-3.5 h-3.5 text-gold mb-1.5" />
                    <span className="text-[0.6875rem] text-muted-foreground block mb-0.5" style={bodyFont}>Prep Time</span>
                    <span className="text-foreground text-[0.8125rem]" style={bodyFont}>{selectedCourse.prepTime}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60">
                    <ChefHat className="w-3.5 h-3.5 text-gold mb-1.5" />
                    <span className="text-[0.6875rem] text-muted-foreground block mb-0.5" style={bodyFont}>Chef</span>
                    <span className="text-foreground text-[0.8125rem]" style={bodyFont}>{selectedCourse.chef}</span>
                  </div>
                </div>

                {/* Key ingredients */}
                <div>
                  <h4 className="text-foreground text-[0.875rem] mb-2" style={headingFont}>Key Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.keyIngredients.map(ing => (
                      <span key={ing} className="flex items-center gap-1.5 text-[0.75rem] bg-gold/8 text-gold px-3 py-1 rounded-full" style={bodyFont}>
                        <Leaf className="w-3 h-3" />
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cross-navigation footer */}
      {onNavigate && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <button
            onClick={() => onNavigate("Chef Roster")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(126,158,120,0.06)",
              border: "1px solid rgba(126,158,120,0.12)",
              ...bodyFont,
            }}
          >
            <Users className="w-4 h-4" style={{ color: "#7E9E78" }} />
            <span className="text-[0.8125rem]" style={{ color: "#7E9E78" }}>
              Chef Roster
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7E9E78", opacity: 0.5 }} />
          </button>
          {role === "leadership" && (
            <button
              onClick={() => onNavigate("Budget & COGS")}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
              style={{
                backgroundColor: "rgba(126,158,120,0.06)",
                border: "1px solid rgba(126,158,120,0.12)",
                ...bodyFont,
              }}
            >
              <DollarSign className="w-4 h-4" style={{ color: "#CDA88A" }} />
              <span className="text-[0.8125rem]" style={{ color: "#CDA88A" }}>
                Budget & COGS
              </span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: "#CDA88A", opacity: 0.5 }} />
            </button>
          )}
          <button
            onClick={() => onNavigate("Event Timeline")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-colors hover:opacity-80"
            style={{
              backgroundColor: "rgba(107,127,142,0.06)",
              border: "1px solid rgba(107,127,142,0.12)",
              ...bodyFont,
            }}
          >
            <BookOpen className="w-4 h-4" style={{ color: "#6B7F8E" }} />
            <span className="text-[0.8125rem]" style={{ color: "#6B7F8E" }}>
              Event Timeline
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#6B7F8E", opacity: 0.5 }} />
          </button>
        </motion.div>
      )}
    </div>
  );
}