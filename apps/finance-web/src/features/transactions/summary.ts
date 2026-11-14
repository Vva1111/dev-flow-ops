import type { Transaction } from './api'

export function summarizeMonth(transactions: readonly Transaction[], month: string) {
  let income = 0n
  let expense = 0n
  const categoryTotals = new Map<string, bigint>()

  for (const item of transactions) {
    if (!item.date.startsWith(`${month}-`)) continue
    const amount = BigInt(item.amount)
    if (item.type === 'income') {
      income += amount
    } else {
      expense += amount
      categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0n) + amount)
    }
  }

  return { income, expense, categoryTotals }
}
