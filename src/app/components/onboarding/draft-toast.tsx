import { motion, AnimatePresence } from "motion/react";
import { Save } from "lucide-react";

interface DraftToastProps {
  visible: boolean;
}

export function DraftToast({ visible }: DraftToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 px-3.5 py-2 rounded-lg bg-navy"
          style={{ color: "rgba(96,108,56,0.9)", boxShadow: "0 10px 15px -3px rgba(40,54,24,0.3)", border: "1px solid rgba(96,108,56,0.15)" }}
        >
          <Save className="w-3 h-3" />
          <span
            className="text-[0.75rem]"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Draft saved
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}