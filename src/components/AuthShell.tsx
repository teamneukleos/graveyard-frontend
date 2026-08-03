import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function GoogleAuthButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <a href="/api/auth/google" className="btn btn-outline w-full">
      <GoogleIcon />
      {label}
    </a>
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="product-shell flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-white/92 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-md md:p-10">
        <BrandLogo href="/" size="md" tone="light" className="mb-6" />
        <p className="plot-label">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-2 text-[14px] text-mute">{description}</p> : null}
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 border-t border-line pt-5 text-sm text-mute">{footer}</div> : null}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.2 0 8.6-3.6 8.6-8.7 0-.6-.1-1-.2-1.4H12z"
      />
    </svg>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-ink underline underline-offset-4">
      {children}
    </Link>
  );
}
