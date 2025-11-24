// Language Manager - Global language state management

export type SupportedLanguage = 'en' | 'hi' | 'bn' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

const STORAGE_KEY = 'appLanguage';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.some(lang => lang.code === stored)) {
    return stored as SupportedLanguage;
  }
  return DEFAULT_LANGUAGE;
};

// Set language
export const setLanguage = (language: SupportedLanguage): void => {
  localStorage.setItem(STORAGE_KEY, language);
  
  // Dispatch custom event for components to listen
  window.dispatchEvent(new CustomEvent('languageChange', { detail: language }));
};

// Get language name
export const getLanguageName = (code: SupportedLanguage): string => {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.nativeName || 'English';
};

// Language change listener
export const onLanguageChange = (callback: (language: SupportedLanguage) => void): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SupportedLanguage>;
    callback(customEvent.detail);
  };
  
  window.addEventListener('languageChange', handler);
  
  // Return cleanup function
  return () => window.removeEventListener('languageChange', handler);
};
