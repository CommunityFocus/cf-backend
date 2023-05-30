import { TimerStore } from "../types";
import { Request } from "express";

export interface RequestWithTimerStore extends Request {
    timerStore?: TimerStore;
}