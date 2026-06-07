export class BudgetNotFoundError extends Error {
  constructor(id: string) {
    super(`Budget with ID '${id}' was not found.`);
    this.name = 'BudgetNotFoundError';
  }
}

export class BudgetOverlapError extends Error {
  constructor(categoryId: string, message?: string) {
    super(
      message ||
        `A budget for category '${categoryId}' already exists within the specified time range.`
    );
    this.name = 'BudgetOverlapError';
  }
}

export class BudgetOwnershipError extends Error {
  constructor(budgetId: string, userId: string) {
    super(`Budget '${budgetId}' does not belong to user '${userId}'.`);
    this.name = 'BudgetOwnershipError';
  }
}

export class BudgetValidationError extends Error {
  public field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'BudgetValidationError';
    this.field = field;
  }
}

export class SalaryWarningResult extends Error {
  public isLimitExceedingSalary: boolean = true;
  constructor(message?: string) {
    super(message || 'Total monthly budgets exceed monthly salary limit.');
    this.name = 'SalaryWarningResult';
  }
}
