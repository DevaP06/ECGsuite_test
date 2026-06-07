import mongoose from 'mongoose';

let connectPromise = null;

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log('MONGO_URI not found, running without database');
      return null;
    }

    if (isDbConnected()) {
      return mongoose.connection;
    }

    if (!connectPromise) {
      connectPromise = mongoose.connect(process.env.MONGO_URI)
        .then((conn) => {
          console.log(`MongoDB connected ✅: ${conn.connection.host}`);
          return conn;
        })
        .catch((err) => {
          connectPromise = null;
          throw err;
        });
    }

    return connectPromise;
  } catch (err) {
    console.error('MongoDB connection error ❌:', err);
    connectPromise = null;
    return null;
  }
};

export const waitForDbReady = async (timeoutMs = 8000) => {
  if (!process.env.MONGO_URI) {
    return false;
  }

  if (isDbConnected()) {
    return true;
  }

  const connectionPromise = connectDB();
  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => resolve(false), timeoutMs);
  });

  try {
    const result = await Promise.race([connectionPromise, timeoutPromise]);
    return Boolean(result && isDbConnected());
  } catch (err) {
    console.error('Database readiness check failed ❌:', err);
    return false;
  }
};

export default connectDB;
