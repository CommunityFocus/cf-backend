import messageList from "../common/models/MessageList";
import { ServerType } from "../common/types/socket/types";
import { TimerStore } from "../common/types/types";
import formatTimestamp from "./formatTimestamp";
import sendMessageToDb from "./sendMessageToDb";

interface StartCountdownArgs {
	roomName: string;
	durationInSeconds: number;
	io: ServerType;
	timerStore: TimerStore;
}

const startCountdown = async ({
	roomName,
	durationInSeconds,
	io,
	timerStore,
}: StartCountdownArgs): Promise<void> => {
	if (!roomName || !timerStore || !timerStore[roomName]) {
		console.error(`Room ${roomName} does not exist. Failed to start timer`);
		return;
	}

	if (
		durationInSeconds === null ||
		durationInSeconds === undefined ||
		typeof durationInSeconds !== "number"
	) {
		console.error(
			`Duration ${durationInSeconds} is not valid. Failed to start timer`
		);
		return;
	}

	if (!io) {
		console.error(`Socket.io instance is not valid. Failed to start timer`);
		return;
	}

	// clear the existing timer if it exists
	if (timerStore[roomName].timer) {
		clearInterval(timerStore[roomName].timer);
		// eslint-disable-next-line no-param-reassign
		timerStore[roomName].heartbeatCounter = 0;
	}

	// eslint-disable-next-line no-param-reassign, no-multi-assign
	let remainingTime = (timerStore[roomName].secondsRemaining =
		durationInSeconds);

	// eslint-disable-next-line no-param-reassign
	timerStore[roomName].timer = setInterval(async () => {
		if (!timerStore[roomName].isPaused) {
			if (timerStore[roomName].secondsRemaining <= 0) {
				// eslint-disable-next-line no-param-reassign
				timerStore[roomName].isTimerRunning = false;
				clearInterval(timerStore[roomName].timer);
				// eslint-disable-next-line no-param-reassign
				timerStore[roomName].secondsRemaining = 0;

				if (durationInSeconds > 1) {
					if (timerStore[roomName].isBreak) {
						// eslint-disable-next-line no-param-reassign
						timerStore[roomName].isBreak = false;
					} else {
						// eslint-disable-next-line no-param-reassign
						timerStore[roomName].isBreak = true;
					}
				}

				io.to(roomName).emit("timerResponse", {
					secondsRemaining: timerStore[roomName].secondsRemaining,
					isPaused: timerStore[roomName].isPaused,
					isTimerRunning: timerStore[roomName].isTimerRunning,
					isBreakMode: timerStore[roomName].isBreak,
				});

				if (durationInSeconds > 1) {
					io.to(roomName).emit("endTimer", {
						isBreakMode: !timerStore[roomName].isBreak,
					});
					
					io.to(roomName).emit("updatedTitle", {
						title: timerStore[roomName].isBreak
							? timerStore[roomName].timerTitle.breakTitle
							: timerStore[roomName].timerTitle.workTitle,
					});

					const currentMessage = messageList({
						user: "Anonymous",
						room: roomName,
						message: "ended",
						altValue: formatTimestamp(durationInSeconds),
					});

					await sendMessageToDb({
						roomName,
						message: currentMessage,
						userName: "Anonymous",
						io,
					});
				}
			} else {
				// eslint-disable-next-line no-param-reassign
				timerStore[roomName].isTimerRunning = true;
				remainingTime--;
				// eslint-disable-next-line no-param-reassign
				timerStore[roomName].secondsRemaining = remainingTime;

				/**
				 * Send a heartbeat every 10 seconds. This is to prevent the timer from getting out of sync.
				 * Avoid sending a heartbeat in the last 20 seconds of the timer to avoid any jumps in the timer
				 */

				// eslint-disable-next-line no-param-reassign
				timerStore[roomName].heartbeatCounter++;
				if (
					timerStore[roomName].secondsRemaining > 20 &&
					timerStore[roomName].heartbeatCounter % 10 === 0
				) {
					io.to(roomName).emit("timerResponse", {
						secondsRemaining: timerStore[roomName].secondsRemaining,
						isPaused: timerStore[roomName].isPaused,
						isTimerRunning: timerStore[roomName].isTimerRunning,
						isBreakMode: timerStore[roomName].isBreak,
					});
				}
			}
		}
	}, 1000);

	if (timerStore[roomName].secondsRemaining <= 0) {
		// eslint-disable-next-line no-param-reassign
		timerStore[roomName].isTimerRunning = false;
	} else {
		// eslint-disable-next-line no-param-reassign
		timerStore[roomName].isTimerRunning = true;
	}

	io.to(roomName).emit("timerResponse", {
		secondsRemaining: timerStore[roomName].secondsRemaining,
		isPaused: timerStore[roomName].isPaused,
		isTimerRunning: timerStore[roomName].isTimerRunning,
		isBreakMode: timerStore[roomName].isBreak,
	});
};

export default startCountdown;
