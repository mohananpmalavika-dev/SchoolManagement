/** Local decorative stickers. They do not represent school activity or achievements. */
export function EnergyArtwork({ compact = false }: { compact?: boolean }) {
  return <div className={'energy-artwork' + (compact ? ' compact' : '')} aria-hidden="true">
    <svg viewBox="0 0 460 270" fill="none" focusable="false">
      <ellipse cx="229" cy="143" rx="183" ry="69" transform="rotate(-19 229 143)" stroke="#211637" strokeWidth="3"/>
      <path d="M98 41L110 69L141 65L123 90L140 116L109 112L95 140L84 110L53 114L72 88L55 63L86 67Z" fill="#FF9EE0" stroke="#211637" strokeWidth="3"/>
      <g transform="rotate(-9 197 142)">
        <rect x="127" y="67" width="139" height="145" rx="34" fill="#211637"/>
        <rect x="120" y="59" width="139" height="145" rx="34" fill="#DEFF7A" stroke="#211637" strokeWidth="3"/>
        <path d="M154 110V125M221 110V125" stroke="#211637" strokeWidth="7" strokeLinecap="round"/>
        <path d="M152 150C171 177 206 177 225 148" stroke="#211637" strokeWidth="6" strokeLinecap="round"/>
      </g>
      <g transform="rotate(12 327 98)">
        <rect x="283" y="43" width="97" height="112" rx="23" fill="#211637"/>
        <rect x="277" y="35" width="97" height="112" rx="23" fill="#A9DFFF" stroke="#211637" strokeWidth="3"/>
        <path d="M330 54L299 94H322L314 129L353 85H330L330 54Z" fill="#7042ED" stroke="#211637" strokeWidth="2" strokeLinejoin="round"/>
      </g>
      <path d="M346 186L354 167L365 184L386 188L370 202L369 223L351 213L331 220L334 198L320 183L346 186Z" fill="#FF9EE0" stroke="#211637" strokeWidth="3"/>
      <path d="M54 172V197M42 184H67M401 109V130M391 120H413" stroke="#DEFF7A" strokeWidth="5" strokeLinecap="round"/>
      <circle cx="101" cy="215" r="10" fill="#A9DFFF" stroke="#211637" strokeWidth="3"/>
      <circle cx="396" cy="50" r="7" fill="#DEFF7A"/>
    </svg>
  </div>;
}
