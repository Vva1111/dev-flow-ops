import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { createApp } from '../src/app.ts'
import { openDatabase } from '../src/db/client.ts'

// 실행마다 새 임시 DB를 사용하며 FINANCE_DB_PATH와 기본 DB는 사용하지 않는다.
const directory = mkdtempSync(join(tmpdir(), 'devflowops-finance-e2e-'))
let database
try {
  database = openDatabase(join(directory, 'finance.db'))
} catch (error) {
  rmSync(directory, { recursive: true, force: true })
  throw error
}

const server = serve({
  fetch: createApp(database.db).fetch,
  hostname: '127.0.0.1',
  port: 3101,
})

let cleaned = false
function cleanup() {
  if (cleaned) return
  cleaned = true
  database.close()
  rmSync(directory, { recursive: true, force: true })
}

function shutdown() {
  server.close()
  server.closeAllConnections()
  // 실행기가 상위 셸 종료를 감지하기 전에 동기적으로 임시 파일을 정리한다.
  cleanup()
}

server.once('close', cleanup)
server.once('error', (error) => {
  cleanup()
  console.error('E2E 서버 실행 실패:', error)
  process.exitCode = 1
})

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
process.once('exit', cleanup)
