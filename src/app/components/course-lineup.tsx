import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, ChefHat, Sparkles, ChevronDown, X, UtensilsCrossed, BookOpen, Leaf, Clock, FlameKindling } from "lucide-react";
import { useNotionDatabase } from "../lib/notion-sync";
import { NotionSyncBadge } from "./ui/notion-sync-badge";
import { transformCourse } from "../lib/notion-transforms";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };
const monoFont = { fontFamily: "'JetBrains Mono', monospace" };

interface Course {
  number: number;
  location: string;
  year: string | null;
  chef: string;
  subtitle: string;
  dish: string;
  description: string;
  special?: string;
  ingredients: string[];
  prepNotes: string;
  chefBio: string;
  servingStyle: string;
}

const courses: Course[] = [
  {
    number: 1, location: "Las Vegas, NV", year: "1911", chef: "Chef Dio Buan", subtitle: "The Desert Frontier",
    dish: "Kare-Kare with Smoked Oxtail Marrow",
    description: "A reimagined kare-kare featuring 48-hour smoked oxtail marrow, toasted peanut crumble, and fermented shrimp paste foam. Served with heirloom rice from Kalinga province.",
    ingredients: ["Oxtail (48-hr smoked)", "Annatto seeds", "Peanut butter (house-roasted)", "Bagoong alamang", "Bok choy", "Eggplant", "Kalinga heirloom rice"],
    prepNotes: "Oxtail requires 2-day advance smoke. Peanut crumble and shrimp paste foam prepped day-of. Plate hot with marrow center.",
    chefBio: "A Las Vegas local known for merging bold Filipino flavors with modern American fine dining. Dio's cooking centers on his lola's recipes reimagined through a contemporary lens.",
    servingStyle: "Plated, individual portion with marrow bone centerpiece",
  },
  {
    number: 2, location: "Alaska", year: "1911", chef: "Chef Rachel Barril", subtitle: "The Alaskeros",
    dish: "Smoked Salmon Sinigang",
    description: "Cold-smoked Copper River salmon in a tamarind-green mango broth, with foraged fiddlehead ferns and watermelon radish. A tribute to the Alaskero cannery workers.",
    ingredients: ["Copper River salmon", "Tamarind paste", "Green mango", "Fiddlehead ferns (foraged)", "Watermelon radish", "Long green chili", "Tomatoes"],
    prepNotes: "Salmon cold-smoked 3 hours before service. Broth built same day. Fiddleheads blanched and shocked. Radish sliced paper-thin on mandoline.",
    chefBio: "From the remote kitchens of Alaska, Rachel draws on Filipino and Indigenous Alaskan food traditions — preservation, fermentation, and living off the land.",
    servingStyle: "Bowl service, broth ladled tableside from ceramic tureen",
  },
  {
    number: 3, location: "Hawaii", year: "1906", chef: "Chef Justin Barnes", subtitle: "The Sakadas",
    dish: "Lechon Belly with Pineapple Atchara",
    description: "Crispy-skin lechon belly glazed with sugarcane vinegar, paired with grilled Maui pineapple atchara and taro leaf laing purée. Honoring the sakada generation.",
    ingredients: ["Pork belly (skin-on)", "Sugarcane vinegar", "Maui gold pineapple", "Coconut cream", "Taro leaves", "Lemongrass", "Garlic"],
    prepNotes: "Pork belly scored and dry-brined 24 hours. Roasted at high heat for crispy skin. Atchara fermented 48 hours in advance. Laing purée cooked low and slow.",
    chefBio: "A Hawaii-based chef deeply rooted in the plantation-era history of Filipino immigration to the islands. Justin's cooking honors the sakada generation through ingredient-driven storytelling.",
    servingStyle: "Family-style sliced belly on banana leaf with individual atchara ramekins",
  },
  {
    number: 4, location: "Washington D.C.", year: "1903", chef: "Chef Patrice Cleary", subtitle: "The Pensionados",
    dish: "Bibingka Soufflé",
    description: "A delicate soufflé infused with coconut cream and salted duck egg, served with latik caramel and banana blossom compote. French technique meets Filipino soul.",
    ingredients: ["Rice flour", "Coconut cream", "Salted duck egg", "Latik (coconut curds)", "Banana blossom", "Muscovado sugar", "Butter"],
    prepNotes: "Soufflé batter prepped in advance; baked to order during service (12 min). Latik caramel and compote plated first. Must serve immediately — no hold time.",
    chefBio: "Operating at the intersection of diplomacy and cuisine in D.C., Patrice uses her platform to elevate Filipino food as a cultural ambassador's tool.",
    servingStyle: "Individual ramekin soufflé, served with caramel pitcher for tableside pour",
  },
  {
    number: 5, location: "Seattle, WA", year: "1883", chef: "Chef Aaron Versoza", subtitle: "The Lumber Pioneer",
    dish: "Pacific Northwest Tinola",
    description: "Geoduck and halibut tinola with lemongrass-ginger broth, chayote, and moringa leaves. Live geoduck breakdown tableside for guests.",
    ingredients: ["Geoduck (live)", "Halibut fillet", "Lemongrass", "Fresh ginger", "Chayote", "Moringa leaves", "Fish sauce"],
    prepNotes: "Geoduck broken down tableside as interactive moment. Halibut poached in broth 4 min before service. Moringa added last to preserve color and nutrients.",
    chefBio: "A Seattle fixture whose restaurants are gathering places for the Filipino-American community. Aaron's cooking is rooted in memory, place, and the immigrant experience.",
    servingStyle: "Tableside interactive — geoduck breakdown followed by bowl service",
  },
  {
    number: 6, location: "New Orleans, LA", year: "1763", chef: "Chef Christina Quackenbush", subtitle: "The First Settlement",
    dish: "Shrimp & Bagoong Étouffée",
    description: "Louisiana gulf shrimp in a roux-based étouffée enriched with bagoong alamang, served over garlic sinangag rice. A Cajun-Filipino love letter to Manila Village.",
    ingredients: ["Gulf shrimp (head-on)", "Bagoong alamang", "Butter roux", "Holy trinity (onion, celery, bell pepper)", "Garlic sinangag rice", "Green onions", "Cayenne"],
    prepNotes: "Roux built 45 min before service — dark chocolate color. Shrimp sautéed à la minute. Bagoong folded into roux for umami depth. Sinangag fried crispy.",
    chefBio: "From the Crescent City, Christina explores the 18th-century Filipino presence in Louisiana — the Manila Village shrimpers, the bayou communities, and the flavors they left behind.",
    servingStyle: "Shallow bowl with rice mound, étouffée ladled around, shrimp arranged on top",
  },
  {
    number: 7, location: "California", year: "1587", chef: "Chef Lord Maynard", subtitle: "The First Landing",
    dish: "Galleon-Spiced Crispy Pata",
    description: "Open-fire crispy pata rubbed with galleon trade spices — cinnamon, star anise, black pepper — with a sawsawan trio: spiced vinegar, liver sauce, calamansi aioli.",
    ingredients: ["Pork knuckle (pata)", "Cinnamon bark", "Star anise", "Black peppercorn", "Spiced cane vinegar", "Chicken liver", "Calamansi"],
    prepNotes: "Pata boiled until tender, then deep-fried to order for maximum crunch. Spice rub applied post-fry while still glistening. Three sawsawan prepared in advance.",
    chefBio: "Based in California, Lord Maynard traces Filipino presence back to the Manila galleon trade. His cooking is a meditation on what it means to have roots in two worlds.",
    servingStyle: "Whole pata on wooden board, carved tableside with sawsawan trio",
  },
  {
    number: 8, location: "Collaborative Dessert", year: null, chef: "Chef Marco Ignacio", special: "Finale",
    dish: "Ube Panna Cotta with Calamansi Caramel",
    description: "A Brooklyn-born dessert: silky ube panna cotta with calamansi caramel, toasted coconut tuile, and macapuno pearls. All chefs contribute a garnish element from their course.",
    ingredients: ["Ube halaya", "Heavy cream", "Gelatin", "Calamansi juice", "Muscovado sugar", "Coconut (toasted)", "Macapuno strings"],
    prepNotes: "Panna cotta set overnight in individual molds. Caramel made same-day. Each chef contributes one micro-garnish from their course for a collaborative finale plate.",
    chefBio: "A Brooklyn-based chef merging Filipino comfort food with Italian technique. Marco's pop-up 'Kusina BK' became a sensation in the NYC food scene.",
    servingStyle: "Individual plated dessert with collaborative garnish ring from all 7 chefs",
  },
];

interface CourseLineupProps {
  collapsible?: boolean;
}

export function CourseLineup({ collapsible = false }: CourseLineupProps) {
  const [expanded, setExpanded] = useState(!collapsible);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { items: notionCourses } = useNotionDatabase("courses");
  const isFromNotion = notionCourses.length > 0;
  const courseData: Course[] = notionCourses.length > 0
    ? notionCourses.map(transformCourse) as unknown as Course[]
    : courses;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="bg-card border border-border rounded-xl p-5"
      >
        <div
          className={`flex items-center justify-between ${expanded ? "mb-5" : ""} ${collapsible ? "cursor-pointer" : ""}`}
          onClick={() => collapsible && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gold" />
            <h3 className="text-foreground" style={headingFont}>
              Course Lineup
            </h3>
            <NotionSyncBadge isLive={isFromNotion} compact />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
              {courseData.length} Courses
            </span>
            {collapsible && (
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
              />
            )}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {courseData.map((course, idx) => (
                  <motion.div
                    key={course.number}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.4 + idx * 0.05,
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    whileHover={{
                      y: -4,
                      boxShadow: course.special
                        ? "0 12px 32px rgba(205,168,138,0.15), 0 0 0 1px rgba(205,168,138,0.4)"
                        : "0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(205,168,138,0.2)",
                      transition: { duration: 0.25 },
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCourse(course)}
                    className="group relative rounded-xl border cursor-pointer overflow-hidden border-border"
                    style={
                      course.special
                        ? { borderColor: "rgba(205,168,138,0.3)", background: "linear-gradient(to bottom right, rgba(205,168,138,0.05), rgba(205,168,138,0.1))" }
                        : { backgroundColor: "rgba(221,207,195,0.3)" }
                    }
                  >
                    {/* Course number badge */}
                    <div className="absolute top-3 right-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.75rem] transition-colors duration-300 ${
                          course.special
                            ? "bg-gold/20 text-gold group-hover:bg-gold/30"
                            : "bg-foreground/5 text-muted-foreground group-hover:bg-gold/10 group-hover:text-gold"
                        }`}
                        style={headingFont}
                      >
                        {course.number}
                      </div>
                    </div>

                    <div className="p-4">
                      {/* Location */}
                      <div className="flex items-center gap-1.5 mb-2">
                        {course.special ? (
                          <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-gold/70 shrink-0 group-hover:text-gold transition-colors duration-300" />
                        )}
                        <span className="text-foreground text-[0.875rem] truncate" style={headingFont}>
                          {course.location}
                        </span>
                      </div>

                      {/* Year */}
                      {course.year && (
                        <span
                          className="inline-block text-[0.6875rem] text-muted-foreground bg-foreground/5 px-2 py-0.5 rounded-full mb-3 tracking-wider"
                          style={monoFont}
                        >
                          Est. {course.year}
                        </span>
                      )}
                      {course.special && (
                        <span className="inline-block text-[0.6875rem] text-gold bg-gold/10 px-2 py-0.5 rounded-full mb-3 tracking-wider">
                          {course.special}
                        </span>
                      )}

                      {/* Chef */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 group-hover:border-gold/20 transition-colors duration-300">
                        <ChefHat
                          className={`w-3.5 h-3.5 shrink-0 transition-colors duration-300 ${
                            course.special
                              ? "text-gold"
                              : "text-muted-foreground group-hover:text-gold/70"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[0.8125rem] text-muted-foreground truncate block" style={bodyFont}>
                            {course.chef}
                          </span>
                          {course.dish && (
                            <span className="text-[0.6875rem] text-gold/70 truncate block" style={bodyFont}>
                              {course.dish}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {course.description && (
                        <p className="text-[0.625rem] text-muted-foreground/60 leading-relaxed mt-2 line-clamp-2" style={bodyFont}>
                          {course.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ COURSE DETAIL MODAL ═══ */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              style={{ border: "1px solid rgba(205,168,138,0.15)" }}
            >
              {/* Modal header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-border shrink-0">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: selectedCourse.special ? "rgba(201,169,110,0.12)" : "rgba(205,168,138,0.08)",
                      border: selectedCourse.special ? "1px solid rgba(201,169,110,0.2)" : "1px solid rgba(205,168,138,0.15)",
                    }}
                  >
                    <span className="text-[1.125rem]" style={{ color: "#C9A96E", ...headingFont }}>{selectedCourse.number}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground text-[1.25rem]" style={headingFont}>
                      {selectedCourse.location}
                    </h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-[0.8125rem]" style={bodyFont}>
                      <span className="text-gold/70">{selectedCourse.subtitle}</span>
                      {selectedCourse.year && (
                        <>
                          <span className="text-muted-foreground/30">&middot;</span>
                          <span style={monoFont} className="text-[0.75rem]">Est. {selectedCourse.year}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Dish name */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.12)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-gold" />
                    <span className="text-foreground text-[0.8125rem]" style={headingFont}>The Dish</span>
                  </div>
                  <p className="text-gold text-[1rem]" style={headingFont}>
                    {selectedCourse.dish}
                  </p>
                  <p className="text-muted-foreground text-[0.8125rem] leading-relaxed mt-2" style={bodyFont}>
                    {selectedCourse.description}
                  </p>
                </div>

                {/* Chef bio snippet */}
                <div className="p-4 rounded-xl" style={{ background: "linear-gradient(to bottom, rgba(192,209,177,0.12), rgba(205,168,138,0.06))", border: "1px solid rgba(126,158,120,0.12)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ChefHat className="w-3.5 h-3.5 text-gold" />
                    <span className="text-foreground text-[0.8125rem]" style={headingFont}>{selectedCourse.chef}</span>
                  </div>
                  <p className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>
                    {selectedCourse.chefBio}
                  </p>
                </div>

                {/* Ingredient highlights */}
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Leaf className="w-3.5 h-3.5 text-gold" />
                    <span className="text-foreground text-[0.875rem]" style={headingFont}>Key Ingredients</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourse.ingredients.map((ing) => (
                      <motion.span
                        key={ing}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[0.75rem] px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: "rgba(126,158,120,0.08)",
                          color: "#7E9E78",
                          border: "1px solid rgba(126,158,120,0.12)",
                          ...bodyFont,
                        }}
                      >
                        {ing}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Preparation notes */}
                <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(205,168,138,0.04)", border: "1px solid rgba(205,168,138,0.1)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <FlameKindling className="w-3.5 h-3.5" style={{ color: "#CDA88A" }} />
                    <span className="text-foreground text-[0.8125rem]" style={headingFont}>Preparation Notes</span>
                  </div>
                  <p className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>
                    {selectedCourse.prepNotes}
                  </p>
                </div>

                {/* Serving style */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                  <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div style={bodyFont}>
                    <span className="text-[0.6875rem] text-muted-foreground/50 uppercase tracking-wider block">Serving Style</span>
                    <span className="text-foreground text-[0.8125rem]">{selectedCourse.servingStyle}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}