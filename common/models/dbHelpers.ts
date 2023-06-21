import mongoose from "mongoose";
import Timer from "./timer";

export interface TimerModel {
	roomName: string;
	isPaused: boolean;
	isBreak: boolean;
	endTimestamp: Date;
	pausedAt?: Date;
	createdAt: Date;
	updatedAt: Date;
	originalDuration: number;
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

export const findTimer = async ({
	roomName,
}: {
	roomName: string;
}): Promise<TimerModel | undefined> => {
	const dbResponse = await readFromDb({ roomName });
	if (!dbResponse) {
		return undefined;
	}

	return dbResponse.endTimestamp > new Date() ? dbResponse : undefined;
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

	console.log("writeToDb", query, update);

	return Timer.findOneAndUpdate(query, update, {
		upsert: true,
	});
};
