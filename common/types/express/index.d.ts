declare global {
	namespace Express {
		export interface Request {
			timerStore?: TimerStore,
		}
	}
}

export {}