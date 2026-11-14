import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.ts'
import { openDatabase } from '../src/db/client.ts'
import { migrateDatabase } from '../src/db/migrations.ts'

const directories: string[] = []
const connections: Array<{ close: () => void }> = []
afterEach(() => {
  for (const connection of connections.splice(0)) connection.close()
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function memoryDatabase() {
  const sqlite = new DatabaseSync(':memory:')
  connections.push({ close: () => { if (sqlite.isOpen) sqlite.close() } })
  return sqlite
}

describe('SQLite 저장과 마이그레이션', () => {
  it('같은 파일을 다시 열어도 내역을 보존하고 마이그레이션을 중복 적용하지 않는다', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'devflowops-finance-unit-'))
    directories.push(directory)
    const path = join(directory, 'nested', 'test.db')
    const first = openDatabase(path)
    connections.push(first)
    const input = { type: 'income', amount: 12345, date: '2026-11-14', description: '수입' }
    const response = await createApp(first.db).request('/api/transactions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    })
    expect(response.status).toBe(201)
    const saved = await response.json()
    first.close()
    const reopened = openDatabase(path)
    connections.push(reopened)
    expect(await (await createApp(reopened.db).request('/api/transactions')).json()).toEqual({ data: [saved] })
  })

  it('현재 버전보다 높은 DB를 거부하고 버전과 기존 데이터를 유지한다', () => {
    const sqlite = memoryDatabase()
    sqlite.exec("CREATE TABLE preserved (value TEXT); INSERT INTO preserved VALUES ('keep'); PRAGMA user_version = 2")
    expect(() => migrateDatabase(sqlite)).toThrow('DB 버전이 현재 서버보다 높아')
    expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 2 })
    expect(sqlite.prepare('SELECT value FROM preserved').get()).toMatchObject({ value: 'keep' })
    expect(sqlite.isTransaction).toBe(false)
  })

  it('마이그레이션 SQL 실패 시 버전을 올리지 않고 트랜잭션을 종료한다', () => {
    const sqlite = memoryDatabase()
    sqlite.exec('CREATE TABLE transactions (existing TEXT)')
    expect(() => migrateDatabase(sqlite)).toThrow()
    expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 0 })
    expect(sqlite.prepare('PRAGMA table_info(transactions)').all()).toEqual([
      expect.objectContaining({ name: 'existing' }),
    ])
    expect(sqlite.isTransaction).toBe(false)
  })

  it('HTTP 검증을 거치지 않아도 SQL 제약조건이 잘못된 데이터를 거부한다', () => {
    const sqlite = memoryDatabase()
    migrateDatabase(sqlite)
    const insert = sqlite.prepare('INSERT INTO transactions (type, amount, date, description, category) VALUES (?, ?, ?, ?, ?)')
    const invalidRows = [
      ['transfer', 1, '2026-11-14', '기록', '식비'],
      ['expense', 0, '2026-11-14', '기록', '식비'],
      ['expense', 1.5, '2026-11-14', '기록', '식비'],
      ['expense', 1, '2026-02-30', '기록', '식비'],
      ['expense', 1, '2026-11-14', ' ', '식비'],
      ['expense', 1, '2026-11-14', '기록', ''],
    ] as const
    for (const row of invalidRows) expect(() => insert.run(...row)).toThrow(/CHECK constraint failed/)
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get()).toMatchObject({ count: 0 })
    insert.run('expense', 1, '2024-02-29', '정상', '식비')
    expect(sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get()).toMatchObject({ count: 1 })
  })
})
