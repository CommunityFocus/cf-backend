import { TimerStore } from "../common/types/types";

export interface DestroyTimerArgs {
	roomName: string;
	timerStore: TimerStore;
}

export const destroyTimer = ({
	roomName,
	timerStore,
}: DestroyTimerArgs): void => {
	if (!roomName || !timerStore || !timerStore[roomName]) {
		console.error(
			`Room ${roomName} does not exist. Failed to destroy timer`
		);
	} else {
		clearInterval(timerStore[roomName].timer);
		// eslint-disable-next-line no-param-reassign
		delete timerStore[roomName];

		console.log(
			`KABOOM: Destroying timer for room ${roomName} due to inactivity`
		);
	}
};
