import { motion, AnimatePresence } from "motion/react";
import { LogOut, X, Heart } from "lucide-react";
import { useFocusTrap } from "../../lib/use-focus-trap";
import { useEffect, useCallback } from "react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface SignOutDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  displayName?: string;
}

export function SignOutDialog({ open, onConfirm, onCancel, displayName }: SignOutDialogProps) {
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  // Escape key to close
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && open) onCancel();
  }, [open, onCancel]);
  useEffect(() => {
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [handleEsc]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={onCancel}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="signout-title"
          aria-describedby="signout-desc"
          ref={trapRef}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(40,54,24,0.4)", backdropFilter: "blur(6px)" }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Warm header illustration */}
            <div
              className="relative flex flex-col items-center pt-8 pb-5 px-6"
              style={{
                background: "linear-gradient(180deg, rgba(201,169,110,0.06) 0%, transparent 100%)",
              }}
            >
              <button
                onClick={onCancel}
                className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors cursor-pointer"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {/* Animated farewell icon */}
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: "rgba(205,168,138,0.1)",
                  border: "1px solid rgba(205,168,138,0.15)",
                }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  {/* Waving hand */}
                  <text x="4" y="22" fontSize="20">👋</text>
                </svg>
              </motion.div>

              <h2
                id="signout-title"
                className="text-foreground text-center text-[1.125rem] mb-1.5"
                style={headingFont}
              >
                Leaving so soon{displayName ? `, ${displayName}` : ""}?
              </h2>
              <p
                id="signout-desc"
                className="text-muted-foreground text-center text-[0.8125rem] leading-relaxed max-w-[18rem]"
                style={bodyFont}
              >
                You'll be signed out and returned to the welcome screen. Your data will be saved.
              </p>
            </div>

            {/* Actions */}
            <div
              className="flex gap-2.5 px-6 py-4"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl text-[0.8125rem] text-foreground cursor-pointer"
                style={{ backgroundColor: "rgba(221,161,94,0.15)", ...bodyFont }}
              >
                Stay
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-[0.8125rem] text-white cursor-pointer"
                style={{
                  backgroundColor: "rgba(164,90,70,0.9)",
                  ...bodyFont,
                }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </motion.button>
            </div>

            {/* Warm footer */}
            <div
              className="flex items-center justify-center gap-1.5 py-2.5"
              style={{ backgroundColor: "rgba(201,169,110,0.04)" }}
            >
              <Heart className="w-3 h-3" style={{ color: "#C9A96E", opacity: 0.5 }} />
              <span className="text-[0.625rem]" style={{ color: "#C9A96E", opacity: 0.5, ...bodyFont }}>
                Salamat po — see you soon!
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}