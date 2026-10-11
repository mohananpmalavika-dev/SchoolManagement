'use client';

import React from 'react';

interface SchoolCrestLogoProps {
  className?: string;
  size?: number;
  variant?: 'full' | 'emblem-only' | 'monochrome';
}

export function SchoolCrestLogo({
  className = '',
  size = 64,
  variant = 'full',
}: SchoolCrestLogoProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center relative select-none ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
          <linearGradient id="crestBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
          <linearGradient id="crestRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>
        </defs>

        {/* Outer Laurel Leaves */}
        <g stroke="url(#crestGold)" strokeWidth="2.5" strokeLinecap="round" opacity="0.85">
          {/* Left Laurel */}
          <path d="M45 130 C30 110 32 75 52 50 C48 65 52 85 64 98" fill="none" />
          <path d="M35 110 C25 95 30 75 42 65" />
          <path d="M40 85 C32 70 42 55 55 48" />
          {/* Right Laurel */}
          <path d="M155 130 C170 110 168 75 148 50 C152 65 148 85 136 98" fill="none" />
          <path d="M165 110 C175 95 170 75 158 65" />
          <path d="M160 85 C168 70 158 55 145 48" />
        </g>

        {/* Shield Outer Ring */}
        <path
          d="M100 24 L142 42 C142 98 128 142 100 160 C72 142 58 98 58 42 L100 24 Z"
          fill="url(#crestBlue)"
          stroke="url(#crestGold)"
          strokeWidth="4"
        />

        {/* Shield Inner Inset */}
        <path
          d="M100 32 L134 47 C134 94 122 132 100 148 C78 132 66 94 66 47 L100 32 Z"
          fill="#1E293B"
          stroke="#FDE68A"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Shield Cross Dividing Lines */}
        <line x1="100" y1="35" x2="100" y2="145" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="68" y1="85" x2="132" y2="85" stroke="#D97706" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* Top Center: Star of Wisdom */}
        <polygon
          points="100,42 103,49 110,50 105,55 106,62 100,58 94,62 95,55 90,50 97,49"
          fill="#FBBF24"
        />

        {/* Left Upper: Open Book of Knowledge */}
        <g transform="translate(74, 58) scale(0.65)">
          <path
            d="M5 22 Q15 16 25 20 Q35 16 45 22 L45 35 Q35 29 25 33 Q15 29 5 35 Z"
            fill="#FEF3C7"
            stroke="#92400E"
            strokeWidth="1.5"
          />
          <line x1="25" y1="20" x2="25" y2="33" stroke="#92400E" strokeWidth="1.5" />
        </g>

        {/* Right Upper: Burning Torch / Flame of Enlightenment */}
        <g transform="translate(112, 58) scale(0.7)">
          <path d="M12 25 L16 35 L8 35 Z" fill="#D97706" />
          <path d="M12 14 C16 18 16 22 12 25 C8 22 8 18 12 14 Z" fill="#F59E0B" />
          <path d="M12 17 C14 19 14 21 12 23 C10 21 10 19 12 17 Z" fill="#FEF3C7" />
        </g>

        {/* Lower Center: Academic Atom / Gear of Innovation */}
        <g transform="translate(100, 115) scale(0.7)">
          <circle cx="0" cy="0" r="4" fill="#FBBF24" />
          <ellipse cx="0" cy="0" rx="14" ry="5" fill="none" stroke="#FDE68A" strokeWidth="1.2" transform="rotate(30)" />
          <ellipse cx="0" cy="0" rx="14" ry="5" fill="none" stroke="#FDE68A" strokeWidth="1.2" transform="rotate(-30)" />
        </g>

        {/* Bottom Banner / Ribbon */}
        <g>
          <path
            d="M48 162 L65 152 L135 152 L152 162 L142 172 L100 166 L58 172 Z"
            fill="url(#crestRibbon)"
            stroke="#78350F"
            strokeWidth="1"
          />
          <text
            x="100"
            y="163"
            fontSize="8"
            fontWeight="bold"
            fontFamily="serif"
            fill="#FFFFFF"
            textAnchor="middle"
            letterSpacing="1"
          >
            VERITAS • VIRTUS
          </text>
        </g>
      </svg>
    </div>
  );
}
