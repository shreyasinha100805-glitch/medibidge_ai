import mongoose from 'mongoose';

const DEFAULT_MONGODB_URI = 'mongodb+srv://shreyasinha100805_db_user:3304T6v7piVWWbJb@medibridge-ai.2vphpdv.mongodb.net/?appName=medibridge-ai';

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) {
      return mongoose.connection;
    }

    const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

    return conn;
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
    throw error;
  }
};

export default connectDB;
