export function formatWon(amount: number | bigint, language: string) {
  if (language === 'ko') return `${amount.toLocaleString('ko-KR')}원`
  return new Intl.NumberFormat(language, {
    style: 'currency', currency: 'KRW', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMonth(date: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric', month: 'long',
  }).format(new Date(`${date}-01T00:00:00`))
}

export function formatDate(date: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
