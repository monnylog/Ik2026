import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  User,
  Palette,
  Bell,
  Check,
  Save,
  Loader2,
  Shield,
  ChefHat,
  LogOut,
  ArrowLeft,
  MapPin,
  UtensilsCrossed,
  BookOpen,
  Utensils,
  Link2,
  Upload,
  X,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  UsersRound,
  Trash2,
} from "lucide-react";
import { useProfile } from "../lib/profile-context";
import { avatarOptions, getAvatar } from "./engagement/avatars";
import { themes, applyTheme, type ThemeId } from "./onboarding/use-theme";
import { getConfirmedChef } from "./onboarding/chef-directory";
import { toast } from "sonner";
import { serverBase } from "../lib/supabase";
import { publicAnonKey } from "/utils/supabase/info";
import { useUserData } from "../lib/use-user-data";
import { useTooltipWalkthrough } from "./ui/feature-tooltip";
import { SignOutDialog } from "./ui/sign-out-dialog";
import { AddToHomeScreenCard } from "./ui/pwa-install";
import { useNotificationSound } from "./ui/notification-sound";
import { loadNotifPrefs, saveNotifPrefs, type NotificationPrefs } from "../lib/notification-prefs";
import { BUILD_ID } from "../lib/version";
import { useFocusTrap } from "../lib/use-focus-trap";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

// All localStorage keys used by the app
const ALL_STORAGE_KEYS = [
  "ik26-task-board-tasks",
  "ik26-checklist-checked",
  "ik26-theme",
  "ik26-prev-light-theme",
  "ik26-notif-prefs",
  "ik26-recent-pages",
  "ik26-favorites",
  "ik26-whats-new-seen",
  "ik26-pwa-dismissed",
  "ik26-guided-tour-completed",
  "ik26-notif-sound-enabled",
  "ik26-notif-sound-volume",
  "ik26_tooltips_leadership_seen",
  "ik26_tooltips_team_seen",
  "ik26_tooltips_chef_seen",
];

interface ProfileSettingsProps {
  onBack: () => void;
  onSignOut: () => void;
}

export function ProfileSettings({ onBack, onSignOut }: ProfileSettingsProps) {
  const { profile, updateProfile } = useProfile();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarId || "mortar");
  const [customPhotoUrl, setCustomPhotoUrl] = useState(profile?.customPhotoUrl || "");
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    (profile?.themePreference as ThemeId) || "ik26"
  );
  const [notifPrefs, setNotifPrefs] = useState(
    profile?.notificationPreferences || {
      banners: true,
      bellAlerts: true,
      chatMentions: true,
    }
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Tour reset hooks — we need all 3 role variants
  const [, setChefTourDismissed] = useUserData<boolean>("chef-tour-dismissed", false);
  const [, setTeamTourDismissed] = useUserData<boolean>("team-tour-dismissed", false);
  const [, setManagerTourDismissed] = useUserData<boolean>("manager-tour-dismissed", false);
  const [tourRestarted, setTourRestarted] = useState(false);
  const [tooltipTourRestarted, setTooltipTourRestarted] = useState(false);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const [clearDataConfirmOpen, setClearDataConfirmOpen] = useState(false);

  // Focus trap for clear data dialog
  const clearDataTrapRef = useFocusTrap<HTMLDivElement>(clearDataConfirmOpen);

  // Escape key to close clear data dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && clearDataConfirmOpen) setClearDataConfirmOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [clearDataConfirmOpen]);

  // Content notification preferences (task updates, checklist, etc.)
  const [contentNotifPrefs, setContentNotifPrefs] = useState<NotificationPrefs>(loadNotifPrefs);

  // Tooltip walkthrough restart
  const { startWalkthrough } = useTooltipWalkthrough();

  // Notification sound management
  const { soundEnabled, soundVolume, toggleSound, setVolume, playPreview } = useNotificationSound();

  // Sync from global profile when it changes externally (e.g. from Comms identity editor)
  const prevProfileRef = useRef(profile);
  useEffect(() => {
    if (!profile || !prevProfileRef.current) { prevProfileRef.current = profile; return; }
    const prev = prevProfileRef.current;
    // Only sync fields that changed in the global profile (external update)
    if (profile.displayName !== prev.displayName && prev.displayName === displayName) {
      setDisplayName(profile.displayName);
    }
    if (profile.avatarId !== prev.avatarId && prev.avatarId === selectedAvatar) {
      setSelectedAvatar(profile.avatarId);
    }
    if ((profile.customPhotoUrl || "") !== (prev.customPhotoUrl || "") && (prev.customPhotoUrl || "") === customPhotoUrl) {
      setCustomPhotoUrl(profile.customPhotoUrl || "");
    }
    prevProfileRef.current = profile;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    const changed =
      displayName !== profile.displayName ||
      selectedAvatar !== profile.avatarId ||
      customPhotoUrl !== (profile.customPhotoUrl || "") ||
      selectedTheme !== profile.themePreference ||
      JSON.stringify(notifPrefs) !== JSON.stringify(profile.notificationPreferences);
    setHasChanges(changed);
  }, [displayName, selectedAvatar, customPhotoUrl, selectedTheme, notifPrefs, profile]);

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    
    // Validate display name
    if (!displayName.trim() || displayName.trim().length < 2) {
      toast.error("Display name must be at least 2 characters.");
      return;
    }

    // Validate photo URL if provided
    if (customPhotoUrl && !customPhotoUrl.match(/^https?:\/\/.+\..+/)) {
      toast.error("Please enter a valid photo URL or leave it empty.");
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await updateProfile({
        displayName: displayName.trim(),
        avatarId: selectedAvatar,
        customPhotoUrl: customPhotoUrl.trim() || undefined,
        themePreference: selectedTheme,
        notificationPreferences: notifPrefs,
      });

      // Apply theme immediately
      applyTheme(selectedTheme);

      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 2000);
      toast.success("Profile saved successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Apply theme preview on change
  const handleThemeChange = (id: ThemeId) => {
    setSelectedTheme(id);
    applyTheme(id);
  };

  const toggleNotifPref = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!profile) return null;

  const currentAvatar = getAvatar(selectedAvatar);
  const confirmedChef = profile.chefDirectoryId ? getConfirmedChef(profile.chefDirectoryId) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-foreground" style={{ ...headingFont, fontSize: "1.5rem" }}>
              Profile Settings
            </h1>
            <p className="text-muted-foreground text-[0.8125rem]" style={bodyFont}>
              Update your display preferences and notification settings.
            </p>
          </div>
        </div>

        {/* Save button */}
        <motion.button
          whileHover={hasChanges ? { scale: 1.02 } : {}}
          whileTap={hasChanges ? { scale: 0.98 } : {}}
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`h-9 px-4 rounded-lg flex items-center gap-2 text-[0.8125rem] cursor-pointer ${
            saved
              ? "bg-success/10 text-success border border-success/20"
              : hasChanges
                ? "bg-gold text-white"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
          style={bodyFont}
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Saving
            </>
          ) : saved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              Save changes
            </>
          )}
        </motion.button>
      </div>

      {/* ─── Profile Card ────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-gold" />
          <h2 className="text-foreground text-[1rem]" style={headingFont}>
            Profile
          </h2>
        </div>

        {/* Current avatar + name preview */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="relative shrink-0">
            {customPhotoUrl ? (
              <img
                src={customPhotoUrl}
                alt=""
                className="w-14 h-14 rounded-full object-cover border border-border"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: currentAvatar.bg }}
              >
                {currentAvatar.emoji}
              </div>
            )}
            {customPhotoUrl && (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.625rem]"
                style={{ backgroundColor: currentAvatar.bg, border: "2px solid var(--card)" }}
              >
                {currentAvatar.emoji}
              </div>
            )}
          </div>
          <div>
            <p className="text-foreground text-[1rem]" style={bodyFont}>
              {displayName || "Your name"}
            </p>
            <div
              className="flex items-center gap-1.5 text-[0.75rem] mt-0.5"
              style={{
                color: profile.role === "leadership" ? "#606C38" : "#606C38",
                ...bodyFont,
              }}
            >
              {profile.role === "leadership" ? (
                <Shield className="w-3 h-3" />
              ) : (
                <ChefHat className="w-3 h-3" />
              )}
              {profile.role === "leadership" ? "Leadership" : "Chef"}
            </div>
          </div>
        </div>

        {/* Display name field */}
        <div className="mb-5">
          <label className="block text-foreground text-[0.8125rem] mb-1.5" style={bodyFont}>
            Display name
          </label>
          <div className="relative">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="First name or preferred name"
              className={`w-full h-10 px-4 pr-10 rounded-lg bg-input-background text-foreground text-[0.875rem] placeholder:text-muted-foreground/50 border focus:outline-none focus:ring-2 transition-colors ${
                displayName.trim().length === 0
                  ? "border-destructive/40 focus:ring-destructive/20"
                  : displayName.trim() !== (profile?.displayName || "")
                    ? "border-gold/40 focus:ring-gold/30"
                    : "border-border focus:ring-gold/30 focus:border-gold/40"
              }`}
              style={bodyFont}
            />
            {/* Validation indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {displayName.trim().length === 0 ? (
                <AlertCircle className="w-4 h-4 text-destructive/50" />
              ) : displayName.trim().length >= 2 ? (
                <CheckCircle2 className="w-4 h-4" style={{ color: "#7E9E78" }} />
              ) : null}
            </div>
          </div>
          {displayName.trim().length === 0 ? (
            <p className="text-destructive/70 text-[0.6875rem] mt-1" style={bodyFont}>
              Display name is required.
            </p>
          ) : displayName.trim().length === 1 ? (
            <p className="text-gold/70 text-[0.6875rem] mt-1" style={bodyFont}>
              Name should be at least 2 characters.
            </p>
          ) : displayName.trim() !== (profile?.displayName || "") ? (
            <p className="text-[0.6875rem] mt-1" style={{ color: "#7E9E78", ...bodyFont }}>
              Name updated — save to apply.
            </p>
          ) : null}
        </div>

        {/* Avatar picker */}
        <div>
          <label className="block text-foreground text-[0.8125rem] mb-2" style={bodyFont}>
            Avatar
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
            {avatarOptions.map((av) => (
              <motion.button
                key={av.id}
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedAvatar(av.id)}
                className={`relative w-full aspect-square rounded-xl flex items-center justify-center text-lg cursor-pointer ${
                  selectedAvatar === av.id
                    ? "ring-2 ring-gold ring-offset-1 ring-offset-card"
                    : "hover:ring-1 hover:ring-border"
                }`}
                style={{ backgroundColor: av.bg }}
                title={av.label}
              >
                {av.emoji}
                {selectedAvatar === av.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold flex items-center justify-center"
                  >
                    <Check className="w-2 h-2 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Profile Photo Section */}
        <div className="mt-5">
          <label className="block text-foreground text-[0.8125rem] mb-2" style={bodyFont}>
            Profile photo
          </label>

          {/* Photo upload drop zone */}
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
              dragOver
                ? "border-gold/50 bg-gold/5"
                : "border-border hover:border-gold/30 hover:bg-secondary/20"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (!file || !profile) return;
              if (!file.type.startsWith("image/")) {
                toast.error("Please drop an image file (JPEG, PNG, WebP, GIF).");
                return;
              }
              if (file.size > 2 * 1024 * 1024) {
                toast.error("File too large. Max 2MB.");
                return;
              }
              setUploading(true);
              try {
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch(`${serverBase}/upload-photo/${profile.id}`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${publicAnonKey}` },
                  body: formData,
                });
                if (!res.ok) {
                  const errBody = await res.json();
                  throw new Error(errBody.error || "Upload failed");
                }
                const data = await res.json();
                setCustomPhotoUrl(data.url);
                if (data.profile) {
                  await updateProfile({ customPhotoUrl: data.url });
                }
                toast.success("Photo uploaded!");
              } catch (err: any) {
                console.error("Upload error:", err);
                toast.error(err.message || "Photo upload failed.");
              } finally {
                setUploading(false);
              }
            }}
          >
            <div className="flex flex-col items-center gap-2 py-5 px-4">
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>Uploading...</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(205,168,138,0.08)" }}>
                    <Upload className="w-5 h-5 text-gold/60" />
                  </div>
                  <div className="text-center">
                    <span className="text-foreground text-[0.8125rem] block" style={bodyFont}>
                      {"Drop an image here or "}
                      <label className="text-gold cursor-pointer hover:underline">
                        browse
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !profile) return;
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error("File too large. Max 2MB.");
                              return;
                            }
                            setUploading(true);
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              const res = await fetch(`${serverBase}/upload-photo/${profile.id}`, {
                                method: "POST",
                                headers: { Authorization: `Bearer ${publicAnonKey}` },
                                body: formData,
                              });
                              if (!res.ok) {
                                const errBody = await res.json();
                                throw new Error(errBody.error || "Upload failed");
                              }
                              const data = await res.json();
                              setCustomPhotoUrl(data.url);
                              if (data.profile) {
                                await updateProfile({ customPhotoUrl: data.url });
                              }
                              toast.success("Photo uploaded!");
                            } catch (err: any) {
                              console.error("Upload error:", err);
                              toast.error(err.message || "Photo upload failed.");
                            } finally {
                              setUploading(false);
                            }
                          }}
                        />
                      </label>
                    </span>
                    <span className="text-muted-foreground/50 text-[0.625rem]" style={bodyFont}>
                      JPEG, PNG, WebP, or GIF up to 2MB
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* OR separator */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground/40 text-[0.625rem] uppercase tracking-wider" style={bodyFont}>or paste URL</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* URL input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                type="text"
                value={customPhotoUrl}
                onChange={(e) => setCustomPhotoUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className={`w-full h-10 pl-9 pr-10 rounded-lg bg-input-background text-foreground text-[0.875rem] placeholder:text-muted-foreground/50 border focus:outline-none focus:ring-2 transition-colors ${
                  customPhotoUrl && !customPhotoUrl.match(/^https?:\/\/.+\..+/)
                    ? "border-destructive/40 focus:ring-destructive/20"
                    : customPhotoUrl && customPhotoUrl.match(/^https?:\/\/.+\..+/)
                      ? "border-success/40 focus:ring-success/20"
                      : "border-border focus:ring-gold/30 focus:border-gold/40"
                }`}
                style={bodyFont}
              />
              {/* Validation indicator for URL */}
              {customPhotoUrl && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {customPhotoUrl.match(/^https?:\/\/.+\..+/) ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#7E9E78" }} />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive/50" />
                  )}
                </div>
              )}
            </div>
            {customPhotoUrl && (
              <button
                onClick={() => setCustomPhotoUrl("")}
                className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                title="Clear photo"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          {customPhotoUrl && !customPhotoUrl.match(/^https?:\/\/.+\..+/) && (
            <p className="text-destructive/70 text-[0.6875rem] mt-1" style={bodyFont}>
              Please enter a valid URL starting with http:// or https://
            </p>
          )}
        </div>
      </div>

      {/* ─── Chef Event Role Card (confirmed chefs only) ─────── */}
      {confirmedChef && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(140,148,125,0.03) 0%, rgba(201,169,110,0.03) 100%)",
            borderColor: "rgba(140,148,125,0.12)",
          }}
        >
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-4">
              <ChefHat className="w-4 h-4 text-gold" />
              <h2 className="text-foreground text-[1rem]" style={headingFont}>
                Your Event Role
              </h2>
            </div>

            {/* Course assignment */}
            <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(140,148,125,0.05)", border: "1px solid rgba(140,148,125,0.1)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(140,148,125,0.1)" }}>
                <span className="text-gold" style={{ ...headingFont, fontSize: "1.125rem" }}>{confirmedChef.course}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-foreground text-[0.875rem] block" style={bodyFont}>
                  {confirmedChef.courseTitle}
                </span>
                <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                  Year {confirmedChef.year} — {confirmedChef.state ? `${confirmedChef.city}, ${confirmedChef.state}` : confirmedChef.city}
                </span>
              </div>
            </div>

            {/* Details grid */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-[0.6875rem] block uppercase tracking-wider" style={bodyFont}>Signature Dish</span>
                  <span className="text-foreground text-[0.8125rem]" style={bodyFont}>{confirmedChef.signatureDish}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Utensils className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-[0.6875rem] block uppercase tracking-wider" style={bodyFont}>Specialties</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {confirmedChef.specialties.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded-full text-[0.6875rem]"
                        style={{
                          backgroundColor: "rgba(126,158,120,0.08)",
                          color: "#7E9E78",
                          border: "1px solid rgba(126,158,120,0.15)",
                          ...bodyFont,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-[0.6875rem] block uppercase tracking-wider" style={bodyFont}>Travel</span>
                  <span className="text-foreground text-[0.8125rem]" style={bodyFont}>
                    {confirmedChef.state ? `${confirmedChef.city}, ${confirmedChef.state}` : confirmedChef.city} ({confirmedChef.airport})
                    {confirmedChef.travelMethod ? ` — ${confirmedChef.travelMethod}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <BookOpen className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground text-[0.6875rem] block uppercase tracking-wider" style={bodyFont}>Bio</span>
                  <span className="text-muted-foreground text-[0.8125rem] leading-relaxed" style={bodyFont}>{confirmedChef.bio}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── Theme Card ──────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Palette className="w-4 h-4 text-gold" />
          <h2 className="text-foreground text-[1rem]" style={headingFont}>
            Appearance
          </h2>
        </div>

        <div className="space-y-2">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                selectedTheme === theme.id
                  ? "bg-gold/8 border border-gold/20"
                  : "hover:bg-secondary border border-transparent"
              }`}
            >
              <div className="flex items-center gap-0 shrink-0">
                {theme.swatches.slice(0, 4).map((color, si) => (
                  <div
                    key={si}
                    style={{
                      width: 16,
                      height: 16,
                      backgroundColor: color,
                      borderRadius: "50%",
                      marginLeft: si === 0 ? 0 : -5,
                      zIndex: 5 - si,
                      border: "1.5px solid rgba(255,255,255,0.6)",
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 text-left min-w-0">
                <span
                  className="text-foreground text-[0.875rem] block truncate"
                  style={headingFont}
                >
                  {theme.name}
                </span>
                <span
                  className="text-muted-foreground text-[0.6875rem]"
                  style={bodyFont}
                >
                  {theme.chapter} — {theme.tagline}
                </span>
              </div>
              {selectedTheme === theme.id && (
                <Check className="w-4 h-4 text-gold shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Notification Preferences ────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-gold" />
          <h2 className="text-foreground text-[1rem]" style={headingFont}>
            Notifications
          </h2>
        </div>

        {/* Display toggles */}
        <p className="text-muted-foreground text-[0.75rem] uppercase tracking-wider mb-3" style={{ ...bodyFont, fontWeight: 600 }}>
          Display
        </p>
        <div className="space-y-3 mb-6">
          {[
            { key: "banners" as const, label: "Announcement banners", description: "Show event announcements at the top of the dashboard" },
            { key: "bellAlerts" as const, label: "Bell notifications", description: "Show notification badge count on the bell icon" },
            { key: "chatMentions" as const, label: "Chat activity", description: "Receive alerts for new messages in chat channels" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => toggleNotifPref(item.key)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold/20 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="text-foreground text-[0.875rem] block" style={bodyFont}>
                  {item.label}
                </span>
                <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                  {item.description}
                </span>
              </div>
              <div
                className={`w-10 h-6 rounded-full flex items-center transition-all duration-200 shrink-0 ${
                  notifPrefs[item.key] ? "bg-gold justify-end" : "bg-secondary justify-start"
                }`}
                style={{ padding: 2 }}
              >
                <motion.div
                  layout
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
          ))}
        </div>

        {/* Content filter toggles */}
        <p className="text-muted-foreground text-[0.75rem] uppercase tracking-wider mb-3" style={{ ...bodyFont, fontWeight: 600 }}>
          Content Filters
        </p>
        <p className="text-muted-foreground/60 text-[0.6875rem] mb-3" style={bodyFont}>
          Choose which types of notifications appear in your bell panel. Changes are saved automatically.
        </p>
        <div className="space-y-3">
          {([
            { key: "taskUpdates" as keyof NotificationPrefs, label: "Task updates", description: "When tasks are moved, created, or completed", color: "#CDA88A" },
            { key: "checklistReminders" as keyof NotificationPrefs, label: "Checklist reminders", description: "Deadline reminders and checklist progress alerts", color: "#C9A96E" },
            { key: "eventAnnouncements" as keyof NotificationPrefs, label: "Event announcements", description: "Milestone completions, urgent alerts, and celebrations", color: "#7E9E78" },
            { key: "teamMessages" as keyof NotificationPrefs, label: "Team messages", description: "General info updates and team communication", color: "#4A7FB5" },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => {
                const updated = { ...contentNotifPrefs, [item.key]: !contentNotifPrefs[item.key] };
                setContentNotifPrefs(updated);
                saveNotifPrefs(updated);
                toast.success(`${item.label} ${updated[item.key] ? "enabled" : "disabled"}`);
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold/20 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="text-left">
                  <span className="text-foreground text-[0.875rem] block" style={bodyFont}>
                    {item.label}
                  </span>
                  <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                    {item.description}
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-6 rounded-full flex items-center transition-all duration-200 shrink-0 ${
                  contentNotifPrefs[item.key] ? "bg-gold justify-end" : "bg-secondary justify-start"
                }`}
                style={{ padding: 2 }}
              >
                <motion.div
                  layout
                  className="w-5 h-5 rounded-full bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Notification Sound ───────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-gold" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          )}
          <h2 className="text-foreground text-[1rem]" style={headingFont}>
            Notification Sound
          </h2>
        </div>

        <div className="space-y-4">
          {/* Enable/disable toggle */}
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-border hover:border-gold/20 transition-all cursor-pointer"
          >
            <div className="text-left">
              <span className="text-foreground text-[0.875rem] block" style={bodyFont}>
                Sound alerts
              </span>
              <span className="text-muted-foreground text-[0.75rem]" style={bodyFont}>
                Play a gentle chime when you receive chat messages or bell notifications
              </span>
            </div>
            <div
              className={`w-10 h-6 rounded-full flex items-center transition-all duration-200 shrink-0 ${
                soundEnabled ? "bg-gold justify-end" : "bg-secondary justify-start"
              }`}
              style={{ padding: 2 }}
            >
              <motion.div
                layout
                className="w-5 h-5 rounded-full bg-white shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </button>

          {/* Volume slider + preview */}
          {soundEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 rounded-lg bg-secondary/30 border border-border"
            >
              <div className="flex items-center gap-4 mb-3">
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={soundVolume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #C9A96E 0%, #C9A96E ${soundVolume * 100}%, rgba(43,68,64,0.1) ${soundVolume * 100}%, rgba(43,68,64,0.1) 100%)`,
                    accentColor: "#C9A96E",
                  }}
                  aria-label="Notification volume"
                />
                <Volume2 className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <span className="text-[0.6875rem] text-muted-foreground w-8 text-right" style={bodyFont}>
                  {Math.round(soundVolume * 100)}%
                </span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={playPreview}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.8125rem] cursor-pointer"
                style={{
                  backgroundColor: "rgba(201,169,110,0.08)",
                  color: "#C9A96E",
                  border: "1px solid rgba(201,169,110,0.2)",
                  ...bodyFont,
                }}
              >
                <Play className="w-3.5 h-3.5" />
                Preview sound
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ─── Language Preference (placeholder) ────────────────── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-gold" />
          <h2 className="text-foreground text-[1rem]" style={headingFont}>
            Language
          </h2>
        </div>

        <div className="space-y-3">
          {[
            { code: "en", label: "English", native: "English", active: true },
            { code: "tl", label: "Filipino (Tagalog)", native: "Filipino", active: false },
            { code: "ceb", label: "Cebuano", native: "Binisayâ", active: false },
          ].map((lang) => (
            <button
              key={lang.code}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all ${
                lang.active
                  ? "bg-gold/8 border-gold/20"
                  : "border-border hover:border-gold/20 opacity-50 cursor-not-allowed"
              }`}
              disabled={!lang.active}
              aria-label={`${lang.label}${!lang.active ? " — coming soon" : ""}`}
            >
              <div className="text-left">
                <span className="text-foreground text-[0.875rem] block" style={bodyFont}>
                  {lang.label}
                </span>
                <span className="text-muted-foreground text-[0.6875rem]" style={bodyFont}>
                  {lang.native}
                </span>
              </div>
              {lang.active ? (
                <Check className="w-4 h-4 text-gold shrink-0" />
              ) : (
                <span className="text-[0.5625rem] px-2 py-0.5 rounded-full text-muted-foreground/50" style={{ backgroundColor: "rgba(107,127,142,0.06)", border: "1px solid rgba(107,127,142,0.1)", ...bodyFont }}>
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Account info ────────────────────────────────────── */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground text-[1rem]" style={headingFont}>
            Account
          </h2>
        </div>

        <div className="space-y-3 text-[0.8125rem]" style={bodyFont}>
          {/* Email */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground/50" />
              <span className="text-muted-foreground">Email</span>
            </div>
            <span className="text-foreground text-[0.75rem]">
              {displayName ? `${displayName.toLowerCase().replace(/\s+/g, ".")}@ik26.team` : "—"}
            </span>
          </div>
          {/* Role */}
          <div className="flex items-center justify-between py-2 border-t border-border">
            <div className="flex items-center gap-2">
              {profile.role === "leadership" ? (
                <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
              ) : profile.role === "team" ? (
                <UsersRound className="w-3.5 h-3.5 text-muted-foreground/50" />
              ) : (
                <ChefHat className="w-3.5 h-3.5 text-muted-foreground/50" />
              )}
              <span className="text-muted-foreground">Role</span>
            </div>
            <span
              className="text-[0.6875rem] px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: profile.role === "leadership" ? "rgba(221,161,94,0.1)" : profile.role === "team" ? "rgba(74,127,181,0.1)" : "rgba(126,158,120,0.1)",
                color: profile.role === "leadership" ? "#DDA15E" : profile.role === "team" ? "#4A7FB5" : "#7E9E78",
                ...bodyFont,
              }}
            >
              {profile.role === "leadership" ? "Admin" : profile.role === "team" ? "Coordinator" : "Chef"}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">User ID</span>
            <span className="text-foreground font-mono text-[0.75rem]">
              {profile.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Joined</span>
            <span className="text-foreground">
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Last active</span>
            <span className="text-foreground">
              {new Date(profile.lastActive).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-5 pt-4 border-t border-border">
          {/* Restart Welcome Tour */}
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                setChefTourDismissed(false);
                setTeamTourDismissed(false);
                setManagerTourDismissed(false);
                setTourRestarted(true);
                toast.success("Welcome tour restarted! Return to your Dashboard to see it.");
                setTimeout(() => setTourRestarted(false), 3000);
              }}
              disabled={tourRestarted}
              className={`flex items-center gap-2 text-[0.8125rem] transition-colors cursor-pointer ${
                tourRestarted
                  ? "text-success"
                  : "text-gold hover:text-gold/80"
              }`}
              style={bodyFont}
            >
              {tourRestarted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Tour restarted
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Welcome Tour
                </>
              )}
            </motion.button>
            <p className="text-muted-foreground/50 text-[0.6875rem] mt-1 pl-5" style={bodyFont}>
              Show the Getting Started guide again on your dashboard.
            </p>
          </div>

          {/* Restart Tooltip Walkthrough */}
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                // Clear tooltip walkthrough localStorage for all roles
                ["leadership", "team", "chef"].forEach((r) => {
                  localStorage.removeItem(`ik26_tooltips_${r}_seen`);
                });
                setTooltipTourRestarted(true);
                toast.success("Feature tour restarted! Navigate to your Dashboard to see the tips.");
                setTimeout(() => setTooltipTourRestarted(false), 3000);
              }}
              disabled={tooltipTourRestarted}
              className={`flex items-center gap-2 text-[0.8125rem] transition-colors cursor-pointer ${
                tooltipTourRestarted
                  ? "text-success"
                  : "text-gold hover:text-gold/80"
              }`}
              style={bodyFont}
            >
              {tooltipTourRestarted ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Feature tour restarted
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Restart Feature Tour
                </>
              )}
            </motion.button>
            <p className="text-muted-foreground/50 text-[0.6875rem] mt-1 pl-5" style={bodyFont}>
              Replay the tooltip walkthrough that highlights key features.
            </p>
          </div>

          {/* Restart Guided Tour */}
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                localStorage.removeItem("ik26-guided-tour-completed");
                toast.success("Guided tour restarted! It will appear on your next page load.");
              }}
              className="flex items-center gap-2 text-[0.8125rem] text-gold hover:text-gold/80 transition-colors cursor-pointer"
              style={bodyFont}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restart Guided Tour
            </motion.button>
            <p className="text-muted-foreground/50 text-[0.6875rem] mt-1 pl-5" style={bodyFont}>
              Re-run the step-by-step first-time user walkthrough.
            </p>
          </div>

          {/* Clear All Data */}
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setClearDataConfirmOpen(true)}
              className="flex items-center gap-2 text-destructive text-[0.8125rem] hover:text-destructive/80 transition-colors cursor-pointer"
              style={bodyFont}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All Saved Data
            </motion.button>
            <p className="text-muted-foreground/50 text-[0.6875rem] mt-1 pl-5" style={bodyFont}>
              Remove all locally saved tasks, checklist progress, theme, and preferences.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setSignOutConfirmOpen(true)}
            className="flex items-center gap-2 text-destructive text-[0.8125rem] hover:text-destructive/80 transition-colors cursor-pointer"
            style={bodyFont}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </motion.button>

          {/* Legal links */}
          <div className="flex items-center gap-4 mt-3 px-1">
            <a
              href="/privacy"
              className="text-[0.6875rem] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              style={bodyFont}
            >
              Privacy Policy
            </a>
            <span className="text-muted-foreground/20 text-[0.6875rem]">&middot;</span>
            <a
              href="/terms"
              className="text-[0.6875rem] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              style={bodyFont}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      {/* Clear Data confirmation dialog */}
      <AnimatePresence>
        {clearDataConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={() => setClearDataConfirmOpen(false)}
            role="alertdialog"
            aria-modal="true"
            aria-label="Clear all data confirmation"
            ref={clearDataTrapRef}
          >
            <div className="absolute inset-0" style={{ backgroundColor: "rgba(40,54,24,0.35)", backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm bg-card rounded-2xl shadow-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(164,90,70,0.08)" }}>
                    <Trash2 className="w-5 h-5" style={{ color: "#A45A46" }} />
                  </div>
                  <div>
                    <h3 className="text-foreground text-[1rem]" style={headingFont}>Clear All Data?</h3>
                    <p className="text-muted-foreground text-[0.75rem]" style={bodyFont}>This cannot be undone</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-[0.8125rem] leading-relaxed mb-5" style={bodyFont}>
                  This will remove all locally saved data including task board state, checklist progress, theme preferences, notification settings, and tour history.
                </p>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setClearDataConfirmOpen(false)}
                    className="flex-1 h-9 rounded-lg text-[0.8125rem] bg-secondary text-foreground cursor-pointer transition-colors hover:bg-secondary/80"
                    style={bodyFont}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      ALL_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
                      // Also clear any ik26- prefixed keys we might have missed
                      const allKeys = Object.keys(localStorage);
                      allKeys.forEach((key) => {
                        if (key.startsWith("ik26")) localStorage.removeItem(key);
                      });
                      setClearDataConfirmOpen(false);
                      toast.success("All saved data cleared. Refresh to see defaults.");
                    }}
                    className="flex-1 h-9 rounded-lg text-[0.8125rem] text-white cursor-pointer transition-colors"
                    style={{ backgroundColor: "#A45A46", ...bodyFont }}
                  >
                    Clear Everything
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign-out confirmation dialog */}
      <SignOutDialog
        open={signOutConfirmOpen}
        onConfirm={() => {
          setSignOutConfirmOpen(false);
          onSignOut();
        }}
        onCancel={() => setSignOutConfirmOpen(false)}
        displayName={displayName}
      />

      {/* Add to Home Screen Card */}
      <AddToHomeScreenCard />

      {/* About section */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-foreground text-[0.9375rem]" style={headingFont}>About</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[0.8125rem]" style={bodyFont}>
            <span className="text-muted-foreground">App Version</span>
            <span className="text-foreground">{BUILD_ID}</span>
          </div>
          <div className="flex items-center justify-between text-[0.8125rem]" style={bodyFont}>
            <span className="text-muted-foreground">Event Date</span>
            <span className="text-foreground">May 22, 2026</span>
          </div>
          <div className="flex items-center justify-between text-[0.8125rem]" style={bodyFont}>
            <span className="text-muted-foreground">Days Remaining</span>
            <span className="text-foreground font-semibold" style={{ color: "#C9A96E" }}>
              {Math.ceil((new Date("2026-05-22").getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
          <div className="flex items-center justify-between text-[0.8125rem]" style={bodyFont}>
            <span className="text-muted-foreground">Venue</span>
            <span className="text-foreground">Keep Memory Alive Event Center</span>
          </div>
          <div className="flex items-center justify-between text-[0.8125rem]" style={bodyFont}>
            <span className="text-muted-foreground">Location</span>
            <span className="text-foreground">Las Vegas, NV</span>
          </div>
        </div>
      </div>

      {/* Version footer */}
      <div className="text-center py-4">
        <p className="text-muted-foreground/30 text-[0.625rem]" style={bodyFont}>
          Isang Kusina 2026 · Version {BUILD_ID} · A Filipino Chefs Collaboration Dinner
        </p>
      </div>
    </motion.div>
  );
}