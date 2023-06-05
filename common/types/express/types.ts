import { Request, Response } from "express";
import { TimerStore } from "../types";

export interface RequestWithTimerStore extends Request {
	timerStore?: TimerStore;
}

export type ExpressRouteReturnType =
	| Response<any, Record<string, any>>
	| undefined;
