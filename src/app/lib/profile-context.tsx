import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, serverBase } from "./supabase";
import { publicAnonKey } from "/utils/supabase/info";
import type { UserRole } from "../components/onboarding/use-auth";
import type { ThemeId } from "../components/onboarding/use-theme";

// ─── Profile types ───────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  accessCode: string;
  displayName: string;
  role: UserRole;
  avatarId: string;
  customPhotoUrl?: string; // user-provided photo/logo URL
  chefDirectoryId?: string;
  bio?: string;
  specialty?: string;
  themePreference: ThemeId;
  notificationPreferences: {
    banners: boolean;
    bellAlerts: boolean;
    chatMentions: boolean;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  lastActive: string;
}

export interface ProfileContextValue {
  profile: UserProfile | null;
  accessToken: string | null;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setProfile: (profile: UserProfile) => void;
  setAccessToken: (token: string, refresh?: string) => void;
  signOut: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ─── localStorage cache keys ───────────────────────────────────

const PROFILE_CACHE_KEY = "ik26-profile-cache";
const TOKEN_CACHE_KEY = "ik26-auth-token";
const REFRESH_TOKEN_KEY = "ik26-refresh-token";

function cacheProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

function getCachedProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheTokens(access: string, refresh: string) {
  try {
    localStorage.setItem(TOKEN_CACHE_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } catch { /* ignore */ }
}

function getCachedTokens(): { access: string | null; refresh: string | null } {
  return {
    access: localStorage.getItem(TOKEN_CACHE_KEY) || sessionStorage.getItem(TOKEN_CACHE_KEY),
    refresh: localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY),
  };
}

function clearAuthCache() {
  localStorage.removeItem(PROFILE_CACHE_KEY);
  localStorage.removeItem(TOKEN_CACHE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  try {
    sessionStorage.removeItem(TOKEN_CACHE_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch { /* ignore */ }
  // Also clear legacy keys
  localStorage.removeItem("ik26-role");
  localStorage.removeItem("ik26-onboarding-complete");
  localStorage.removeItem("ik26-remember-me");
  localStorage.removeItem("ik26-chat-avatar");
  localStorage.removeItem("ik26-chat-name");
}

// ─── Provider ────────────────────────────────────────────────────

interface ProfileProviderProps {
  children: ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profile, setProfileState] = useState<UserProfile | null>(getCachedProfile);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    () => getCachedTokens().access
  );
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session
  useEffect(() => {
    const restore = async () => {
      const cached = getCachedTokens();
      if (!cached.access) {
        // No stored token — clear any stale profile cache
        const staleProfile = getCachedProfile();
        if (staleProfile) {
          clearAuthCache();
          setProfileState(null);
          setAccessTokenState(null);
        }
        setLoading(false);
        return;
      }

      // Must have a refresh token for a valid session
      if (!cached.refresh) {
        console.warn("Access token without refresh token — clearing stale session");
        clearAuthCache();
        setProfileState(null);
        setAccessTokenState(null);
        setLoading(false);
        return;
      }

      // Add timeout to prevent infinite loading
      const timeout = new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), 8000)
      );

      try {
        const restorePromise = (async () => {
          // Try to set the session with Supabase client — retry once on network failure
          let lastError: any = null;
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              if (attempt > 0) {
                await new Promise((r) => setTimeout(r, 2000)); // wait 2s before retry
              }
              const { data, error } = await supabase.auth.setSession({
                access_token: cached.access!,
                refresh_token: cached.refresh!,
              });

              if (error || !data.session) {
                // Session expired or invalid — clear everything and force re-auth
                console.warn("Session validation failed — clearing cached auth:", error?.message);
                clearAuthCache();
                setProfileState(null);
                setAccessTokenState(null);
                return "cleared";
              }

              // Session is valid — update tokens
              const newToken = data.session.access_token;
              const newRefresh = data.session.refresh_token;
              setAccessTokenState(newToken);
              cacheTokens(newToken, newRefresh);

              // Fetch fresh profile from server using userId-based route
              const cachedP = getCachedProfile();
              if (cachedP?.id) {
                try {
                  const res = await fetch(`${serverBase}/profile/${cachedP.id}`, {
                    headers: {
                      Authorization: `Bearer ${publicAnonKey}`,
                      "Content-Type": "application/json",
                    },
                  });

                  if (res.ok) {
                    const { profile: freshProfile } = await res.json();
                    setProfileState(freshProfile);
                    cacheProfile(freshProfile);
                  }
                } catch {
                  // Profile fetch failed but session is valid — keep cached profile
                  console.warn("Profile fetch failed during session restore — using cached profile");
                }
              }
              return "restored";
            } catch (err) {
              lastError = err;
              if (attempt === 0 && err instanceof TypeError && String(err).includes("Failed to fetch")) {
                console.warn("Session restore network error — retrying in 2s...");
                continue;
              }
              throw err;
            }
          }
          // If we exhausted retries on network errors, use cached profile without clearing
          console.warn("Session restore failed after retry — keeping cached profile:", lastError);
          return "cached-fallback";
        })();

        const result = await Promise.race([restorePromise, timeout]);
        if (result === "timeout") {
          // Timeout: don't trust cached profile — force re-authentication
          console.warn("Session restoration timed out — clearing cached auth for security");
          clearAuthCache();
          setProfileState(null);
          setAccessTokenState(null);
        }
      } catch (err) {
        console.error("Session restoration failed — clearing cached auth:", err);
        clearAuthCache();
        setProfileState(null);
        setAccessTokenState(null);
      }

      setLoading(false);
    };

    restore();

    // Listen for Supabase token refresh events so our stored token stays current
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setAccessTokenState(session.access_token);
          cacheTokens(session.access_token, session.refresh_token);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    setProfileState(p);
    cacheProfile(p);
  }, []);

  const setAccessToken = useCallback((token: string, refresh?: string) => {
    setAccessTokenState(token);
    if (refresh) {
      cacheTokens(token, refresh);
      // Register the session with the Supabase client so it can auto-refresh
      supabase.auth.setSession({
        access_token: token,
        refresh_token: refresh,
      }).catch((err) => {
        console.error("Failed to set Supabase session:", err);
      });
    } else {
      try {
        localStorage.setItem(TOKEN_CACHE_KEY, token);
      } catch { /* ignore */ }
    }
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!profile) return;

      // Optimistic update
      const updated = { ...profile, ...updates };
      setProfileState(updated);
      cacheProfile(updated);

      try {
        // Use userId-based route — no JWT auth needed, just publicAnonKey for Edge Function gate
        const res = await fetch(`${serverBase}/profile/${profile.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          const { profile: serverProfile } = await res.json();
          setProfileState(serverProfile);
          cacheProfile(serverProfile);
        } else {
          const text = await res.text();
          console.error(`Profile update failed (${res.status}): ${text}`);
          // Revert on failure
          setProfileState(profile);
          cacheProfile(profile);
        }
      } catch (err) {
        console.error("Profile update error:", err);
        setProfileState(profile);
        cacheProfile(profile);
      }
    },
    [profile]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    clearAuthCache();
    setProfileState(null);
    setAccessTokenState(null);
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        accessToken,
        loading,
        updateProfile,
        setProfile,
        setAccessToken,
        signOut,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

// ─── Auth API calls ──────────────────────────────────────────────

export async function apiLookupProfiles(accessCode: string) {
  const res = await fetch(`${serverBase}/auth/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ accessCode }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lookup failed: ${text}`);
  }
  return res.json() as Promise<{
    profiles: Array<{ id: string; displayName: string; avatarId: string; role: string }>;
    role: string;
  }>;
}

export async function apiRegister(data: {
  accessCode: string;
  displayName: string;
  avatarId?: string;
  themePreference?: string;
  chefDirectoryId?: string;
}) {
  const res = await fetch(`${serverBase}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Registration failed: ${text}`);
  }
  return res.json() as Promise<{
    profile: UserProfile;
    session: { access_token: string; refresh_token: string };
    credentials: { email: string; password: string };
  }>;
}

export async function apiSignIn(profileId: string) {
  const res = await fetch(`${serverBase}/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ profileId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sign-in failed: ${text}`);
  }
  return res.json() as Promise<{
    profile: UserProfile;
    session: { access_token: string; refresh_token: string };
  }>;
}

// Helper to store tokens after auth
export function storeSession(
  accessToken: string,
  refreshToken: string,
  profile: UserProfile,
  rememberMe: boolean
) {
  cacheProfile(profile);
  if (rememberMe) {
    cacheTokens(accessToken, refreshToken);
  } else {
    // Store in sessionStorage-like behavior — only persist access token without refresh
    // so it won't survive browser close
    try {
      sessionStorage.setItem(TOKEN_CACHE_KEY, accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch { /* ignore */ }
  }
}