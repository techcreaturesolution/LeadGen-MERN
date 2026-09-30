import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import { recoverCampaigns } from './services/campaignQueue.js';
import { recoverJobs } from './services/jobQueue.js';
import { startRetention } from './services/retention.js';

await connectDb();
await recoverJobs();
await recoverCampaigns();
startRetention();
createApp().listen(env.port, () => console.log(`[api] listening on http://localhost:${env.port}`));
