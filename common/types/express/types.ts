import { ITimerStore } from "../types";

export interface RequestWithTimerStore extends Request {
    timerStore: ITimerStore;
}