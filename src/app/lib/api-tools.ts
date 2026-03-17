// ─── API Tools ───────────────────────────────────────────────────
// Centralized client-side helpers for all deployment-critical API integrations:
// Clearbit logos, Google Calendar deep links, Notion key validation,
// pre-flight checks, and full data export.

import { apiFetch } from "./supabase";

// ─── Types ──────────────────────────────────────────────────────

export interface PreflightCheck {
  ok: boolean;
  latencyMs?: number;
  detail?: string;
  error?: string;
}

export interface PreflightResult {
  ready: boolean;
  score: string;
  checks: Record<string, PreflightCheck>;
  timestamp: string;
  version: string;
}

export interface LogoResult {
  url: string | null;
  cached: boolean;
  error?: string;
}

export interface BatchLogoResult {
  logos: Record<string, string | null>;
  cached: number;
  fetched: number;
}

export interface CalendarLinkResult {
  url: string;
}

export interface BatchCalendarResult {
  links: Array<{ id: string; title: string; url: string }>;
}

export interface NotionKeyValidation {
  valid: boolean;
  botName?: string;
  botId?: string;
  type?: string;
  error?: string;
}

export interface ExportResult {
  exportedAt: string;
  version: string;
  counts: Record<string, number>;
  data: Record<string, any>;
}

// ─── Pre-flight Deployment Check ────────────────────────────────

export async function runPreflightCheck(): Promise<PreflightResult> {
  return apiFetch("/preflight");
}

// ─── Clearbit Logo API ──────────────────────────────────────────

/** Look up a single company logo by domain via the server-side Clearbit proxy. */
export async function getLogo(domain: string): Promise<LogoResult> {
  return apiFetch(`/logo/${encodeURIComponent(domain)}`);
}

/** Look up multiple company logos in a single request (max 20). */
export async function getLogoBatch(domains: string[]): Promise<BatchLogoResult> {
  return apiFetch("/logos/batch", {
    method: "POST",
    body: JSON.stringify({ domains }),
  });
}

/**
 * Extract a domain from a contact email or company name.
 * Skips free email providers (gmail, yahoo, etc.)
 */
export function extractDomain(name: string, contactEmail?: string): string | null {
  // Try email domain first
  if (contactEmail && contactEmail.includes("@")) {
    const domain = contactEmail.split("@")[1];
    const freeProviders = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "aol.com", "protonmail.com", "live.com"];
    if (domain && !freeProviders.includes(domain.toLowerCase())) {
      return domain.toLowerCase();
    }
  }
  // Try company name as domain
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+(inc|llc|corp|co|group|foundation|org)$/i, "")
    .trim()
    .replace(/\s+/g, "");
  if (cleaned.length > 2) {
    return `${cleaned}.com`;
  }
  return null;
}

// ─── Google Calendar Deep Links ─────────────────────────────────

/** Generate a Google Calendar "Add Event" deep link. */
export async function createCalendarLink(event: {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
}): Promise<CalendarLinkResult> {
  return apiFetch("/calendar/create-link", {
    method: "POST",
    body: JSON.stringify(event),
  });
}

/** Generate deep links for multiple events at once. */
export async function createCalendarBatchLinks(events: Array<{
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  description?: string;
  location?: string;
  allDay?: boolean;
}>): Promise<BatchCalendarResult> {
  return apiFetch("/calendar/batch-links", {
    method: "POST",
    body: JSON.stringify({ events }),
  });
}

/**
 * Generate a Google Calendar link client-side (no server call needed).
 * Use this for simple cases where you don't need server-side processing.
 */
export function createCalendarLinkLocal(event: {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
}): string {
  const formatDate = (dateStr: string, isAllDay: boolean) => {
    const d = new Date(dateStr);
    if (isAllDay) return d.toISOString().replace(/[-:]/g, "").split("T")[0];
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const start = formatDate(event.startDate, !!event.allDay);
  const end = event.endDate
    ? formatDate(event.endDate, !!event.allDay)
    : event.allDay
      ? formatDate(new Date(new Date(event.startDate).getTime() + 86400000).toISOString(), true)
      : formatDate(new Date(new Date(event.startDate).getTime() + 3600000).toISOString(), false);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
  });
  if (event.description) params.set("details", event.description);
  if (event.location) params.set("location", event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── Notion API Key Validation ──────────────────────────────────

/** Validate a Notion API key via the server proxy (avoids CORS). */
export async function validateNotionKey(apiKey: string): Promise<NotionKeyValidation> {
  return apiFetch("/notion/validate-key", {
    method: "POST",
    body: JSON.stringify({ apiKey }),
  });
}

// ─── Full Data Export ───────────────────────────────────────────

/** Export all app data for backup / migration. */
export async function exportFullData(): Promise<ExportResult> {
  return apiFetch("/export/full");
}

/** Download the full export as a JSON file. */
export async function downloadFullExport(): Promise<void> {
  const data = await exportFullData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ik26-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Gmail Mailto Helpers ───────────────────────────────────────

/** Generate a Gmail compose URL (opens in new tab). */
export function createGmailLink(params: {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
}): string {
  const base = "https://mail.google.com/mail/?view=cm&fs=1";
  const urlParams = new URLSearchParams();
  if (params.to) urlParams.set("to", params.to);
  if (params.cc) urlParams.set("cc", params.cc);
  if (params.bcc) urlParams.set("bcc", params.bcc);
  if (params.subject) urlParams.set("su", params.subject);
  if (params.body) urlParams.set("body", params.body);
  return `${base}&${urlParams.toString()}`;
}

/** Generate a standard mailto: link (opens default email client). */
export function createMailtoLink(params: {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
}): string {
  const urlParams = new URLSearchParams();
  if (params.cc) urlParams.set("cc", params.cc);
  if (params.bcc) urlParams.set("bcc", params.bcc);
  if (params.subject) urlParams.set("subject", params.subject);
  if (params.body) urlParams.set("body", params.body);
  return `mailto:${params.to || ""}?${urlParams.toString()}`;
}
