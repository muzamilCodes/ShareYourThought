import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';
import { seedCategories } from './utils/seedCategories.js';

async function startServer() {
  await connectDB();
  await seedCategories();
  app.listen(env.port, () => {
    console.log(`ThoughtShare API running on port ${env.port} in ${env.nodeEnv} mode`);
  });
}

startServer().catch((error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
