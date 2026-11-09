import { useState } from 'react'
import type { CSSProperties } from 'react'
import './App.css'

const navigation = [
  { id: 'overview', label: '한눈에 보기', icon: '◫' },
  { id: 'transactions', label: '수입·지출', icon: '↔' },
  { id: 'assets', label: '내 자산', icon: '▤' },
  { id: 'budget', label: '예산 관리', icon: '◷' },
  { id: 'goals', label: '저축 목표', icon: '⚑' },
]

const categories = [
  { name: '식비·카페', amount: 520000, budget: 700000, color: '#347766' },
  { name: '쇼핑', amount: 320000, budget: 400000, color: '#9bb981' },
  { name: '교통', amount: 144000, budget: 200000, color: '#e8ba73' },
  { name: '생활·기타', amount: 300000, budget: 700000, color: '#b7c8c1' },
]

const transactions = [
  { id: 1, name: '오늘의 점심', category: '식비·카페', account: '생활비 통장', date: '11.04', type: '지출', amount: 12000, icon: '밥' },
  { id: 2, name: '출근길 커피', category: '식비·카페', account: '생활비 통장', date: '11.04', type: '지출', amount: 4500, icon: '잔' },
  { id: 3, name: '11월 월급', category: '급여', account: '생활비 통장', date: '11.03', type: '수입', amount: 4200000, icon: '₩' },
  { id: 4, name: '겨울 니트', category: '쇼핑', account: '생활비 통장', date: '11.03', type: '지출', amount: 69000, icon: '옷' },
  { id: 5, name: '저축 통장으로 이동', category: '내 계좌 간 이체', account: '생활비 → 저축', date: '11.02', type: '이체', amount: 500000, icon: '↔' },
]

const accounts = [
  { name: '입출금·현금', description: '매일 사용하는 돈', amount: 4280000, icon: '₩' },
  { name: '예금·적금', description: '차곡차곡 모으는 돈', amount: 18000000, icon: '▤' },
  { name: '투자', description: '주식·펀드 등 평가 금액', amount: 12000000, icon: '↗' },
]

const savingsGoals = [
  { name: '든든한 비상금', description: '예상치 못한 순간을 위한 준비', saved: 6000000, target: 10000000, date: '2027년 6월', icon: '☂', color: 'green' },
  { name: '다음 여행', description: '일상에서 잠시 벗어나는 시간', saved: 2400000, target: 4000000, date: '2027년 3월', icon: '✈', color: 'sand' },
]

const won = (amount: number) => `${amount.toLocaleString('ko-KR')}원`
const totalExpense = categories.reduce((sum, category) => sum + category.amount, 0)
const totalBudget = categories.reduce((sum, category) => sum + category.budget, 0)
const totalAssets = accounts.reduce((sum, account) => sum + account.amount, 0)
const debt = 4000000
const income = 4200000
const expenseStops = categories.map((category, index) => {
  const start = categories.slice(0, index).reduce((sum, item) => sum + item.amount, 0) / totalExpense * 100
  return `${category.color} ${start}% ${start + category.amount / totalExpense * 100}%`
}).join(', ')

export default function App() {
  const [filter, setFilter] = useState('전체')
  const visibleTransactions = transactions.filter((transaction) => filter === '전체' || transaction.type === filter)

  return (
    <div className="finance-layout">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>
      <aside className="sidebar">
        <a className="brand" href="#overview" aria-label="Finance 홈">
          <span className="brand-symbol" aria-hidden="true">f<span>・</span></span>
          <span>finance<span className="brand-caption">나를 위한 금융 기록</span></span>
        </a>
        <p className="nav-label">나의 금융</p>
        <nav className="main-nav" aria-label="주 메뉴">
          {navigation.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              <span aria-hidden="true">{item.icon}</span>{item.label}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-symbol" aria-hidden="true">✳</span>
          <strong>작은 기록이 만드는 변화</strong>
          <p>오늘의 돈을 살펴보고,<br />내일의 계획을 만들어 보세요.</p>
        </div>
        <div className="sidebar-footer">
          <span className="avatar" aria-hidden="true">나</span>
          <div><strong>나의 금융 공간</strong><small>개인 금융 관리</small></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <span>나의 금융 <span className="breadcrumb-divider">/</span> <strong>대시보드</strong></span>
          <span className="demo-badge"><span />샘플 데이터</span>
        </header>
        <main id="main-content" className="dashboard">
          <section id="overview" aria-labelledby="overview-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">MY FINANCIAL OVERVIEW</p>
                <h1 id="overview-title">내 돈의 흐름, 한눈에.</h1>
                <p className="page-description">오늘의 소비부터 내일의 목표까지 차근차근 관리해요.</p>
              </div>
              <div className="month-label"><span aria-hidden="true">▦</span> 2026년 11월</div>
            </div>
            <p className="preview-notice">퍼블리싱 미리보기 · 모든 금액과 내역은 예시이며, 실제 금융 정보와 연결되어 있지 않습니다.</p>
            <div className="summary-grid">
              <article className="net-worth-card">
                <div className="card-topline"><span>나의 순자산</span><span aria-hidden="true">↗</span></div>
                <p className="net-worth-amount">{(totalAssets - debt).toLocaleString('ko-KR')}<span>원</span></p>
                <p className="net-worth-description">지금 가진 자산에서 부채를 뺀 금액</p>
                <div className="net-worth-footer">
                  <span>총자산 <strong>{won(totalAssets)}</strong></span>
                  <span>총부채 <strong>{won(debt)}</strong></span>
                </div>
              </article>
              <article className="summary-card">
                <span className="metric-icon income-icon" aria-hidden="true">↙</span>
                <p>이번 달 수입</p><strong className="metric-amount">{won(income)}</strong>
                <span className="metric-caption">11월에 들어온 돈</span>
              </article>
              <article className="summary-card">
                <span className="metric-icon expense-icon" aria-hidden="true">↗</span>
                <p>이번 달 지출</p><strong className="metric-amount">{won(totalExpense)}</strong>
                <span className="metric-caption">수입 − 지출 <b>{won(income - totalExpense)}</b></span>
              </article>
            </div>
          </section>

          <div className="dashboard-grid">
            <section className="panel spending-panel" aria-labelledby="spending-title">
              <div className="section-heading">
                <div><p className="eyebrow">SPENDING</p><h2 id="spending-title">어디에 쓰고 있을까요?</h2></div>
                <span className="subtle-label">11월 누적</span>
              </div>
              <div className="spending-content">
                <div className="expense-donut" style={{ background: `conic-gradient(${expenseStops})` }} role="img" aria-label={`카테고리별 지출 합계 ${won(totalExpense)}. 상세 금액은 옆 목록에 표시됩니다.`}>
                  <div><span>총 지출</span><strong>{(totalExpense / 10000).toLocaleString('ko-KR')}<span>만 원</span></strong></div>
                </div>
                <ul className="category-list">
                  {categories.map((category) => (
                    <li key={category.name}>
                      <span className="category-name"><i style={{ backgroundColor: category.color }} />{category.name}</span>
                      <strong>{won(category.amount)}</strong>
                      <span>{Math.round(category.amount / totalExpense * 100)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="panel-footnote">작은 지출도 기록하면 나의 소비 습관이 보여요.</div>
            </section>

            <section id="assets" className="panel assets-panel" aria-labelledby="assets-title">
              <div className="section-heading">
                <div><p className="eyebrow">ASSETS</p><h2 id="assets-title">내 자산 모아보기</h2></div>
                <span className="section-mark" aria-hidden="true">▤</span>
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
              <div className="debt-row"><span>부채 <small>대출 잔액</small></span><strong>{won(debt)}</strong></div>
            </section>

            <section id="transactions" className="panel transactions-panel" aria-labelledby="transactions-title">
              <div className="section-heading">
                <div><p className="eyebrow">ACTIVITY</p><h2 id="transactions-title">최근 수입·지출</h2></div>
                <span className="subtle-label">최근 내역 예시 {transactions.length}건</span>
              </div>
              <div className="transaction-toolbar">
                <div className="filter-group" role="group" aria-label="최근 내역 종류">
                  {['전체', '지출', '수입', '이체'].map((type) => (
                    <button key={type} type="button" aria-pressed={filter === type} onClick={() => setFilter(type)}>{type}</button>
                  ))}
                </div>
                <span className="toolbar-note">이체는 수입·지출에서 제외해요</span>
              </div>
              <div className="table-scroll">
                <table>
                  <caption className="sr-only">2026년 11월 최근 수입·지출 및 이체 예시</caption>
                  <thead><tr><th scope="col">내역</th><th scope="col">날짜</th><th scope="col">계좌</th><th scope="col" className="amount-cell">금액</th></tr></thead>
                  <tbody>
                    {visibleTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td><div className="transaction-name">
                          <span className={`transaction-icon type-${transaction.type === '수입' ? 'income' : transaction.type === '이체' ? 'transfer' : 'expense'}`} aria-hidden="true">{transaction.icon}</span>
                          <div><strong>{transaction.name}</strong><small>{transaction.category}</small></div>
                        </div></td>
                        <td><time dateTime={`2026-${transaction.date.replace('.', '-')}`}>{transaction.date}</time></td>
                        <td>{transaction.account}</td>
                        <td className={`amount-cell ${transaction.type === '수입' ? 'income-text' : ''}`}>
                          <strong>{transaction.type === '수입' ? '+' : transaction.type === '지출' ? '−' : ''}{won(transaction.amount)}</strong>
                          <small>{transaction.type}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="table-note">월 전체 합계와 별개로 최근 내역 일부를 표시한 예시입니다.</p>
            </section>

            <section id="budget" className="panel budget-panel" aria-labelledby="budget-title">
              <div className="section-heading">
                <div><p className="eyebrow">MONTHLY BUDGET</p><h2 id="budget-title">계획 안에서, 여유 있게</h2></div>
                <span className="subtle-label">11월 예산</span>
              </div>
              <div className="budget-summary">
                <span>이번 달 남은 예산</span><strong>{won(totalBudget - totalExpense)}</strong>
                <small>전체 예산 {won(totalBudget)}</small>
              </div>
              <div className="budget-list">
                {categories.map((category) => (
                  <div className="budget-item" key={category.name}>
                    <div><strong>{category.name}</strong><span><b>{(category.amount / 10000).toLocaleString('ko-KR')}</b> / {category.budget / 10000}만 원</span></div>
                    <progress value={category.amount} max={category.budget} aria-label={`${category.name} 예산 사용량`} style={{ '--progress-color': category.color } as CSSProperties} />
                  </div>
                ))}
              </div>
            </section>

            <section id="goals" className="goals-section" aria-labelledby="goals-title">
              <div className="section-heading">
                <div><p className="eyebrow">SAVING FOR TOMORROW</p><h2 id="goals-title">조금씩, 원하는 내일로</h2></div>
                <span className="subtle-label">저축 목표 {savingsGoals.length}개</span>
              </div>
              <div className="goals-grid">
                {savingsGoals.map((goal) => (
                  <article className={`goal-card goal-${goal.color}`} key={goal.name}>
                    <div className="goal-header"><span className="goal-icon" aria-hidden="true">{goal.icon}</span><span className="goal-date">{goal.date}까지</span></div>
                    <h3>{goal.name}</h3><p>{goal.description}</p>
                    <div className="goal-amount"><strong>{won(goal.saved)}</strong><span> / {won(goal.target)}</span></div>
                    <progress value={goal.saved} max={goal.target} aria-label={`${goal.name} 저축 진행률`} />
                    <div className="goal-footer"><span>목표까지 {won(goal.target - goal.saved)}</span><strong>{Math.round(goal.saved / goal.target * 100)}%</strong></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
          <footer className="page-footer"><span>finance · 나를 위한 금융 기록</span><span>소비를 이해하고, 자산을 살피고, 내일을 계획해요.</span></footer>
        </main>
      </div>
    </div>
  )
}
