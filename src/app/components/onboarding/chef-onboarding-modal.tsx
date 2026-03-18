import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Upload, Loader2, ChefHat, MapPin, Instagram, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/supabase";
import { bodyFont, headingFont } from "../../lib/fonts";

interface ChefOnboardingModalProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export function ChefOnboardingModal({ onComplete, onSkip }: ChefOnboardingModalProps) {
  const [fullName, setFullName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [city, setCity] = useState("");
  const [instagram, setInstagram] = useState("");
  const [bio, setBio] = useState("");
  const [headshot, setHeadshot] = useState<File | null>(null);
  const [headshotPreview, setHeadshotPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }
      setHeadshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeadshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!bio.trim()) {
      toast.error("Please add a short bio");
      return;
    }

    setSaving(true);

    try {
      const profileData = {
        fullName: fullName.trim(),
        restaurant: restaurant.trim(),
        city: city.trim(),
        instagram: instagram.trim().replace(/^@/, ""),
        bio: bio.trim(),
        headshot: headshotPreview || "",
      };

      await apiFetch("/chef/profile", {
        method: "POST",
        body: JSON.stringify(profileData),
      });

      toast.success("Profile saved successfully!");
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (err) {
      console.error("Failed to save chef profile:", err);
      toast.error("Failed to save profile. Please try again.");
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && onSkip) {
            onSkip();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 md:p-8"
          style={{
            backgroundColor: "#FFFDF5",
            boxShadow: "0 20px 60px rgba(46,79,82,0.15), 0 0 1px rgba(46,79,82,0.1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(203,164,122,0.12)" }}
              >
                <ChefHat className="w-5 h-5" style={{ color: "#CBA47A" }} />
              </div>
              <div>
                <h2
                  className="text-[1.375rem] leading-tight"
                  style={{ ...headingFont, color: "#2E4F52" }}
                >
                  Complete Your Chef Profile
                </h2>
                <p
                  className="text-[0.8125rem] mt-0.5"
                  style={{ ...bodyFont, color: "#6B8A8D" }}
                >
                  Help the team get to know you better
                </p>
              </div>
            </div>
            {onSkip && (
              <button
                onClick={onSkip}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "#6B8A8D" }}
                aria-label="Skip for now"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-[0.8125rem] mb-1.5"
                style={{ ...bodyFont, color: "#2E4F52" }}
              >
                <User className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Chef Rachel Barril"
                className="w-full px-3.5 py-2.5 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2"
                style={{
                  ...bodyFont,
                  borderColor: "rgba(46,79,82,0.12)",
                  backgroundColor: "#FFFFFF",
                  color: "#2E4F52",
                }}
                required
              />
            </div>

            {/* Restaurant Name */}
            <div>
              <label
                htmlFor="restaurant"
                className="block text-[0.8125rem] mb-1.5"
                style={{ ...bodyFont, color: "#2E4F52" }}
              >
                <Building2 className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                Restaurant / Establishment
              </label>
              <input
                id="restaurant"
                type="text"
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                placeholder="e.g., Archipelago Restaurant"
                className="w-full px-3.5 py-2.5 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2"
                style={{
                  ...bodyFont,
                  borderColor: "rgba(46,79,82,0.12)",
                  backgroundColor: "#FFFFFF",
                  color: "#2E4F52",
                }}
              />
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="city"
                className="block text-[0.8125rem] mb-1.5"
                style={{ ...bodyFont, color: "#2E4F52" }}
              >
                <MapPin className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                City
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Seattle, WA"
                className="w-full px-3.5 py-2.5 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2"
                style={{
                  ...bodyFont,
                  borderColor: "rgba(46,79,82,0.12)",
                  backgroundColor: "#FFFFFF",
                  color: "#2E4F52",
                }}
              />
            </div>

            {/* Instagram Handle */}
            <div>
              <label
                htmlFor="instagram"
                className="block text-[0.8125rem] mb-1.5"
                style={{ ...bodyFont, color: "#2E4F52" }}
              >
                <Instagram className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                Instagram Handle
              </label>
              <input
                id="instagram"
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@yourhandle"
                className="w-full px-3.5 py-2.5 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2"
                style={{
                  ...bodyFont,
                  borderColor: "rgba(46,79,82,0.12)",
                  backgroundColor: "#FFFFFF",
                  color: "#2E4F52",
                }}
              />
            </div>

            {/* Bio */}
            <div>
              <label
                htmlFor="bio"
                className="block text-[0.8125rem] mb-1.5"
                style={{ ...bodyFont, color: "#2E4F52" }}
              >
                Short Bio (2-3 sentences) *
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a bit about your culinary journey, specialties, or what brings you to Isang Kusina..."
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-lg border text-[0.875rem] transition-all focus:outline-none focus:ring-2 resize-none"
                style={{
                  ...bodyFont,
                  borderColor: "rgba(46,79,82,0.12)",
                  backgroundColor: "#FFFFFF",
                  color: "#2E4F52",
                }}
                required
              />
              <div
                className="text-[0.6875rem] mt-1"
                style={{ ...bodyFont, color: "#6B8A8D" }}
              >
                {bio.length}/300 characters
              </div>
            </div>

            {/* Headshot Upload */}
            <div>
              <label className="block text-[0.8125rem] mb-1.5" style={{ ...bodyFont, color: "#2E4F52" }}>
                <Upload className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5" />
                Headshot (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                {headshotPreview && (
                  <img
                    src={headshotPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover"
                    style={{ border: "2px solid rgba(203,164,122,0.2)" }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg text-[0.8125rem] transition-colors"
                  style={{
                    ...bodyFont,
                    backgroundColor: "rgba(203,164,122,0.08)",
                    color: "#CBA47A",
                    border: "1px solid rgba(203,164,122,0.2)",
                  }}
                >
                  {headshotPreview ? "Change Photo" : "Upload Photo"}
                </button>
              </div>
              <div
                className="text-[0.6875rem] mt-1.5"
                style={{ ...bodyFont, color: "#6B8A8D" }}
              >
                Maximum 5MB. JPG, PNG, or WEBP.
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || !fullName.trim() || !bio.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-[0.875rem] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  ...bodyFont,
                  backgroundColor: "#2E4F52",
                  color: "#FFFDF5",
                }}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Profile
                  </>
                )}
              </button>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-5 py-3 rounded-lg text-[0.875rem] transition-colors"
                  style={{
                    ...bodyFont,
                    color: "#6B8A8D",
                  }}
                >
                  Skip for now
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
