import { readFileSync } from 'node:fs'
import type { DatabaseSync } from 'node:sqlite'

const migrations = [
  { version: 1, file: new URL('../../migrations/0001_transactions.sql', import.meta.url) },
]

export function migrateDatabase(sqlite: DatabaseSync) {
  sqlite.exec('BEGIN IMMEDIATE')

  try {
    const { user_version: currentVersion } = sqlite.prepare('PRAGMA user_version').get() as { user_version: number }
    if (currentVersion > migrations[migrations.length - 1].version) {
      throw new Error('DB 버전이 현재 서버보다 높아 실행할 수 없습니다.')
    }

    for (const migration of migrations) {
      if (migration.version > currentVersion) {
        sqlite.exec(readFileSync(migration.file, 'utf8'))
        sqlite.exec(`PRAGMA user_version = ${migration.version}`)
      }
    }

    sqlite.exec('COMMIT')
  } catch (error) {
    sqlite.exec('ROLLBACK')
    throw error
  }
}
