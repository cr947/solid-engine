import { runAgentLoop } from '../lib/agent';

const INTERVAL_MS = 30 * 60 * 1000;

async function executeAgent() {
  try {
    const result = await runAgentLoop();
    console.log(`Worker run complete: ${result.marketsAnalyzed} markets analyzed, ${result.picksSaved} picks saved.`);
  } catch (error) {
    console.error('Worker loop failed:', error);
  }
}

async function startWorker() {
  console.log('Agora Agent worker starting at', new Date().toISOString());
  await executeAgent();
  setInterval(async () => {
    console.log('Worker interval triggered at', new Date().toISOString());
    await executeAgent();
  }, INTERVAL_MS);
}

startWorker().catch((error) => {
  console.error('Worker startup error:', error);
  process.exit(1);
});
