import { describe, expect, it } from 'vitest'
import type { Transaction } from './api'
import { summarizeMonth } from './summary'

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return { id: 1, type: 'expense', amount: 100, date: '2026-01-01', description: '기록', category: '식비', ...overrides }
}

describe('월별 집계', () => {
  it('빈 월은 수입·지출 0과 빈 카테고리를 반환한다', () => {
    expect(summarizeMonth([], '2026-01')).toEqual({ income: 0n, expense: 0n, categoryTotals: new Map() })
  })

  it('연말과 다음 월을 제외하고 해당 월의 첫날과 마지막 날을 포함한다', () => {
    const result = summarizeMonth([
      transaction({ date: '2025-12-31', amount: 999 }),
      transaction({ date: '2026-01-01', type: 'income', amount: 1000 }),
      transaction({ date: '2026-01-31', amount: 200 }),
      transaction({ date: '2026-02-01', amount: 888 }),
      transaction({ date: '2025-01-15', amount: 777 }),
    ], '2026-01')
    expect(result).toEqual({ income: 1000n, expense: 200n, categoryTotals: new Map([['식비', 200n]]) })
  })

  it('윤년 2월의 마지막 날을 포함하고 3월은 제외한다', () => {
    const result = summarizeMonth([
      transaction({ date: '2024-02-29', amount: 50 }),
      transaction({ date: '2024-03-01', amount: 70 }),
    ], '2024-02')
    expect(result.expense).toBe(50n)
  })

  it('같은 카테고리의 지출을 합치고 수입은 소비 분포에서 제외한다', () => {
    const result = summarizeMonth([
      transaction({ amount: 100 }), transaction({ amount: 250 }),
      transaction({ category: '교통', amount: 80 }),
      transaction({ type: 'income', category: '식비', amount: 2000 }),
    ], '2026-01')
    expect(result).toEqual({ income: 2000n, expense: 430n, categoryTotals: new Map([['식비', 350n], ['교통', 80n]]) })
  })

  it('합계가 안전 정수 범위를 넘어도 원 단위를 정확하게 유지한다', () => {
    const result = summarizeMonth([
      transaction({ amount: Number.MAX_SAFE_INTEGER }), transaction({ amount: 2 }),
      transaction({ type: 'income', amount: Number.MAX_SAFE_INTEGER }),
      transaction({ type: 'income', amount: 4 }),
    ], '2026-01')
    expect(result.income).toBe(9007199254740995n)
    expect(result.expense).toBe(9007199254740993n)
    expect(result.categoryTotals.get('식비')).toBe(9007199254740993n)
  })

  it('등록·금액과 카테고리 수정·다른 월로 이동·삭제 후 새 입력으로 재집계한다', () => {
    const first = transaction({ id: 1 })
    const added = transaction({ id: 2, amount: 200 })
    const initial = Object.freeze([Object.freeze(first)])
    expect(summarizeMonth(initial, '2026-01').expense).toBe(100n)
    expect(summarizeMonth([first, added], '2026-01').expense).toBe(300n)
    const updated = { ...added, amount: 400, category: '교통' }
    expect(summarizeMonth([first, updated], '2026-01').categoryTotals).toEqual(new Map([['식비', 100n], ['교통', 400n]]))
    expect(summarizeMonth([first, { ...updated, date: '2026-02-01' }], '2026-01').expense).toBe(100n)
    expect(summarizeMonth([updated], '2026-01').expense).toBe(400n)
    expect(summarizeMonth([], '2026-01').expense).toBe(0n)
    expect(initial).toEqual([first])
  })
})
