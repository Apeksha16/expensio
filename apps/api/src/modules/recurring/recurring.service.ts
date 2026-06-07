import {
  recurringRepository,
  CreateRecurringInput,
  UpdateRecurringInput,
} from './recurring.repository.js';
import { NotFoundError, AppError } from '../../utils/errors.js';
import { nanoid } from 'nanoid';

export class RecurringService {
  async createRecurring(userId: string, data: Omit<CreateRecurringInput, 'id' | 'userId'>) {
    if (!data.nextGenerationDate) {
      data.nextGenerationDate = data.startDate;
    }

    return recurringRepository.create({
      ...data,
      id: nanoid(),
      userId,
    } as CreateRecurringInput);
  }

  async getRecurring(id: string, userId: string) {
    const item = await recurringRepository.findById(id, userId);
    if (!item) throw new NotFoundError('Recurring expense not found');
    return item;
  }

  async listRecurring(userId: string) {
    return recurringRepository.findMany(userId);
  }

  async updateRecurring(id: string, userId: string, data: UpdateRecurringInput) {
    const updated = await recurringRepository.update(id, userId, data);
    if (!updated) throw new NotFoundError('Recurring expense not found');
    return updated;
  }

  async deleteRecurring(id: string, userId: string) {
    await recurringRepository.delete(id, userId);
  }
}

export const recurringService = new RecurringService();
