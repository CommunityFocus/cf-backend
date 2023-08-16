import mongoose from "mongoose";
import Timer from "./timer";
import { ServerType } from "../types/socket/types";

export interface TimerModel {
	roomName: string;
	isPaused: boolean;
	isBreak: boolean;
	endTimestamp: Date;
	pausedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	originalDuration: number;
	updateLog: mongoose.Types.DocumentArray<{
		message: string;
		user: string;
		time: Date;
	}>;
}

export const readFromDb = async ({
	roomName,
}: {
	roomName: string;
}): Promise<TimerModel | undefined> => {
	const timer = await Timer.findOne({ roomName });

	if (!timer) {
		return undefined;
	}

	return timer;
};

export const modifyUpdateLog = async ({
	roomName,
	message,
	user,
	io,
}: {
	roomName: string;
	message: string;
	user: string;
	io: ServerType;
}): Promise<mongoose.UpdateWriteOpResult> => {
	io.to(roomName).emit("updateLog", {
		message,
		user,
		time: new Date(),
	});
	const query = { roomName };
	const update = {
		$push: {
			updateLog: {
				message,
				user,
			},
		},
	};

	return Timer.updateOne(query, update);
};

export const writeToDb = async ({
	roomName,
	isPaused,
	isBreak,
	endTimestamp,
	pausedAt,
	originalDuration,
}: Partial<TimerModel>): Promise<
	mongoose.Query<
		TimerModel | null,
		TimerModel,
		Record<string, unknown>,
		TimerModel
	>
> => {
	const query = { roomName };
	const update = {
		$set: {
			isPaused,
			isBreak,
			endTimestamp,
			pausedAt,
			updatedAt: new Date(),
			originalDuration,
		},
	};

	return Timer.findOneAndUpdate(query, update, {
		upsert: true,
	});
};
