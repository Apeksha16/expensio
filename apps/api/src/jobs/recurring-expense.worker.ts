import { recurringRepository } from '../modules/recurring/recurring.repository.js';
import { eventBus } from '../utils/event.bus.js';
export class RecurringExpenseWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMs = 1000 * 60 * 60) {
    // Default 1 hour
    if (this.timer) return;

    console.log('Started Recurring Expense Worker');

    // Run immediately on start, then periodically
    this.process();
    this.timer = setInterval(() => this.process(), intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async process() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Process in batches until no more pending rows are found
      let hasMore = true;
      while (hasMore) {
        const { processedIds, generatedExpenses } =
          await recurringRepository.processPendingExpenses(100);

        if (processedIds.length === 0) {
          hasMore = false;
        } else {
          console.log(
            `Processed ${processedIds.length} recurring expenses, generated ${generatedExpenses.length} expenses.`
          );

          // Events are now emitted via Outbox Worker using the Transactional Outbox pattern
        }
      }
    } catch (err) {
      console.error('Error in RecurringExpenseWorker', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const recurringExpenseWorker = new RecurringExpenseWorker();
