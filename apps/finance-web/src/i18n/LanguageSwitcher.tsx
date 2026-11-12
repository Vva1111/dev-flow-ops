import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <label className="language-switcher">
      {t('common.language')}
      <select value={i18n.resolvedLanguage} onChange={(event) => { void i18n.changeLanguage(event.target.value) }}>
        <option value="ko" lang="ko">한국어</option>
        <option value="en" lang="en">English</option>
      </select>
    </label>
  )
}
