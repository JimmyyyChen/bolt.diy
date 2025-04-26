import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en/translation.json';
import zhTranslation from './locales/zh/translation.json';

// Custom language detection function
const getUserLanguageFromProfile = () => {
  try {
    const profileData = localStorage.getItem('bolt_user_profile');

    if (profileData) {
      const profile = JSON.parse(profileData);

      if (profile && profile.language) {
        return profile.language;
      }
    }
  } catch (error) {
    console.error('Error getting language from user profile:', error);
  }
  return undefined;
};

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  // init i18next
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
      // order and from where user language should be detected
      order: ['navigator'],

      // cache user language in localStorage
      caches: ['localStorage'],
    },
  });

// Try to get language from user profile
const userLang = getUserLanguageFromProfile();

if (userLang) {
  i18n.changeLanguage(userLang);
}

// Function to change the language
export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);

  // Also update the language in the user profile
  try {
    const userProfile = JSON.parse(localStorage.getItem('bolt_user_profile') || '{}');
    userProfile.language = lng;
    localStorage.setItem('bolt_user_profile', JSON.stringify(userProfile));

    // Update the URL if we're in a browser context
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      const currentPath = url.pathname;

      // If changing to Chinese, add /cn prefix if not already present
      if (lng === 'zh') {
        // Only add /cn if it's not already there
        if (!currentPath.startsWith('/cn')) {
          // Handle root path specially
          const newPath = currentPath === '/' ? '/cn' : `/cn${currentPath}`;
          window.history.replaceState(null, '', newPath + url.search + url.hash);
        }
      }
      // If changing to English, remove /cn prefix
      else if (lng === 'en' && currentPath.startsWith('/cn')) {
        const newPath = currentPath === '/cn' ? '/' : currentPath.substring(3);
        window.history.replaceState(null, '', newPath + url.search + url.hash);
      }
    }
  } catch (error) {
    console.error('Error updating language in user profile:', error);
  }
};

export default i18n;
