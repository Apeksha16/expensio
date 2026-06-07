import test, { describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { eventBus } from '../../../utils/event.bus.js';
import { notificationService } from '../notification.service.js';
import { notificationRepository } from '../notification.repository.js';
import { socketManagerInstance } from '../../../sockets/socket.manager.js';

describe('Notification Pipeline Integrations', () => {
  before(() => {
    notificationService.initialize();
  });

  after(() => {
    mock.restoreAll();
    eventBus.removeAllListeners();
  });

  test('Should insert notification and emit socket on budget.threshold.crossed', async () => {
    let mockNotif = { id: 'n1', title: 'test', body: 'test' };
    const createMock = mock.method(
      notificationRepository,
      'createNotification',
      async () => mockNotif
    );

    let emittedRooms: string[] = [];
    let emittedEvents: string[] = [];

    // Mock socket emission
    mock.method(socketManagerInstance, 'emitToUser', (userId: string, eventName: string) => {
      emittedRooms.push(userId);
      emittedEvents.push(eventName);
    });

    await eventBus.publish('budget.threshold.crossed', {
      userId: 'user_notif_1',
      budgetId: 'b1',
      categoryId: 'Food',
      utilization: 85,
      threshold: 80,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.strictEqual(createMock.mock.callCount(), 1);
    const callArgs = createMock.mock.calls[0].arguments;
    assert.strictEqual(callArgs[0], 'user_notif_1');
    assert.strictEqual(callArgs[1], 'budget_threshold');
    assert.ok((callArgs[3] as string).includes('85% consumed'));

    assert.ok(emittedRooms.includes('user_notif_1'));
    assert.ok(emittedEvents.includes('budget.threshold.crossed'));
    assert.ok(emittedEvents.includes('notification.new'));
  });
});
