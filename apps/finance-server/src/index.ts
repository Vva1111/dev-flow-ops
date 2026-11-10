import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { openDatabase } from './db/client.ts'

const database = openDatabase()
const app = createApp(database.db)

const server = serve({ fetch: app.fetch, hostname: '127.0.0.1', port: 3001 }, (info) => {
  console.log(`Finance 서버 실행: http://127.0.0.1:${info.port}`)
})

server.on('error', (error) => {
  database.close()
  console.error('Finance 서버 실행 실패:', error)
  process.exitCode = 1
})

const shutdown = () => {
  server.close((error) => {
    database.close()
    if (error) {
      console.error('Finance 서버 종료 실패:', error)
      process.exitCode = 1
    }
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
