export type Transaction = {
  id: number
  type: 'income' | 'expense'
  amount: number
  date: string
  description: string
  category: string
}

export type TransactionInput = Omit<Transaction, 'id'>

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: TransactionInput
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/transactions${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      cache: 'no-store',
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new Error('transactions.errors.connection', { cause: error })
  }

  if (response.ok && response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const messages: Record<string, string> = {
      VALIDATION_ERROR: 'transactions.errors.validation',
      INVALID_REQUEST: 'transactions.errors.invalidRequest',
      NOT_FOUND: 'transactions.errors.notFound',
    }
    const code = payload?.error?.code
    throw new Error(
      typeof code === 'string' && Object.hasOwn(messages, code)
        ? messages[code]
        : 'transactions.errors.request',
    )
  }
  if (payload === null) {
    throw new Error('transactions.errors.response')
  }
  return payload as T
}

export const transactionsApi = {
  async list(signal: AbortSignal) {
    const payload = await request<{ data: Transaction[] }>('', { signal })
    if (!Array.isArray(payload.data)) throw new Error('transactions.errors.invalidList')
    return payload.data
  },
  create: (input: TransactionInput) => request<Transaction>('', { method: 'POST', body: input }),
  update: (id: number, input: TransactionInput) => request<Transaction>(`/${id}`, { method: 'PATCH', body: input }),
  remove: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
}
