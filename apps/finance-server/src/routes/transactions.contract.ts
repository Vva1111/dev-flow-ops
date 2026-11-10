import { createRoute, z } from '@hono/zod-openapi'

const transactionFields = {
  type: z.enum(['income', 'expense']).openapi({ description: '수입 또는 지출', example: 'expense' }),
  amount: z.number().int().positive().max(Number.MAX_SAFE_INTEGER)
    .openapi({ description: '원 단위의 양의 정수 금액', example: 12000 }),
  date: z.iso.date().refine((value) => value >= '0001-01-01', '유효한 날짜를 입력해 주세요.')
    .openapi({ description: '거래 날짜, YYYY-MM-DD', example: '2026-11-10' }),
  description: z.string().trim().min(1).max(200)
    .openapi({ description: '거래 내역', example: '점심 식사' }),
  category: z.string().trim().min(1).max(50)
    .openapi({ description: '카테고리 이름', example: '식비' }),
}

export const TransactionSchema = z.object({
  id: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).openapi({ example: 1 }),
  ...transactionFields,
}).openapi('Transaction')

export const CreateTransactionSchema = z.strictObject({
  ...transactionFields,
  category: transactionFields.category.optional().openapi({ description: '생략하면 미분류로 저장' }),
}).openapi('CreateTransaction')

export const UpdateTransactionSchema = z.strictObject(transactionFields).partial()
  .refine((value) => Object.keys(value).length > 0, '수정할 항목을 하나 이상 입력해 주세요.')
  .openapi('UpdateTransaction')

const TransactionParamsSchema = z.object({
  id: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)
    .openapi({ param: { name: 'id', in: 'path' }, description: '거래 ID', example: 1 }),
})

export const ErrorSchema = z.object({
  error: z.object({
    code: z.enum(['VALIDATION_ERROR', 'INVALID_REQUEST', 'NOT_FOUND', 'INTERNAL_ERROR']),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
}).openapi('ApiError')

const validationError = {
  description: '요청 형식 또는 입력값 오류',
  content: { 'application/json': { schema: ErrorSchema } },
}

const notFound = {
  description: '해당 거래가 없음',
  content: { 'application/json': { schema: ErrorSchema } },
}

const internalError = {
  description: '서버 처리 실패',
  content: { 'application/json': { schema: ErrorSchema } },
}

const transactionResponse = {
  description: '거래 내역',
  content: { 'application/json': { schema: TransactionSchema } },
}

export const transactionRoutes = {
  list: createRoute({
    method: 'get', path: '/api/transactions', tags: ['수입·지출'],
    summary: '수입·지출 목록 조회',
    description: '거래 날짜와 ID의 내림차순으로 전체 내역을 반환합니다.',
    responses: {
      200: {
        description: '거래 목록, 내역이 없으면 빈 배열',
        content: { 'application/json': { schema: z.object({ data: z.array(TransactionSchema) }) } },
      },
      500: internalError,
    },
  }),
  get: createRoute({
    method: 'get', path: '/api/transactions/{id}', tags: ['수입·지출'],
    summary: '수입·지출 단건 조회',
    request: { params: TransactionParamsSchema },
    responses: { 200: transactionResponse, 400: validationError, 404: notFound, 500: internalError },
  }),
  create: createRoute({
    method: 'post', path: '/api/transactions', tags: ['수입·지출'],
    summary: '수입·지출 등록',
    request: {
      body: { required: true, content: { 'application/json': { schema: CreateTransactionSchema } } },
    },
    responses: {
      201: { ...transactionResponse, description: '등록된 거래 내역' },
      400: validationError,
      500: internalError,
    },
  }),
  update: createRoute({
    method: 'patch', path: '/api/transactions/{id}', tags: ['수입·지출'],
    summary: '수입·지출 수정',
    description: '전달한 항목만 수정합니다. 빈 객체와 정의하지 않은 항목은 허용하지 않습니다.',
    request: {
      params: TransactionParamsSchema,
      body: { required: true, content: { 'application/json': { schema: UpdateTransactionSchema } } },
    },
    responses: { 200: transactionResponse, 400: validationError, 404: notFound, 500: internalError },
  }),
  delete: createRoute({
    method: 'delete', path: '/api/transactions/{id}', tags: ['수입·지출'],
    summary: '수입·지출 삭제',
    request: { params: TransactionParamsSchema },
    responses: {
      204: { description: '삭제 완료, 응답 본문 없음' },
      400: validationError,
      404: notFound,
      500: internalError,
    },
  }),
}
