import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';

export function startEmailWorker(redisConnection: Redis, logInfo: (msg: string) => void) {
  const worker = new Worker(
    'emails',
    async (job: Job) => {
      logInfo(`Processing job ${job.id}: Sending email to ${job.data.to}`);
      // Send email simulation
      return { success: true };
    },
    { 
      connection: redisConnection,
      concurrency: 1, 
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
  });

  return worker;
}
