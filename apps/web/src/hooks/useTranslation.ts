import { useLanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';

export function useTranslation() {
  const { language } = useLanguageContext();

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if translation not found
        value = translations.en;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key;
          }
        }
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, language };
}
