export interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  icon: string;
  color: string;
  isCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const GoalFields = {
  UPDATABLE: ['name', 'targetAmount', 'currentAmount', 'deadline', 'icon', 'color', 'isCompleted', 'isActive'] as const,
  REQUIRED: ['name', 'targetAmount', 'icon', 'color'] as const,
  OPTIONAL: ['currentAmount', 'deadline', 'isCompleted', 'isActive'] as const,
};

export type UpdatableFields = typeof GoalFields.UPDATABLE[number];
export type RequiredFields = typeof GoalFields.REQUIRED[number];

export const GoalQueries = {
  CREATE_TABLE: `
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      targetAmount DECIMAL(10,2) NOT NULL,
      currentAmount DECIMAL(10,2) DEFAULT 0,
      deadline TEXT,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      isCompleted INTEGER DEFAULT 0,
      isActive INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  CREATE_INDEXES: `
    CREATE INDEX IF NOT EXISTS idx_goals_isActive ON goals(isActive);
    CREATE INDEX IF NOT EXISTS idx_goals_isCompleted ON goals(isCompleted);
  `,

  INSERT: `
    INSERT INTO goals (name, targetAmount, currentAmount, deadline, icon, color, isCompleted, isActive)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,

  UPDATE: `
    UPDATE goals
    SET name = COALESCE(?, name),
        targetAmount = COALESCE(?, targetAmount),
        currentAmount = COALESCE(?, currentAmount),
        deadline = COALESCE(?, deadline),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        isCompleted = COALESCE(?, isCompleted),
        isActive = COALESCE(?, isActive),
        updatedAt = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  DELETE: 'DELETE FROM goals WHERE id = ?',

  FIND_BY_ID: 'SELECT * FROM goals WHERE id = ?',

  FIND_ALL: 'SELECT * FROM goals ORDER BY createdAt DESC',

  FIND_ACTIVE: 'SELECT * FROM goals WHERE isActive = 1 ORDER BY createdAt DESC',

  FIND_IN_PROGRESS: 'SELECT * FROM goals WHERE isActive = 1 AND isCompleted = 0 ORDER BY deadline ASC',

  FIND_COMPLETED: 'SELECT * FROM goals WHERE isCompleted = 1 ORDER BY updatedAt DESC',

  COUNT_ALL: 'SELECT COUNT(*) as count FROM goals',

  UPDATE_PROGRESS: 'UPDATE goals SET currentAmount = ?, isCompleted = CASE WHEN currentAmount >= targetAmount THEN 1 ELSE 0 END, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',

  generateUpdateQuery: (fields: string[]): string => {
    const setClause = fields.map(field => {
      const dbField = field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      return `${dbField} = ?`;
    }).join(', ');
    return `UPDATE goals SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
  },
};