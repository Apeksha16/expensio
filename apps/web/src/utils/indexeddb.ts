import Dexie, { Table } from 'dexie';

export interface MutationRecord {
  id: string; // uuid
  type: string; // e.g. 'CREATE_EXPENSE', 'UPDATE_EXPENSE', 'DELETE_EXPENSE', 'CREATE_BUDGET', etc.
  payload: any; // The request body
  createdAt: number;
  status: 'pending' | 'failed';
  retryCount: number;
}

export class ExpensioDB extends Dexie {
  mutations!: Table<MutationRecord, string>;

  constructor() {
    super('ExpensioOfflineDB');
    this.version(1).stores({
      mutations: 'id, type, status, createdAt', // Primary key and indexed props
    });
  }
}

export const db = new ExpensioDB();
