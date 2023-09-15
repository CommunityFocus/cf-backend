export interface TimerStore {
	[key: string]: {
		users: string[];
		timer: NodeJS.Timeout | undefined;
		timerButtons: {
			work: number[];
			break: number[];
		};
		secondsRemaining: number;
		isPaused: boolean;
		isBreak: boolean;
		destroyTimer?: NodeJS.Timeout;
		originalDuration: number;
		heartbeatCounter: number;
		isTimerRunning: boolean;
		timerTitle: {
			workTitle: string;
			breakTitle: string;
		};
	};
}
