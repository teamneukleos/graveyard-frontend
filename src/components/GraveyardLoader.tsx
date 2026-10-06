"use client";

export function GraveyardLoader() {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#f4f4f4]">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <div
          className="absolute inset-0 animate-spin rounded-full border border-black/10 border-t-[#ff6a00]"
          style={{ animationDuration: "1s" }}
        />

        <svg
          className="h-14 w-14 text-[#ff6a00]"
          viewBox="0 0 64 80"
          fill="none"
        >
          <path
            d="M32 6c-12 0-20 10-20 24v34c0 2 1.5 3 3 2l5-3 5 3c1.2.7 2.8.7 4 0l5-3 5 3c1.2.7 2.8.7 4 0l5-3 5 3c1.5 1 3 0 3-2V30C51 16 44 6 32 6Z"
            fill="currentColor"
          />
          <circle cx="24" cy="32" r="3" fill="#0a0a0a" />
          <circle cx="40" cy="32" r="3" fill="#0a0a0a" />
        </svg>
      </div>
    </div>
  );
}