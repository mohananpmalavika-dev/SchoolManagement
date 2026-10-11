'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeSVGProps {
  value: string;
  size?: number;
  className?: string;
  darkColor?: string;
  lightColor?: string;
  includeMargin?: boolean;
}

export function QRCodeSVG({
  value,
  size = 180,
  className = '',
  darkColor = '#0f172a',
  lightColor = '#ffffff',
  includeMargin = true,
}: QRCodeSVGProps) {
  const [svgString, setSvgString] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toString(value, {
      type: 'svg',
      width: size,
      margin: includeMargin ? 2 : 0,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((svg) => {
        if (isMounted) setSvgString(svg);
      })
      .catch((err) => {
        console.error('QR code generation error', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, darkColor, lightColor, includeMargin]);

  if (!svgString) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-gray-100 rounded-lg animate-pulse ${className}`}
      >
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`inline-block overflow-hidden rounded-lg shadow-sm ${className}`}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  );
}
