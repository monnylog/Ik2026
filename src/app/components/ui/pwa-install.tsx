import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Download, X, Smartphone, Share } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

// Generate a high-quality PWA icon as a data URL
function generateAppIcon(size: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const r = size * 0.1875; // corner radius

  // Rounded rectangle background
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  // Gradient background (deep forest → sage)
  const bg = ctx.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, "#2B4440");
  bg.addColorStop(0.5, "#3D524D");
  bg.addColorStop(1, "#4D6A5E");
  ctx.fillStyle = bg;
  ctx.fill();

  // Subtle inner border glow
  ctx.strokeStyle = "rgba(201,169,110,0.15)";
  ctx.lineWidth = size * 0.01;
  ctx.stroke();

  // Decorative top accent line
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.12);
  ctx.lineTo(size * 0.8, size * 0.12);
  ctx.strokeStyle = "rgba(201,169,110,0.3)";
  ctx.lineWidth = size * 0.008;
  ctx.stroke();

  // "IK" text in gold
  const fontSize = size * 0.38;
  ctx.font = `700 ${fontSize}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Gold gradient for text
  const textGrad = ctx.createLinearGradient(size * 0.3, size * 0.3, size * 0.7, size * 0.65);
  textGrad.addColorStop(0, "#C9A96E");
  textGrad.addColorStop(0.5, "#DDA15E");
  textGrad.addColorStop(1, "#CDA88A");
  ctx.fillStyle = textGrad;
  ctx.fillText("IK", size / 2, size * 0.48);

  // "2026" subtitle
  const subSize = size * 0.1;
  ctx.font = `400 ${subSize}px sans-serif`;
  ctx.fillStyle = "rgba(201,169,110,0.6)";
  ctx.fillText("2026", size / 2, size * 0.72);

  // Bottom accent line
  ctx.beginPath();
  ctx.moveTo(size * 0.3, size * 0.85);
  ctx.lineTo(size * 0.7, size * 0.85);
  ctx.strokeStyle = "rgba(126,158,120,0.4)";
  ctx.lineWidth = size * 0.006;
  ctx.stroke();

  return canvas.toDataURL("image/png");
}

// Inject PWA manifest on mount
export function usePWAManifest() {
  useEffect(() => {
    // Static manifest.json is served from /public and linked in index.html,
    // so PWABuilder / crawlers can access it without auth.
    // Here we only enhance with canvas-generated PNG icons and Apple meta tags.

    // Generate raster icons for better compatibility
    const icon180 = generateAppIcon(180);

    // Apple touch icon (uses the 180px icon — correct Apple HIG size)
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      appleTouchIcon.setAttribute("sizes", "180x180");
      appleTouchIcon.href = icon180;
      document.head.appendChild(appleTouchIcon);
    }

    // Set theme color meta — uses sidebar color for address bar
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = getComputedStyle(document.documentElement).getPropertyValue("--sidebar").trim() || "#3D524D";

    // Set apple-mobile-web-app meta tags
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const appleMeta = document.createElement("meta");
      appleMeta.name = "apple-mobile-web-app-capable";
      appleMeta.content = "yes";
      document.head.appendChild(appleMeta);
    }

    if (!document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')) {
      const appleStatusBar = document.createElement("meta");
      appleStatusBar.name = "apple-mobile-web-app-status-bar-style";
      appleStatusBar.content = "black-translucent";
      document.head.appendChild(appleStatusBar);
    }

    // Apple web app title
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      appleTitle.content = "IK26";
      document.head.appendChild(appleTitle);
    }

    // Ensure viewport meta has viewport-fit=cover for safe areas
    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    if (viewport && !viewport.content.includes("viewport-fit")) {
      viewport.content += ", viewport-fit=cover";
    }

    // ── Apple Touch Startup Images (Splash Screens) ──
    // Dark forest green (#2B4440) background with centered IK26 branding
    // Covers: iPhone 15 Pro Max, 15 Pro, 15/14, 14 Pro Max, SE 3rd gen
    const splashScreens: { w: number; h: number; ratio: number; orient: string }[] = [
      // iPhone 15 Pro Max / 14 Pro Max
      { w: 1290, h: 2796, ratio: 3, orient: "portrait" },
      // iPhone 15 Pro / 14 Pro
      { w: 1179, h: 2556, ratio: 3, orient: "portrait" },
      // iPhone 15 / 14
      { w: 1170, h: 2532, ratio: 3, orient: "portrait" },
      // iPhone 14 Plus / 13 Pro Max
      { w: 1284, h: 2778, ratio: 3, orient: "portrait" },
      // iPhone SE (3rd gen) / iPhone 8
      { w: 750, h: 1334, ratio: 2, orient: "portrait" },
    ];

    splashScreens.forEach(({ w, h, ratio }) => {
      // Check if already injected
      const media = `(device-width: ${w / ratio}px) and (device-height: ${h / ratio}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`;
      if (document.querySelector(`link[media="${media}"]`)) return;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Dark forest green background
      ctx.fillStyle = "#2B4440";
      ctx.fillRect(0, 0, w, h);

      // Subtle radial glow
      const glow = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.6);
      glow.addColorStop(0, "rgba(126,158,120,0.15)");
      glow.addColorStop(1, "rgba(43,68,64,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Gold accent glow
      const goldGlow = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.3);
      goldGlow.addColorStop(0, "rgba(201,169,110,0.06)");
      goldGlow.addColorStop(1, "rgba(43,68,64,0)");
      ctx.fillStyle = goldGlow;
      ctx.fillRect(0, 0, w, h);

      // "IK" text
      const fontSize = w * 0.12;
      ctx.font = `700 ${fontSize}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textGrad = ctx.createLinearGradient(w * 0.35, h * 0.4, w * 0.65, h * 0.48);
      textGrad.addColorStop(0, "#C9A96E");
      textGrad.addColorStop(0.5, "#DDA15E");
      textGrad.addColorStop(1, "#CDA88A");
      ctx.fillStyle = textGrad;
      ctx.fillText("IK", w / 2, h * 0.44);

      // "2026"
      const subSize = w * 0.035;
      ctx.font = `400 ${subSize}px sans-serif`;
      ctx.fillStyle = "rgba(201,169,110,0.5)";
      ctx.fillText("2026", w / 2, h * 0.44 + fontSize * 0.6);

      // Top accent line
      ctx.beginPath();
      ctx.moveTo(w * 0.35, h * 0.44 - fontSize * 0.55);
      ctx.lineTo(w * 0.65, h * 0.44 - fontSize * 0.55);
      ctx.strokeStyle = "rgba(201,169,110,0.2)";
      ctx.lineWidth = ratio;
      ctx.stroke();

      // Bottom branding
      const brandSize = w * 0.018;
      ctx.font = `400 ${brandSize}px sans-serif`;
      ctx.fillStyle = "rgba(192,209,177,0.15)";
      ctx.letterSpacing = "0.2em";
      ctx.fillText("ISTORYA CREATIVE", w / 2, h * 0.88);

      const splashLink = document.createElement("link");
      splashLink.rel = "apple-touch-startup-image";
      splashLink.media = media;
      splashLink.href = canvas.toDataURL("image/png");
      document.head.appendChild(splashLink);
    });

    return () => {
      URL.revokeObjectURL(icon180);
    };
  }, []);
}

// Register service worker for offline caching
export function useServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[SW] Service worker registered:", reg.scope);
        })
        .catch((err) => {
          console.log("[SW] Service worker registration failed:", err);
        });
    }
  }, []);
}

// Detect iOS for special install instructions
function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// Install prompt banner (self-contained — uses localStorage for dismiss state)
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already dismissed via localStorage
    if (localStorage.getItem("ik26-pwa-dismissed") === "true") return;

    // Don't show if already in standalone mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner promptly (3s delay for UX)
      setTimeout(() => setShowBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS Safari (no beforeinstallprompt), show instructions after 8s
    const timer = setTimeout(() => {
      if (!localStorage.getItem("ik26-pwa-dismissed")) {
        setShowBanner(true);
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("ik26-pwa-dismissed", "true");
  };

  if (!showBanner) return null;

  const showIOSInstructions = isIOS() && isSafari() && !deferredPrompt;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
      >
        <div
          className="rounded-2xl p-4 shadow-xl"
          style={{
            backgroundColor: "rgba(61,82,77,0.97)",
            border: "1px solid rgba(201,169,110,0.15)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #2B4440, #4D6A5E)",
                border: "1px solid rgba(201,169,110,0.3)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              <div className="flex flex-col items-center">
                <span style={{ ...headingFont, color: "#C9A96E", fontSize: "0.875rem", lineHeight: 1 }}>IK</span>
                <span style={{ color: "rgba(201,169,110,0.5)", fontSize: "0.4rem", lineHeight: 1 }}>2026</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[0.875rem] mb-0.5" style={{ color: "#F5F0E8", ...bodyFont, fontWeight: 600 }}>
                Add to Home Screen
              </h4>
              <p className="text-[0.75rem] leading-relaxed" style={{ color: "rgba(192,209,177,0.6)", ...bodyFont }}>
                {showIOSInstructions
                  ? "Tap the Share button, then \"Add to Home Screen\" for a custom IK26 app icon."
                  : "Install IK26 on your device for quick access with a custom app icon."}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstall}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.75rem] cursor-pointer min-h-[44px]"
                    style={{
                      background: "linear-gradient(135deg, #C9A96E, #CDA88A)",
                      color: "#FFFDF5",
                      ...bodyFont,
                      fontWeight: 600,
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install App
                  </button>
                ) : showIOSInstructions ? (
                  <span
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[0.6875rem]"
                    style={{
                      backgroundColor: "rgba(201,169,110,0.1)",
                      color: "#C9A96E",
                      border: "1px solid rgba(201,169,110,0.2)",
                      ...bodyFont,
                    }}
                  >
                    <Share className="w-3 h-3" />
                    Tap Share → Add to Home Screen
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem]"
                    style={{
                      backgroundColor: "rgba(201,169,110,0.1)",
                      color: "#C9A96E",
                      border: "1px solid rgba(201,169,110,0.2)",
                      ...bodyFont,
                    }}
                  >
                    <Smartphone className="w-3 h-3" />
                    Use browser menu → Install
                  </span>
                )}
                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  aria-label="Dismiss install banner"
                >
                  <X className="w-3.5 h-3.5" style={{ color: "rgba(192,209,177,0.5)" }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Add to Home Screen Button (for profile settings & onboarding) ── */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installed = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installed);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    canPrompt: !!deferredPrompt,
    isInstalled,
    isIOSSafari: isIOS() && isSafari(),
    promptInstall,
  };
}

export function AddToHomeScreenCard({ compact = false }: { compact?: boolean }) {
  const { canPrompt, isInstalled, isIOSSafari, promptInstall } = useInstallPrompt();

  if (isInstalled) {
    return (
      <div
        className={`rounded-xl flex items-center gap-3 ${compact ? "p-3" : "p-4"}`}
        style={{
          backgroundColor: "rgba(126,158,120,0.06)",
          border: "1px solid rgba(126,158,120,0.15)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: "rgba(126,158,120,0.12)" }}
        >
          <Smartphone className="w-4.5 h-4.5" style={{ color: "#7E9E78" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.8125rem] font-medium" style={{ ...bodyFont, color: "#7E9E78" }}>
            App installed
          </p>
          <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "rgba(126,158,120,0.6)" }}>
            IK26 is on your home screen. You're all set.
          </p>
        </div>
      </div>
    );
  }

  if (isIOSSafari) {
    return (
      <div
        className={`rounded-xl ${compact ? "p-3" : "p-4"}`}
        style={{
          backgroundColor: "rgba(201,169,110,0.06)",
          border: "1px solid rgba(201,169,110,0.15)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #2B4440, #4D6A5E)",
              border: "1px solid rgba(201,169,110,0.25)",
            }}
          >
            <span style={{ ...headingFont, color: "#C9A96E", fontSize: "0.75rem" }}>IK</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-medium mb-1" style={{ ...bodyFont, color: "var(--foreground)" }}>
              Add to Home Screen
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[0.625rem] text-gold shrink-0 font-bold">1</span>
                <p className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
                  Tap the <Share className="inline w-3 h-3 -mt-0.5" style={{ color: "#C9A96E" }} /> <strong>Share</strong> button in Safari
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[0.625rem] text-gold shrink-0 font-bold">2</span>
                <p className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
                  Scroll down, tap <strong>"Add to Home Screen"</strong>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[0.625rem] text-gold shrink-0 font-bold">3</span>
                <p className="text-[0.75rem]" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
                  Tap <strong>"Add"</strong> to confirm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (canPrompt) {
    return (
      <div
        className={`rounded-xl flex items-center gap-3 ${compact ? "p-3" : "p-4"}`}
        style={{
          backgroundColor: "rgba(201,169,110,0.06)",
          border: "1px solid rgba(201,169,110,0.15)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: "linear-gradient(135deg, #2B4440, #4D6A5E)",
            border: "1px solid rgba(201,169,110,0.25)",
          }}
        >
          <span style={{ ...headingFont, color: "#C9A96E", fontSize: "0.75rem" }}>IK</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.8125rem] font-medium" style={{ ...bodyFont, color: "var(--foreground)" }}>
            Add to Home Screen
          </p>
          <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
            Quick access with a custom IK26 icon on your device.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={promptInstall}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[0.75rem] font-semibold cursor-pointer shrink-0 min-h-[44px]"
          style={{
            background: "linear-gradient(135deg, #C9A96E, #CDA88A)",
            color: "#FFFDF5",
            ...bodyFont,
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Install
        </motion.button>
      </div>
    );
  }

  // Desktop or unsupported — show generic instructions
  return (
    <div
      className={`rounded-xl flex items-center gap-3 ${compact ? "p-3" : "p-4"}`}
      style={{
        backgroundColor: "rgba(201,169,110,0.04)",
        border: "1px solid rgba(201,169,110,0.1)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #2B4440, #4D6A5E)",
          border: "1px solid rgba(201,169,110,0.2)",
        }}
      >
        <span style={{ ...headingFont, color: "#C9A96E", fontSize: "0.75rem" }}>IK</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.8125rem] font-medium" style={{ ...bodyFont, color: "var(--foreground)" }}>
          Add to Home Screen
        </p>
        <p className="text-[0.6875rem]" style={{ ...bodyFont, color: "var(--muted-foreground)" }}>
          Use your browser menu to install IK26 as an app on your device.
        </p>
      </div>
      <Smartphone className="w-4 h-4 shrink-0" style={{ color: "rgba(201,169,110,0.4)" }} />
    </div>
  );
}