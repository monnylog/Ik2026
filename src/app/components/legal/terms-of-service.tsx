import { ArrowLeft } from "lucide-react";
import { bodyFont, headingFont } from "../../lib/fonts";

export function TermsOfService() {
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
            Terms of Service
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
            Terms of Service
          </h2>
          <p className="text-[0.875rem] mt-2 leading-relaxed" style={bodyFont}>
            Welcome to Isang Kusina 2026 ("IK26"), an invite-only event coordination platform
            operated by Istorya Creative. By accessing or using IK26, you agree to these terms.
          </p>
        </div>

        <Section title="1. Access & Eligibility">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            IK26 is an invite-only platform. Access requires a valid access code issued by the
            event leadership team. You are responsible for keeping your access code confidential.
            Sharing access codes with unauthorized individuals is prohibited.
          </p>
        </Section>

        <Section title="2. Acceptable Use">
          <p className="text-[0.875rem] leading-relaxed mb-2" style={bodyFont}>
            When using IK26, you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[0.875rem]" style={bodyFont}>
            <li>Provide accurate information in your profile and submissions</li>
            <li>Use the platform respectfully and professionally</li>
            <li>Not attempt to access areas or data beyond your assigned role</li>
            <li>Not use the platform for any purpose other than Isang Kusina 2026 event coordination</li>
            <li>Not reverse engineer, copy, or redistribute any part of the platform</li>
            <li>Respect the privacy and intellectual property of other participants</li>
          </ul>
        </Section>

        <Section title="3. User Content">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            You retain ownership of content you submit (profile information, messages, chef
            submissions, photos). By submitting content, you grant Istorya Creative a limited
            license to use, display, and store it for event coordination purposes. Content
            related to recipe submissions and chef dishes may be used in event marketing
            materials with your consent.
          </p>
        </Section>

        <Section title="4. Intellectual Property">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            The IK26 platform, including its design, branding, code, and content created by
            Istorya Creative, is protected by copyright and intellectual property laws. The
            "Isang Kusina" name, logos, and visual identity are property of Istorya Creative.
          </p>
        </Section>

        <Section title="5. Privacy">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            Your use of IK26 is also governed by our{" "}
            <a
              href="/privacy"
              className="underline"
              style={{ color: "#C9A96E" }}
            >
              Privacy Policy
            </a>
            , which describes how we collect, use, and protect your data.
          </p>
        </Section>

        <Section title="6. Service Availability">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            IK26 is provided "as is" without warranties of any kind. We strive for reliable
            uptime but do not guarantee uninterrupted access. The platform is designed for the
            Isang Kusina 2026 event cycle and may be discontinued after the event concludes.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            To the fullest extent permitted by law, Istorya Creative and the Isang Kusina 2026
            event team shall not be liable for any indirect, incidental, or consequential
            damages arising from your use of IK26. Our total liability is limited to the fees
            paid for access to the platform (which is $0, as IK26 is provided free of charge
            to event participants).
          </p>
        </Section>

        <Section title="8. Account Termination">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            We reserve the right to suspend or terminate access to IK26 at our discretion,
            particularly in cases of misuse, unauthorized sharing of access codes, or violation
            of these terms. You may voluntarily sign out and request data deletion at any time.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            We may update these terms as needed. Changes will be reflected by updating the "Last
            updated" date. Continued use of IK26 after changes constitutes acceptance of the
            updated terms.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            These terms are governed by the laws of the State of Nevada, United States, without
            regard to conflict of law principles.
          </p>
        </Section>

        <Section title="11. Contact">
          <p className="text-[0.875rem] leading-relaxed" style={bodyFont}>
            Questions about these terms? Contact us:
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