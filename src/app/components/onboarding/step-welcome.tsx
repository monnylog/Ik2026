import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import type { UserRole } from "./use-auth";
import { useProfile } from "../../lib/profile-context";
import { getConfirmedChef } from "./chef-directory";
import istoryaLogo from "figma:asset/b55bcac066687e563f77685fc31f20ef43e81d5d.png";

interface WelcomeStepProps {
  onNext: () => void;
  role: UserRole;
}

const bodyFont = { fontFamily: "'Inter', sans-serif" };

const roleGreetings: Record<UserRole, string> = {
  leadership: "Welcome back.",
  chef: "Welcome, Chef.",
};

function useTypewriter(text: string, speed = 40, delay = 400) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, speed, delay]);
  return { displayed, done };
}

export function WelcomeStep({ onNext, role }: WelcomeStepProps) {
  const { profile } = useProfile();
  const confirmedChef = profile?.chefDirectoryId ? getConfirmedChef(profile.chefDirectoryId) : null;
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const { displayed: heading, done: headingDone } = useTypewriter(
    "Isang Kusina 2026",
    45,
    400
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const gradientX = 30 + mousePos.x * 40;
  const gradientY = 20 + mousePos.y * 60;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex flex-col items-center justify-center text-center px-8 py-14 overflow-hidden"
    >
      {/* Parallax gradient */}
      <div
        className="absolute inset-0 opacity-40 transition-all duration-700 ease-out pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at ${gradientX}% ${gradientY}%, rgba(96,108,56,0.12) 0%, rgba(96,108,56,0.02) 50%, transparent 80%)`,
        }}
      />

      <motion.div
        animate={{ y: [0, -8, 0], x: [0, 4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-12 right-16 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ backgroundColor: "rgba(96,108,56,0.05)" }}
      />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 180, damping: 14 }}
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 relative"
      >
        <img src={istoryaLogo} alt="Istorya" className="w-16 h-16" width={64} height={64} />
      </motion.div>

      {/* Heading with typewriter */}
      <h1
        className="text-foreground mb-2 relative min-h-[2.8rem]"
        style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif", fontSize: "2rem", lineHeight: 1.2 }}
      >
        {heading.includes("2026") ? (
          <>
            <span className="text-gold">Isang Kusina</span> 2026
          </>
        ) : (
          <>
            {heading}
            <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} className="text-gold">|</motion.span>
          </>
        )}
      </h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={headingDone ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="text-muted-foreground mb-2 text-[0.9375rem]"
        style={bodyFont}
      >
        A Filipino Chefs Collaboration Dinner
      </motion.p>

      {/* Role greeting */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={headingDone ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-gold text-[0.875rem] mb-6"
        style={{ fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif", fontStyle: "italic" }}
      >
        {confirmedChef ? confirmedChef.greeting : roleGreetings[role]}
      </motion.p>

      <motion.div
        initial={{ width: 0 }}
        animate={headingDone ? { width: 48 } : {}}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="h-px mb-6"
        style={{ backgroundColor: "rgba(96,108,56,0.3)" }}
      />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={headingDone ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-muted-foreground max-w-md mx-auto mb-10 text-[0.9375rem] leading-relaxed"
        style={bodyFont}
      >
        This is your coordination hub for IK26. The dashboard includes project
        status, timelines, your profile, and the full team roster. Complete setup
        to proceed.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={headingDone ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.5 }}
        whileHover={{ scale: 1.03, boxShadow: "0 8px 30px rgba(96,108,56,0.25)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="px-8 py-3 rounded-xl bg-gold text-white cursor-pointer relative overflow-hidden"
        style={{ ...bodyFont, fontSize: "0.9375rem" }}
      >
        <span className="relative z-10">Get Started</span>
        <motion.div
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 w-1/3 skew-x-12"
          style={{ background: "linear-gradient(to right, transparent, rgba(255,255,255,0.25), transparent)" }}
        />
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={headingDone ? { opacity: 1 } : {}}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="mt-10 text-muted-foreground/40 text-[0.75rem] tracking-widest uppercase"
        style={bodyFont}
      >
        isangkusina.com
      </motion.p>
    </div>
  );
}