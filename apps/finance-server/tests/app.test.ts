import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.ts'
import { openDatabase } from '../src/db/client.ts'

const input = { type: 'expense', amount: 12000, date: '2026-11-14', description: '점심', category: '식비' }
let database: ReturnType<typeof openDatabase>
let app: ReturnType<typeof createApp>

beforeEach(() => {
  database = openDatabase(':memory:')
  app = createApp(database.db)
})
afterEach(() => {
  database.close()
  vi.restoreAllMocks()
})

function write(method: 'POST' | 'PATCH', body: unknown, path = '/api/transactions') {
  return app.request(path, {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

async function create(body = input) {
  const response = await write('POST', body)
  expect(response.status).toBe(201)
  return response.json() as Promise<typeof input & { id: number }>
}

describe('Finance API', () => {
  it('빈 목록에서 등록·조회·부분 수정·삭제까지 DB에 반영한다', async () => {
    expect(await (await app.request('/api/transactions')).json()).toEqual({ data: [] })
    const transaction = await create()
    expect(transaction).toEqual({ ...input, id: expect.any(Number) })
    const path = `/api/transactions/${transaction.id}`
    const get = await app.request(path)
    expect(get.status).toBe(200)
    expect(await get.json()).toEqual(transaction)

    const update = await write('PATCH', { amount: 15000, description: '저녁' }, path)
    expect(update.status).toBe(200)
    const updated = { ...transaction, amount: 15000, description: '저녁' }
    expect(await update.json()).toEqual(updated)
    expect(await (await app.request('/api/transactions')).json()).toEqual({ data: [updated] })
    expect(await (await app.request(path)).json()).toEqual(updated)

    const remove = await app.request(path, { method: 'DELETE' })
    expect(remove.status).toBe(204)
    expect(await remove.text()).toBe('')
    expect((await app.request(path)).status).toBe(404)
    expect(await (await app.request('/api/transactions')).json()).toEqual({ data: [] })
  })

  it('날짜와 같은 날짜의 ID를 내림차순으로 정렬한다', async () => {
    const older = await create({ ...input, date: '2025-12-31' })
    const first = await create({ ...input, date: '2026-01-01' })
    const second = await create({ ...input, date: '2026-01-01' })
    expect(await (await app.request('/api/transactions')).json()).toEqual({ data: [second, first, older] })
  })

  it('문자열 공백을 정리하고 생략한 카테고리는 미분류로 저장한다', async () => {
    const response = await write('POST', {
      type: 'income', amount: 1, date: '2024-02-29', description: '  환급  ',
    })
    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ description: '환급', category: '미분류' })
    const explicit = await create({ ...input, description: '  식사  ', category: '  식비  ' })
    expect(explicit).toMatchObject({ description: '식사', category: '식비' })
  })

  it('최대 안전 정수 금액을 정확하게 저장하고 조회한다', async () => {
    const transaction = await create({ ...input, amount: Number.MAX_SAFE_INTEGER })
    expect(await (await app.request(`/api/transactions/${transaction.id}`)).json()).toEqual(transaction)
    expect(transaction.amount).toBe(9007199254740991)
  })

  const invalidFields = [
    ['금액 0', { amount: 0 }], ['음수', { amount: -1 }], ['소수', { amount: 1.5 }],
    ['문자열 금액', { amount: '100' }], ['안전 정수 초과', { amount: Number.MAX_SAFE_INTEGER + 1 }],
    ['존재하지 않는 날짜', { date: '2026-02-30' }], ['평년의 윤일', { date: '2025-02-29' }],
    ['0년', { date: '0000-01-01' }], ['날짜 형식', { date: '2026-1-01' }],
    ['거래 종류', { type: 'transfer' }], ['빈 내역', { description: '   ' }],
    ['긴 내역', { description: 'a'.repeat(201) }], ['빈 카테고리', { category: '' }],
    ['긴 카테고리', { category: 'a'.repeat(51) }], ['알 수 없는 필드', { extra: true }],
  ] as const

  it.each(invalidFields)('%s 입력을 등록과 수정에서 거부하고 기존 데이터를 보존한다', async (_label, fields) => {
    const transaction = await create()
    const path = `/api/transactions/${transaction.id}`
    for (const response of [await write('POST', { ...input, ...fields }), await write('PATCH', fields, path)]) {
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR', details: expect.any(Array) } })
    }
    expect(await (await app.request('/api/transactions')).json()).toEqual({ data: [transaction] })
  })

  it('필수값 누락과 빈 수정 요청을 거부한다', async () => {
    const transaction = await create()
    for (const response of [await write('POST', {}), await write('PATCH', {}, `/api/transactions/${transaction.id}`)]) {
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
    }
  })

  it.each(['GET', 'PATCH', 'DELETE'])('%s에서 없는 거래는 공통 404 오류로 응답한다', async (method) => {
    const response = method === 'PATCH'
      ? await write('PATCH', { amount: 1 }, '/api/transactions/999')
      : await app.request('/api/transactions/999', { method })
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })

  it.each(['0', '-1', '1.5', 'abc', '9007199254740992'])('잘못된 ID %s를 거부한다', async (id) => {
    for (const response of [
      await app.request(`/api/transactions/${id}`),
      await write('PATCH', { amount: 1 }, `/api/transactions/${id}`),
      await app.request(`/api/transactions/${id}`, { method: 'DELETE' }),
    ]) {
      expect(response.status).toBe(400)
      expect(await response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } })
    }
  })

  it.each(['POST', 'PATCH'] as const)('%s의 잘못된 JSON을 공통 400 오류로 응답한다', async (method) => {
    const response = await app.request(method === 'POST' ? '/api/transactions' : '/api/transactions/1', {
      method, headers: { 'Content-Type': 'application/json' }, body: '{',
    })
    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_REQUEST' } })
  })

  it('DB 처리 실패의 내부 내용을 응답에 노출하지 않는다', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    database.close()
    const response = await app.request('/api/transactions')
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: { code: 'INTERNAL_ERROR', message: '요청을 처리하지 못했습니다.' } })
    expect(log).toHaveBeenCalled()
  })

  it('상태 확인과 OpenAPI·Swagger UI를 제공하고 알 수 없는 경로는 404로 응답한다', async () => {
    const health = await app.request('/api/health')
    expect(health.status).toBe(200)
    expect(await health.json()).toEqual({ status: 'ok', service: 'finance-server' })
    const schema = await app.request('/api/openapi.json')
    expect(schema.status).toBe(200)
    const document = await schema.json()
    expect(document).toMatchObject({
      paths: {
        '/api/transactions': { post: expect.any(Object) },
        '/api/transactions/{id}': { patch: expect.any(Object) },
      },
    })
    const docs = await app.request('/api/docs')
    expect(docs.status).toBe(200)
    expect(await docs.text()).toContain('/api/openapi.json')
    const missing = await app.request('/api/missing')
    expect(missing.status).toBe(404)
    expect(await missing.json()).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })
})
