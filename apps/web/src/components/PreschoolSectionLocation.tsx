'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

// Kept behind a small Suspense boundary so the surrounding workspace can render normally.
export function PreschoolSectionLocation({ onChange }: { onChange: (section: string | null) => void }) {
  const params = useSearchParams();
  const section = params.get('section');
  useEffect(() => onChange(section), [section, onChange]);
  return null;
}
