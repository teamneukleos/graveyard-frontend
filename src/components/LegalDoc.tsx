import type { ReactNode } from "react";
import { YardContainer, YardHeader, YardPage } from "@/components/yard/YardPage";

export function LegalDoc({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <YardPage>
      <YardHeader
        narrow
        tone="night"
        eyebrow={eyebrow}
        title={title}
        description={`Last updated ${updated}`}
      />
      <YardContainer narrow>
        <article className="legal-prose yard-card space-y-8 p-6 text-[15px] leading-relaxed text-ink/85 md:p-10">
          {children}
        </article>
      </YardContainer>
    </YardPage>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl tracking-tight text-ink">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
