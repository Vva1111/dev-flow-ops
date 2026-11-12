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
    { id: 'overview', label: t('nav.overview'), icon: '◫' },
    { id: 'transactions', label: t('nav.transactions'), icon: '↔' },
    { id: 'assets', label: t('nav.assets'), icon: '▤' },
    { id: 'budget', label: t('nav.budget'), icon: '◷' },
    { id: 'goals', label: t('nav.goals'), icon: '⚑' },
  ]

  const budgetCategories = [
    { name: t('categories.foodAndCafe'), amount: 520000, budget: 700000, color: '#347766' },
    { name: t('categories.shopping'), amount: 320000, budget: 400000, color: '#9bb981' },
    { name: t('categories.transport'), amount: 144000, budget: 200000, color: '#e8ba73' },
    { name: t('categories.livingAndOther'), amount: 300000, budget: 700000, color: '#b7c8c1' },
  ]

  const accounts = [
    { name: t('accounts.cash.name'), description: t('accounts.cash.description'), amount: 4280000, icon: '₩' },
    { name: t('accounts.savings.name'), description: t('accounts.savings.description'), amount: 18000000, icon: '▤' },
    { name: t('accounts.investments.name'), description: t('accounts.investments.description'), amount: 12000000, icon: '↗' },
  ]

  const savingsGoals = [
    { name: t('goals.emergency.name'), description: t('goals.emergency.description'), saved: 6000000, target: 10000000, date: formatMonth('2027-06', language), icon: '☂', color: 'green' },
    { name: t('goals.travel.name'), description: t('goals.travel.description'), saved: 2400000, target: 4000000, date: formatMonth('2027-03', language), icon: '✈', color: 'sand' },
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
      <a className="skip-link" href="#main-content">{t('accessibility.skipToContent')}</a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label={t('brand.home')}>
          <span className="brand-symbol" aria-hidden="true">f<span>·</span></span>
          <span>finance<span className="brand-caption">{t('brand.tagline')}</span></span>
        </a>
        <p className="nav-label">{t('navigation.title')}</p>
        <nav className="main-nav" aria-label={t('navigation.label')}>
          {navigation.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-symbol" aria-hidden="true">✳</span>
          <strong>{t('sidebar.noteTitle')}</strong>
          <p>{t('sidebar.noteFirstLine')}<br />{t('sidebar.noteSecondLine')}</p>
        </div>
        <div className="sidebar-footer">
          <span className="avatar" aria-hidden="true">{t('profile.avatar')}</span>
          <div><strong>{t('profile.title')}</strong><small>{t('common.financeManagement')}</small></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span>{t('navigation.title')} <span className="breadcrumb-divider">/</span> <strong>{t('dashboard.breadcrumb')}</strong></span>
          <div className="header-controls">
            <span className="demo-badge"><span />{t('dashboard.badge')}</span>
            <LanguageSwitcher />
          </div>
        </header>
        <main id="main-content" className="dashboard">
          <section id="overview" aria-labelledby="overview-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">MY FINANCIAL OVERVIEW</p>
                <h1 id="overview-title">{t('dashboard.title')}</h1>
                <p className="page-description">{t('dashboard.description')}</p>
              </div>
              <div className="month-label"><span aria-hidden="true">▦</span> {monthLabel}</div>
            </div>
            <p className="preview-notice">{t('dashboard.sampleNotice')}</p>
            {data.status === 'loading' && <p role="status">{t('dashboard.loading')}</p>}
            {data.error && <p className="transaction-error" role="alert">{t(data.error)}</p>}
            <div className="summary-grid">
              <article className="net-worth-card">
                <div className="card-topline"><span>{t('summary.netWorth')} <small className="sample-label">{t('sample.label')}</small></span><span aria-hidden="true">↗</span></div>
                <p className="net-worth-amount">{won(totalAssets - debt)}</p>
                <p className="net-worth-description">{t('summary.netWorthDescription')}</p>
                <div className="net-worth-footer">
                  <span>{t('summary.totalAssets')} <strong>{won(totalAssets)}</strong></span>
                  <span>{t('summary.totalDebt')} <strong>{won(debt)}</strong></span>
                </div>
              </article>
              <article className="summary-card">
                <span className="metric-icon income-icon" aria-hidden="true">↙</span>
                <p>{t('summary.monthlyIncome')}</p><strong className="metric-amount">{totalsReady ? won(income) : '—'}</strong>
                <span className="metric-caption">{t('summary.period', { month: monthLabel })}</span>
              </article>
              <article className="summary-card">
                <span className="metric-icon expense-icon" aria-hidden="true">↗</span>
                <p>{t('summary.monthlyExpense')}</p><strong className="metric-amount">{totalsReady ? won(totalExpense) : '—'}</strong>
                <span className="metric-caption">{t('summary.balance')} <b>{totalsReady ? won(income - totalExpense) : '—'}</b></span>
              </article>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="panel spending-panel" aria-labelledby="spending-title">
              <div className="section-heading">
                <div><p className="eyebrow">SPENDING</p><h2 id="spending-title">{t('spending.title')}</h2></div>
                <span className="subtle-label">{t('spending.period', { month: monthLabel })}</span>
              </div>
              {totalsReady && totalExpense > 0n ? <div className="spending-content">
                <div className="expense-donut" style={{ background: `conic-gradient(${expenseStops.join(', ')})` }} role="img" aria-label={t('spending.chartLabel', { amount: won(totalExpense) })}>
                  <div><span>{t('spending.total')}</span><strong>{(Number(totalExpense) / 10000).toLocaleString(language, { maximumFractionDigits: 1 })}<span>{t('spending.tenThousandWon')}</span></strong></div>
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
              : <p className="transaction-empty" role="status">{data.status === 'loading' ? t('spending.loading') : data.status === 'error' ? t('spending.unavailable') : t('spending.empty')}</p>}
              <div className="panel-footnote">{t('spending.note')}</div>
            </section>

            <section id="assets" className="panel assets-panel" aria-labelledby="assets-title">
              <div className="section-heading">
                <div><p className="eyebrow">ASSETS</p><h2 id="assets-title">{t('assets.title')}</h2></div>
                <span className="sample-label">{t('sample.data')}</span>
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
              <div className="debt-row"><span>{t('assets.debt')} <small>{t('assets.loanBalance')}</small></span><strong>{won(debt)}</strong></div>
            </section>

            <TransactionsPanel data={data} />

            <section id="budget" className="panel budget-panel" aria-labelledby="budget-title">
              <div className="section-heading">
                <div><p className="eyebrow">MONTHLY BUDGET</p><h2 id="budget-title">{t('budget.title')}</h2></div>
                <span className="sample-label">{t('sample.data')}</span>
              </div>
              <div className="budget-summary">
                <span>{t('budget.remaining')}</span><strong>{won(totalBudget - sampleExpense)}</strong>
                <small>{t('budget.total', { amount: won(totalBudget) })}</small>
              </div>
              <div className="budget-list">
                {budgetCategories.map((category) => (
                  <div className="budget-item" key={category.name}>
                    <div><strong>{category.name}</strong><span><b>{won(category.amount)}</b> / {won(category.budget)}</span></div>
                    <progress value={category.amount} max={category.budget} aria-label={t('budget.progressLabel', { name: category.name })} style={{ '--progress-color': category.color } as CSSProperties} />
                  </div>
                ))}
              </div>
            </section>

            <section id="goals" className="goals-section" aria-labelledby="goals-title">
              <div className="section-heading">
                <div><p className="eyebrow">SAVING FOR TOMORROW</p><h2 id="goals-title">{t('goals.title')}</h2></div>
                <span className="sample-label">{t('goals.sampleCount', { count: savingsGoals.length })}</span>
              </div>
              <div className="goals-grid">
                {savingsGoals.map((goal) => (
                  <article className={`goal-card goal-${goal.color}`} key={goal.name}>
                    <div className="goal-header"><span className="goal-icon" aria-hidden="true">{goal.icon}</span><span className="goal-date">{t('goals.dueDate', { date: goal.date })}</span></div>
                    <h3>{goal.name}</h3><p>{goal.description}</p>
                    <div className="goal-amount"><strong>{won(goal.saved)}</strong><span> / {won(goal.target)}</span></div>
                    <progress value={goal.saved} max={goal.target} aria-label={t('goals.progressLabel', { name: goal.name })} />
                    <div className="goal-footer"><span>{t('goals.remaining', { amount: won(goal.target - goal.saved) })}</span><strong>{Math.round(goal.saved / goal.target * 100)}%</strong></div>
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
