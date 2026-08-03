import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "Cookie Policy | Graveyard",
};

export default function CookiesPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Cookie Policy" updated="3 August 2026">
      <LegalSection title="Overview">
        <p>
          Graveyard uses a small number of cookies and similar technologies so the product can
          function. This page explains what we use and why.
        </p>
      </LegalSection>

      <LegalSection title="Essential cookies">
        <p>
          <strong>Session cookie:</strong>{" "}
          <code className="rounded bg-soft px-1.5 py-0.5 text-[13px]">graveyard_session</code>
        </p>
        <p>
          An httpOnly cookie that stores your signed-in session so you can vote, submit work, RSVP,
          and access portals. It is required for authenticated features and is not used for
          advertising.
        </p>
      </LegalSection>

      <LegalSection title="Local storage">
        <p>
          We may store lightweight preferences in your browser (for example whether you have entered
          the homepage intro) so we do not replay the same experience every visit. This stays on
          your device and is not sent as a tracking identifier.
        </p>
      </LegalSection>

      <LegalSection title="Analytics and marketing">
        <p>
          We do not currently set third-party advertising cookies. If we add optional analytics
          later, we will update this policy and provide controls where required.
        </p>
      </LegalSection>

      <LegalSection title="Managing cookies">
        <p>
          You can clear cookies and site data in your browser settings. If you remove the session
          cookie you will be signed out. Blocking essential cookies may prevent login and voting
          from working.
        </p>
      </LegalSection>

      <LegalSection title="More information">
        <p>
          See also our{" "}
          <a className="font-semibold text-accent underline underline-offset-2" href="/privacy">
            Privacy Policy
          </a>
          . Questions:{" "}
          <a
            className="font-semibold text-accent underline underline-offset-2"
            href="mailto:privacy@graveyard.studio"
          >
            privacy@graveyard.studio
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
