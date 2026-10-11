'use client';

import React from 'react';
import { useLanguageContext, Language } from '@/contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export default function LanguageSwitcher({ variant = 'default', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguageContext();

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  ];

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setLanguage(language === 'en' ? 'sw' : 'en')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
        title={language === 'en' ? 'Switch to Kiswahili' : 'Badilisha kwa English'}
      >
        <span className="text-xl">
          {language === 'en' ? '🇬🇧' : '🇰🇪'}
        </span>
        <span className="text-sm font-medium">
          {language === 'en' ? 'EN' : 'SW'}
        </span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
