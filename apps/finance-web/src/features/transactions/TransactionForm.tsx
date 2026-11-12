import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Transaction, TransactionInput } from './api'
import { localDate } from './date'

type Props = {
  transaction: Transaction | null
  isPending: boolean
  onSave: (input: TransactionInput) => Promise<void>
  onCancel: () => void
}

export function TransactionForm({ transaction, isPending, onSave, onCancel }: Props) {
  const { t } = useTranslation()
  const [type, setType] = useState<Transaction['type']>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : '')
  const [date, setDate] = useState(transaction?.date ?? localDate)
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [category, setCategory] = useState(transaction?.category ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return
    setError(null)
    const value = Number(amount)
    if (!/^\d+$/.test(amount) || !Number.isSafeInteger(value) || value <= 0) {
      setError('transactions.validation.amount')
      return
    }
    if (!description.trim()) {
      setError('transactions.validation.description')
      return
    }
    try {
      await onSave({ type, amount: value, date, description: description.trim(), category: category.trim() || '미분류' })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'transactions.errors.save')
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit} aria-labelledby="transaction-form-title" aria-busy={isPending}>
      <h3 id="transaction-form-title">{transaction ? t('transactions.form.editTitle') : t('transactions.form.createTitle')}</h3>
      <fieldset disabled={isPending}>
        <legend className="sr-only">{t('transactions.form.legend')}</legend>
        <div className="transaction-fields">
          <label>{t('transactions.fields.type')} <select value={type} onChange={(event) => setType(event.target.value as Transaction['type'])}>
              <option value="expense">{t('transactions.types.expense')}</option><option value="income">{t('transactions.types.income')}</option>
            </select>
          </label>
          <label>{t('transactions.fields.date')} <input type="date" required min="0001-01-01" max="9999-12-31" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>{t('transactions.fields.amount')} <input type="number" inputMode="numeric" required min={1} max={Number.MAX_SAFE_INTEGER} step={1} placeholder={t('transactions.form.amountPlaceholder')} value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label>{t('transactions.fields.category')} <span className="field-hint">{t('transactions.form.optional')}</span>
            <input type="text" maxLength={50} placeholder={t('transactions.form.uncategorized')} value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label className="description-field">{t('transactions.fields.description')} <input type="text" required maxLength={200} placeholder={t('transactions.form.descriptionPlaceholder')} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
        {error && <p className="transaction-error" role="alert">{t(error)}</p>}
        <div className="transaction-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>{t('common.cancel')}</button>
          <button className="primary-button" type="submit">{isPending ? t('transactions.actions.saving') : transaction ? t('transactions.actions.saveChanges') : t('transactions.actions.create')}</button>
        </div>
      </fieldset>
    </form>
  )
}
