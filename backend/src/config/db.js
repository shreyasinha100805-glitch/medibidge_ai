import mongoose from 'mongoose';

const mongoTimeoutMs = Number(process.env.MONGODB_TIMEOUT_MS) || 10000;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose.connection;
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is not configured in environment variables.');
    }

    const opts = {
      serverSelectionTimeoutMS: mongoTimeoutMs,
      connectTimeoutMS: mongoTimeoutMs,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`✅ MongoDB connected: ${m.connection.host}`);
      return m.connection;
    }).catch((err) => {
      cached.promise = null;
      console.error(`❌ Failed to connect to MongoDB: ${err.message}`);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

export default connectDB;
