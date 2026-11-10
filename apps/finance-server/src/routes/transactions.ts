import type { OpenAPIHono } from '@hono/zod-openapi'
import { desc, eq } from 'drizzle-orm'
import type { FinanceDatabase } from '../db/client.ts'
import { transactions } from '../db/schema.ts'
import { transactionRoutes } from './transactions.contract.ts'

const notFound = { error: { code: 'NOT_FOUND', message: '거래 내역을 찾을 수 없습니다.' } } as const

export function registerTransactionRoutes(app: OpenAPIHono, db: FinanceDatabase) {
  app.openapi(transactionRoutes.list, async (c) => {
    const data = await db.select().from(transactions).orderBy(desc(transactions.date), desc(transactions.id))
    return c.json({ data }, 200)
  })

  app.openapi(transactionRoutes.get, async (c) => {
    const { id } = c.req.valid('param')
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
    if (!transaction) return c.json(notFound, 404)
    return c.json(transaction, 200)
  })

  app.openapi(transactionRoutes.create, async (c) => {
    const input = c.req.valid('json')
    const [transaction] = await db.insert(transactions).values(input).returning()
    return c.json(transaction, 201)
  })

  app.openapi(transactionRoutes.update, async (c) => {
    const { id } = c.req.valid('param')
    const input = c.req.valid('json')
    const [transaction] = await db.update(transactions).set(input).where(eq(transactions.id, id)).returning()
    if (!transaction) return c.json(notFound, 404)
    return c.json(transaction, 200)
  })

  app.openapi(transactionRoutes.delete, async (c) => {
    const { id } = c.req.valid('param')
    const [transaction] = await db.delete(transactions).where(eq(transactions.id, id))
      .returning({ id: transactions.id })
    if (!transaction) return c.json(notFound, 404)
    return c.body(null, 204)
  })
}
