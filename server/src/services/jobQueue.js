import { env } from '../config/env.js';
import { SearchJob } from '../models/SearchJob.js';
import { runSearchJob } from './pipeline.js';

const queue = [];
let running = 0;

function pump() {
  while (running < env.maxConcurrentJobs && queue.length) {
    const id = queue.shift();
    running += 1;
    runSearchJob(id)
      .catch((err) => console.error(`[queue] job ${id} crashed`, err))
      .finally(() => {
        running -= 1;
        pump();
      });
  }
}

export function enqueueJob(id) {
  queue.push(String(id));
  pump();
}

export async function recoverJobs() {
  await SearchJob.updateMany(
    { status: 'running' },
    { $set: { status: 'failed', error: 'Server restarted while job was running', finishedAt: new Date(), 'progress.stage': 'failed' } },
  );
  const queued = await SearchJob.find({ status: 'queued' }).sort({ createdAt: 1 }).select('_id');
  queued.forEach((j) => enqueueJob(j._id));
}
