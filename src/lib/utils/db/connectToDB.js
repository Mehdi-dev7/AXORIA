import mongoose from "mongoose";

export async function connectToDB() {
	if (mongoose.connection.readyState) {
		console.log("Using existing DB connection:", mongoose.connection.name);
		return;
	}
  try {
    await mongoose.connect(process.env.MONGO)
    console.log("Connected to database:", mongoose.connection.name);
  }
  catch(err) {
    throw new Error("Failed to connect to database");
  }
}
