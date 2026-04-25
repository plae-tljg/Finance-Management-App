import { Goal, GoalFields, UpdatableFields } from '../schemas/Goal';
import { GoalQueries } from '../schemas/Goal';
import { BaseRepository } from './BaseRepository';
import { QueryExecutor } from '../types';

export class GoalRepository implements BaseRepository<Goal> {
  constructor(private db: QueryExecutor) {}

  async findById(id: number): Promise<Goal | null> {
    const result = await this.db.executeQuery<Goal>(
      GoalQueries.FIND_BY_ID,
      [id]
    );
    return result.rows._array[0] || null;
  }

  async findAll(): Promise<Goal[]> {
    const result = await this.db.executeQuery<Goal>(
      GoalQueries.FIND_ALL
    );
    return result.rows._array;
  }

  async findActive(): Promise<Goal[]> {
    const result = await this.db.executeQuery<Goal>(
      GoalQueries.FIND_ACTIVE
    );
    return result.rows._array;
  }

  async findInProgress(): Promise<Goal[]> {
    const result = await this.db.executeQuery<Goal>(
      GoalQueries.FIND_IN_PROGRESS
    );
    return result.rows._array;
  }

  async findCompleted(): Promise<Goal[]> {
    const result = await this.db.executeQuery<Goal>(
      GoalQueries.FIND_COMPLETED
    );
    return result.rows._array;
  }

  async create(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const result = await this.db.executeQuery<Goal>(
      GoalQueries.INSERT,
      [
        goal.name,
        goal.targetAmount,
        goal.currentAmount ?? 0,
        goal.deadline ?? null,
        goal.icon,
        goal.color,
        goal.isCompleted ? 1 : 0,
        goal.isActive ? 1 : 0
      ]
    );

    if (!result.insertId) {
      throw new Error('Failed to create goal');
    }

    return {
      id: result.insertId,
      ...goal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async update(id: number, entity: Partial<Goal>): Promise<boolean> {
    const updates: { fields: string[]; values: any[] } = {
      fields: [],
      values: []
    };

    Object.entries(entity).forEach(([field, value]) => {
      if (value !== undefined && GoalFields.UPDATABLE.includes(field as UpdatableFields)) {
        if (field === 'isCompleted' || field === 'isActive') {
          updates.values.push(value ? 1 : 0);
        } else {
          updates.values.push(value);
        }
        updates.fields.push(field);
      }
    });

    if (updates.fields.length === 0) return false;

    const query = GoalQueries.generateUpdateQuery(updates.fields);
    updates.values.push(id);

    const result = await this.db.executeQuery<never>(query, updates.values);
    return (result.changes ?? 0) > 0;
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db.executeQuery(
      GoalQueries.DELETE,
      [id]
    );
    return (result.changes ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await this.db.executeQuery<{count: number}>(
      GoalQueries.COUNT_ALL
    );
    return result.rows._array[0]?.count ?? 0;
  }

  async updateProgress(id: number, currentAmount: number): Promise<boolean> {
    const result = await this.db.executeQuery(
      GoalQueries.UPDATE_PROGRESS,
      [currentAmount, id]
    );
    return (result.changes ?? 0) > 0;
  }

  async addToProgress(id: number, amount: number): Promise<boolean> {
    const goal = await this.findById(id);
    if (!goal) return false;
    const newAmount = goal.currentAmount + amount;
    return this.updateProgress(id, newAmount);
  }
}