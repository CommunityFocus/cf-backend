export interface TimerStore {
	[key: string]: {
		users: string[];
		timer: NodeJS.Timeout | undefined;
		secondsRemaining: number;
		isPaused: boolean;
		isBreak: boolean;
		destroyTimer?: NodeJS.Timeout;
		originalDuration: number;
		heartbeatCounter: number;
		isTimerRunning: boolean;
	};
}
