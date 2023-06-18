import { ServerType } from "../common/types/socket/types";
import { TimerStore } from "../common/types/types";

interface StartCountdownArgs {
	roomName: string;
	durationInSeconds: number;
	io: ServerType;
	timerStore: TimerStore;
}

const startCountdown = ({
	roomName,
	durationInSeconds,
	io,
	timerStore,
}: StartCountdownArgs): void => {
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
	}

	// eslint-disable-next-line no-param-reassign, no-multi-assign
	let remainingTime = (timerStore[roomName].secondsRemaining =
		durationInSeconds);

	// eslint-disable-next-line no-param-reassign
	timerStore[roomName].timer = setInterval(() => {
		if (!timerStore[roomName].isPaused) {
			if (timerStore[roomName].secondsRemaining <= 0) {
				clearInterval(timerStore[roomName].timer);
				// eslint-disable-next-line no-param-reassign
				timerStore[roomName].secondsRemaining = 0;
			} else {
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
						secondsRemaining: remainingTime,
						isPaused: timerStore[roomName].isPaused,
					});
				}
			}
		}
	}, 1000);

	io.to(roomName).emit("timerResponse", {
		secondsRemaining: remainingTime,
		isPaused: timerStore[roomName].isPaused,
	});
};

export default startCountdown;
