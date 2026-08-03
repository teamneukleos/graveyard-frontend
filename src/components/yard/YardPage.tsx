import type { ReactNode } from "react";

type YardPageProps = {
  children: ReactNode;
  className?: string;
};

export function YardPage({ children, className = "" }: YardPageProps) {
  return <main className={`product-shell flex-1 ${className}`}>{children}</main>;
}

type YardHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  tone?: "light" | "night";
  actions?: ReactNode;
  narrow?: boolean;
};

export function YardHeader({
  eyebrow,
  title,
  description,
  tone = "light",
  actions,
  narrow,
}: YardHeaderProps) {
  const night = tone === "night";
  return (
    <div className={`border-b border-line ${night ? "bg-night text-white" : "bg-white/85 backdrop-blur-sm"}`}>
      <div
        className={`mx-auto flex flex-wrap items-end justify-between gap-4 px-4 py-8 md:px-6 md:py-10 ${
          narrow ? "max-w-[960px]" : "max-w-[1440px]"
        }`}
      >
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? (
            <p
              className={`plot-label ${night ? "text-white/50" : ""}`}
            >
              {eyebrow}
            </p>
          ) : null}
          <h1
            className={`mt-2 font-display text-[28px] tracking-tight md:text-[36px] ${
              night ? "text-white" : "text-ink"
            }`}
          >
            {title}
          </h1>
          {description ? (
            <p className={`mt-2 max-w-xl text-[14px] leading-relaxed ${night ? "text-white/55" : "text-mute"}`}>
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

type YardContainerProps = {
  children: ReactNode;
  narrow?: boolean;
  className?: string;
};

export function YardContainer({ children, narrow, className = "" }: YardContainerProps) {
  return (
    <div
      className={`mx-auto px-4 py-8 md:px-6 md:py-10 ${
        narrow ? "max-w-[960px]" : "max-w-[1440px]"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function YardCard({
  children,
  className = "",
  soft,
}: {
  children: ReactNode;
  className?: string;
  soft?: boolean;
}) {
  return <div className={`${soft ? "yard-card-soft" : "yard-card"} ${className}`}>{children}</div>;
}

export function YardStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[20px] border px-4 py-5 ${
        accent
          ? "border-accent/30 bg-accent text-white"
          : "border-line bg-white/90 text-ink"
      }`}
    >
      <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${accent ? "text-white/75" : "text-mute"}`}>
        {label}
      </p>
      <p className="font-display mt-2 text-3xl tracking-tight">{value}</p>
    </div>
  );
}

export function YardEmpty({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="yard-empty">
      <div>{children}</div>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
