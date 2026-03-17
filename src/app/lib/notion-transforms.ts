// ─── Notion Data Transformers ────────────────────────────────────
// Transforms raw Notion properties into shapes expected by existing components.
// These are flexible — they try multiple common Notion property name patterns.

export interface TransformedChef {
  id: string;
  name: string;
  city: string;
  course: number;
  courseLocation: string;
  year: string;
  travelStatus: "confirmed" | "pending" | "needs-booking";
  bio: string;
  specialties: string[];
  signatureDish: string;
  storySnippet: string;
  logoUrl?: string;
  restaurant?: string;
  restaurantUrl: string;
  restaurantLogoUrl: string;
  instagram: string;
  accolades: string[];
  jamesBearStatus: "winner" | "finalist" | null;
  _notionId: string;
  _url: string;
}

export interface TransformedCourse {
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
  _notionId: string;
  _url: string;
}

export interface TransformedBudgetLine {
  category: string;
  allocated: number;
  spent: number;
  status: "on-track" | "at-risk" | "over";
  items: { name: string; amount: number; note?: string }[];
  _notionId: string;
  _url: string;
}

export interface TransformedMilestone {
  id: string;
  title: string;
  date: string;
  sortDate: string;
  description: string;
  status: "done" | "in-progress" | "upcoming" | "critical";
  category: string;
  owner?: string;
  notionUrl?: string;
}

export interface TransformedScheduleBlock {
  id: string;
  time: string;
  endTime: string;
  title: string;
  description: string;
  team: string;
  location: string;
  status: "completed" | "active" | "upcoming";
  color: string;
  details?: string[];
  _notionId: string;
  _url: string;
}

export interface TransformedDecision {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: string;
  status: string;
  owner?: string;
  dueDate?: string;
  proposed?: string;
  confirmed?: string;
  _notionId: string;
  _url: string;
}

export interface TransformedCommsContact {
  id: string;
  name: string;
  contact: string;
  communicationType: string;
  status: string;
  lastContact: string;
  nextAction: string;
  priority: "high" | "medium" | "low";
  owner: string;
  followUpDate: string;
  workstream: string;
  emailThread: string;
  notes: string;
  confirmed: boolean;
  responseDeadline: string;
  suggestedBy: string;
  source: string;
  tier: string;
  estValue: string;
  _notionId: string;
  _url: string;
}

export interface TransformedWarRoomItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  category: string;
  status: string;
  owner?: string;
  dueDate?: string;
  _notionId: string;
  _url: string;
}

export interface TransformedAnnouncement {
  id: string;
  title: string;
  body: string;
  type: "info" | "celebration" | "urgent" | "reminder" | "action" | "update";
  date: string;
  actionLabel?: string;
  actionUrl?: string;
  actionNavigate?: string;
  dismissible: boolean;
  chefVisible: boolean;
  teamVisible: boolean;
  _notionId: string;
  _url: string;
}

export interface TransformedSponsor {
  id: string;
  name: string;
  contact: string;
  tier: "platinum" | "gold" | "silver" | "bronze" | "in-kind" | "pending";
  estValue: number;
  status: string;
  category: string;
  confirmed: boolean;
  owner: string;
  notes: string;
  logoUrl?: string;
  _notionId: string;
  _url: string;
}

// ─── Helper: flexible property getter ───────────────────────────
// Tries multiple property name patterns to find a value

function findProp(item: Record<string, any>, ...names: string[]): any {
  for (const name of names) {
    if (item[name] !== undefined && item[name] !== null && item[name] !== "") {
      return item[name];
    }
    // Try case-insensitive
    const lower = name.toLowerCase();
    for (const key of Object.keys(item)) {
      if (key.toLowerCase() === lower && item[key] !== undefined && item[key] !== null && item[key] !== "") {
        return item[key];
      }
    }
  }
  return null;
}

function findPropStr(item: Record<string, any>, ...names: string[]): string {
  return String(findProp(item, ...names) || "");
}

function findPropNum(item: Record<string, any>, ...names: string[]): number {
  const val = findProp(item, ...names);
  return typeof val === "number" ? val : parseInt(val) || 0;
}

function findPropArr(item: Record<string, any>, ...names: string[]): string[] {
  const val = findProp(item, ...names);
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s: string) => s.trim()).filter(Boolean);
  return [];
}

// ─── Transform Functions ────────────────────────────────────────

export function transformChef(item: Record<string, any>): TransformedChef {
  const travelRaw = findPropStr(item, "Travel Status", "TravelStatus", "Status", "travel_status").toLowerCase();
  let travelStatus: "confirmed" | "pending" | "needs-booking" = "pending";
  if (travelRaw.includes("confirm")) travelStatus = "confirmed";
  else if (travelRaw.includes("need") || travelRaw.includes("book")) travelStatus = "needs-booking";

  return {
    id: item._notionId || findPropStr(item, "ID", "id"),
    name: findPropStr(item, "Name", "Chef", "Chef Name", "name", "Title"),
    city: findPropStr(item, "City", "Location", "city", "Base"),
    course: findPropNum(item, "Course", "Course #", "course", "#"),
    courseLocation: findPropStr(item, "Course Location", "CourseLocation", "Region"),
    year: findPropStr(item, "Year", "Era", "year"),
    travelStatus,
    bio: findPropStr(item, "Bio", "Biography", "Description", "bio"),
    specialties: findPropArr(item, "Specialties", "Tags", "Cuisine", "specialties"),
    signatureDish: findPropStr(item, "Signature Dish", "SignatureDish", "Dish", "dish"),
    storySnippet: findPropStr(item, "Story", "Story Snippet", "Quote", "storySnippet"),
    logoUrl: findPropStr(item, "Logo", "Logo URL", "Photo", "Image") || undefined,
    restaurant: findPropStr(item, "Restaurant", "restaurant") || undefined,
    restaurantUrl: findPropStr(item, "Restaurant URL", "RestaurantUrl", "Website", "restaurant_url") || "",
    restaurantLogoUrl: findPropStr(item, "Restaurant Logo", "RestaurantLogo", "restaurant_logo") || "",
    instagram: findPropStr(item, "Instagram", "IG", "instagram") || "",
    accolades: findPropArr(item, "Accolades", "Awards", "accolades"),
    jamesBearStatus: (() => {
      const jb = findPropStr(item, "James Beard", "JamesBeerd", "JB Status", "james_beard").toLowerCase();
      if (jb.includes("winner")) return "winner" as const;
      if (jb.includes("finalist")) return "finalist" as const;
      return null;
    })(),
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformCourse(item: Record<string, any>): TransformedCourse {
  return {
    number: findPropNum(item, "Course #", "Course", "Number", "#", "number"),
    location: findPropStr(item, "Location", "Region", "City"),
    year: findPropStr(item, "Year", "Era") || null,
    chef: findPropStr(item, "Chef", "Chef Name", "Assigned Chef"),
    subtitle: findPropStr(item, "Subtitle", "Theme", "Title"),
    dish: findPropStr(item, "Dish", "Dish Name", "Name", "Title"),
    description: findPropStr(item, "Description", "Notes", "Details"),
    special: findPropStr(item, "Special", "Special Notes") || undefined,
    ingredients: findPropArr(item, "Ingredients", "Ingredient List"),
    prepNotes: findPropStr(item, "Prep Notes", "PrepNotes", "Preparation"),
    chefBio: findPropStr(item, "Chef Bio", "ChefBio", "Bio"),
    servingStyle: findPropStr(item, "Serving Style", "ServingStyle", "Plating"),
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformBudgetLine(item: Record<string, any>): TransformedBudgetLine {
  const allocated = findPropNum(item, "Allocated", "Budget", "Estimated");
  const spent = findPropNum(item, "Spent", "Actual", "Cost");
  const ratio = allocated > 0 ? spent / allocated : 0;
  let status: "on-track" | "at-risk" | "over" = "on-track";
  if (ratio > 1) status = "over";
  else if (ratio > 0.85) status = "at-risk";

  // Try to parse sub-items from a rich text field
  const itemsRaw = findPropStr(item, "Items", "Line Items", "Sub-Items");
  const items = itemsRaw
    ? itemsRaw.split("\n").filter(Boolean).map((line: string) => {
        const match = line.match(/^(.+?)[\s]*[-–—:][\s]*\$?([\d,.]+)/);
        return match
          ? { name: match[1].trim(), amount: parseFloat(match[2].replace(",", "")) }
          : { name: line.trim(), amount: 0 };
      })
    : [];

  return {
    category: findPropStr(item, "Category", "Name", "Title", "Department"),
    allocated,
    spent,
    status,
    items,
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformMilestone(item: Record<string, any>): TransformedMilestone {
  const statusRaw = findPropStr(item, "Status", "state", "Progress").toLowerCase();
  let status: "done" | "in-progress" | "upcoming" | "critical" = "upcoming";
  if (statusRaw.includes("done") || statusRaw.includes("complete")) status = "done";
  else if (statusRaw.includes("progress") || statusRaw.includes("active")) status = "in-progress";
  else if (statusRaw.includes("critical") || statusRaw.includes("overdue") || statusRaw.includes("blocked")) status = "critical";

  const dueDate = findPropStr(item, "Due Date", "Due", "Date", "Deadline");

  return {
    id: item._notionId || findPropStr(item, "ID"),
    title: findPropStr(item, "Milestone", "Name", "Title", "Task"),
    date: dueDate,
    sortDate: dueDate || "9999-12-31",
    description: findPropStr(item, "Description", "Notes", "Details", "Blocks / Dependencies"),
    status,
    category: findPropStr(item, "Division", "Category", "Area", "Department") || "General",
    owner: findPropStr(item, "Owner", "Assignee", "Assigned To") || undefined,
    notionUrl: item._url || undefined,
  };
}

export function transformScheduleBlock(item: Record<string, any>): TransformedScheduleBlock {
  const statusRaw = findPropStr(item, "Status", "Progress").toLowerCase();
  let status: "completed" | "active" | "upcoming" = "upcoming";
  if (statusRaw.includes("done") || statusRaw.includes("complete")) status = "completed";
  else if (statusRaw.includes("active") || statusRaw.includes("current")) status = "active";

  const colors: Record<string, string> = {
    setup: "#4A7FB5",
    kitchen: "#7E9E78",
    service: "#C9A96E",
    media: "#9B8EC4",
    entertainment: "#D4727E",
    default: "#8A857F",
  };
  const category = findPropStr(item, "Category", "Type", "Area").toLowerCase();
  const color = colors[category] || colors.default;

  return {
    id: item._notionId || findPropStr(item, "ID"),
    time: findPropStr(item, "Start Time", "Time", "Start"),
    endTime: findPropStr(item, "End Time", "End"),
    title: findPropStr(item, "Name", "Title", "Event", "Activity"),
    description: findPropStr(item, "Description", "Notes", "Details"),
    team: findPropStr(item, "Team", "Assigned Team", "Department"),
    location: findPropStr(item, "Location", "Venue", "Room"),
    status,
    color,
    details: findPropArr(item, "Details", "Sub-tasks", "Checklist"),
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformDecision(item: Record<string, any>): TransformedDecision {
  const severityRaw = findPropStr(item, "Priority", "Severity", "Urgency").toLowerCase();
  let severity: "critical" | "warning" | "info" = "info";
  if (severityRaw.includes("critical") || severityRaw.includes("high") || severityRaw.includes("urgent")) severity = "critical";
  else if (severityRaw.includes("medium") || severityRaw.includes("warn")) severity = "warning";

  // The IK26 Open Decisions table uses "Blocker" as the title column
  const title = findPropStr(item, "Blocker", "Name", "Title", "Decision", "Topic");
  // If no severity from Priority column, default to critical for unconfirmed decisions
  const confirmedVal = findPropStr(item, "Confirmed");
  if (!severityRaw && !confirmedVal) {
    severity = "critical";
  } else if (confirmedVal) {
    severity = "info";
  } else {
    severity = severity || "warning";
  }

  return {
    id: item._notionId || findPropStr(item, "ID"),
    title,
    description: findPropStr(item, "Description", "Notes", "Details", "Context"),
    severity,
    category: findPropStr(item, "Category", "Area", "Department") || "General",
    status: findPropStr(item, "Status", "State", "Decision Status") || "Open",
    owner: findPropStr(item, "Owner", "Assignee", "DRI", "Decision by") || undefined,
    dueDate: findPropStr(item, "Due Date", "Deadline", "Due", "Decision by") || undefined,
    proposed: findPropStr(item, "Proposed") || undefined,
    confirmed: findPropStr(item, "Confirmed") || undefined,
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformCommsContact(item: Record<string, any>): TransformedCommsContact {
  const priorityRaw = findPropStr(item, "Priority").toLowerCase();
  let priority: "high" | "medium" | "low" = "medium";
  if (priorityRaw.includes("high")) priority = "high";
  else if (priorityRaw.includes("low")) priority = "low";

  return {
    id: item._notionId || findPropStr(item, "ID"),
    name: findPropStr(item, "Name"),
    contact: findPropStr(item, "Contact"),
    communicationType: findPropStr(item, "Communication Type"),
    status: findPropStr(item, "Status"),
    lastContact: findPropStr(item, "Last Contact"),
    nextAction: findPropStr(item, "Next Action"),
    priority,
    owner: findPropStr(item, "Owner"),
    followUpDate: findPropStr(item, "Follow Up Date"),
    workstream: findPropStr(item, "Workstream"),
    emailThread: findPropStr(item, "Email Thread"),
    notes: findPropStr(item, "Notes"),
    confirmed: findPropStr(item, "Confirmed") === "true",
    responseDeadline: findPropStr(item, "Response Deadline"),
    suggestedBy: findPropStr(item, "Suggested By"),
    source: findPropStr(item, "Source"),
    tier: findPropStr(item, "Tier"),
    estValue: findPropStr(item, "Estimated Value"),
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformWarRoomItem(item: Record<string, any>): TransformedWarRoomItem {
  const severityRaw = findPropStr(item, "Priority", "Severity", "Urgency").toLowerCase();
  let severity: "critical" | "warning" | "info" = "info";
  if (severityRaw.includes("critical") || severityRaw.includes("high") || severityRaw.includes("urgent")) severity = "critical";
  else if (severityRaw.includes("medium") || severityRaw.includes("warn")) severity = "warning";

  return {
    id: item._notionId || findPropStr(item, "ID"),
    title: findPropStr(item, "Name", "Title", "Decision", "Topic"),
    description: findPropStr(item, "Description", "Notes", "Details", "Context"),
    severity,
    category: findPropStr(item, "Category", "Area", "Department") || "General",
    status: findPropStr(item, "Status", "State", "Decision Status") || "Open",
    owner: findPropStr(item, "Owner", "Assignee", "DRI") || undefined,
    dueDate: findPropStr(item, "Due Date", "Deadline", "Due") || undefined,
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformAnnouncement(item: Record<string, any>): TransformedAnnouncement {
  const typeRaw = findPropStr(item, "Type", "Category", "Priority").toLowerCase();
  let type: TransformedAnnouncement["type"] = "info";
  if (typeRaw.includes("urgent") || typeRaw.includes("critical")) type = "urgent";
  else if (typeRaw.includes("celebrat") || typeRaw.includes("milestone") || typeRaw.includes("win")) type = "celebration";
  else if (typeRaw.includes("remind") || typeRaw.includes("deadline")) type = "reminder";
  else if (typeRaw.includes("action") || typeRaw.includes("task")) type = "action";
  else if (typeRaw.includes("update")) type = "update";

  const chefVisRaw = findPropStr(item, "Chef Visible", "ChefVisible", "Audience").toLowerCase();
  const teamVisRaw = findPropStr(item, "Team Visible", "TeamVisible", "Audience").toLowerCase();
  const audienceRaw = findPropStr(item, "Audience", "Visibility", "Roles").toLowerCase();

  let chefVisible = true;
  let teamVisible = true;
  if (audienceRaw.includes("leadership")) { chefVisible = false; teamVisible = false; }
  else if (audienceRaw.includes("team")) { chefVisible = false; teamVisible = true; }
  if (chefVisRaw === "false" || chefVisRaw === "no") chefVisible = false;
  if (teamVisRaw === "false" || teamVisRaw === "no") teamVisible = false;

  const dismissRaw = findProp(item, "Dismissible", "Can Dismiss");
  const dismissible = dismissRaw === true || dismissRaw === "true" || dismissRaw === "Yes" || dismissRaw === null;

  return {
    id: `notion-ann-${item._notionId || findPropStr(item, "ID")}`,
    title: findPropStr(item, "Name", "Title", "Announcement"),
    body: findPropStr(item, "Body", "Description", "Message", "Content", "Notes"),
    type,
    date: findPropStr(item, "Date", "Published", "Created", "_created") || item._created || "",
    actionLabel: findPropStr(item, "Action Label", "CTA", "Button") || undefined,
    actionUrl: findPropStr(item, "Action URL", "Link", "URL") || undefined,
    actionNavigate: findPropStr(item, "Navigate To", "Page", "NavigateTo") || undefined,
    dismissible,
    chefVisible,
    teamVisible,
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

export function transformSponsor(item: Record<string, any>): TransformedSponsor {
  const tierRaw = findPropStr(item, "Tier", "Level", "Sponsorship Level", "Package").toLowerCase();
  let tier: TransformedSponsor["tier"] = "pending";
  if (tierRaw.includes("plat")) tier = "platinum";
  else if (tierRaw.includes("gold")) tier = "gold";
  else if (tierRaw.includes("silver")) tier = "silver";
  else if (tierRaw.includes("bronze")) tier = "bronze";
  else if (tierRaw.includes("kind") || tierRaw.includes("trade")) tier = "in-kind";

  const estRaw = findProp(item, "Estimated Value", "Est Value", "Value", "Amount", "Contribution");
  let estValue = 0;
  if (typeof estRaw === "number") estValue = estRaw;
  else if (typeof estRaw === "string") estValue = parseFloat(estRaw.replace(/[^0-9.]/g, "")) || 0;

  const confirmedRaw = findProp(item, "Confirmed", "Status");
  const statusStr = findPropStr(item, "Status", "State").toLowerCase();
  const confirmed = confirmedRaw === true || statusStr.includes("confirm") || statusStr.includes("signed");

  return {
    id: item._notionId || findPropStr(item, "ID"),
    name: findPropStr(item, "Name", "Sponsor", "Company", "Organization", "Title"),
    contact: findPropStr(item, "Contact", "Email", "Phone"),
    tier,
    estValue,
    status: findPropStr(item, "Status", "State") || (confirmed ? "Confirmed" : "Pending"),
    category: findPropStr(item, "Category", "Type", "Industry") || "General",
    confirmed,
    owner: findPropStr(item, "Owner", "Lead", "Assigned To", "DRI"),
    notes: findPropStr(item, "Notes", "Description", "Details"),
    logoUrl: findPropStr(item, "Logo", "Logo URL", "Image") || undefined,
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

// ─── Budget Item Transform (individual Notion rows → grouped categories) ───

export interface TransformedBudgetItem {
  id: string;
  name: string;
  category: string;
  budget: number;
  actuals: number;
  notes: string;
  owner: string;
  status: string;
  _notionId: string;
  _url: string;
}

function findPropFloat(item: Record<string, any>, ...names: string[]): number {
  const val = findProp(item, ...names);
  if (typeof val === "number") return val;
  if (typeof val === "string") return parseFloat(val.replace(/[^0-9.-]/g, "")) || 0;
  return 0;
}

export function transformBudgetItem(item: Record<string, any>): TransformedBudgetItem {
  return {
    id: item._notionId || findPropStr(item, "ID"),
    name: findPropStr(item, "Name", "Title", "Item", "Line Item", "Expense"),
    category: findPropStr(item, "Category", "Department", "Type", "Workstream", "Area") || "Uncategorized",
    budget: findPropFloat(item, "Budget", "Amount", "Allocated", "Estimated", "Estimate", "Budgeted"),
    actuals: findPropFloat(item, "Actuals", "Actual", "Spent", "Cost", "Real Cost", "Expense"),
    notes: findPropStr(item, "Notes", "Description", "Details", "Memo"),
    owner: findPropStr(item, "Owner", "Assignee", "Lead", "DRI", "Responsible"),
    status: findPropStr(item, "Status", "State", "Progress"),
    _notionId: item._notionId || "",
    _url: item._url || "",
  };
}

/** Group individual budget items by category into BudgetLine shapes */
export function groupBudgetItemsByCategory(items: TransformedBudgetItem[]): TransformedBudgetLine[] {
  const groups = new Map<string, TransformedBudgetItem[]>();
  for (const item of items) {
    const cat = item.category || "Uncategorized";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(item);
  }

  return Array.from(groups.entries()).map(([category, lineItems]) => {
    const allocated = lineItems.reduce((s, i) => s + i.budget, 0);
    const spent = lineItems.reduce((s, i) => s + i.actuals, 0);
    const ratio = allocated > 0 ? spent / allocated : (spent > 0 ? 1.1 : 0);
    let status: "on-track" | "at-risk" | "over" = "on-track";
    if (ratio > 1) status = "over";
    else if (ratio > 0.85) status = "at-risk";

    return {
      category,
      allocated,
      spent,
      status,
      items: lineItems.map(i => ({
        name: i.name,
        amount: i.budget || i.actuals,
        note: [i.notes, i.owner ? `Owner: ${i.owner}` : ""].filter(Boolean).join(" · ") || undefined,
      })),
      _notionId: lineItems[0]?._notionId || "",
      _url: lineItems[0]?._url || "",
    };
  }).sort((a, b) => b.allocated - a.allocated);
}