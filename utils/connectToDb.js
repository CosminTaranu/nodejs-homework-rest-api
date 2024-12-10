import mongoose from "mongoose";

async function connectToDb() {
  try {
    await mongoose.connect(
      "mongodb+srv://ctaranu83:1clCyUDRUd8LmH4P@cluster0.ext7b.mongodb.net/"
    );
    console.log("Database connection successful");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

export default connectToDb;