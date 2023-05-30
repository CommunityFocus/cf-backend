import { TimerStore } from "../types";

export interface RequestWithTimerStore extends Request {
    timerStore: TimerStore;
}