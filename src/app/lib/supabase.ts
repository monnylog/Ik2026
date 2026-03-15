import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    storageKey: "sb-ik26-auth-token",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "implicit",
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<any>) => {
      return fn();
    },
  },
});

// Server base URL for API calls
export const serverBase = `${supabaseUrl}/functions/v1/make-server-5ed426e6`;

// Notion API key from localStorage (set via Admin Panel → Settings)
export function getStoredNotionApiKey(): string | null {
  try { return localStorage.getItem("ik26-notion-api-key"); } catch { return null; }
}
export function setStoredNotionApiKey(key: string) {
  try { localStorage.setItem("ik26-notion-api-key", key); } catch {}
}
export function clearStoredNotionApiKey() {
  try { localStorage.removeItem("ik26-notion-api-key"); } catch {}
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const notionKey = getStoredNotionApiKey();
  const res = await fetch(`${serverBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      ...(notionKey ? { "X-Notion-Key": notionKey } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`API error ${res.status} on ${path}: ${text}`);
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

// Authorized API fetch — uses publicAnonKey for Edge Function gate,
// sends the user's access token in X-User-Token for server-side validation
export async function authApiFetch(
  path: string,
  accessToken: string,
  options: RequestInit = {}
) {
  const notionKey = getStoredNotionApiKey();
  const res = await fetch(`${serverBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      "X-User-Token": accessToken,
      ...(notionKey ? { "X-Notion-Key": notionKey } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`Auth API error ${res.status} on ${path}: ${text}`);
    throw new Error(`Auth API error: ${res.status}`);
  }
  return res.json();
}