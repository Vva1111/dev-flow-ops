import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { migrateDatabase } from './migrations.ts'

const serverRoot = fileURLToPath(new URL('../../', import.meta.url))

export function openDatabase(path = process.env.FINANCE_DB_PATH ?? 'data/finance.db') {
  const databasePath = path === ':memory:' ? path : resolve(serverRoot, path)
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true })
  }

  const sqlite = new DatabaseSync(databasePath)

  try {
    sqlite.exec('PRAGMA busy_timeout = 5000')
    migrateDatabase(sqlite)
    const db = drizzle({ client: sqlite })

    return {
      db,
      close: () => {
        if (sqlite.isOpen) sqlite.close()
      },
    }
  } catch (error) {
    sqlite.close()
    throw error
  }
}

export type FinanceDatabase = ReturnType<typeof openDatabase>['db']
