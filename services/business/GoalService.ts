import { GoalRepository } from '../database/repositories/GoalRepository';
import type { Goal } from '../database/schemas/Goal';
import { DatabaseService } from '../database/DatabaseService';

export function useGoalService(databaseService: DatabaseService) {
  const repository = new GoalRepository(databaseService);

  const getGoals = async () => {
    return await repository.findAll();
  };

  const getActiveGoals = async () => {
    return await repository.findActive();
  };

  const getGoalsInProgress = async () => {
    return await repository.findInProgress();
  };

  const getCompletedGoals = async () => {
    return await repository.findCompleted();
  };

  const getGoalById = async (id: number) => {
    return await repository.findById(id);
  };

  const createGoal = async (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    return await repository.create(goal);
  };

  const updateGoal = async (id: number, goal: Partial<Goal>) => {
    return await repository.update(id, goal);
  };

  const deleteGoal = async (id: number) => {
    return await repository.delete(id);
  };

  const updateGoalProgress = async (id: number, currentAmount: number) => {
    return await repository.updateProgress(id, currentAmount);
  };

  const addToGoalProgress = async (id: number, amount: number) => {
    return await repository.addToProgress(id, amount);
  };

  return {
    getGoals,
    getActiveGoals,
    getGoalsInProgress,
    getCompletedGoals,
    getGoalById,
    createGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    addToGoalProgress
  };
}