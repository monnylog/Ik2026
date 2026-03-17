import { ArrowLeft } from "lucide-react";
import { bodyFont, headingFont } from "../../lib/fonts";

export function PrivacyPolicy() {
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#F4EDE4",
        color: "#3A3D35",
      }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-md"
        style={{
          backgroundColor: "rgba(244,237,228,0.9)",
          borderBottom: "1px solid rgba(201,169,110,0.15)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-[0.8125rem] cursor-pointer min-h-[44px] min-w-[44px] rounded-lg justify-center"
            style={{ ...bodyFont, color: "#C9A96E" }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <h1 style={{ ...headingFont, fontSize: "1.125rem", color: "#3A3D35" }}>
            Privacy Policy
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <p className="text-[0.8125rem] mb-1" style={{ ...bodyFont, color: "rgba(58,61,53,0.5)" }}>
            Last updated: March 11, 2026
          </p>
          <h2 style={{ ...headingFont, fontSize: "1.5rem", color: "#3A3D35" }}>
            Your privacy matters to us
          </h2>
          <p className="text-[0.875rem] mt-2 leading-relaxed" style={bodyFont}>
            Isang Kusina 2026 ("IK26") is an invite-only event coordination hub operated by
            Istorya Creative for the Filipino Chefs Collaboration Dinner on May 22, 2026. This
            policy explains what data we collect, how we use it, and your rights.
          </p>
        </div>

        <Section title="1. Information We Collect">
          <ul className="list-disc pl-5 space-y-2 text-[0.875rem]" style={bodyFont}>
            <li>
              <strong>Profile information:</strong> Display name and avatar selection you provide
              during onboarding. These are stored in our secure database (Supabase) and in your
              browser's localStorage for session persistence.
            </li>
            <li>
              <strong>Access code:</strong> The event access code you enter is used only for
              authentication and role assignment. It is never stored in plain text.
            </li>
            <li>
              <strong>Contact form submissions:</strong> If you submit an inquiry via the public
              landing page, we collect the name, email, organization, and message you provide.
            </li>
            <li>
              <strong>Usage analytics:</strong> We track anonymized page views and feature usage
              (e.g., which pages are visited, button clicks) to improve the event experience.
              No personally identifiable information is included in analytics events.
            </li>
            <li>
              <strong>Device data:</strong> We store preferences (theme, notification settings)
              in your browser's localStorage. No cookies are used for tracking.
            </li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Data">
          <ul className="list-disc pl-5 space-y-2 text-[0.875rem]" style={bodyFont}>
            <li>To authenticate and identify participants within the event hub</li>
            <li>To personalize your dashboard experience based on your role (Chef, Team, Leadership)</li>
            <li>To facilitate team communication and task coordination</li>
            <li>To respond to inquiry form submissions</li>
            <li>To improve the event coordination experience</li>
          </ul>
        </Section>

        <Section title="3. Data Sharing">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            We do <strong>not</strong> sell, rent, or share your personal data with any third parties.
            Your information is only accessible to the Isang Kusina 2026 event leadership team for
            event coordination purposes.
          </p>
        </Section>

        <Section title="4. Data Storage & Security">
          <ul className="list-disc pl-5 space-y-2 text-[0.875rem]" style={bodyFont}>
            <li>
              Profile data is stored securely in Supabase (hosted on AWS) with encryption at rest
              and in transit.
            </li>
            <li>
              Session tokens are stored in your browser's localStorage. Clearing your browser data
              or signing out will remove them.
            </li>
            <li>
              Uploaded files (profile photos, chef submissions) are stored in private Supabase
              Storage buckets accessible only via signed URLs.
            </li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            Your data is retained for the duration of the Isang Kusina 2026 event cycle (through
            December 31, 2026). After this period, all personal data will be deleted unless you
            request earlier deletion. Anonymized analytics may be retained for historical reference.
          </p>
        </Section>

        <Section title="6. Your Rights">
          <ul className="list-disc pl-5 space-y-2 text-[0.875rem]" style={bodyFont}>
            <li>
              <strong>Access & Correction:</strong> You can view and edit your profile information
              at any time through Profile Settings.
            </li>
            <li>
              <strong>Deletion:</strong> You can request deletion of your data by contacting the
              event team. Use "Clear All Data" in Profile Settings to remove local data immediately.
            </li>
            <li>
              <strong>Sign Out:</strong> Signing out removes your session tokens from this device.
            </li>
          </ul>
        </Section>

        <Section title="7. Children's Privacy">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            IK26 is an invite-only professional event hub. We do not knowingly collect data from
            anyone under 18 years of age.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            We may update this policy as needed. Changes will be reflected by updating the "Last
            updated" date at the top. Continued use of IK26 after changes constitutes acceptance
            of the updated policy.
          </p>
        </Section>

        <Section title="9. Contact">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            If you have questions about this Privacy Policy or your data, please contact:
          </p>
          <div
            className="mt-3 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: "rgba(201,169,110,0.06)",
              border: "1px solid rgba(201,169,110,0.15)",
            }}
          >
            <p className="text-[0.875rem] font-medium" style={bodyFont}>
              Istorya Creative — Isang Kusina 2026
            </p>
            <p className="text-[0.8125rem] mt-1" style={{ ...bodyFont, color: "rgba(58,61,53,0.6)" }}>
              Email:{" "}
              <a
                href="mailto:walbert@isangkusina.com"
                className="underline"
                style={{ color: "#C9A96E" }}
              >
                walbert@isangkusina.com
              </a>
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="pt-6 border-t" style={{ borderColor: "rgba(201,169,110,0.12)" }}>
          <p className="text-[0.75rem] text-center" style={{ ...bodyFont, color: "rgba(58,61,53,0.35)" }}>
            &copy; 2026 Istorya Creative. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="px-5 py-4 rounded-xl"
      style={{
        backgroundColor: "rgba(255,255,255,0.5)",
        border: "1px solid rgba(201,169,110,0.08)",
      }}
    >
      <h3
        className="mb-3"
        style={{
          fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif",
          fontSize: "1.0625rem",
          color: "#3A3D35",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}