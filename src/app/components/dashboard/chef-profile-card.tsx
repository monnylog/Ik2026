import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChefHat,
  Camera,
  Edit3,
  Save,
  X,
  MapPin,
  UtensilsCrossed,
  BookOpen,
  Check,
  Loader2,
  Upload,
} from "lucide-react";
import { useProfile } from "../../lib/profile-context";
import { getAvatar } from "../engagement/avatars";
import { getConfirmedChef } from "../onboarding/chef-directory";
import { toast } from "sonner";
import { serverBase } from "../../lib/supabase";
import { publicAnonKey } from "/utils/supabase/info";

import { bodyFont, headingFont } from "../../lib/fonts";

interface ChefProfileCardProps {
  onNavigate?: (page: string) => void;
}

export function ChefProfileCard({ onNavigate }: ChefProfileCardProps) {
  const { profile, updateProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(profile?.bio || "");
  const [specialty, setSpecialty] = useState(profile?.specialty || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const avatar = getAvatar(profile.avatarId || "mortar");
  const confirmedChef = profile.chefDirectoryId ? getConfirmedChef(profile.chefDirectoryId) : null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ bio: bio.trim(), specialty: specialty.trim() });
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
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
      await updateProfile({ customPhotoUrl: data.url });
      toast.success("Photo updated!");
    } catch (err: any) {
      console.error("Photo upload error:", err);
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="bg-card rounded-xl border border-border overflow-hidden"
      role="region"
      aria-label="Your chef profile"
    >
      {/* Banner gradient */}
      <div
        className="h-20 relative"
        style={{
          background: "linear-gradient(135deg, rgba(126,158,120,0.15) 0%, rgba(205,168,138,0.15) 50%, rgba(201,169,110,0.1) 100%)",
        }}
      >
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer transition-all hover:bg-white/50"
              style={{ backgroundColor: "rgba(255,255,255,0.3)", color: "#7E9E78", ...bodyFont }}
              aria-label="Edit profile"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setEditing(false); setBio(profile.bio || ""); setSpecialty(profile.specialty || ""); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer hover:bg-white/50"
                style={{ backgroundColor: "rgba(255,255,255,0.3)", color: "#6B7F8E", ...bodyFont }}
                aria-label="Cancel editing"
              >
                <X className="w-3 h-3" />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] cursor-pointer"
                style={{ backgroundColor: "rgba(126,158,120,0.8)", color: "#FFF", ...bodyFont }}
                aria-label="Save profile changes"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile content */}
      <div className="px-5 pb-5 -mt-10">
        {/* Avatar / Photo */}
        <div className="relative w-20 h-20 mb-3">
          {profile.customPhotoUrl ? (
            <img
              src={profile.customPhotoUrl}
              alt={profile.displayName || "Chef"}
              className="w-20 h-20 rounded-2xl object-cover border-4"
              style={{ borderColor: "var(--card)" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl border-4"
              style={{ backgroundColor: avatar.bg, borderColor: "var(--card)" }}
            >
              {avatar.emoji}
            </div>
          )}

          {/* Photo upload overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            aria-label="Upload profile photo"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Camera className="w-5 h-5 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
            }}
          />

          {/* Confirmed chef badge */}
          {confirmedChef && (
            <div
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#C9A96E", border: "3px solid var(--card)" }}
              title="Confirmed Chef"
            >
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Name + role */}
        <h3 className="text-foreground text-[1.125rem] mb-0.5" style={headingFont}>
          {confirmedChef?.name || profile.displayName || "Chef"}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1 text-[0.6875rem] px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(126,158,120,0.1)", color: "#7E9E78", ...bodyFont }}>
            <ChefHat className="w-3 h-3" />
            {confirmedChef ? `Course ${confirmedChef.course} Chef` : "Guest Chef"}
          </span>
          {confirmedChef?.city && (
            <span className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground" style={bodyFont}>
              <MapPin className="w-3 h-3" />
              {confirmedChef.state ? `${confirmedChef.city}, ${confirmedChef.state}` : confirmedChef.city}
            </span>
          )}
        </div>

        {/* Bio / Specialty (editable) */}
        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[0.6875rem] text-muted-foreground mb-1" style={bodyFont}>
                  Culinary specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g., Modern Filipino, Pastry, Kamayan"
                  className="w-full h-9 px-3 rounded-lg bg-input-background text-foreground text-[0.8125rem] placeholder:text-muted-foreground/50 border border-border focus:outline-none focus:ring-2 focus:ring-gold/30"
                  style={bodyFont}
                />
              </div>
              <div>
                <label className="block text-[0.6875rem] text-muted-foreground mb-1" style={bodyFont}>
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a bit about yourself, your cooking philosophy, or what excites you about IK26..."
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2 rounded-lg bg-input-background text-foreground text-[0.8125rem] placeholder:text-muted-foreground/50 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-gold/30"
                  style={bodyFont}
                />
                <div className="text-right text-[0.5625rem] text-muted-foreground/50 mt-0.5" style={bodyFont}>
                  {bio.length}/300
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              {(profile.specialty || (confirmedChef?.specialties && confirmedChef.specialties.length > 0)) && (
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-3 h-3 text-gold/60" />
                  <span className="text-[0.75rem] text-foreground" style={bodyFont}>
                    {profile.specialty || confirmedChef?.specialties?.join(", ")}
                  </span>
                </div>
              )}
              {profile.bio ? (
                <p className="text-[0.75rem] text-muted-foreground leading-relaxed" style={bodyFont}>
                  {profile.bio}
                </p>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-[0.75rem] text-gold/60 hover:text-gold transition-colors cursor-pointer"
                  style={bodyFont}
                >
                  <Edit3 className="w-3 h-3" />
                  Add a bio to introduce yourself to the team
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick links */}
        {confirmedChef && (
          <div className="mt-4 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--border)" }}>
            {confirmedChef.courseTitle && (
              <span className="flex items-center gap-1 text-[0.625rem] px-2 py-1 rounded-lg" style={{ backgroundColor: "rgba(205,168,138,0.08)", color: "#CDA88A", ...bodyFont }}>
                <BookOpen className="w-2.5 h-2.5" />
                {confirmedChef.courseTitle}
              </span>
            )}
            {onNavigate && (
              <button
                onClick={() => onNavigate("Settings")}
                className="flex items-center gap-1 text-[0.625rem] px-2 py-1 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                style={{ backgroundColor: "rgba(107,127,142,0.06)", color: "#6B7F8E", ...bodyFont }}
              >
                Full profile settings →
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}