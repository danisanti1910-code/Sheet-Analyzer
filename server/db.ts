import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "MONGODB_URI or DATABASE_URL must be set. Use your MongoDB Atlas connection string."
    );
  }
  return uri;
}

export async function connectDb(): Promise<typeof mongoose> {
  return mongoose.connect(getMongoUri());
}

export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
