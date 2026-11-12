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
    { value: 'all', label: t('transactions.filters.all') },
    { value: 'expense', label: t('transactions.types.expense') },
    { value: 'income', label: t('transactions.types.income') },
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
    setFeedback({ type: 'success', message: editing ? 'transactions.feedback.updated' : 'transactions.feedback.created' })
    if (!editing) setFilter('all')
    setFormOpen(false)
    setEditing(null)
  }

  async function confirmDelete() {
    if (!deleting || data.isMutating) return
    try {
      await data.remove(deleting.id)
      setDeleting(null)
      setFeedback({ type: 'success', message: 'transactions.feedback.deleted' })
    } catch (error) {
      setFeedback({ type: 'error', message: error instanceof Error ? error.message : 'transactions.errors.delete' })
    }
  }

  return (
    <section id="transactions" className="panel transactions-panel" aria-labelledby="transactions-title">
      <div className="section-heading">
        <div><p className="eyebrow">ACTIVITY</p><h2 id="transactions-title">{t('transactions.title')}</h2></div>
        <button className="primary-button" type="button" disabled={controlsDisabled} onClick={() => openForm(null)}>{t('transactions.actions.openCreate')}</button>
      </div>
      <div className="transaction-toolbar">
        <div className="filter-group" role="group" aria-label={t('transactions.filters.label')}>
          {filters.map((item) => (
            <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>
          ))}
        </div>
        <button className="secondary-button" type="button" disabled={data.status === 'loading' || data.isMutating || formOpen || deleting !== null} onClick={() => { setFeedback(null); data.reload() }}>{t('common.refresh')}</button>
      </div>
      {formOpen && <TransactionForm key={editing?.id ?? 'new'} transaction={editing} isPending={data.isMutating} onSave={save} onCancel={() => { setFormOpen(false); setEditing(null) }} />}
      {deleting && (
        <div className="delete-confirmation" role="alert" aria-busy={data.isMutating}>
          <p><strong>{deleting.description}</strong> {t('transactions.deleteConfirmation')}</p>
          <div className="transaction-actions">
            <button className="secondary-button" type="button" disabled={data.isMutating} onClick={() => { setDeleting(null); setFeedback(null) }}>{t('common.cancel')}</button>
            <button className="danger-button" type="button" disabled={data.isMutating} onClick={confirmDelete}>{data.isMutating ? t('transactions.actions.deleting') : t('transactions.actions.confirmDelete')}</button>
          </div>
        </div>
      )}
      {feedback && <p className={feedback.type === 'error' ? 'transaction-error' : 'transaction-success'} role={feedback.type === 'error' ? 'alert' : 'status'}>{t(feedback.message)}</p>}
      {data.status === 'loading' && <p className="transaction-empty" role="status">{t('transactions.loading')}</p>}
      {data.error && <p className="transaction-error" role="alert">{t(data.error)} {t('transactions.retryHint')}</p>}
      {data.status === 'ready' && visible.length === 0 && (
        <p className="transaction-empty" role="status">{data.transactions.length === 0 ? t('transactions.empty') : t('transactions.filteredEmpty')}</p>
      )}
      {data.status === 'ready' && visible.length > 0 && (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">{t('transactions.table.caption')}</caption>
            <thead><tr><th scope="col">{t('transactions.fields.description')}</th><th scope="col">{t('transactions.fields.date')}</th><th scope="col" className="amount-cell">{t('transactions.fields.amount')}</th><th scope="col">{t('common.actions')}</th></tr></thead>
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
                    <small>{transaction.type === 'income' ? t('transactions.types.income') : t('transactions.types.expense')}</small>
                  </td>
                  <td><div className="row-actions">
                    <button className="secondary-button" type="button" aria-label={t('transactions.actions.editLabel', { name: transaction.description })} disabled={controlsDisabled} onClick={() => openForm(transaction)}>{t('common.edit')}</button>
                    <button className="danger-button" type="button" aria-label={t('transactions.actions.deleteLabel', { name: transaction.description })} disabled={controlsDisabled} onClick={() => { setDeleting(transaction); setFeedback(null) }}>{t('common.delete')}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="table-note">{data.status === 'ready' ? t('transactions.totalCount', { count: data.transactions.length }) : t('transactions.allDates')} {data.status === 'error' ? t('transactions.status.failed') : data.status === 'loading' ? t('transactions.status.loading') : ''} · {t('transactions.table.note')}</p>
    </section>
  )
}
