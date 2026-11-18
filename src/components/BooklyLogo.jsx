import React from 'react';

export default function BooklyLogo({ size = 36, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 select-none ${className}`}
      aria-label="Bookly Logo"
    >
      <defs>
        <linearGradient id="booklyLogoBg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="booklyAirTrail" x1="11" y1="39" x2="42" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" />
          <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Rounded Badge Background */}
      <rect width="64" height="64" rx="15" fill="url(#booklyLogoBg)" />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="14"
        stroke="#FFFFFF"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />

      {/* Upper Loop & Spine of Letter "B" */}
      <path
        d="M14 13H29.5C36.8 13 41.5 16.8 41.5 22.5C41.5 26.2 39.2 29.1 35.5 30.5H21.5V20.5H28.8C31.6 20.5 33.4 21.6 33.4 23.5C33.4 25.4 31.6 26.6 28.8 26.6H21.5V31.5H14V13Z"
        fill="#FFFFFF"
      />

      {/* Lower Loop & Spine of Letter "B" */}
      <path
        d="M14 35.5H21.5V43.5H29.8C33.1 43.5 35.2 42 35.2 39.7C35.2 37.6 33.4 36.2 30.2 36.2H25.5L32.5 31.8C38.8 32.6 43 36.3 43 41.5C43 47.6 37.8 51 29.8 51H14V35.5Z"
        fill="#FFFFFF"
      />

      {/* Air Stream / Contrail Swooshes Coming Out of the Center of "B" */}
      <path
        d="M11 36.5C19 37 27.5 34.2 37.5 27.8"
        stroke="url(#booklyAirTrail)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M15 40.5C22.5 40.5 30 37.8 39.5 31.8"
        stroke="#38BDF8"
        strokeOpacity="0.75"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      <path
        d="M17 32.5C23 32.5 29 30.2 35.5 25.5"
        stroke="#BAE6FD"
        strokeOpacity="0.7"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Jet Airplane Soaring Out from the Center of "B" */}
      <path
        d="M54.5 16.5C55.6 15.8 56.8 16.9 56 18L47.8 29.5L51.5 40.2L48.2 42.2L41.8 33.2L34.8 37.2L35.2 41.8L32.5 43.2L29.8 36.8L23.5 34.2L26.2 31.5L30.8 32L37.8 27.8L29.2 21.2L32.5 19.2L43.2 23.2L54.5 16.5Z"
        fill="#38BDF8"
      />
      <path
        d="M54.5 16.5C55.2 16.1 56 16.5 55.8 17.2L41.8 33.2L34.8 37.2L35.2 41.8L32.5 43.2L29.8 36.8L37.8 27.8L54.5 16.5Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}
