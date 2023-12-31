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
	workTimerButtons: number[];
	breakTimerButtons: number[];
	originalDuration: number;
	messageHistory: {
		userName: string;
		message: string;
		date?: Date;
	}[];
	workTitle: string;
	breakTitle: string;
	isPublic: boolean;
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

	return timer.toObject() as TimerModel;
};

export const writeToDb = async ({
	roomName,
	isPaused,
	isBreak,
	endTimestamp,
	pausedAt,
	originalDuration,
	workTimerButtons,
	breakTimerButtons,
	workTitle,
	breakTitle,
	isPublic,
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
			workTimerButtons,
			breakTimerButtons,
			workTitle,
			breakTitle,
			isPublic,
		},
	};

	return Timer.findOneAndUpdate(query, update, {
		upsert: true,
	});
};

export const writeMessageToDb = async ({
	roomName,
	userName,
	message,
}: {
	roomName: string;
	userName: string;
	message: string;
}): Promise<
	mongoose.Query<TimerModel, TimerModel, Record<string, unknown>, TimerModel>
> => {
	const query = { roomName };
	const update = {
		$push: {
			messageHistory: {
				userName,
				message,
			},
		},
	};

	return Timer.findOneAndUpdate(query, update, {
		upsert: false,
		new: true,
	}) as mongoose.Query<
		TimerModel,
		TimerModel,
		Record<string, unknown>,
		TimerModel
	>;
};

export const readMessageFromDb = async ({
	roomName,
}: {
	roomName: string;
}): Promise<{ messageHistory: TimerModel["messageHistory"] } | undefined> => {
	const timer = await readFromDb({ roomName });

	if (!timer) {
		return undefined;
	}

	return {
		messageHistory: timer.messageHistory,
	};
};
