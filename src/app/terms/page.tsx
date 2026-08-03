import { LegalDoc, LegalSection } from "@/components/LegalDoc";

export const metadata = {
  title: "Terms of Use | Graveyard",
};

export default function TermsPage() {
  return (
    <LegalDoc eyebrow="Legal" title="Terms of Use" updated="3 August 2026">
      <LegalSection title="Agreement">
        <p>
          By accessing or using Graveyard, you agree to these Terms of Use. If you do not agree, do
          not use the service.
        </p>
      </LegalSection>

      <LegalSection title="The service">
        <p>
          Graveyard is a platform for submitting, reviewing, voting on, and showcasing creative work
          that never went live. Features may change as we improve the product.
        </p>
      </LegalSection>

      <LegalSection title="Accounts">
        <p>
          You must provide accurate registration details and keep your login secure. You are
          responsible for activity under your account. We may suspend accounts that abuse the
          platform or break these terms.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You retain ownership of work you submit. By uploading, you grant Graveyard a worldwide,
          non-exclusive license to host, display, and promote that work on the platform (including
          showcase, leaderboards, and marketing of the awards) for as long as it remains published
          or necessary to operate the service.
        </p>
        <p>
          You confirm you have the rights to submit the work and that it does not infringe others’
          rights or contain unlawful material.
        </p>
      </LegalSection>

      <LegalSection title="Community rules">
        <ul className="list-disc space-y-1 pl-5">
          <li>Do not manipulate votes or reviews</li>
          <li>Do not upload malware or attempt to disrupt the service</li>
          <li>Do not harass other users or misuse judge/admin tools</li>
          <li>Respect event capacity and RSVP etiquette</li>
        </ul>
      </LegalSection>

      <LegalSection title="Awards and decisions">
        <p>
          Public votes and industry reviews inform outcomes, but Graveyard and its organizers may
          make final publishing and award decisions. Awards recognition does not create employment,
          partnership, or payment obligations unless separately agreed in writing.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          The service is provided “as is”. To the fullest extent permitted by law, we disclaim
          warranties of uninterrupted availability, fitness for a particular purpose, and
          non-infringement. We are not liable for indirect or consequential losses arising from use
          of Graveyard.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these terms. Continued use after changes means you accept the revised
          terms. Material updates will be reflected by the “Last updated” date on this page.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Legal questions:{" "}
          <a
            className="font-semibold text-accent underline underline-offset-2"
            href="mailto:legal@graveyard.studio"
          >
            legal@graveyard.studio
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
