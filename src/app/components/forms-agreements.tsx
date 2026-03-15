import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText,
  ClipboardList,
  Scale,
  ExternalLink,
  ChefHat,
  Users,
  UserCheck,
  Handshake,
  Shield,
  ArrowLeft,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = {
  fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif",
};

interface FormItem {
  id: string;
  title: string;
  description: string;
  embedUrl: string;
  icon: typeof FileText;
  color: string;
  audience: string;
}

interface LegalDoc {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: typeof FileText;
  color: string;
  parties: string;
}

const forms: FormItem[] = [
  {
    id: "chef-onboarding",
    title: "Chef Onboarding Form",
    description:
      "Collect travel, dietary, and logistics info from each confirmed chef for event planning.",
    embedUrl:
      "https://docs.google.com/forms/d/e/1EsE6Gmz5PKAvVcTG3GnWyLwngzCx65AEmXr7SYXGplc/viewform?embedded=true",
    icon: ChefHat,
    color: "#C9A96E",
    audience: "Chefs",
  },
  {
    id: "team-feedback",
    title: "Team Feedback Form",
    description:
      "Anonymous feedback channel for team members to share thoughts, concerns, and suggestions.",
    embedUrl:
      "https://docs.google.com/forms/d/e/1aKHuwRWkSvuKZssSnjGM-fLm-Ncr6L1Z5_hhOMXyA-0/viewform?embedded=true",
    icon: Users,
    color: "#5DA06B",
    audience: "All Team",
  },
  {
    id: "team-rsvp",
    title: "Team RSVP Form",
    description:
      "Confirm attendance, roles, and availability for May 22 event night and prep days.",
    embedUrl:
      "https://docs.google.com/forms/d/e/1fAi97LKQVvOBtjxwdCG-Mvpy7nRfFVFHDAWzVZEHFKo/viewform?embedded=true",
    icon: UserCheck,
    color: "#4A7FB5",
    audience: "All Team",
  },
];

const legalDocs: LegalDoc[] = [
  {
    id: "chef-agreement",
    title: "Featured Chef Agreement",
    description:
      "Participation terms, compensation details, IP rights, and responsibilities for featured chefs at Isang Kusina 2026.",
    url: "https://docs.google.com/document/d/1p2lTUEU6oOoAvllQoBSWsHIcuFlVksqaxE7aDFwnLGE/edit",
    icon: ChefHat,
    color: "#C9A96E",
    parties: "Istorya LV x Featured Chef",
  },
  {
    id: "volunteer-waiver",
    title: "Volunteer Waiver & Release",
    description:
      "Liability waiver, safety acknowledgment, and release of claims for all event volunteers and team members.",
    url: "https://docs.google.com/document/d/1xpalF17ElEDC0tQdfcs0dyQCfcPgg8TkVjNLkANlm6c/edit",
    icon: Shield,
    color: "#7E9E78",
    parties: "Istorya LV x Volunteer",
  },
  {
    id: "vendor-agreement",
    title: "Vendor Agreement",
    description:
      "Terms of service, deliverables, payment schedule, and liability provisions for third-party vendors and suppliers.",
    url: "https://docs.google.com/document/d/10gnZ2v0Ls_5Yyf5rjf4c6kbJOv-PUxhY3Hr1LveUo6U/edit",
    icon: Handshake,
    color: "#CDA88A",
    parties: "Istorya LV x Vendor",
  },
];

interface FormsAgreementsProps {
  onNavigate?: (page: string) => void;
}

export function FormsAgreements({ onNavigate }: FormsAgreementsProps) {
  const [activeForm, setActiveForm] = useState<FormItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <ClipboardList
            className="w-6 h-6"
            style={{ color: "#C9A96E" }}
            aria-hidden="true"
          />
          <h1
            className="text-foreground"
            style={{ ...headingFont, fontSize: "1.625rem" }}
          >
            Forms & Agreements
          </h1>
        </div>
        <p
          className="text-muted-foreground text-[0.9375rem] leading-relaxed max-w-2xl"
          style={bodyFont}
        >
          Onboarding forms, team RSVPs, and legal agreements for Isang Kusina
          2026. Forms can be filled out directly below. Legal documents open in
          Google Docs.
        </p>
      </motion.div>

      {/* ===== FORMS SECTION ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-1 h-5 rounded-full"
            style={{ backgroundColor: "#C9A96E" }}
          />
          <h2
            className="text-foreground text-[1.125rem]"
            style={headingFont}
          >
            Forms
          </h2>
          <span
            className="text-[0.6875rem] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(201,169,110,0.1)",
              color: "#C9A96E",
              ...bodyFont,
            }}
          >
            {forms.length} forms
          </span>
        </div>

        {/* Form selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {forms.map((form, idx) => {
            const isActive = activeForm?.id === form.id;
            const FormIcon = form.icon;
            return (
              <motion.button
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.04 }}
                onClick={() => {
                  setActiveForm(isActive ? null : form);
                  setIsFullscreen(false);
                }}
                className="text-left p-4 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? `${form.color}12`
                    : "var(--card)",
                  border: isActive
                    ? `2px solid ${form.color}40`
                    : "1px solid var(--border)",
                  boxShadow: isActive
                    ? `0 0 0 1px ${form.color}15, 0 4px 12px ${form.color}08`
                    : undefined,
                }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${form.color}12`,
                      border: `1px solid ${form.color}20`,
                    }}
                  >
                    <FormIcon
                      className="w-4.5 h-4.5"
                      style={{ color: form.color }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-foreground text-[0.875rem] mb-0.5"
                      style={headingFont}
                    >
                      {form.title}
                    </h3>
                    <p
                      className="text-muted-foreground text-[0.6875rem] leading-relaxed line-clamp-2"
                      style={bodyFont}
                    >
                      {form.description}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 mt-1.5 text-[0.5625rem] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${form.color}08`,
                        color: form.color,
                        ...bodyFont,
                      }}
                    >
                      {form.audience}
                    </span>
                  </div>
                </div>
                {isActive && (
                  <div
                    className="flex items-center gap-1 mt-2.5 text-[0.6875rem]"
                    style={{ color: form.color, ...bodyFont }}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Currently viewing
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Embedded form iframe */}
        <AnimatePresence mode="wait">
          {activeForm && (
            <motion.div
              key={activeForm.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                className="rounded-xl overflow-hidden"
                style={{
                  border: `1px solid ${activeForm.color}25`,
                  boxShadow: `0 4px 20px ${activeForm.color}08`,
                }}
              >
                {/* Iframe toolbar */}
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{
                    background: `linear-gradient(90deg, ${activeForm.color}0A, ${activeForm.color}05)`,
                    borderBottom: `1px solid ${activeForm.color}15`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = activeForm.icon;
                      return (
                        <Icon
                          className="w-4 h-4"
                          style={{ color: activeForm.color }}
                        />
                      );
                    })()}
                    <span
                      className="text-foreground text-[0.8125rem]"
                      style={headingFont}
                    >
                      {activeForm.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                      aria-label={
                        isFullscreen ? "Exit fullscreen" : "Expand form"
                      }
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-3.5 h-3.5" />
                      ) : (
                        <Maximize2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={activeForm.embedUrl.replace(
                        "?embedded=true",
                        ""
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50 transition-colors"
                      aria-label="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setActiveForm(null);
                        setIsFullscreen(false);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground hover:bg-secondary/50 transition-colors cursor-pointer"
                      aria-label="Close form"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Iframe */}
                <div
                  style={{
                    height: isFullscreen ? "85vh" : "680px",
                    transition: "height 0.3s ease",
                  }}
                >
                  <iframe
                    src={activeForm.embedUrl}
                    width="100%"
                    height="100%"
                    className="border-0"
                    style={{ backgroundColor: "#fff", borderRadius: "0 0 0.75rem 0.75rem" }}
                    title={activeForm.title}
                    loading="lazy"
                    allow="autoplay"
                  >
                    Loading…
                  </iframe>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ===== LEGAL AGREEMENTS SECTION ===== */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div
            className="w-1 h-5 rounded-full"
            style={{ backgroundColor: "#7E9E78" }}
          />
          <h2
            className="text-foreground text-[1.125rem]"
            style={headingFont}
          >
            Legal Agreements
          </h2>
          <span
            className="text-[0.6875rem] px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: "rgba(126,158,120,0.1)",
              color: "#7E9E78",
              ...bodyFont,
            }}
          >
            {legalDocs.length} documents
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {legalDocs.map((doc, idx) => {
            const DocIcon = doc.icon;
            return (
              <motion.a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + idx * 0.04 }}
                className="group block p-5 rounded-xl transition-all duration-200 no-underline"
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                }}
                whileHover={{
                  y: -3,
                  boxShadow: `0 8px 24px rgba(0,0,0,0.06), 0 0 0 1px ${doc.color}20`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${doc.color}0A`,
                      border: `1px solid ${doc.color}18`,
                    }}
                  >
                    <Scale className="w-5 h-5" style={{ color: doc.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="text-foreground text-[0.9375rem]"
                        style={headingFont}
                      >
                        {doc.title}
                      </h3>
                      <ExternalLink
                        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
                        style={{ color: doc.color }}
                      />
                    </div>
                    <p
                      className="text-muted-foreground text-[0.75rem] leading-relaxed mb-2.5"
                      style={bodyFont}
                    >
                      {doc.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span
                        className="inline-flex items-center gap-1 text-[0.5625rem] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${doc.color}08`,
                          color: doc.color,
                          border: `1px solid ${doc.color}12`,
                          ...bodyFont,
                        }}
                      >
                        <DocIcon className="w-2.5 h-2.5" />
                        {doc.parties}
                      </span>
                      <span
                        className="text-[0.5625rem] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(107,127,142,0.06)",
                          color: "#6B7F8E",
                          ...bodyFont,
                        }}
                      >
                        Google Docs
                      </span>
                    </div>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>

        {/* Legal disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 p-3.5 rounded-xl flex items-start gap-3"
          style={{
            backgroundColor: "rgba(107,127,142,0.04)",
            border: "1px solid rgba(107,127,142,0.08)",
          }}
        >
          <Scale
            className="w-4 h-4 shrink-0 mt-0.5"
            style={{ color: "#6B7F8E" }}
          />
          <p
            className="text-[0.6875rem] text-muted-foreground/70 leading-relaxed"
            style={bodyFont}
          >
            All legal documents are maintained in Google Docs by the Istorya
            leadership team. Contact Walbert or Monny for questions about
            specific agreements. Signed copies should be uploaded to the shared
            Google Drive.
          </p>
        </motion.div>
      </motion.section>
    </div>
  );
}
