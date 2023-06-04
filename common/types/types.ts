export interface TimerStore {
  [key: string]: {
    users: string[];
    timer: NodeJS.Timeout | undefined;
    secondsRemaining: number;
    isPaused: boolean;
    destroyTimer?: NodeJS.Timeout;
    originalDuration: number;
  };
}
