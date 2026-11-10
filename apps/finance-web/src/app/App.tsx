import { useTranslation } from 'react-i18next'
import type { CSSProperties } from 'react'
import { formatMonth, formatWon } from '../i18n/format'
import { localDate } from '../features/transactions/date'
import { TransactionsPanel } from '../features/transactions/TransactionsPanel'
import { useTransactions } from '../features/transactions/useTransactions'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher'
import './App.css'

export default function App() {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'ko'

  const navigation = [
    { id: 'overview', label: t('한눈에 보기'), icon: '◫' },
    { id: 'transactions', label: t('수입·지출'), icon: '↔' },
    { id: 'assets', label: t('내 자산'), icon: '▤' },
    { id: 'budget', label: t('예산 관리'), icon: '◷' },
    { id: 'goals', label: t('저축 목표'), icon: '⚑' },
  ]

  const budgetCategories = [
    { name: t('식비·카페'), amount: 520000, budget: 700000, color: '#347766' },
    { name: t('쇼핑'), amount: 320000, budget: 400000, color: '#9bb981' },
    { name: t('교통'), amount: 144000, budget: 200000, color: '#e8ba73' },
    { name: t('생활·기타'), amount: 300000, budget: 700000, color: '#b7c8c1' },
  ]

  const accounts = [
    { name: t('입출금·현금'), description: t('매일 사용하는 돈'), amount: 4280000, icon: '₩' },
    { name: t('예금·적금'), description: t('차곡차곡 모으는 돈'), amount: 18000000, icon: '▤' },
    { name: t('투자'), description: t('주식·펀드 등 평가 금액'), amount: 12000000, icon: '↗' },
  ]

  const savingsGoals = [
    { name: t('든든한 비상금'), description: t('예상치 못한 순간을 위한 준비'), saved: 6000000, target: 10000000, date: formatMonth('2027-06', language), icon: '☂', color: 'green' },
    { name: t('다음 여행'), description: t('일상에서 잠시 벗어나는 시간'), saved: 2400000, target: 4000000, date: formatMonth('2027-03', language), icon: '✈', color: 'sand' },
  ]

  const won = (amount: number | bigint) => formatWon(amount, language)
  const sampleExpense = budgetCategories.reduce((sum, category) => sum + category.amount, 0)
  const totalBudget = budgetCategories.reduce((sum, category) => sum + category.budget, 0)
  const totalAssets = accounts.reduce((sum, account) => sum + account.amount, 0)
  const debt = 4000000

  const data = useTransactions()
  const month = localDate().slice(0, 7)
  const monthLabel = formatMonth(month, language)
  const monthTransactions = data.transactions.filter((item) => item.date.startsWith(`${month}-`))
  const income = monthTransactions.reduce((sum, item) => item.type === 'income' ? sum + BigInt(item.amount) : sum, 0n)
  const totalExpense = monthTransactions.reduce((sum, item) => item.type === 'expense' ? sum + BigInt(item.amount) : sum, 0n)
  const categoryTotals = new Map<string, bigint>()
  for (const item of monthTransactions) {
    if (item.type === 'expense') categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0n) + BigInt(item.amount))
  }
  const categories = [...categoryTotals].map(([name, amount], index) => ({
    name, amount, color: budgetCategories[index % budgetCategories.length].color,
  })).sort((a, b) => a.amount === b.amount ? a.name.localeCompare(b.name) : a.amount > b.amount ? -1 : 1)
  let cumulativeExpense = 0n
  const expenseStops: string[] = []
  for (const category of categories) {
    const start = Number(cumulativeExpense) / Number(totalExpense) * 100
    cumulativeExpense += category.amount
    expenseStops.push(`${category.color} ${start}% ${Number(cumulativeExpense) / Number(totalExpense) * 100}%`)
  }
  const totalsReady = data.status === 'ready'

  return (
    <div className="finance-layout">
      <a className="skip-link" href="#main-content">{t('본문으로 바로가기')}</a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label={t('Finance 홈')}>
          <span className="brand-symbol" aria-hidden="true">f<span>·</span></span>
          <span>finance<span className="brand-caption">{t('나를 위한 금융 기록')}</span></span>
        </a>
        <p className="nav-label">{t('나의 금융')}</p>
        <nav className="main-nav" aria-label={t('주 메뉴')}>
          {navigation.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-symbol" aria-hidden="true">✳</span>
          <strong>{t('작은 기록이 만드는 변화')}</strong>
          <p>{t('오늘의 돈을 살펴보고,')}<br />{t('내일의 계획을 만들어 보세요.')}</p>
        </div>
        <div className="sidebar-footer">
          <span className="avatar" aria-hidden="true">{t('나')}</span>
          <div><strong>{t('나의 금융 공간')}</strong><small>{t('개인 금융 관리')}</small></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span>{t('나의 금융')} <span className="breadcrumb-divider">/</span> <strong>{t('대시보드')}</strong></span>
          <div className="header-controls">
            <span className="demo-badge"><span />{t('나의 금융 기록')}</span>
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main-content" className="dashboard">
          <section id="overview" aria-labelledby="overview-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">MY FINANCIAL OVERVIEW</p>
                <h1 id="overview-title">{t('내 돈의 흐름, 한눈에.')}</h1>
                <p className="page-description">{t('오늘의 소비부터 내일의 목표까지 차근차근 관리해요.')}</p>
              </div>
              <div className="month-label"><span aria-hidden="true">▦</span> {monthLabel}</div>
            </div>
            <p className="preview-notice">{t('수입·지출과 소비 분포는 저장된 기록을 표시합니다. 자산·부채·예산·저축 목표는 아직 샘플입니다.')}</p>
            {data.status === 'loading' && <p role="status">{t('저장된 수입·지출을 불러오는 중입니다.')}</p>}
            {data.error && <p className="transaction-error" role="alert">{t(data.error)}</p>}
            <div className="summary-grid">
              <article className="net-worth-card">
                <div className="card-topline"><span>{t('나의 순자산')} <small className="sample-label">{t('샘플')}</small></span><span aria-hidden="true">↗</span></div>
                <p className="net-worth-amount">{won(totalAssets - debt)}</p>
                <p className="net-worth-description">{t('예시 자산에서 예시 부채를 뺀 금액')}</p>
                <div className="net-worth-footer">
                  <span>{t('총자산')} <strong>{won(totalAssets)}</strong></span>
                  <span>{t('총부채')} <strong>{won(debt)}</strong></span>
                </div>
              </article>
              <article className="summary-card">
                <span className="metric-icon income-icon" aria-hidden="true">↙</span>
                <p>{t('이번 달 수입')}</p><strong className="metric-amount">{totalsReady ? won(income) : '—'}</strong>
                <span className="metric-caption">{t('{{month}} 기록 기준', { month: monthLabel })}</span>
              </article>
              <article className="summary-card">
                <span className="metric-icon expense-icon" aria-hidden="true">↗</span>
                <p>{t('이번 달 지출')}</p><strong className="metric-amount">{totalsReady ? won(totalExpense) : '—'}</strong>
                <span className="metric-caption">{t('수입 − 지출')} <b>{totalsReady ? won(income - totalExpense) : '—'}</b></span>
              </article>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="panel spending-panel" aria-labelledby="spending-title">
              <div className="section-heading">
                <div><p className="eyebrow">SPENDING</p><h2 id="spending-title">{t('어디에 쓰고 있을까요?')}</h2></div>
                <span className="subtle-label">{t('{{month}} 누적', { month: monthLabel })}</span>
              </div>
              {totalsReady && totalExpense > 0n ? <div className="spending-content">
                <div className="expense-donut" style={{ background: `conic-gradient(${expenseStops.join(', ')})` }} role="img" aria-label={t('카테고리별 지출 합계 {{amount}}. 상세 금액은 옆 목록에 표시됩니다.', { amount: won(totalExpense) })}>
                  <div><span>{t('총 지출')}</span><strong>{(Number(totalExpense) / 10000).toLocaleString(language, { maximumFractionDigits: 1 })}<span>{t('만 원')}</span></strong></div>
                </div>
                <ul className="category-list">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <span className="category-name"><i style={{ backgroundColor: category.color }} />{category.name}</span>
                      <strong>{won(category.amount)}</strong>
                      <span>{Math.round(Number(category.amount) / Number(totalExpense) * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              : <p className="transaction-empty" role="status">{data.status === 'loading' ? t('소비 내역을 불러오는 중입니다.') : data.status === 'error' ? t('거래 내역을 불러오면 소비 분포를 확인할 수 있습니다.') : t('이번 달에 등록된 지출이 없습니다.')}</p>}
              <div className="panel-footnote">{t('작은 지출도 기록하면 나의 소비 습관이 보여요.')}</div>
            </section>

            <section id="assets" className="panel assets-panel" aria-labelledby="assets-title">
              <div className="section-heading">
                <div><p className="eyebrow">ASSETS</p><h2 id="assets-title">{t('내 자산 모아보기')}</h2></div>
                <span className="sample-label">{t('샘플 데이터')}</span>
              </div>
              <ul className="account-list">
                {accounts.map((account) => (
                  <li key={account.name}>
                    <span className="account-icon" aria-hidden="true">{account.icon}</span>
                    <div><strong>{account.name}</strong><small>{account.description}</small></div>
                    <b>{won(account.amount)}</b>
                  </li>
                ))}
              </ul>
              <div className="debt-row"><span>{t('부채')} <small>{t('대출 잔액')}</small></span><strong>{won(debt)}</strong></div>
            </section>

            <TransactionsPanel data={data} />

            <section id="budget" className="panel budget-panel" aria-labelledby="budget-title">
              <div className="section-heading">
                <div><p className="eyebrow">MONTHLY BUDGET</p><h2 id="budget-title">{t('계획 안에서, 여유 있게')}</h2></div>
                <span className="sample-label">{t('샘플 데이터')}</span>
              </div>
              <div className="budget-summary">
                <span>{t('이번 달 남은 예산')}</span><strong>{won(totalBudget - sampleExpense)}</strong>
                <small>{t('전체 예산 {{amount}}', { amount: won(totalBudget) })}</small>
              </div>
              <div className="budget-list">
                {budgetCategories.map((category) => (
                  <div className="budget-item" key={category.name}>
                    <div><strong>{category.name}</strong><span><b>{won(category.amount)}</b> / {won(category.budget)}</span></div>
                    <progress value={category.amount} max={category.budget} aria-label={t('{{name}} 예산 사용량', { name: category.name })} style={{ '--progress-color': category.color } as CSSProperties} />
                  </div>
                ))}
              </div>
            </section>

            <section id="goals" className="goals-section" aria-labelledby="goals-title">
              <div className="section-heading">
                <div><p className="eyebrow">SAVING FOR TOMORROW</p><h2 id="goals-title">{t('조금씩, 원하는 내일로')}</h2></div>
                <span className="sample-label">{t('샘플 목표 {{count}}개', { count: savingsGoals.length })}</span>
              </div>
              <div className="goals-grid">
                {savingsGoals.map((goal) => (
                  <article className={`goal-card goal-${goal.color}`} key={goal.name}>
                    <div className="goal-header"><span className="goal-icon" aria-hidden="true">{goal.icon}</span><span className="goal-date">{t('{{date}}까지', { date: goal.date })}</span></div>
                    <h3>{goal.name}</h3><p>{goal.description}</p>
                    <div className="goal-amount"><strong>{won(goal.saved)}</strong><span> / {won(goal.target)}</span></div>
                    <progress value={goal.saved} max={goal.target} aria-label={t('{{name}} 저축 진행률', { name: goal.name })} />
                    <div className="goal-footer"><span>{t('목표까지 {{amount}}', { amount: won(goal.target - goal.saved) })}</span><strong>{Math.round(goal.saved / goal.target * 100)}%</strong></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <footer className="page-footer" />
        </main>
      </div>
    </div>
  )
}
