// ─── Confirmed Chef Directory ────────────────────────────────────
// Pre-set profiles for personalized onboarding.
// chefDirectoryId is stored on the user profile to link identity.

import type { ChefFormData } from "./use-draft";

export interface ConfirmedChef {
  id: string;
  name: string;
  city: string;
  state?: string;
  airport: string;
  course: number;
  courseTitle: string;
  year: string;
  avatarId: string;
  travelMethod: string;
  bio: string;
  specialties: string[];
  signatureDish: string;
  greeting: string; // personalized welcome message
  logoUrl?: string; // chef's restaurant/brand logo or headshot URL
}

export const confirmedChefs: ConfirmedChef[] = [
  {
    id: "dio",
    name: "Dio Buan",
    city: "Las Vegas",
    state: "NV",
    airport: "LAS",
    course: 1,
    courseTitle: "Course 1",
    year: "1911",
    avatarId: "flame",
    travelMethod: "",
    bio: "A Las Vegas-based chef known for merging bold Filipino flavors with modern American fine dining.",
    specialties: ["Modern Filipino", "Fine Dining", "Fermentation"],
    signatureDish: "Kare-Kare with Smoked Oxtail Marrow",
    greeting: "Welcome home, Chef Dio. Your kitchen, your city.",
    logoUrl: "https://ui-avatars.com/api/?name=DB&background=C49370&color=fff&size=128&font-size=0.4&bold=true",
  },
  {
    id: "rachel",
    name: "Rachel Barril",
    city: "Juneau",
    state: "AK",
    airport: "JNU",
    course: 2,
    courseTitle: "Course 2",
    year: "1911",
    avatarId: "leaf",
    travelMethod: "Flying",
    bio: "From the remote kitchens of Alaska, Rachel draws on the connection between Filipino and Indigenous Alaskan food traditions.",
    specialties: ["Farm-to-Table", "Fermentation", "Foraging"],
    signatureDish: "Smoked Salmon Sinigang",
    greeting: "Welcome, Chef Rachel. From Alaska to Vegas — we're glad you're here.",
    logoUrl: "https://ui-avatars.com/api/?name=RB&background=7A865C&color=fff&size=128&font-size=0.4&bold=true",
  },
  {
    id: "justin",
    name: "Justin Barnes",
    city: "Hawaii",
    state: "",
    airport: "HNL",
    course: 3,
    courseTitle: "Course 3",
    year: "1906",
    avatarId: "island",
    travelMethod: "Flying",
    bio: "A Hawaii-based chef deeply rooted in the plantation-era history of Filipino immigration to the islands.",
    specialties: ["Hawaiian-Filipino Fusion", "Grilling", "Tropical Ingredients"],
    signatureDish: "Lechon Belly with Pineapple Atchara",
    greeting: "Welcome, Chef Justin. The islands travel with you.",
    logoUrl: "https://ui-avatars.com/api/?name=JB&background=D4A843&color=fff&size=128&font-size=0.4&bold=true",
  },
  {
    id: "patrice",
    name: "Patrice Cleary",
    city: "Washington D.C.",
    state: "",
    airport: "DCA",
    course: 4,
    courseTitle: "Course 4",
    year: "1903",
    avatarId: "star",
    travelMethod: "Flying",
    bio: "Operating at the intersection of diplomacy and cuisine in D.C., Patrice uses her platform to elevate Filipino food as a cultural ambassador's tool.",
    specialties: ["Fine Dining", "Filipino-French", "Pastry"],
    signatureDish: "Bibingka Souffl\u00e9",
    greeting: "Welcome, Chef Patrice. Diplomacy through flavor starts here.",
    logoUrl: "https://ui-avatars.com/api/?name=PC&background=5C7256&color=fff&size=128&font-size=0.4&bold=true",
  },
  {
    id: "aaron",
    name: "Aaron Verzosa",
    city: "Seattle",
    state: "WA",
    airport: "SEA",
    course: 5,
    courseTitle: "Course 5",
    year: "1883",
    avatarId: "mortar",
    travelMethod: "Flying",
    bio: "A Seattle fixture whose restaurants have become gathering places for the Filipino-American community.",
    specialties: ["Filipino-American", "Communal Dining", "Seafood"],
    signatureDish: "Pacific Northwest Tinola",
    greeting: "Welcome, Chef Aaron. Seattle to Vegas — let's build the table.",
    logoUrl: "https://ui-avatars.com/api/?name=AV&background=2B4440&color=C0D1B1&size=128&font-size=0.4&bold=true",
  },
  {
    id: "christina",
    name: "Cristina Quackenbush",
    city: "New Orleans",
    state: "LA",
    airport: "MSY",
    course: 6,
    courseTitle: "Course 6",
    year: "1763",
    avatarId: "shell",
    travelMethod: "Flying",
    bio: "From the Crescent City, Cristina explores the 18th-century Filipino presence in Louisiana.",
    specialties: ["Cajun-Filipino", "Seafood", "Storytelling"],
    signatureDish: "Shrimp & Bagoong \u00c9touff\u00e9e",
    greeting: "Welcome, Chef Cristina. The bayou meets the barrio.",
    logoUrl: "https://ui-avatars.com/api/?name=CQ&background=C49370&color=fff&size=128&font-size=0.4&bold=true",
  },
  {
    id: "lord",
    name: "Lord Maynard Llera",
    city: "Los Angeles",
    state: "CA",
    airport: "LAX",
    course: 7,
    courseTitle: "Course 7",
    year: "1587",
    avatarId: "turmeric",
    travelMethod: "Driving",
    bio: "Based in California, Lord Maynard traces Filipino presence back to the Manila galleon trade.",
    specialties: ["Heritage Cuisine", "Open Fire", "Nose-to-Tail"],
    signatureDish: "Galleon-Spiced Crispy Pata",
    greeting: "Welcome, Chef Lord. 1587 to 2026 — the story continues.",
    logoUrl: "https://ui-avatars.com/api/?name=LM&background=D4A843&color=fff&size=128&font-size=0.4&bold=true",
  },
];

export function getConfirmedChef(id: string): ConfirmedChef | undefined {
  return confirmedChefs.find((c) => c.id === id);
}

/** Convert a confirmed chef's known data into pre-filled onboarding form */
export function prefillChefForm(chef: ConfirmedChef): ChefFormData {
  return {
    cityOfDeparture: chef.state ? `${chef.city}, ${chef.state}` : chef.city,
    nearestAirport: chef.airport,
    travelMethod: chef.travelMethod,
    dietaryRestrictions: "",
    shirtSize: "",
    lodging: "",
    leadTalk: false,
    acknowledged: false,
    storytelling: Array(6).fill(""),
  };
}