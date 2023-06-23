import mongoose from "mongoose";

const updateLogSchema = new mongoose.Schema({
	timestamp: {
		type: Date,
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	user: {
		type: String,
		required: true,
	},
});

const timerSchema = new mongoose.Schema({
	roomName: {
		type: String,
		required: true,
	},
	isPaused: {
		type: Boolean,
		required: true,
		default: false,
	},
	isBreak: {
		type: Boolean,
		required: true,
		default: false,
	},
	endTimestamp: {
		type: Date,
		required: true,
	},
	pausedAt: {
		type: Date,
		required: false,
	},
	originalDuration: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		required: true,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
		required: true,
	},
	updateLog: {
		type: [updateLogSchema],
		required: false,
	},
});

const Timer = mongoose.model("Timer", timerSchema);

export default Timer;
