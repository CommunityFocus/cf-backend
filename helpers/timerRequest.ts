import { Socket } from "socket.io";
import { TimerStore } from "../common/types/types";

export interface TimerRequestArgs {
	timerStore: TimerStore;
	roomName: string;
	socket: Socket;
}

const timerRequest = ({
	timerStore,
	roomName,
	socket,
}: TimerRequestArgs): void => {
	if (!timerStore[roomName]) {
		console.error("timerStore[roomName] is undefined | null");
		return;
	}
	if (
		!timerStore[roomName].secondsRemaining ||
		typeof timerStore[roomName].secondsRemaining !== "number"
	) {
		socket.emit("timerResponse", {
			secondsRemaining: 0,
			isPaused: timerStore[roomName].isPaused,
			isTimerRunning: timerStore[roomName].isTimerRunning,
			isBreakMode: timerStore[roomName].isBreak,
		});
		return;
	}

	if (timerStore[roomName].isPaused) {
		socket.emit("timerResponse", {
			secondsRemaining: timerStore[roomName].secondsRemaining,
			isPaused: timerStore[roomName].isPaused,
			isTimerRunning: timerStore[roomName].isTimerRunning,
			isBreakMode: timerStore[roomName].isBreak,
		});
		return;
	}

	const currentSecondsRemaining = timerStore[roomName].secondsRemaining;
	// Function to check if secondsRemaining has changed
	const hasSecondsRemainingChanged = (): boolean => {
		return (
			timerStore[roomName].secondsRemaining !== currentSecondsRemaining
		);
	};

	// Emit 'timerResponse' event when secondsRemaining ticks down
	const emitTimerResponse = (): void => {
		socket.emit("timerResponse", {
			secondsRemaining: timerStore[roomName].secondsRemaining,
			isPaused: timerStore[roomName].isPaused,
			isTimerRunning: timerStore[roomName].isTimerRunning,
			isBreakMode: timerStore[roomName].isBreak,
		});
		// eslint-disable-next-line no-use-before-define
		clearInterval(updateChecker);
	};

	// Check for updates and emit 'timerResponse' every millisecond
	const updateChecker = setInterval(() => {
		if (hasSecondsRemainingChanged()) {
			emitTimerResponse();
		}
	}, 1); // Check every 1 ms
};

export { timerRequest };
