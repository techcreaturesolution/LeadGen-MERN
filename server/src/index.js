import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { recoverJobs } from './services/jobQueue.js';

await connectDb();
await recoverJobs();
createApp().listen(env.port, () => console.log(`[api] listening on http://localhost:${env.port}`));
