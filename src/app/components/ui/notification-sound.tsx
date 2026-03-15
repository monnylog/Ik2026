import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "ik26_notification_sound";

interface SoundPreferences {
  enabled: boolean;
  volume: number; // 0-1
}

const defaultPrefs: SoundPreferences = {
  enabled: true,
  volume: 0.5,
};

function loadSoundPrefs(): SoundPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultPrefs, ...JSON.parse(stored) };
  } catch {}
  return defaultPrefs;
}

function saveSoundPrefs(prefs: SoundPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

/**
 * Generate a gentle notification chime using Web Audio API.
 * Two-tone ascending pattern — warm and non-jarring.
 */
function playNotificationChime(volume: number = 0.5) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First tone — warm base
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second tone — ascending warmth
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(volume * 0.25, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);

    // Third tone — gentle resolve
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(783.99, now + 0.25); // G5
    gain3.gain.setValueAtTime(0, now + 0.25);
    gain3.gain.linearRampToValueAtTime(volume * 0.18, now + 0.27);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.25);
    osc3.stop(now + 0.7);

    // Clean up
    setTimeout(() => ctx.close(), 1000);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}

/**
 * Hook to manage notification sound preferences.
 */
export function useNotificationSound() {
  const [prefs, setPrefs] = useState<SoundPreferences>(() => loadSoundPrefs());

  const updatePrefs = useCallback((updates: Partial<SoundPreferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates };
      saveSoundPrefs(next);
      return next;
    });
  }, []);

  const playPreview = useCallback(() => {
    playNotificationChime(prefs.volume);
  }, [prefs.volume]);

  const playIfEnabled = useCallback(() => {
    if (prefs.enabled) {
      playNotificationChime(prefs.volume);
    }
  }, [prefs.enabled, prefs.volume]);

  return {
    soundEnabled: prefs.enabled,
    soundVolume: prefs.volume,
    toggleSound: () => updatePrefs({ enabled: !prefs.enabled }),
    setVolume: (v: number) => updatePrefs({ volume: v }),
    playPreview,
    playIfEnabled,
  };
}
