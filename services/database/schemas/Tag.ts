export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export const TagQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
  `,

  INSERT: `
    INSERT INTO tags (name, color)
    VALUES (?, ?)
  `,

  UPDATE: `
    UPDATE tags
    SET name = COALESCE(?, name),
        color = COALESCE(?, color),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  DELETE: 'DELETE FROM tags WHERE id = ?',

  FIND_BY_ID: 'SELECT * FROM tags WHERE id = ?',

  FIND_ALL: 'SELECT * FROM tags ORDER BY name ASC',

  FIND_BY_NAME: 'SELECT * FROM tags WHERE name = ?',

  COUNT_ALL: 'SELECT COUNT(*) as count FROM tags',
};

export interface TransactionTag {
  transactionId: number;
  tagId: number;
}

export const TransactionTagQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS transaction_tags (
      transactionId INTEGER NOT NULL,
      tagId INTEGER NOT NULL,
      PRIMARY KEY (transactionId, tagId),
      FOREIGN KEY (transactionId) REFERENCES transactions(id) ON DELETE CASCADE,
      FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
    )
  `,

  INSERT: `
    INSERT INTO transaction_tags (transactionId, tagId)
    VALUES (?, ?)
  `,

  DELETE: 'DELETE FROM transaction_tags WHERE transactionId = ? AND tagId = ?',

  DELETE_BY_TRANSACTION: 'DELETE FROM transaction_tags WHERE transactionId = ?',

  FIND_BY_TRANSACTION: `
    SELECT t.* FROM tags t
    INNER JOIN transaction_tags tt ON t.id = tt.tagId
    WHERE tt.transactionId = ?
  `,

  FIND_BY_TAG: `
    SELECT tr.* FROM transactions tr
    INNER JOIN transaction_tags tt ON tr.id = tt.transactionId
    WHERE tt.tagId = ?
  `,
};