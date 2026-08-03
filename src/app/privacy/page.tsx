import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "Privacy Policy | Graveyard",
};

export default function PrivacyPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Privacy Policy" updated="3 August 2026">
      <LegalSection title="Who we are">
        <p>
          Graveyard (“we”, “us”) is a digital awards platform for rejected, shelved, and
          never-produced creative work. This policy explains what we collect and how we use it.
        </p>
      </LegalSection>

      <LegalSection title="What we collect">
        <p>Depending on how you use Graveyard, we may process:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Account details: name, email, password hash, optional agency name and bio</li>
          <li>Profile media: avatar and submission assets you upload</li>
          <li>Activity: votes, event RSVPs, reviews, and submission metadata</li>
          <li>Technical data: session cookies and basic server logs needed to run the service</li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <p>We use this information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create and secure your account</li>
          <li>Run submissions, judging, voting, and public showcase features</li>
          <li>Send essential messages such as email verification and password reset</li>
          <li>Operate events and RSVP lists</li>
          <li>Improve reliability and prevent abuse</li>
        </ul>
        <p>We do not sell your personal data.</p>
      </LegalSection>

      <LegalSection title="Cookies and sessions">
        <p>
          We use an essential session cookie (<code className="rounded bg-soft px-1.5 py-0.5 text-[13px]">graveyard_session</code>)
          to keep you signed in. See our{" "}
          <a className="font-semibold text-accent underline underline-offset-2" href="/cookies">
            Cookie Policy
          </a>{" "}
          for details.
        </p>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We may share data with infrastructure providers that help us host the product (for
          example email delivery or authentication partners) under contracts that limit their use
          of your information. We may also disclose information if required by law.
        </p>
      </LegalSection>

      <LegalSection title="Retention">
        <p>
          We keep account and submission data while your account is active and as needed to operate
          the awards archive. You can ask us to update or delete account information by contacting
          us.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can update profile details in Settings, request a password reset, or contact us to
          request access or deletion where applicable.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about privacy:{" "}
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
