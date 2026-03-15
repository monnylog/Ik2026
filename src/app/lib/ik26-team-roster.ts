// ─── Shared IK26 Team Roster ────────────────────────────────────
// Single source of truth for team member data used across:
// - Team Deploy page
// - Members / User Management page
// - Dashboard key contacts
// Falls back to this when Notion team data is not available.

import type { LucideIcon } from "lucide-react";
import {
  Users,
  ShieldCheck,
  ChefHat,
  Utensils,
  Camera,
  BookOpen,
  Megaphone,
  DollarSign,
  GlassWater,
  Mic,
  Pen,
  Film,
  Ticket,
} from "lucide-react";

export type AssignmentStatus = "confirmed" | "pending" | "open";
export type TaskStatus = "ready" | "in-progress" | "blocked" | "complete";

export interface IK26TeamMember {
  name: string;
  role: string;
  department: string;
  status: AssignmentStatus;
  icon: LucideIcon;
  note?: string;
  shifts?: string[];
  responsibilities?: string[];
  taskStatus?: TaskStatus;
  currentTask?: string;
}

export interface IK26Department {
  name: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const IK26_DEPARTMENTS: IK26Department[] = [
  { name: "Event Operations", icon: ShieldCheck, color: "#C9A96E", bg: "rgba(201,169,110,0.08)" },
  { name: "F&B / Kitchen", icon: Utensils, color: "#7E9E78", bg: "rgba(126,158,120,0.08)" },
  { name: "Creative & Content", icon: Camera, color: "#4A7FB5", bg: "rgba(74,127,181,0.08)" },
  { name: "Research & Story", icon: BookOpen, color: "#CDA88A", bg: "rgba(205,168,138,0.08)" },
  { name: "Communications", icon: Megaphone, color: "#1A5C38", bg: "rgba(26,92,56,0.08)" },
  { name: "Finance & Ops", icon: DollarSign, color: "#D4A843", bg: "rgba(212,168,67,0.08)" },
];

export const IK26_TEAM_ROSTER: IK26TeamMember[] = [
  {
    name: "Monica Blanco",
    role: "Co-Owner / EP (Agency Lead)",
    department: "Event Operations",
    status: "confirmed",
    icon: ShieldCheck,
    shifts: ["May 17–22: Full event oversight"],
    responsibilities: ["Event strategy", "Social media/marketing (agency)", "Sponsorship oversight", "Finance oversight with Jerjon"],
    taskStatus: "in-progress",
    currentTask: "Finalizing sponsorship deck",
  },
  {
    name: "Walbert Castillo",
    role: "Co-Owner / EP (Restaurant Lead)",
    department: "Event Operations",
    status: "confirmed",
    icon: ShieldCheck,
    shifts: ["May 17–22: Full event oversight"],
    responsibilities: ["Creative direction & story", "Restaurant operations", "Community outreach with Ava"],
    taskStatus: "ready",
    currentTask: "Community outreach calls",
  },
  {
    name: "Christine Antonio",
    role: "Project Manager",
    department: "Event Operations",
    status: "confirmed",
    icon: Ticket,
    shifts: ["May 17–22: Coordination & logistics"],
    responsibilities: ["Ticketing / booking platform", "Project timelines", "Vendor coordination"],
    taskStatus: "in-progress",
    currentTask: "Vendor coordination follow-ups",
  },
  {
    name: "JJ Mayang",
    role: "Day-of Coordinator / Narrative",
    department: "Event Operations",
    status: "confirmed",
    icon: Film,
    shifts: ["May 19: Setup", "May 20: Rehearsal", "May 21: Final prep", "May 22: Day-of coordination"],
    responsibilities: ["Day-of event coordination", "Documentary / film with Ayce", "Narrative & writing"],
    taskStatus: "ready",
    currentTask: "Run-of-show draft",
  },
  {
    name: "Mariana",
    role: "F&B Lead / Events Director",
    department: "F&B / Kitchen",
    status: "pending",
    icon: Utensils,
    shifts: ["May 19: Kitchen setup", "May 20: Rehearsal (8a–10p)", "May 21: Prep day (6a–10p)", "May 22: Service (6a–12a)"],
    responsibilities: ["Overall F&B coordination", "FOH/BOH bridge", "Service flow", "Vendor management"],
    note: "Suggested lead — was TBD. Melvin held this in Y1+Y2. Must confirm by Mar 12.",
    taskStatus: "blocked",
    currentTask: "Awaiting role confirmation",
  },
  {
    name: "Dio Buan + Justin Barnes",
    role: "Kitchen / BOH Leads",
    department: "F&B / Kitchen",
    status: "confirmed",
    icon: ChefHat,
    shifts: ["May 19: Kitchen setup", "May 20: Rehearsal", "May 21: Full prep", "May 22: Service"],
    responsibilities: ["Kitchen coordination", "Course timing", "Chef liaison", "BOH staffing support"],
    taskStatus: "in-progress",
    currentTask: "Equipment inventory",
  },
  {
    name: "Anjelique",
    role: "Head Chef / Kitchen BTS",
    department: "F&B / Kitchen",
    status: "confirmed",
    icon: Utensils,
    shifts: ["May 20: Rehearsal", "May 21: Prep", "May 22: Service"],
    responsibilities: ["BOH operations", "Kitchen BTS content", "Prep coordination"],
    taskStatus: "ready",
    currentTask: "BTS content plan",
  },
  {
    name: "Cy",
    role: "Beverage Director",
    department: "F&B / Kitchen",
    status: "pending",
    icon: GlassWater,
    shifts: ["May 20: Pairing rehearsal", "May 21: Prep", "May 22: Service"],
    responsibilities: ["Beverage pairings per course", "Bar setup & staffing", "Non-alcoholic options", "Glassware coordination"],
    note: "Y2 mixologist (with Aria, Gary). Suggested lead for Y3. Needs confirmation.",
    taskStatus: "blocked",
    currentTask: "Awaiting pairing menu draft",
  },
  {
    name: "Griselle",
    role: "FOH Staffing Lead",
    department: "F&B / Kitchen",
    status: "confirmed",
    icon: Users,
    shifts: ["May 21: FOH setup", "May 22: Guest service (2p–12a)"],
    responsibilities: ["FOH volunteer coordination", "Server/runner pool", "Guest seating flow", "Guest experience"],
    note: "200+ guests requires 2–3x Y2 staffing. Need server, bartender, expo pools.",
    taskStatus: "in-progress",
    currentTask: "Volunteer recruitment",
  },
  {
    name: "Ayce Mangapit",
    role: "Creative Director / Content",
    department: "Creative & Content",
    status: "confirmed",
    icon: Camera,
    shifts: ["May 19: Venue styling", "May 20: Content capture", "May 22: Live documentation"],
    responsibilities: ["Visual identity", "Content / video production with Jaryd", "Documentary / film with JJ"],
    taskStatus: "in-progress",
    currentTask: "Visual identity finalization",
  },
  {
    name: "Jaryd Lucero",
    role: "Lead Editor",
    department: "Creative & Content",
    status: "confirmed",
    icon: Film,
    shifts: ["May 20: Content capture", "May 22: Live documentation"],
    responsibilities: ["Video editing", "Content production", "Post-event recap"],
    taskStatus: "ready",
    currentTask: "Equipment prep checklist",
  },
  {
    name: "Denise",
    role: "Design Lead",
    department: "Creative & Content",
    status: "confirmed",
    icon: Pen,
    shifts: ["Mar–May: Pre-event design", "May 22: Event-night materials"],
    responsibilities: ["Visual design", "Printed materials", "Event branding"],
    note: "External — not in Istorya directory.",
    taskStatus: "in-progress",
    currentTask: "Program booklet layout",
  },
  {
    name: "Zwei",
    role: "Social Media Lead / Editor",
    department: "Creative & Content",
    status: "confirmed",
    icon: Camera,
    shifts: ["May 19–22: Social coverage"],
    responsibilities: ["Social media content", "Live posting", "FOH support"],
    taskStatus: "ready",
    currentTask: "Content calendar review",
  },
  {
    name: "Andrew",
    role: "Research Lead",
    department: "Research & Story",
    status: "confirmed",
    icon: BookOpen,
    shifts: ["Mar 14–18: Distribute assignments", "Ongoing: Research oversight"],
    responsibilities: ["Lead researcher", "Chef-researcher pairings", "Historical narrative per course"],
    note: "Needs to assign 7 researcher–chef pairings by Mar 14–18.",
    taskStatus: "in-progress",
    currentTask: "Research pairings assignment",
  },
  {
    name: "Ava Carino",
    role: "Food Historian / Event Lead / Host",
    department: "Research & Story",
    status: "confirmed",
    icon: Mic,
    shifts: ["Ongoing: Research", "May 22: Host & emcee"],
    responsibilities: ["Food history research (2 chefs)", "Community outreach with Walbert", "Event hosting"],
    taskStatus: "in-progress",
    currentTask: "Chef research profiles",
  },
  {
    name: "Flerine Cruz Atienza",
    role: "EP / Brand & Story / PR",
    department: "Communications",
    status: "confirmed",
    icon: Megaphone,
    shifts: ["Ongoing: PR & brand", "May 22: Event coverage"],
    responsibilities: ["PR lead", "Brand & story", "Research support (2 chefs)", "Production/leadership"],
    taskStatus: "ready",
    currentTask: "Press list finalization",
  },
  {
    name: "Sarah Obal",
    role: "Sponsorship / Communications",
    department: "Communications",
    status: "confirmed",
    icon: Megaphone,
    shifts: ["Ongoing: Pre-event comms", "May 22: Live updates"],
    responsibilities: ["Sponsorship outreach", "Guest communications", "HR / operations (new for Y3)"],
    note: "New addition for Y3.",
    taskStatus: "in-progress",
    currentTask: "Sponsor follow-up emails",
  },
  {
    name: "Jerjon + Monica",
    role: "Finance / Budget",
    department: "Finance & Ops",
    status: "confirmed",
    icon: DollarSign,
    shifts: ["Ongoing: Budget tracking"],
    responsibilities: ["COGS tracking", "Budget management", "Chef reimbursement processing"],
    taskStatus: "ready",
    currentTask: "Q1 budget reconciliation",
  },
];

// Helper: transform Notion team item to IK26TeamMember
export function transformNotionTeamMember(item: Record<string, any>): IK26TeamMember {
  const name = item.Name || item.name || item["Team Member"] || "Unknown";
  const role = item.Role || item.role || item.Position || "";
  const dept = item.Department || item.department || item.Division || item.Workstream || "Unassigned";
  const statusStr = (item.Status || "").toLowerCase();
  const status: AssignmentStatus = statusStr.includes("confirm") ? "confirmed"
    : statusStr.includes("pending") ? "pending"
    : statusStr.includes("open") ? "open"
    : "confirmed";
  const taskStr = (item["Task Status"] || item.taskStatus || "").toLowerCase();
  const taskStatus: TaskStatus | undefined = taskStr.includes("block") ? "blocked"
    : taskStr.includes("progress") ? "in-progress"
    : taskStr.includes("complete") || taskStr.includes("done") ? "complete"
    : taskStr.includes("ready") ? "ready"
    : undefined;

  return {
    name,
    role,
    department: dept,
    status,
    shifts: item.Shifts ? (Array.isArray(item.Shifts) ? item.Shifts : [item.Shifts]) : [],
    responsibilities: item.Responsibilities
      ? (Array.isArray(item.Responsibilities) ? item.Responsibilities : [item.Responsibilities])
      : [],
    icon: Users,
    note: item.Notes || item.Note || undefined,
    taskStatus,
    currentTask: item["Current Task"] || item.currentTask || undefined,
  };
}
