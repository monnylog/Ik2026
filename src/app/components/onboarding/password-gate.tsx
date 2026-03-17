import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Eye, EyeOff, ChevronRight, Loader2, ArrowLeft, User, Check, MapPin, ChefHat, Users, CheckCircle2, ShieldCheck } from "lucide-react";
import { authenticatePassword, getPersonalPreset, type UserRole } from "./use-auth";
import { avatarOptions, getAvatar } from "../engagement/avatars";
import { confirmedChefs, type ConfirmedChef } from "./chef-directory";
import {
  apiLookupProfiles,
  apiRegister,
  apiSignIn,
  useProfile,
  type UserProfile,
} from "../../lib/profile-context";
import istoryaLogo from "figma:asset/b55bcac066687e563f77685fc31f20ef43e81d5d.png";
import istoryaWordmark from "figma:asset/f39822aa8d83145832fad1a77f8dd27c27cd088d.png";

interface PasswordGateProps {
  onAuthenticated: (role: UserRole, rememberMe: boolean) => void;
}

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

type GateStep = "code" | "select-profile" | "identify-chef" | "create-profile";

interface ExistingProfile {
  id: string;
  displayName: string;
  avatarId: string;
  role: string;
}

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const { setProfile, setAccessToken } = useProfile();

  // Step state
  const [step, setStep] = useState<GateStep>("code");
  const [accessCode, setAccessCode] = useState("");
  const [resolvedRole, setResolvedRole] = useState<UserRole | null>(null);

  // Code step
  const [password, setPassword] = useState(() => {
    // Remember the last attempted code from this session
    try { return sessionStorage.getItem("ik26-last-code-attempt") || ""; } catch { return ""; }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [codeHint, setCodeHint] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Profile selection
  const [existingProfiles, setExistingProfiles] = useState<ExistingProfile[]>([]);

  // Chef identification
  const [selectedChef, setSelectedChef] = useState<ConfirmedChef | null>(null);

  // Profile creation
  const [displayName, setDisplayName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("mortar");
  const [creating, setCreating] = useState(false);
  const [personalGreeting, setPersonalGreeting] = useState<string | null>(null);

  // ── Personal preset auto-login ──────────────────────────────────
  const handlePersonalLogin = async (pw: string, role: UserRole) => {
    const preset = getPersonalPreset(pw);
    if (!preset) return false;

    setLoading(true);
    setPersonalGreeting(preset.displayName.split(" ")[0]);

    try {
      // Check for existing profiles under this password
      const { profiles } = await apiLookupProfiles(pw);

      if (profiles.length > 0) {
        // Found existing profile — sign in directly
        const match = profiles.find(p => p.displayName === preset.displayName) || profiles[0];
        try {
          const result = await apiSignIn(match.id);
          const { profile, session } = result;

          // Apply preset bio/specialty if missing on server profile
          const updates: Partial<UserProfile> = {};
          if (preset.bio && !profile.bio) updates.bio = preset.bio;
          if (preset.specialty && !profile.specialty) updates.specialty = preset.specialty;

          setProfile({ ...profile, ...updates } as UserProfile);
          setAccessToken(session.access_token, session.refresh_token);
          localStorage.setItem("ik26-auth-token", session.access_token);
          localStorage.setItem("ik26-refresh-token", session.refresh_token);
          onAuthenticated(profile.role as UserRole, true);
          return true;
        } catch (err) {
          console.error("Personal preset sign-in failed:", err);
        }
      }

      // No existing profile — register with preset data
      try {
        const result = await apiRegister({
          accessCode: pw,
          displayName: preset.displayName,
          avatarId: preset.avatarId,
        });
        const { profile, session } = result;

        // Apply extra preset fields
        const enriched: UserProfile = {
          ...profile,
          ...(preset.bio ? { bio: preset.bio } : {}),
          ...(preset.specialty ? { specialty: preset.specialty } : {}),
        };

        setProfile(enriched);
        setAccessToken(session.access_token, session.refresh_token);
        localStorage.setItem("ik26-auth-token", session.access_token);
        localStorage.setItem("ik26-refresh-token", session.refresh_token);
        onAuthenticated(preset.role, true);
        return true;
      } catch (err) {
        console.error("Personal preset registration failed:", err);
      }
    } catch (err) {
      console.error("Personal preset lookup failed:", err);
    }

    // If all API calls failed, fall back to local-only mode
    const fallbackProfile: UserProfile = {
      id: `local-${Date.now()}`,
      email: "",
      accessCode: pw,
      displayName: preset.displayName,
      role: preset.role,
      avatarId: preset.avatarId,
      bio: preset.bio,
      specialty: preset.specialty,
      themePreference: "ik26" as any,
      notificationPreferences: { banners: true, bellAlerts: true, chatMentions: true },
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };
    setProfile(fallbackProfile);
    onAuthenticated(preset.role, true);
    return true;
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Persist last attempt for convenience
    try { sessionStorage.setItem("ik26-last-code-attempt", password); } catch {}

    if (!password.trim()) {
      setError("Please enter your access code.");
      setCodeHint("");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      inputRef.current?.focus();
      return;
    }
    if (password.trim().length < 3) {
      setError("Access codes are at least 3 characters.");
      setCodeHint("");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      inputRef.current?.focus();
      return;
    }
    const role = authenticatePassword(password);
    if (!role) {
      setError("That code doesn't match. Check with your event lead.");
      setCodeHint("Double-check your access code and try again.");
      setShaking(true);
      setTimeout(() => setShaking(false), 600);
      inputRef.current?.select();
      return;
    }

    setError("");
    setCodeHint("");
    setCodeValid(true);
    setAccessCode(password);
    setResolvedRole(role);
    setLoading(true);

    // ── Check for personal preset (auto-login) ──
    const preset = getPersonalPreset(password);
    if (preset) {
      const handled = await handlePersonalLogin(password, role);
      if (handled) return;
      // If personal login failed, fall through to normal flow
    }

    try {
      const { profiles } = await apiLookupProfiles(password);

      if (profiles.length > 0) {
        setExistingProfiles(profiles);
        setStep("select-profile");
      } else if (role === "chef") {
        // New chef — show identification step
        setStep("identify-chef");
      } else {
        setStep("create-profile");
      }
    } catch (err) {
      console.error("Profile lookup failed:", err);
      if (role === "chef") {
        setStep("identify-chef");
      } else {
        setStep("create-profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const result = await apiSignIn(profileId);
      const { profile, session } = result;

      setProfile(profile as UserProfile);
      setAccessToken(session.access_token, session.refresh_token);
      localStorage.setItem("ik26-auth-token", session.access_token);
      localStorage.setItem("ik26-refresh-token", session.refresh_token);

      onAuthenticated(profile.role as UserRole, true);
    } catch (err) {
      console.error("Sign-in failed:", err);
      // Fallback: use the selected profile data from the list to avoid bounce
      const selected = existingProfiles.find(p => p.id === profileId);
      if (selected && resolvedRole) {
        const fallbackProfile: UserProfile = {
          id: selected.id,
          email: "",
          accessCode,
          displayName: selected.displayName,
          role: selected.role as UserRole,
          avatarId: selected.avatarId,
          themePreference: "ik26" as any,
          notificationPreferences: { banners: true, bellAlerts: true, chatMentions: true },
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        onAuthenticated(selected.role as UserRole, true);
      } else {
        setError("Sign-in failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChefSelected = (chef: ConfirmedChef) => {
    setSelectedChef(chef);
    setDisplayName(chef.name);
    setSelectedAvatar(chef.avatarId);
    setStep("create-profile");
  };

  const handleTeamMember = () => {
    setSelectedChef(null);
    setDisplayName("");
    setSelectedAvatar("mortar");
    setStep("create-profile");
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setCreating(true);
    try {
      const result = await apiRegister({
        accessCode,
        displayName: displayName.trim(),
        avatarId: selectedAvatar,
        chefDirectoryId: selectedChef?.id,
      });
      const { profile, session } = result;

      setProfile(profile as UserProfile);
      setAccessToken(session.access_token, session.refresh_token);
      localStorage.setItem("ik26-auth-token", session.access_token);
      localStorage.setItem("ik26-refresh-token", session.refresh_token);

      onAuthenticated(profile.role as UserRole, true);
    } catch (err) {
      console.error("Registration failed:", err);
      // Fallback: create a local-only profile so users never bounce back to the code step
      if (resolvedRole) {
        const fallbackProfile: UserProfile = {
          id: `local-${Date.now()}`,
          email: "",
          accessCode,
          displayName: displayName.trim(),
          role: resolvedRole,
          avatarId: selectedAvatar,
          chefDirectoryId: selectedChef?.id,
          themePreference: "ik26" as any,
          notificationPreferences: { banners: true, bellAlerts: true, chatMentions: true },
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        onAuthenticated(resolvedRole, true);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  const goBack = () => {
    if (step === "create-profile" && resolvedRole === "chef") {
      setStep("identify-chef");
      setSelectedChef(null);
      setDisplayName("");
      return;
    }
    setStep("code");
    setExistingProfiles([]);
    setError("");
    setSelectedChef(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8"
      style={{
        background: "linear-gradient(145deg, #2A2D26 0%, #1E2019 35%, #252822 55%, #1E2019 100%)",
      }}
    >
      {/* Multi-layer ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: [
            "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(201,169,110,0.07) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 80% at 20% 80%, rgba(126,158,120,0.04) 0%, transparent 60%)",
            "radial-gradient(ellipse 50% 50% at 85% 70%, rgba(139,150,196,0.03) 0%, transparent 60%)",
          ].join(", "),
        }}
      />

      {/* Subtle gold border line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(201,169,110,0.3) 50%, transparent 90%)",
        }}
      />

      <AnimatePresence mode="wait">
        {/* ─── STEP 1: Access Code ──────────────────────────────── */}
        {step === "code" && (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm mx-4"
          >
            {/* Brand */}
            <div className="flex flex-col items-center mb-10">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
                className="relative mb-5"
              >
                {/* Glow ring behind logo */}
                <div
                  className="absolute -inset-3 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)",
                  }}
                />
                <img src={istoryaLogo} alt="Istorya" className="w-16 h-16 relative z-10" width={64} height={64} />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ ...headingFont, fontSize: "2rem", lineHeight: 1.2, color: "#F4EDE4" }}
              >
                Isang Kusina{" "}
                <span style={{ color: "#C9A96E" }}>2026</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[0.9375rem] mt-1"
                style={{ ...bodyFont, color: "rgba(244,237,228,0.5)" }}
              >
                A Filipino Chefs Collaboration Dinner
              </motion.p>

              {/* Event date pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 px-3 py-1 rounded-full text-[0.6875rem] tracking-widest uppercase"
                style={{
                  ...bodyFont,
                  color: "rgba(201,169,110,0.6)",
                  backgroundColor: "rgba(201,169,110,0.06)",
                  border: "1px solid rgba(201,169,110,0.12)",
                }}
              >
                May 22, 2026 &middot; Las Vegas
              </motion.div>
            </div>

            {/* Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "rgba(244,237,228,0.035)",
                border: "1px solid rgba(201,169,110,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(201,169,110,0.05) inset",
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    backgroundColor: "rgba(201,169,110,0.1)",
                    border: "1px solid rgba(201,169,110,0.2)",
                  }}
                >
                  <Lock className="w-3.5 h-3.5" style={{ color: "#C9A96E" }} />
                </div>
                <h2
                  style={{ ...headingFont, fontSize: "1.125rem", color: "#F4EDE4" }}
                >
                  Enter your access code
                </h2>
              </div>
              <p className="text-[0.8125rem] mb-5" style={{ ...bodyFont, color: "rgba(244,237,228,0.4)" }}>
                Your code was sent by the event team.
              </p>

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <motion.div
                    animate={shaking ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <input
                      ref={inputRef}
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                        if (codeValid) setCodeValid(false);
                      }}
                      placeholder="Access code"
                      autoFocus
                      className="w-full h-12 px-4 pr-10 rounded-xl text-[0.9375rem] placeholder:opacity-40 outline-none"
                      style={{
                        ...bodyFont,
                        backgroundColor: "rgba(244,237,228,0.04)",
                        color: "#F4EDE4",
                        border: error
                          ? "1.5px solid rgba(237,203,200,0.5)"
                          : codeValid
                            ? "1.5px solid rgba(126,158,120,0.5)"
                            : "1.5px solid rgba(201,169,110,0.15)",
                        boxShadow: error
                          ? "0 0 0 3px rgba(237,203,200,0.08)"
                          : codeValid
                            ? "0 0 0 3px rgba(126,158,120,0.08)"
                            : "0 0 0 3px rgba(201,169,110,0.04)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                      style={{ color: "rgba(244,237,228,0.35)" }}
                      aria-label={showPassword ? "Hide access code" : "Show access code"}
                    >
                      {codeValid ? (
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#7E9E78" }} />
                      ) : showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </motion.div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[0.75rem] mt-1.5"
                      style={{ ...bodyFont, color: "#EDCBC8" }}
                    >
                      {error}
                    </motion.p>
                  )}
                  {codeHint && (
                    <p className="text-[0.75rem] mt-1.5" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>
                      {codeHint}
                    </p>
                  )}
                </div>

                {/* Session persistence notice */}
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
                  style={{
                    backgroundColor: "rgba(126,158,120,0.04)",
                    border: "1px solid rgba(126,158,120,0.1)",
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "rgba(126,158,120,0.5)" }} />
                  <p className="text-[0.6875rem] leading-relaxed" style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}>
                    Your session will be remembered on this device until you sign out.
                  </p>
                </div>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={loading ? {} : { scale: 1.02 }}
                  whileTap={loading ? {} : { scale: 0.98 }}
                  className="w-full h-12 rounded-xl cursor-pointer relative overflow-hidden disabled:opacity-60"
                  style={{
                    ...bodyFont,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #C9A96E 0%, #B8944F 100%)",
                    color: "#1E2019",
                    boxShadow: "0 4px 16px rgba(201,169,110,0.25), 0 0 0 1px rgba(201,169,110,0.3) inset",
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying
                    </span>
                  ) : codeValid ? (
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      <CheckCircle2 className="w-4 h-4" />
                      Code accepted
                    </span>
                  ) : (
                    <>
                      <span className="relative z-10">Enter</span>
                      <motion.div
                        animate={{ x: ["-100%", "250%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 4 }}
                        className="absolute inset-0 w-1/3 skew-x-12"
                        style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)" }}
                      />
                    </>
                  )}
                </motion.button>

                {/* Shimmer loading state */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-4 h-4 rounded-full relative overflow-hidden" style={{ backgroundColor: "rgba(201,169,110,0.1)" }}>
                            <div className="absolute inset-0 shimmer-bar" />
                          </div>
                          <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}>
                            {personalGreeting ? `Welcome back, ${personalGreeting}...` : "Looking up profiles..."}
                          </span>
                        </div>
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "rgba(244,237,228,0.02)", border: "1px solid rgba(201,169,110,0.06)" }}>
                            <div className="w-9 h-9 rounded-full relative overflow-hidden" style={{ backgroundColor: "rgba(201,169,110,0.06)" }}>
                              <motion.div
                                animate={{ x: ["-100%", "200%"] }}
                                transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 w-1/2"
                                style={{ background: "linear-gradient(to right, transparent, rgba(201,169,110,0.12), transparent)" }}
                              />
                            </div>
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3 rounded-full relative overflow-hidden" style={{ width: `${60 + i * 12}%`, backgroundColor: "rgba(244,237,228,0.04)" }}>
                                <motion.div
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{ duration: 1.5, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
                                  className="absolute inset-0 w-1/2"
                                  style={{ background: "linear-gradient(to right, transparent, rgba(201,169,110,0.1), transparent)" }}
                                />
                              </div>
                              <div className="h-2 rounded-full relative overflow-hidden" style={{ width: `${40 + i * 8}%`, backgroundColor: "rgba(244,237,228,0.03)" }}>
                                <motion.div
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{ duration: 1.5, delay: i * 0.15 + 0.1, repeat: Infinity, ease: "easeInOut" }}
                                  className="absolute inset-0 w-1/2"
                                  style={{ background: "linear-gradient(to right, transparent, rgba(201,169,110,0.08), transparent)" }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

            {/* Branding footer */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <img
                src={istoryaWordmark}
                alt="Istorya"
                className="h-5 opacity-20"
                style={{ filter: "saturate(0.3) brightness(1.2)" }}
              />
              <p className="text-[0.5625rem] tracking-widest uppercase" style={{ ...bodyFont, color: "rgba(244,237,228,0.15)" }}>
                Invite-only experience
              </p>
              <a
                href="mailto:walbert@isangkusina.com?subject=Isang%20Kusina%202026%20-%20Access%20Code%20Help&body=Hi%20team%2C%0A%0AI%20need%20help%20with%20my%20access%20code%20for%20the%20Isang%20Kusina%202026%20portal.%0A%0AMy%20name%3A%20%0AMy%20role%3A%20"
                className="text-[0.6875rem] mt-1 cursor-pointer"
                style={{
                  ...bodyFont,
                  color: "rgba(201,169,110,0.35)",
                  textDecoration: "none",
                }}
                onMouseOver={(e) => (e.currentTarget.style.color = "rgba(201,169,110,0.6)")}
                onMouseOut={(e) => (e.currentTarget.style.color = "rgba(201,169,110,0.35)")}
              >
                Forgot your code? Contact the event lead
              </a>
              <div className="flex items-center gap-3 mt-1">
                <a
                  href="/privacy"
                  className="text-[0.5625rem] cursor-pointer"
                  style={{
                    ...bodyFont,
                    color: "rgba(244,237,228,0.2)",
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "rgba(244,237,228,0.4)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "rgba(244,237,228,0.2)")}
                >
                  Privacy
                </a>
                <span className="text-[0.5625rem]" style={{ color: "rgba(244,237,228,0.1)" }}>&middot;</span>
                <a
                  href="/terms"
                  className="text-[0.5625rem] cursor-pointer"
                  style={{
                    ...bodyFont,
                    color: "rgba(244,237,228,0.2)",
                    textDecoration: "none",
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "rgba(244,237,228,0.4)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "rgba(244,237,228,0.2)")}
                >
                  Terms
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── STEP 2: Select existing profile ─────────────────── */}
        {step === "select-profile" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm mx-4"
          >
            <div className="flex flex-col items-center mb-8">
              <img src={istoryaLogo} alt="Istorya" className="w-14 h-14 mb-4" width={56} height={56} />
              <h1 className="mb-1" style={{ ...headingFont, fontSize: "1.5rem", color: "#F4EDE4" }}>
                Welcome back
              </h1>
              <p className="text-[0.8125rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.45)" }}>
                Select your profile to continue.
              </p>
            </div>

            <div className="rounded-2xl p-5 space-y-2"
              style={{
                backgroundColor: "rgba(244,237,228,0.035)",
                border: "1px solid rgba(201,169,110,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              {existingProfiles.map((p) => {
                const avatar = getAvatar(p.avatarId);
                return (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectProfile(p.id)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: "rgba(0,0,0,0)",
                      border: "1px solid rgba(201,169,110,0.1)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: avatar.bg }}
                    >
                      {avatar.emoji}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <span className="text-[0.9375rem] block truncate" style={{ ...bodyFont, color: "#F4EDE4" }}>
                        {p.displayName}
                      </span>
                      <span className="text-[0.6875rem] capitalize" style={{ ...bodyFont, color: "rgba(244,237,228,0.4)" }}>
                        {p.role}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: "rgba(201,169,110,0.4)" }} />
                  </motion.button>
                );
              })}

              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,169,110,0.08)" }} />
                <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.25)" }}>or</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,169,110,0.08)" }} />
              </div>

              {/* Create new profile */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  if (resolvedRole === "chef") {
                    setStep("identify-chef");
                  } else {
                    setStep("create-profile");
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: "rgba(0,0,0,0)",
                  border: "1px dashed rgba(201,169,110,0.15)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(201,169,110,0.06)" }}
                >
                  <User className="w-5 h-5" style={{ color: "#C9A96E" }} />
                </div>
                <span className="text-[0.9375rem]" style={{ ...bodyFont, color: "#F4EDE4" }}>
                  Create new profile
                </span>
              </motion.button>
            </div>

            {/* Back */}
            <button
              onClick={goBack}
              className="mt-4 mx-auto flex items-center gap-1.5 text-[0.8125rem] cursor-pointer"
              style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to access code
            </button>
          </motion.div>
        )}

        {/* ─── STEP 2b: Chef Identification ────────────────────── */}
        {step === "identify-chef" && (
          <motion.div
            key="identify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg mx-4"
          >
            <div className="flex flex-col items-center mb-6">
              <img src={istoryaLogo} alt="Istorya" className="w-14 h-14 mb-4" width={56} height={56} />
              <h1 className="mb-1 text-center" style={{ ...headingFont, fontSize: "1.5rem", color: "#F4EDE4" }}>
                Who are you?
              </h1>
              <p className="text-[0.8125rem] text-center max-w-xs" style={{ ...bodyFont, color: "rgba(244,237,228,0.45)" }}>
                Select your name below. Your profile has been prepared with your info pre-filled.
              </p>
            </div>

            <div className="rounded-2xl p-5"
              style={{
                backgroundColor: "rgba(244,237,228,0.035)",
                border: "1px solid rgba(201,169,110,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              {/* Chef grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {confirmedChefs.map((chef, idx) => {
                  const avatar = getAvatar(chef.avatarId);
                  return (
                    <motion.button
                      key={chef.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChefSelected(chef)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-left group"
                      style={{
                        backgroundColor: "rgba(0,0,0,0)",
                        border: "1px solid rgba(201,169,110,0.1)",
                      }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 transition-transform group-hover:scale-110"
                        style={{ backgroundColor: avatar.bg }}
                      >
                        {avatar.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[0.875rem] block truncate" style={{ ...bodyFont, color: "#F4EDE4" }}>
                          Chef {chef.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0" style={{ color: "rgba(139,150,196,0.6)" }} />
                          <span className="text-[0.6875rem] truncate" style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}>
                            {chef.state ? `${chef.city}, ${chef.state}` : chef.city}
                          </span>
                          <span className="text-[0.6875rem]" style={{ color: "rgba(244,237,228,0.15)" }}>/</span>
                          <span className="text-[0.6875rem] shrink-0" style={{ ...bodyFont, color: "#C9A96E" }}>
                            {chef.courseTitle}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "rgba(201,169,110,0.25)" }} />
                    </motion.button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,169,110,0.08)" }} />
                <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.25)" }}>not a chef?</span>
                <div className="flex-1 h-px" style={{ backgroundColor: "rgba(201,169,110,0.08)" }} />
              </div>

              {/* Team/volunteer option */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleTeamMember}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer"
                style={{
                  backgroundColor: "rgba(0,0,0,0)",
                  border: "1px dashed rgba(126,158,120,0.15)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "rgba(126,158,120,0.06)" }}
                >
                  <Users className="w-5 h-5" style={{ color: "#7E9E78" }} />
                </div>
                <div className="text-left flex-1">
                  <span className="text-[0.875rem] block" style={{ ...bodyFont, color: "#F4EDE4" }}>
                    I'm a team member or volunteer
                  </span>
                  <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}>
                    Create a new profile
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Back */}
            <button
              onClick={goBack}
              className="mt-4 mx-auto flex items-center gap-1.5 text-[0.8125rem] cursor-pointer"
              style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to access code
            </button>
          </motion.div>
        )}

        {/* ─── STEP 3: Create profile ──────────────────────────── */}
        {step === "create-profile" && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md mx-4"
          >
            <div className="flex flex-col items-center mb-8">
              <img src={istoryaLogo} alt="Istorya" className="w-14 h-14 mb-4" width={56} height={56} />
              {selectedChef ? (
                <>
                  <h1 className="mb-1 text-center" style={{ ...headingFont, fontSize: "1.5rem", color: "#F4EDE4" }}>
                    Welcome, Chef {selectedChef.name.split(" ")[0]}
                  </h1>
                  <p className="text-[0.8125rem] text-center max-w-xs" style={{ ...bodyFont, color: "rgba(244,237,228,0.45)" }}>
                    {selectedChef.greeting}
                  </p>
                  {/* Chef info badge */}
                  <div
                    className="flex items-center gap-3 mt-4 px-4 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: "rgba(201,169,110,0.04)",
                      border: "1px solid rgba(201,169,110,0.12)",
                    }}
                  >
                    <ChefHat className="w-4 h-4 shrink-0" style={{ color: "#C9A96E" }} />
                    <div className="text-left">
                      <span className="text-[0.8125rem] block" style={{ ...bodyFont, color: "#F4EDE4" }}>
                        {selectedChef.courseTitle} — {selectedChef.signatureDish}
                      </span>
                      <span className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.4)" }}>
                        {selectedChef.state ? `${selectedChef.city}, ${selectedChef.state}` : selectedChef.city} · Year {selectedChef.year}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="mb-1" style={{ ...headingFont, fontSize: "1.5rem", color: "#F4EDE4" }}>
                    Set up your profile
                  </h1>
                  <p className="text-[0.8125rem]" style={{ ...bodyFont, color: "rgba(244,237,228,0.45)" }}>
                    This identifies you across the event hub.
                  </p>
                </>
              )}
            </div>

            <div className="rounded-2xl p-6"
              style={{
                backgroundColor: "rgba(244,237,228,0.035)",
                border: "1px solid rgba(201,169,110,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <form onSubmit={handleCreateProfile} className="space-y-5">
                {/* Display name */}
                <div>
                  <label className="block text-[0.8125rem] mb-1.5" style={{ ...bodyFont, color: "#F4EDE4" }}>
                    Display name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={selectedChef ? `Chef ${selectedChef.name}` : "First name or preferred name"}
                      autoFocus
                      className="w-full h-11 px-4 pr-10 rounded-xl text-[0.9375rem] placeholder:opacity-35 outline-none"
                      style={{
                        ...bodyFont,
                        backgroundColor: "rgba(244,237,228,0.04)",
                        color: "#F4EDE4",
                        border: displayName.trim().length >= 2
                          ? "1.5px solid rgba(126,158,120,0.4)"
                          : "1.5px solid rgba(201,169,110,0.15)",
                        boxShadow: displayName.trim().length >= 2
                          ? "0 0 0 3px rgba(126,158,120,0.06)"
                          : "0 0 0 3px rgba(201,169,110,0.04)",
                      }}
                    />
                    {displayName.trim().length >= 2 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 className="w-4 h-4" style={{ color: "#7E9E78" }} />
                      </div>
                    )}
                  </div>
                  {selectedChef ? (
                    <p className="text-[0.6875rem] mt-1" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>
                      Pre-filled from chef directory — feel free to adjust
                    </p>
                  ) : displayName.trim().length === 1 ? (
                    <p className="text-[0.6875rem] mt-1" style={{ ...bodyFont, color: "rgba(201,169,110,0.6)" }}>
                      Name should be at least 2 characters.
                    </p>
                  ) : null}
                </div>

                {/* Avatar selection */}
                <div>
                  <label className="block text-[0.8125rem] mb-2" style={{ ...bodyFont, color: "#F4EDE4" }}>
                    Choose your avatar
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {avatarOptions.map((av) => (
                      <motion.button
                        key={av.id}
                        type="button"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedAvatar(av.id)}
                        className="relative w-full aspect-square rounded-xl flex items-center justify-center text-xl cursor-pointer"
                        style={{
                          backgroundColor: av.bg,
                          boxShadow: selectedAvatar === av.id
                            ? "0 0 0 2px #C9A96E, 0 0 0 4px rgba(201,169,110,0.2)"
                            : "none",
                        }}
                        title={av.label}
                      >
                        {av.emoji}
                        {selectedAvatar === av.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: "#C9A96E" }}
                          >
                            <Check className="w-2.5 h-2.5" style={{ color: "#1E2019" }} />
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                  {selectedChef && (
                    <p className="text-[0.6875rem] mt-1.5" style={{ ...bodyFont, color: "rgba(244,237,228,0.3)" }}>
                      We've suggested an avatar — pick any one you like
                    </p>
                  )}
                </div>

                {/* Role display */}
                {resolvedRole && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[0.8125rem]"
                    style={{
                      ...bodyFont,
                      backgroundColor: resolvedRole === "leadership"
                        ? "rgba(201,169,110,0.06)"
                        : resolvedRole === "team"
                          ? "rgba(139,150,196,0.06)"
                          : "rgba(126,158,120,0.06)",
                      border: resolvedRole === "leadership"
                        ? "1px solid rgba(201,169,110,0.15)"
                        : resolvedRole === "team"
                          ? "1px solid rgba(139,150,196,0.15)"
                          : "1px solid rgba(126,158,120,0.15)",
                      color: resolvedRole === "leadership"
                        ? "#C9A96E"
                        : resolvedRole === "team"
                          ? "#8B96C4"
                          : "#7E9E78",
                    }}
                  >
                    Role: {resolvedRole === "leadership" ? "Leadership" : resolvedRole === "team" ? "Team Member" : selectedChef ? `Chef — ${selectedChef.courseTitle}` : "Chef / Team"}
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={!displayName.trim() || creating}
                  whileHover={creating ? {} : { scale: 1.02 }}
                  whileTap={creating ? {} : { scale: 0.98 }}
                  className="w-full h-12 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    ...bodyFont,
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    background: "linear-gradient(135deg, #C9A96E 0%, #B8944F 100%)",
                    color: "#1E2019",
                    boxShadow: "0 4px 16px rgba(201,169,110,0.25), 0 0 0 1px rgba(201,169,110,0.3) inset",
                  }}
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating profile
                    </span>
                  ) : (
                    "Continue"
                  )}
                </motion.button>
              </form>
            </div>

            {/* Back */}
            <button
              onClick={goBack}
              className="mt-4 mx-auto flex items-center gap-1.5 text-[0.8125rem] cursor-pointer"
              style={{ ...bodyFont, color: "rgba(244,237,228,0.35)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {selectedChef ? "Back to chef selection" : "Back to access code"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {loading && step !== "code" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
            style={{ backgroundColor: "rgba(30,32,25,0.7)" }}
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#C9A96E" }} />
              <span className="text-[0.875rem]" style={{ ...bodyFont, color: "#F4EDE4" }}>Signing in</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}