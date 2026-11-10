import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import ko from './locales/ko.json'
import en from './locales/en.json'

const storageKey = 'devflowops.language'

function savedLanguage() {
  try {
    return localStorage.getItem(storageKey) === 'en' ? 'en' : 'ko'
  } catch {
    return 'ko'
  }
}

function applyLanguage(language: string) {
  document.documentElement.lang = language
  try {
    localStorage.setItem(storageKey, language)
  } catch {
    // 저장소 접근이 제한되어도 현재 화면의 언어 전환은 유지한다.
  }
}

i18next.on('languageChanged', applyLanguage)

void i18next.use(initReactI18next).init({
  resources: { ko: { translation: ko }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'ko',
  supportedLngs: ['ko', 'en'],
  keySeparator: false,
  nsSeparator: false,
  initAsync: false,
  interpolation: { escapeValue: false },
})

export default i18next
