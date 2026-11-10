import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { Transaction, TransactionInput } from './api'
import { formatDate, formatWon } from '../../i18n/format'
import { TransactionForm } from './TransactionForm'
import type { useTransactions } from './useTransactions'

type Props = { data: ReturnType<typeof useTransactions> }

export function TransactionsPanel({ data }: Props) {
  const { t, i18n } = useTranslation()
  const language = i18n.resolvedLanguage ?? 'ko'
  const filters = [
    { value: 'all', label: t('전체') },
    { value: 'expense', label: t('지출') },
    { value: 'income', label: t('수입') },
  ] as const
  const [filter, setFilter] = useState<'all' | Transaction['type']>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const visible = data.transactions.filter((item) => filter === 'all' || item.type === filter)
  const controlsDisabled = data.status !== 'ready' || data.isMutating || formOpen || deleting !== null

  function openForm(transaction: Transaction | null) {
    setEditing(transaction)
    setFormOpen(true)
    setFeedback(null)
  }

  async function save(input: TransactionInput) {
    if (editing) await data.update(editing.id, input)
    else await data.create(input)
    setFeedback({ type: 'success', message: editing ? '내역을 수정했습니다.' : '내역을 등록했습니다.' })
    if (!editing) setFilter('all')
    setFormOpen(false)
    setEditing(null)
  }

  async function confirmDelete() {
    if (!deleting || data.isMutating) return
    try {
      await data.remove(deleting.id)
      setDeleting(null)
      setFeedback({ type: 'success', message: '내역을 삭제했습니다.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : '내역을 삭제하지 못했습니다.' })
    }
  }

  return (
    <section id="transactions" className="panel transactions-panel" aria-labelledby="transactions-title">
      <div className="section-heading">
        <div><p className="eyebrow">ACTIVITY</p><h2 id="transactions-title">{t('수입·지출 내역')}</h2></div>
        <button className="primary-button" type="button" disabled={controlsDisabled} onClick={() => openForm(null)}>{t('내역 등록')}</button>
      </div>
      <div className="transaction-toolbar">
        <div className="filter-group" role="group" aria-label={t('내역 종류')}>
          {filters.map((item) => (
            <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>
          ))}
        </div>
        <button className="secondary-button" type="button" disabled={data.status === 'loading' || data.isMutating || formOpen || deleting !== null} onClick={() => { setFeedback(null); data.reload() }}>{t('새로고침')}</button>
      </div>
      {formOpen && <TransactionForm key={editing?.id ?? 'new'} transaction={editing} isPending={data.isMutating} onSave={save} onCancel={() => { setFormOpen(false); setEditing(null) }} />}
      {deleting && (
        <div className="delete-confirmation" role="alert" aria-busy={data.isMutating}>
          <p><strong>{deleting.description}</strong> {t('내역을 삭제할까요? 삭제한 내역은 복구할 수 없습니다.')}</p>
          <div className="transaction-actions">
            <button className="secondary-button" type="button" disabled={data.isMutating} onClick={() => { setDeleting(null); setFeedback(null) }}>{t('취소')}</button>
            <button className="danger-button" type="button" disabled={data.isMutating} onClick={confirmDelete}>{data.isMutating ? t('삭제 중…') : t('삭제 확인')}</button>
          </div>
        </div>
      )}
      {feedback && <p className={feedback.type === 'error' ? 'transaction-error' : 'transaction-success'} role={feedback.type === 'error' ? 'alert' : 'status'}>{t(feedback.message)}</p>}
      {data.status === 'loading' && <p className="transaction-empty" role="status">{t('내역을 불러오는 중입니다.')}</p>}
      {data.error && <p className="transaction-error" role="alert">{t(data.error)} {t('새로고침으로 다시 불러올 수 있습니다.')}</p>}
      {data.status === 'ready' && visible.length === 0 && (
        <p className="transaction-empty" role="status">{data.transactions.length === 0 ? t('등록된 내역이 없습니다. 첫 수입이나 지출을 기록해 보세요.') : t('선택한 종류의 내역이 없습니다.')}</p>
      )}
      {data.status === 'ready' && visible.length > 0 && (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">{t('저장된 수입·지출 내역')}</caption>
            <thead><tr><th scope="col">{t('내역')}</th><th scope="col">{t('날짜')}</th><th scope="col" className="amount-cell">{t('금액')}</th><th scope="col">{t('관리')}</th></tr></thead>
            <tbody>
              {visible.map((transaction) => (
                <tr key={transaction.id}>
                  <td><div className="transaction-name">
                    <span className={`transaction-icon type-${transaction.type}`} aria-hidden="true">{transaction.type === 'income' ? '↙' : '↗'}</span>
                    <div><strong>{transaction.description}</strong><small>{transaction.category}</small></div>
                  </div></td>
                  <td><time dateTime={transaction.date}>{formatDate(transaction.date, language)}</time></td>
                  <td className={`amount-cell ${transaction.type === 'income' ? 'income-text' : ''}`}>
                    <strong>{transaction.type === 'income' ? '+' : '−'}{formatWon(transaction.amount, language)}</strong>
                    <small>{transaction.type === 'income' ? t('수입') : t('지출')}</small>
                  </td>
                  <td><div className="row-actions">
                    <button className="secondary-button" type="button" aria-label={t('{{name}} 수정', { name: transaction.description })} disabled={controlsDisabled} onClick={() => openForm(transaction)}>{t('수정')}</button>
                    <button className="danger-button" type="button" aria-label={t('{{name}} 삭제', { name: transaction.description })} disabled={controlsDisabled} onClick={() => { setDeleting(transaction); setFeedback(null) }}>{t('삭제')}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="table-note">{data.status === 'ready' ? t('전체 기간의 내역 {{count}}건', { count: data.transactions.length }) : t('전체 기간의 내역')} {data.status === 'error' ? t('조회 실패') : data.status === 'loading' ? t('조회 중') : ''} · {t('날짜순으로 표시합니다. 이체·계좌 관리는 아직 지원하지 않습니다.')}</p>
    </section>
  )
}
