"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  id?: string;
  label: string;
  labelRight?: ReactNode;
};

export function PasswordField({
  id,
  label,
  labelRight,
  name = "password",
  className,
  ...inputProps
}: PasswordFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {labelRight ? (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="label mb-0" htmlFor={fieldId}>
            {label}
          </label>
          {labelRight}
        </div>
      ) : (
        <label className="label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          {...inputProps}
          id={fieldId}
          name={name}
          type={visible ? "text" : "password"}
          className={["field pr-12", className].filter(Boolean).join(" ")}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-mute transition hover:text-ink"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M9.4 5.1A10.4 10.4 0 0 1 12 5c6 0 9.5 7 9.5 7a17.5 17.5 0 0 1-3.2 3.9M6.2 6.3C3.9 8 2.5 12 2.5 12s3.5 7 9.5 7c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
