/** Decorative, local SVG artwork; it does not represent live school metrics. */
export function CampusArtwork({ compact = false }: { compact?: boolean }) {
  return <div className={'campus-artwork' + (compact ? ' compact' : '')} aria-hidden="true">
    <svg viewBox="0 0 520 330" fill="none" focusable="false">
      <circle cx="285" cy="163" r="141" fill="currentColor" opacity=".07" />
      <circle cx="285" cy="163" r="158" stroke="currentColor" opacity=".18" strokeDasharray="4 9" />
      <path d="M68 273H467" stroke="currentColor" opacity=".3" />
      <path d="M117 144L284 65L449 144" stroke="currentColor" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M136 145H431V269H136V145Z" fill="currentColor" opacity=".14" />
      <path d="M253 173H307V269H253V173Z" fill="currentColor" opacity=".3" />
      <path d="M161 168H191V195H161V168ZM210 168H240V195H210V168ZM322 168H352V195H322V168ZM371 168H401V195H371V168ZM161 214H191V241H161V214ZM210 214H240V241H210V214ZM322 214H352V241H322V214ZM371 214H401V241H371V214Z" fill="currentColor" opacity=".5" />
      <circle cx="282" cy="119" r="18" fill="currentColor" opacity=".8" />
      <path d="M282 108V119L291 125" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <path d="M107 269V209M446 269V222" stroke="currentColor" strokeWidth="5" opacity=".5" />
      <ellipse cx="107" cy="202" rx="26" ry="34" fill="currentColor" opacity=".3" />
      <ellipse cx="446" cy="214" rx="23" ry="31" fill="currentColor" opacity=".35" />
      <rect x="45" y="92" width="82" height="66" rx="14" fill="var(--art-card, white)" transform="rotate(-9 45 92)" />
      <path d="M65 113L83 104L103 110L86 120L65 113Z" fill="currentColor" />
      <path d="M72 117V127C84 134 92 129 98 123V115" stroke="currentColor" strokeWidth="3" />
      <rect x="358" y="39" width="89" height="60" rx="14" fill="var(--art-card, white)" transform="rotate(8 358 39)" />
      <path d="M376 59L393 63V83L376 79V59ZM393 63L411 59V79L393 83V63Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="156" cy="49" r="7" fill="#E8AE57" />
      <circle cx="468" cy="130" r="5" fill="#E8AE57" />
      <path d="M75 224H91M83 216V232M329 26H345M337 18V34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".5" />
    </svg>
  </div>;
}
