import React from 'react';

/**
 * Inline SVG icon set for BankReadyDocs.
 * All icons are 24x24, use `currentColor` so color is controlled by parent
 * text color (or the `color` style/className), and accept a `size` prop.
 */

export type IconName =
  | 'bank'
  | 'shield-check'
  | 'lock'
  | 'verified'
  | 'medal'
  | 'arrow-right'
  | 'check-circle'
  | 'user-id'
  | 'dollar'
  | 'wallet'
  | 'home'
  | 'globe'
  | 'doc-add'
  | 'chart'
  | 'doc-text'
  | 'trophy'
  | 'arrow-right-line';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number | string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  // Bank — three columns with a triangular pediment + base
  bank: (
    <>
      <path d="M12 2L2 7v2h20V7L12 2z" />
      <path d="M4 10v8H3v2h18v-2h-1v-8h-2v8h-3v-8h-2v8h-2v-8H9v8H6v-8H4z" />
    </>
  ),

  // Shield with check
  'shield-check': (
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1.5 16L6 12.5l1.41-1.41L10.5 14.17l6.09-6.09L18 9.5 10.5 17z" />
  ),

  // Lock with keyhole
  lock: (
    <path d="M12 1a5 5 0 0 0-5 5v3H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v3H9V6a3 3 0 0 1 3-3zm0 11a2 2 0 0 1 1 3.73V19h-2v-1.27A2 2 0 0 1 12 14z" />
  ),

  // Verified seal — starburst circle with check
  verified: (
    <path d="M12 1l2.4 2.4L18 2.6l1.4 3.6L23 7v3.6l-1.6 3 1.6 3v3.6l-3.6.8L18 21.4l-3.6-.8L12 23l-2.4-2.4L6 21.4l-1.4-3.6L1 17v-3.6l1.6-3L1 7.4V3.8l3.6-.8L6 1.6l3.6.8L12 1zm-1.5 14L17 8.5 15.6 7l-5.1 5.1L8 9.6 6.6 11l3.9 4z" />
  ),

  // Medal / ribbons-star
  medal: (
    <path d="M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm-3 11.18-2.5 6 3.5-1.5 2 1.5-3-6zm6 0-3 6 2-1.5 3.5 1.5-2.5-6z" />
  ),

  // Trophy — for "approved-ready" step
  trophy: (
    <path d="M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4h.4a6 6 0 0 0 4.6 3.92V19H8v2h8v-2h-4v-2.08A6 6 0 0 0 16.6 13H17a4 4 0 0 0 4-4V7a2 2 0 0 0-2-2zM5 9V7h2v4a2 2 0 0 1-2-2zm14 0a2 2 0 0 1-2 2V7h2v2z" />
  ),

  // Arrow right (filled / bold)
  'arrow-right': (
    <path d="M12.59 4.59 14 6l6 6-6 6-1.41-1.41L16.17 13H4v-2h12.17l-3.58-3.41z" />
  ),

  // Arrow right (line / linear)
  'arrow-right-line': (
    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  ),

  // Check inside circle (filled)
  'check-circle': (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1 14.41-4.7-4.7L7.7 10.3 11 13.59l5.3-5.3 1.4 1.42L11 16.41z" />
  ),

  // User ID card — credit profile
  'user-id': (
    <path d="M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM8 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm6 11H2v-1c0-2 4-3.1 6-3.1S14 15 14 17v1zm7-2h-6v-2h6v2zm0-3h-6v-2h6v2zm0-3h-6V8h6v2z" />
  ),

  // Dollar minimalistic — cash flow
  dollar: (
    <path d="M11 2v2.07A6 6 0 0 0 6 10c0 3.31 2.69 5 6 5 2.21 0 4 .9 4 3s-1.79 3-4 3-4-.9-4-3H6c0 2.97 2.16 5.43 5 5.93V26h2v-2.07c2.84-.5 5-2.96 5-5.93 0-3.31-2.69-5-6-5-2.21 0-4-.9-4-3s1.79-3 4-3 4 .9 4 3h2c0-2.97-2.16-5.43-5-5.93V2h-2z" />
  ),

  // Wallet — financial position
  wallet: (
    <path d="M21 7H5a1 1 0 0 1 0-2h15V3H5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm-3 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  ),

  // Home — assets / collateral
  home: (
    <path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3z" />
  ),

  // Globe — business environment
  globe: (
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.07 0 2.18 1.95 2.74 5H9.26C9.82 5.95 10.93 4 12 4zM4.26 14a8.13 8.13 0 0 1 0-4h3.04c-.07.66-.11 1.32-.11 2s.04 1.34.11 2H4.26zm.82 2h2.5c.31 1.31.78 2.51 1.4 3.55A8.04 8.04 0 0 1 5.08 16zm2.5-8h-2.5a8.04 8.04 0 0 1 3.9-3.55C7.86 5.49 7.39 6.69 7.08 8zM9 14c-.08-.66-.13-1.32-.13-2s.05-1.34.13-2h6c.08.66.13 1.32.13 2s-.05 1.34-.13 2H9zm.74 6c-1.07 0-2.18-1.95-2.74-5h5.48c-.56 3.05-1.67 5-2.74 5zm5.18-.45c.62-1.04 1.09-2.24 1.4-3.55h2.5a8.04 8.04 0 0 1-3.9 3.55zM16.7 14c.07-.66.11-1.32.11-2s-.04-1.34-.11-2h3.04a8.13 8.13 0 0 1 0 4H16.7zm-.38-6c-.31-1.31-.78-2.51-1.4-3.55A8.04 8.04 0 0 1 18.92 8h-2.6z" />
  ),

  // Document with plus — step 1 "tell us your story"
  'doc-add': (
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 16h-2v-3H8v-2h3v-3h2v3h3v2h-3v3zm0-9V3.5L18.5 9H13z" />
  ),

  // Bar chart in square — step 2 "see your score"
  chart: (
    <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM9 17H7v-5h2v5zm4 0h-2V7h2v10zm4 0h-2v-7h2v7z" />
  ),

  // Document with text lines — step 3 "get bank-formatted docs"
  'doc-text': (
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  ),
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, ...rest }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...rest}
  >
    {PATHS[name]}
  </svg>
);

export default Icon;
