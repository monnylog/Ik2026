import { motion } from "motion/react";

const bodyFont = { fontFamily: "'Civil', 'Inter', sans-serif" };
const headingFont = { fontFamily: "'Steiner', 'Degular', 'Maragsa', 'Playfair Display', serif" };

type IllustrationVariant =
  | "submissions"
  | "timeline"
  | "roster"
  | "chat"
  | "activity"
  | "tasks"
  | "travel"
  | "budget"
  | "generic";

interface EmptyStateProps {
  variant?: IllustrationVariant;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

function Illustration({ variant }: { variant: IllustrationVariant }) {
  const size = 80;
  const illustrations: Record<IllustrationVariant, React.ReactNode> = {
    submissions: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="16" y="12" width="48" height="56" rx="6" fill="#EDE7DB" stroke="#CDA88A" strokeWidth="1.5" />
        <rect x="24" y="24" width="20" height="2" rx="1" fill="#CDA88A" opacity="0.6" />
        <rect x="24" y="30" width="32" height="2" rx="1" fill="#CDA88A" opacity="0.4" />
        <rect x="24" y="36" width="28" height="2" rx="1" fill="#CDA88A" opacity="0.3" />
        <circle cx="58" cy="54" r="12" fill="#7E9E78" opacity="0.15" />
        <path d="M54 54h8M58 50v8" stroke="#7E9E78" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    timeline: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <line x1="24" y1="16" x2="24" y2="64" stroke="#CDA88A" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="24" cy="20" r="4" fill="#7E9E78" opacity="0.3" />
        <circle cx="24" cy="36" r="4" fill="#7E9E78" opacity="0.2" />
        <circle cx="24" cy="52" r="4" fill="#7E9E78" opacity="0.15" />
        <rect x="34" y="16" width="30" height="8" rx="4" fill="#EDE7DB" />
        <rect x="34" y="32" width="24" height="8" rx="4" fill="#EDE7DB" />
        <rect x="34" y="48" width="28" height="8" rx="4" fill="#EDE7DB" />
        <circle cx="60" cy="60" r="10" fill="#D4AA7C" opacity="0.15" />
        <path d="M57 60l2.5 2.5L64 57" stroke="#D4AA7C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    roster: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <circle cx="30" cy="28" r="8" fill="#EDE7DB" stroke="#CDA88A" strokeWidth="1.5" />
        <circle cx="50" cy="28" r="8" fill="#EDE7DB" stroke="#7E9E78" strokeWidth="1.5" opacity="0.6" />
        <circle cx="40" cy="48" r="8" fill="#EDE7DB" stroke="#D4AA7C" strokeWidth="1.5" opacity="0.6" />
        <path d="M22 44c0-4 4-7 8-7s8 3 8 7" stroke="#CDA88A" strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M42 44c0-4 4-7 8-7s8 3 8 7" stroke="#7E9E78" strokeWidth="1.5" fill="none" opacity="0.4" />
        <path d="M32 62c0-4 4-7 8-7s8 3 8 7" stroke="#D4AA7C" strokeWidth="1.5" fill="none" opacity="0.4" />
      </svg>
    ),
    chat: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="12" y="16" width="36" height="24" rx="6" fill="#EDE7DB" stroke="#7E9E78" strokeWidth="1.5" />
        <rect x="20" y="24" width="20" height="2" rx="1" fill="#7E9E78" opacity="0.3" />
        <rect x="20" y="30" width="14" height="2" rx="1" fill="#7E9E78" opacity="0.2" />
        <path d="M18 40l-4 6v-6" fill="#EDE7DB" stroke="#7E9E78" strokeWidth="1.5" />
        <rect x="32" y="36" width="36" height="20" rx="6" fill="#FBF8F3" stroke="#CDA88A" strokeWidth="1.5" />
        <rect x="40" y="43" width="20" height="2" rx="1" fill="#CDA88A" opacity="0.3" />
        <rect x="40" y="48" width="12" height="2" rx="1" fill="#CDA88A" opacity="0.2" />
        <path d="M62 56l4 5v-5" fill="#FBF8F3" stroke="#CDA88A" strokeWidth="1.5" />
      </svg>
    ),
    activity: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="24" fill="#EDE7DB" opacity="0.5" />
        <path d="M28 40h8l4-10 8 20 4-10h8" stroke="#7E9E78" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
        <circle cx="40" cy="40" r="3" fill="#D4AA7C" opacity="0.6" />
      </svg>
    ),
    tasks: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <rect x="16" y="16" width="48" height="48" rx="8" fill="#EDE7DB" opacity="0.5" />
        <rect x="26" y="26" width="12" height="12" rx="3" fill="none" stroke="#7E9E78" strokeWidth="1.5" opacity="0.4" />
        <rect x="26" y="44" width="12" height="12" rx="3" fill="none" stroke="#7E9E78" strokeWidth="1.5" opacity="0.3" />
        <rect x="44" y="28" width="14" height="2" rx="1" fill="#CDA88A" opacity="0.4" />
        <rect x="44" y="33" width="10" height="2" rx="1" fill="#CDA88A" opacity="0.3" />
        <rect x="44" y="46" width="14" height="2" rx="1" fill="#CDA88A" opacity="0.3" />
        <rect x="44" y="51" width="10" height="2" rx="1" fill="#CDA88A" opacity="0.2" />
      </svg>
    ),
    travel: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <ellipse cx="40" cy="56" rx="24" ry="6" fill="#EDE7DB" opacity="0.5" />
        <path d="M40 14l-3 8h-8l6.5 5-2.5 8 7-5 7 5-2.5-8 6.5-5h-8z" fill="#D4AA7C" opacity="0.3" stroke="#D4AA7C" strokeWidth="1" />
        <path d="M26 40c0-8 6-14 14-14s14 6 14 14" stroke="#7E9E78" strokeWidth="1.5" strokeDasharray="3 2" fill="none" opacity="0.4" />
        <circle cx="40" cy="44" r="3" fill="#7E9E78" opacity="0.5" />
      </svg>
    ),
    budget: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="22" fill="none" stroke="#EDE7DB" strokeWidth="6" />
        <path d="M40 18a22 22 0 0 1 19 11" stroke="#7E9E78" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
        <path d="M59 29a22 22 0 0 1 3 11" stroke="#D4AA7C" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <circle cx="40" cy="40" r="10" fill="#FBF8F3" />
        <text x="40" y="44" textAnchor="middle" fontSize="12" fill="#7E9E78" fontWeight="600" opacity="0.5">$</text>
      </svg>
    ),
    generic: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="36" r="16" fill="#EDE7DB" opacity="0.5" />
        <path d="M32 60c0-5 4-8 8-8s8 3 8 8" stroke="#CDA88A" strokeWidth="1.5" fill="none" opacity="0.4" />
        <circle cx="40" cy="34" r="6" fill="none" stroke="#7E9E78" strokeWidth="1.5" opacity="0.4" />
        <circle cx="56" cy="52" r="8" fill="#D4AA7C" opacity="0.12" />
        <path d="M53.5 52h5M56 49.5v5" stroke="#D4AA7C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  };

  return <>{illustrations[variant]}</>;
}

export function EmptyState({ variant = "generic", title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-4"
      >
        <Illustration variant={variant} />
      </motion.div>
      <h4
        className="text-foreground text-[0.9375rem] mb-1"
        style={headingFont}
      >
        {title}
      </h4>
      {description && (
        <p
          className="text-muted-foreground text-[0.8125rem] max-w-xs leading-relaxed"
          style={bodyFont}
        >
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 rounded-lg text-[0.8125rem] text-white cursor-pointer transition-all hover:brightness-110"
          style={{
            backgroundColor: "rgba(126,158,120,0.9)",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}