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
      setError('금액은 1원 이상의 정수로 입력해 주세요.')
      return
    }
    if (!description.trim()) {
      setError('내역을 입력해 주세요.')
      return
    }
    try {
      await onSave({ type, amount: value, date, description: description.trim(), category: category.trim() || '미분류' })
    } catch (error) {
      setError(error instanceof Error ? error.message : '내역을 저장하지 못했습니다.')
    }
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit} aria-labelledby="transaction-form-title" aria-busy={isPending}>
      <h3 id="transaction-form-title">{transaction ? t('수입·지출 수정') : t('수입·지출 등록')}</h3>
      <fieldset disabled={isPending}>
        <legend className="sr-only">{t('거래 정보')}</legend>
        <div className="transaction-fields">
          <label>{t('종류')} <select value={type} onChange={(event) => setType(event.target.value as Transaction['type'])}>
              <option value="expense">{t('지출')}</option><option value="income">{t('수입')}</option>
            </select>
          </label>
          <label>{t('날짜')} <input type="date" required min="0001-01-01" max="9999-12-31" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <label>{t('금액')} <input type="number" inputMode="numeric" required min={1} max={Number.MAX_SAFE_INTEGER} step={1} placeholder={t('원 단위')} value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <label>{t('카테고리')} <span className="field-hint">{t('선택')}</span>
            <input type="text" maxLength={50} placeholder={t('미분류')} value={category} onChange={(event) => setCategory(event.target.value)} />
          </label>
          <label className="description-field">{t('내역')} <input type="text" required maxLength={200} placeholder={t('예: 점심 식사')} value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>
        </div>
        {error && <p className="transaction-error" role="alert">{t(error)}</p>}
        <div className="transaction-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>{t('취소')}</button>
          <button className="primary-button" type="submit">{isPending ? t('저장 중…') : transaction ? t('수정 저장') : t('등록')}</button>
        </div>
      </fieldset>
    </form>
  )
}
