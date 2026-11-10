import { swaggerUI } from '@hono/swagger-ui'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { HTTPException } from 'hono/http-exception'
import type { FinanceDatabase } from './db/client.ts'
import { registerTransactionRoutes } from './routes/transactions.ts'

export function createApp(db: FinanceDatabase) {
  const app = new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json({
          error: {
            code: 'VALIDATION_ERROR' as const,
            message: '입력값을 확인해 주세요.',
            details: result.error.issues.map((issue) => ({
              path: issue.path.map(String).join('.'), message: issue.message,
            })),
          },
        }, 400)
      }
    },
  })

  app.openapi(createRoute({
    method: 'get', path: '/api/health', tags: ['서버'], summary: '서버 상태 확인',
    description: '서버 프로세스의 응답 여부를 확인합니다. DB 상태 검사는 포함하지 않습니다.',
    responses: {
      200: {
        description: '서버 응답 정상',
        content: {
          'application/json': {
            schema: z.object({ status: z.literal('ok'), service: z.literal('finance-server') }),
          },
        },
      },
    },
  }), (c) => c.json({ status: 'ok' as const, service: 'finance-server' as const }, 200))

  registerTransactionRoutes(app, db)

  app.doc('/api/openapi.json', {
    openapi: '3.0.0',
    info: { title: 'Finance API', version: '0.1.0', description: '수입·지출 기록 API' },
  })
  app.get('/api/docs', swaggerUI({
    url: '/api/openapi.json', title: 'Finance API 문서', validatorUrl: '',
  }))

  app.notFound((c) => c.json({
    error: { code: 'NOT_FOUND', message: '요청한 경로를 찾을 수 없습니다.' },
  }, 404))

  app.onError((error, c) => {
    if (error instanceof HTTPException && error.status === 400) {
      return c.json({ error: { code: 'INVALID_REQUEST', message: '올바른 JSON 요청을 보내 주세요.' } }, 400)
    }

    console.error('Finance API 처리 실패:', error)
    return c.json({ error: { code: 'INTERNAL_ERROR', message: '요청을 처리하지 못했습니다.' } }, 500)
  })

  return app
}
