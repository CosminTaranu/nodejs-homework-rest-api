import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); 

async function connectToDb() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MongoDB URI is not defined!');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log("Database connection successful");
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
}

export default connectToDb;
