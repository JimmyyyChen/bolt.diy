import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';

/**
 * Initialize i18next with URL-based language detection
 * The language is determined by the URL path:
 * - If URL starts with /cn, language is set to Chinese
 * - Otherwise, language is set to English
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: enTranslation,
      },
      zh: {
        translation: zhTranslation,
      },
    },
    detection: {
      // Only use URL path detection, no localStorage
      order: ['path'],

      // Look for /cn in the URL path to determine Chinese
      lookupFromPathIndex: 0,

      // Language mapping for path prefixes
      lookupFromPathMap: {
        '/cn': 'zh',
        '/cn/': 'zh',
      },
    } as any,
  });

/**
 * Function to change the language
 * This will update the URL path and navigate to the appropriate language version
 */
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);

  // Don't manipulate URL on server side
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const url = new URL(window.location.href);
    const currentPath = url.pathname;

    // If changing to Chinese, add /cn prefix if not already present
    if (lng === 'zh') {
      if (!currentPath.startsWith('/cn')) {
        // Handle root path specially
        const newPath = currentPath === '/' ? '/cn' : `/cn${currentPath}`;
        window.location.href = newPath + url.search + url.hash;
      }
    }
    // If changing to English, remove /cn prefix
    else if (lng === 'en' && currentPath.startsWith('/cn')) {
      const newPath = currentPath === '/cn' ? '/' : currentPath.substring(3);
      window.location.href = newPath + url.search + url.hash;
    }
  } catch (error) {
    console.error('Error updating language in URL:', error);
  }
};

export default i18n;
