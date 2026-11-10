import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  amount: integer('amount').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull().default('미분류'),
}, (table) => [
  check('transactions_type_check', sql`${table.type} IN ('income', 'expense')`),
  check('transactions_amount_check', sql`typeof(${table.amount}) = 'integer' AND ${table.amount} BETWEEN 1 AND 9007199254740991`),
  check('transactions_date_check', sql`length(${table.date}) = 10 AND ${table.date} BETWEEN '0001-01-01' AND '9999-12-31' AND date(${table.date}, '+0 days') IS NOT NULL AND date(${table.date}, '+0 days') = ${table.date}`),
  check('transactions_description_check', sql`length(trim(${table.description})) BETWEEN 1 AND 200`),
  check('transactions_category_check', sql`length(trim(${table.category})) BETWEEN 1 AND 50`),
])
