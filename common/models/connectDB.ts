import mongoose from "mongoose";
import dotenv from "dotenv";
import DB_SHARED from "./db_default";

dotenv.config();

const DB_STRING = process.env.DB_STRING || DB_SHARED;

const connectDB = async (): Promise<void> => {
	try {
		// mongoose setup
		const conn = await mongoose.connect(DB_STRING);
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
};

export default connectDB;
