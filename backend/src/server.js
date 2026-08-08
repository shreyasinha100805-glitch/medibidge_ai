import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import app from './app.js';
import connectDB from './config/db.js';
import { runReminderCycle } from './services/reminderService.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 MediBridge AI backend running on port ${PORT}`);
  });

  cron.schedule('* * * * *', async () => {
    try {
      const result = await runReminderCycle();
      if (result.missedProcessed > 0) {
        console.log(
          `⏰ Reminder cycle: checked ${result.patientsChecked} patients, ${result.missedProcessed} dose(s) marked MISSED.`
        );
      }
    } catch (err) {
      console.error('Reminder cycle error:', err.message);
    }
  });

  console.log('⏱️  Missed-dose detection cron job scheduled (every minute).');
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});