'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface PrincipalDigitalSignatureProps {
  principalName?: string;
  principalTitle?: string;
  principalDegree?: string;
  issueDate?: string;
  verificationHash?: string;
  showSeal?: boolean;
  sealColor?: 'gold' | 'blue' | 'crimson';
  compact?: boolean;
}

export function PrincipalDigitalSignature({
  principalName = 'Dr. K. R. Nambiar',
  principalTitle = 'Principal & Head of Institution',
  principalDegree = 'M.Sc., M.Ed., Ph.D.',
  issueDate = new Date().toISOString().split('T')[0],
  verificationHash = 'SHA256:VERIFIED-E8291F',
  showSeal = true,
  sealColor = 'blue',
  compact = false,
}: PrincipalDigitalSignatureProps) {
  return (
    <div className="flex items-center justify-between gap-6 select-none">
      {/* Official School Seal / Stamp */}
      {showSeal && (
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg
            viewBox="0 0 140 140"
            className={`${compact ? 'w-20 h-20' : 'w-28 h-28'} drop-shadow-sm transform -rotate-6`}
          >
            <defs>
              <linearGradient id="sealGradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <path
                id="topSealArc"
                d="M 22 70 A 48 48 0 0 1 118 70"
                fill="none"
              />
              <path
                id="bottomSealArc"
                d="M 118 70 A 48 48 0 0 1 22 70"
                fill="none"
              />
            </defs>

            {/* Serrated Outer Border (Stamp effect) */}
            <circle
              cx="70"
              cy="70"
              r="66"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              opacity="0.85"
            />
            {/* Inner Ring */}
            <circle
              cx="70"
              cy="70"
              r="60"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <circle
              cx="70"
              cy="70"
              r="40"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.8"
            />

            {/* Arc Text Top */}
            <text fill="#1E3A8A" fontSize="7.5" fontWeight="bold" letterSpacing="1.2">
              <textPath href="#topSealArc" startOffset="50%" textAnchor="middle">
                KRYPTON PUBLIC SCHOOL
              </textPath>
            </text>

            {/* Arc Text Bottom */}
            <text fill="#1E3A8A" fontSize="7.5" fontWeight="bold" letterSpacing="1.2">
              <textPath href="#bottomSealArc" startOffset="50%" textAnchor="middle">
                ★ OFFICIAL SEAL ★
              </textPath>
            </text>

            {/* Center Emblem in Seal */}
            <g transform="translate(56, 52) scale(0.2)">
              <polygon
                points="70,10 88,46 128,52 99,80 106,120 70,101 34,120 41,80 12,52 52,46"
                fill="#1D4ED8"
                opacity="0.25"
              />
            </g>
            <text
              x="70"
              y="68"
              fill="#1E3A8A"
              fontSize="7"
              fontWeight="900"
              textAnchor="middle"
              letterSpacing="0.8"
            >
              AFFILIATED
            </text>
            <text
              x="70"
              y="78"
              fill="#1E3A8A"
              fontSize="6"
              fontWeight="bold"
              textAnchor="middle"
            >
              CBSE - 930124
            </text>
          </svg>
        </div>
      )}

      {/* Signature & Cryptographic Stamp */}
      <div className="flex flex-col items-end text-right">
        {/* Vector Stylized Signature */}
        <div className="relative mb-1">
          <svg viewBox="0 0 200 65" className={`${compact ? 'w-32 h-10' : 'w-44 h-14'}`}>
            {/* Artistic dynamic pen stroke */}
            <path
              d="M15 48 C 30 18, 45 10, 60 38 C 70 56, 85 14, 100 24 C 115 34, 130 50, 145 28 C 158 10, 168 45, 185 22"
              fill="none"
              stroke="#0f2b5c"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Signature Underline Flourish */}
            <path
              d="M25 54 C 70 52, 120 54, 175 48 C 185 46, 170 58, 150 56"
              fill="none"
              stroke="#0f2b5c"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            {/* Little initials dot flourish */}
            <circle cx="58" cy="18" r="1.5" fill="#0f2b5c" />
            <circle cx="98" cy="12" r="1.5" fill="#0f2b5c" />
          </svg>

          {/* Cryptographic Digital Signature Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded text-[10px] text-emerald-800 font-mono tracking-tight mt-0.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
            <span>Digitally Verified Sign</span>
          </div>
        </div>

        {/* Principal Name & Credentials */}
        <div className="text-gray-900 font-serif font-bold text-sm tracking-wide">
          {principalName}
        </div>
        <div className="text-gray-600 text-[11px] font-sans">
          {principalDegree}
        </div>
        <div className="text-indigo-950 font-semibold text-xs uppercase tracking-wider">
          {principalTitle}
        </div>

        {/* Digital Signature Hash & Timestamp */}
        <div className="text-[9px] text-gray-400 font-mono mt-1 flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
          <span>Hash: {verificationHash.slice(0, 20)}...</span>
        </div>
      </div>
    </div>
  );
}
