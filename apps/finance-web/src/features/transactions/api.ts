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
    throw new Error('서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', { cause: error })
  }

  if (response.ok && response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const messages: Record<string, string> = {
      VALIDATION_ERROR: '입력값을 확인해 주세요.',
      INVALID_REQUEST: '올바른 JSON 요청을 보내 주세요.',
      NOT_FOUND: '거래 내역을 찾을 수 없습니다.',
    }
    const code = payload?.error?.code
    throw new Error(
      typeof code === 'string' && Object.hasOwn(messages, code)
        ? messages[code]
        : '요청을 처리하지 못했습니다. 다시 시도해 주세요.',
    )
  }
  if (payload === null) {
    throw new Error('서버 응답을 확인하지 못했습니다. 다시 시도해 주세요.')
  }
  return payload as T
}

export const transactionsApi = {
  async list(signal: AbortSignal) {
    const payload = await request<{ data: Transaction[] }>('', { signal })
    if (!Array.isArray(payload.data)) throw new Error('거래 내역을 확인하지 못했습니다.')
    return payload.data
  },
  create: (input: TransactionInput) => request<Transaction>('', { method: 'POST', body: input }),
  update: (id: number, input: TransactionInput) => request<Transaction>(`/${id}`, { method: 'PATCH', body: input }),
  remove: (id: number) => request<void>(`/${id}`, { method: 'DELETE' }),
}
