import mongoose from "mongoose";

const updateLogSchema = new mongoose.Schema({
	message: {
		type: String,
		required: true,
	},
	user: {
		type: String,
		required: true,
	},
	time: {
		type: Date,
		required: true,
		default: Date.now,
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
	},
	isBreak: {
		type: Boolean,
		required: true,
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
	updateLog: [updateLogSchema],
});

const Timer = mongoose.model("Timer", timerSchema);

export default Timer;
