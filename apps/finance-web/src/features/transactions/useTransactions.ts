import { useEffect, useRef, useState } from 'react'
import { transactionsApi } from './api'
import type { Transaction, TransactionInput } from './api'

const sortTransactions = (items: Transaction[]) => [...items].sort((a, b) => (
  b.date.localeCompare(a.date) || b.id - a.id
))

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isMutating, setIsMutating] = useState(false)
  const mutationLock = useRef(false)

  useEffect(() => {
    const controller = new AbortController()
    transactionsApi.list(controller.signal).then((items) => {
      if (controller.signal.aborted) return
      setTransactions(sortTransactions(items))
      setStatus('ready')
      setError(null)
    }).catch((error: unknown) => {
      if (controller.signal.aborted) return
      setError(error instanceof Error ? error.message : '거래 내역을 불러오지 못했습니다.')
      setStatus('error')
    })

    return () => controller.abort()
  }, [reloadKey])

  function reload() {
    if (mutationLock.current || status === 'loading') return
    setStatus('loading')
    setError(null)
    setReloadKey((value) => value + 1)
  }

  async function mutate<T>(
    send: () => Promise<T>,
    apply: (result: T, current: Transaction[]) => Transaction[],
  ) {
    if (mutationLock.current || status !== 'ready') {
      throw new Error('진행 중인 요청이 끝난 뒤 다시 시도해 주세요.')
    }
    mutationLock.current = true
    setIsMutating(true)
    try {
      const result = await send()
      setTransactions((current) => sortTransactions(apply(result, current)))
    } finally {
      mutationLock.current = false
      setIsMutating(false)
    }
  }

  return {
    transactions, status, error, isMutating, reload,
    create: (input: TransactionInput) => mutate(
      () => transactionsApi.create(input), (created, current) => [created, ...current],
    ),
    update: (id: number, input: TransactionInput) => mutate(
      () => transactionsApi.update(id, input),
      (updated, current) => current.map((item) => item.id === id ? updated : item),
    ),
    remove: (id: number) => mutate(
      () => transactionsApi.remove(id), (_, current) => current.filter((item) => item.id !== id),
    ),
  }
}
