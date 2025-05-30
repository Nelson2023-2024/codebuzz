import mongoose from "mongoose";
import dotenv, { configDotenv } from "dotenv"

configDotenv()
export async function connectToDB() {
  try {
    // Use process.env.MONGODB_URI as defined in docker-compose.yml
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("MongoDB connection URI is not defined. Please set MONGODB_URI environment variable.");
      // Optionally throw an error or exit the process if connection is critical
      // process.exit(1);
      return;
    }

    const conn = await mongoose.connect(mongoUri);

    console.log("Connected successfully to MONGODB", conn.connection.host);
  } catch (error) {
    console.error("Error connecting to the Database:", error.message);
  }
}