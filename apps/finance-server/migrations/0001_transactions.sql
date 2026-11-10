CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '미분류',
  CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense')),
  CONSTRAINT transactions_amount_check CHECK (
    typeof(amount) = 'integer' AND amount BETWEEN 1 AND 9007199254740991
  ),
  CONSTRAINT transactions_date_check CHECK (
    length(date) = 10 AND date BETWEEN '0001-01-01' AND '9999-12-31'
    AND date(date, '+0 days') IS NOT NULL AND date(date, '+0 days') = date
  ),
  CONSTRAINT transactions_description_check CHECK (length(trim(description)) BETWEEN 1 AND 200),
  CONSTRAINT transactions_category_check CHECK (length(trim(category)) BETWEEN 1 AND 50)
);
