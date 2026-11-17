import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import cron from 'node-cron';
import app from './app.js';
import connectDB from './config/db.js';
import { runReminderCycle } from './services/reminderService.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`🚀 MediBridge AI backend running on port ${PORT}`);
  });

  try {
    await connectDB();
  } catch {
    // The health route must remain reachable while MongoDB is unavailable.
    // Database-backed API requests retry through the existing app middleware.
    console.error('Initial MongoDB connection failed; health checks remain available.');
  }

  cron.schedule('* * * * *', async () => {
    try {
      await connectDB();
      const result = await runReminderCycle();
      if (result.missedProcessed > 0) {
        console.log(
          `⏰ Reminder cycle: checked ${result.patientsChecked} patients, ${result.missedProcessed} dose(s) marked MISSED.`
        );
      }
    } catch (err) {
      console.error('Reminder cycle failed.', err.name || 'Error');
    }
  });

  console.log('⏱️  Missed-dose detection cron job scheduled (every minute).');
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err?.name || 'Error');
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err?.name || 'Error');
  process.exit(1);
});
