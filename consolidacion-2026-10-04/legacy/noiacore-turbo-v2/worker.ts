import 'dotenv/config';
import { taskQueue } from '@/lib/job-queue';
import { db } from '@/lib/db';
import { publishTaskUpdate, publishNotification } from '@/lib/websocket-server';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

console.log('🚀 Job Worker Started');

// Process queue events
taskQueue.on('error', (error) => {
  console.error('Queue Error:', error);
  redis.lpush('errors:queue', JSON.stringify({ error: error.message, timestamp: new Date() }));
});

taskQueue.on('failed', async (job, error) => {
  console.error(`❌ Job ${job.id} failed:`, error.message);

  const taskId = job.data.taskId;
  const userId = job.data.userId;

  await publishNotification(userId, `Task failed: ${error.message}`, 'error');
  await publishTaskUpdate(userId, taskId, { status: 'failed', error: error.message });
});

taskQueue.on('completed', async (job) => {
  console.log(`✅ Job ${job.id} completed`);

  const taskId = job.data.taskId;
  const userId = job.data.userId;

  const task = await db.task.findUnique({ where: { id: taskId } });
  if (task) {
    await publishNotification(userId, `Task completed: $${task.cost?.toFixed(2)}`, 'success');
  }
});

taskQueue.on('active', async (job) => {
  console.log(`⚙️ Job ${job.id} started`);

  const taskId = job.data.taskId;
  const userId = job.data.userId;

  await publishTaskUpdate(userId, taskId, { status: 'running' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⏹️ Shutting down gracefully...');
  await taskQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('⏹️ Shutting down gracefully...');
  await taskQueue.close();
  process.exit(0);
});

console.log('👂 Worker listening for jobs...');
