import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../backend/src/config/db.js';
import app from '../backend/src/app.js';

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection failed in serverless handler:', err);
  }

  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }

  return app(req, res);
}
