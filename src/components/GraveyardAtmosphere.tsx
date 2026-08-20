"use client";

/** Fixed graveyard atmosphere — mist, plots, and floating wisps. */
export function GraveyardAtmosphere() {
  return (
    <div className="graveyard-atmosphere" aria-hidden="true">
      <div className="ga-lightning" />
      <div className="ga-grain" />
      <div className="ga-mist ga-mist-a" />
      <div className="ga-mist ga-mist-b" />

      <svg className="ga-ghost ga-ghost-1" viewBox="0 0 64 80" fill="none">
        <path
          d="M32 6c-12 0-20 10-20 24v34c0 2 1.5 3 3 2l5-3 5 3c1.2.7 2.8.7 4 0l5-3 5 3c1.2.7 2.8.7 4 0l5-3 5 3c1.5 1 3 0 3-2V30C51 16 44 6 32 6Z"
          fill="currentColor"
        />
        <circle cx="24" cy="32" r="3" fill="#fafafa" />
        <circle cx="40" cy="32" r="3" fill="#fafafa" />
      </svg>

      <svg className="ga-ghost ga-ghost-2" viewBox="0 0 64 80" fill="none">
        <path
          d="M32 8c-11 0-18 9-18 22v32c0 2 1.6 3 3.2 2l4.8-2.8 4.8 2.8c1.2.7 2.8.7 4 0l4.8-2.8 4.8 2.8c1.2.7 2.8.7 4 0l4.8-2.8 4.8 2.8c1.6 1 3.2 0 3.2-2V30C50 17 43 8 32 8Z"
          fill="currentColor"
        />
        <circle cx="25" cy="30" r="2.5" fill="#fafafa" />
        <circle cx="39" cy="30" r="2.5" fill="#fafafa" />
      </svg>

      <svg className="ga-ghost ga-ghost-3" viewBox="0 0 64 80" fill="none">
        <path
          d="M32 10c-10 0-16 8-16 20v30c0 1.8 1.4 2.6 2.8 1.8l4.2-2.4 4.2 2.4c1 .6 2.4.6 3.4 0l4.2-2.4 4.2 2.4c1 .6 2.4.6 3.4 0l4.2-2.4 4.2 2.4c1.4.8 2.8 0 2.8-1.8V30C48 18 42 10 32 10Z"
          fill="currentColor"
        />
        <circle cx="26" cy="28" r="2.2" fill="#fafafa" />
        <circle cx="38" cy="28" r="2.2" fill="#fafafa" />
      </svg>

      <svg className="ga-ghost ga-ghost-4" viewBox="0 0 64 80" fill="none">
        <path
          d="M32 7c-11 0-19 9-19 23v33c0 2 1.5 3 3 2l4.5-2.6 4.5 2.6c1.2.7 2.8.7 4 0l4.5-2.6 4.5 2.6c1.2.7 2.8.7 4 0l4.5-2.6 4.5 2.6c1.5 1 3 0 3-2V30C51 16 43 7 32 7Z"
          fill="currentColor"
        />
        <circle cx="24" cy="31" r="2.8" fill="#fafafa" />
        <circle cx="40" cy="31" r="2.8" fill="#fafafa" />
      </svg>

      <svg className="ga-ghost ga-ghost-5" viewBox="0 0 64 80" fill="none">
        <path
          d="M32 12c-9 0-15 7-15 18v28c0 1.6 1.3 2.4 2.6 1.7l4-2.2 4 2.2c1 .55 2.2.55 3.2 0l4-2.2 4 2.2c1 .55 2.2.55 3.2 0l4-2.2 4 2.2c1.3.7 2.6 0 2.6-1.7V30C47 19 41 12 32 12Z"
          fill="currentColor"
        />
        <circle cx="26" cy="27" r="2" fill="#fafafa" />
        <circle cx="38" cy="27" r="2" fill="#fafafa" />
      </svg>

      <svg className="ga-mid-crosses" viewBox="0 0 1440 120" preserveAspectRatio="xMidYMid meet">
        <g fill="currentColor">
          <path d="M120 40 h5 v50 h-5z M108 55 h29 v5 h-29z" />
          <path d="M380 55 h4 v40 h-4z M370 68 h24 v4 h-24z" />
          <path d="M700 35 h5 v55 h-5z M688 52 h29 v5 h-29z" />
          <path d="M980 48 h4 v45 h-4z M970 62 h24 v4 h-24z" />
          <path d="M1280 42 h5 v48 h-5z M1268 56 h29 v5 h-29z" />
        </g>
      </svg>

      <svg className="ga-plots" viewBox="0 0 1440 180" preserveAspectRatio="xMidYMax meet">
        <path
          d="M0 120 C180 70 320 140 480 100 C640 60 780 130 960 95 C1120 65 1280 110 1440 80 L1440 180 L0 180 Z"
          fill="currentColor"
          opacity="0.45"
        />
        <g fill="currentColor" opacity="0.7">
          <path d="M90 95 h36 v70 h-36z M90 95 a18 18 0 0 1 36 0" />
          <path d="M210 110 h28 v55 h-28z M210 110 a14 14 0 0 1 28 0" />
          <rect x="320" y="105" width="40" height="60" rx="4" />
          <path d="M335 95 h10 v12 h-10z" />
          <path d="M470 100 h32 v65 h-32z M470 100 a16 16 0 0 1 32 0" />
          <path d="M620 115 h24 v50 h-24z M620 115 a12 12 0 0 1 24 0" />
          <rect x="760" y="108" width="36" height="57" rx="3" />
          <path d="M773 98 h10 v12 h-10z" />
          <path d="M900 102 h30 v63 h-30z M900 102 a15 15 0 0 1 30 0" />
          <path d="M1040 112 h26 v53 h-26z M1040 112 a13 13 0 0 1 26 0" />
          <rect x="1180" y="100" width="38" height="65" rx="4" />
          <path d="M1194 90 h10 v12 h-10z" />
          <path d="M1320 108 h28 v57 h-28z M1320 108 a14 14 0 0 1 28 0" />
        </g>
        <g fill="currentColor" opacity="0.55">
          <path d="M160 125 h4 v30 h-4z M152 135 h20 v4 h-20z" />
          <path d="M560 130 h3 v28 h-3z M553 138 h17 v3 h-17z" />
          <path d="M850 128 h3 v26 h-3z M843 136 h17 v3 h-17z" />
          <path d="M1120 122 h4 v32 h-4z M1112 132 h20 v4 h-20z" />
        </g>
      </svg>

      <span className="ga-wisp ga-wisp-1" />
      <span className="ga-wisp ga-wisp-2" />
      <span className="ga-wisp ga-wisp-3" />
      <span className="ga-wisp ga-wisp-4" />
      <span className="ga-wisp ga-wisp-5" />
      <span className="ga-wisp ga-wisp-6" />
    </div>
  );
}
