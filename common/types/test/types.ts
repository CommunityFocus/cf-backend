import { TimerStore } from "@common/types/types";
import { Response } from "express";
import { RequestWithTimerStore } from "@common/types/express/types";

export interface MockRequest extends Partial<RequestWithTimerStore> {
	body: jest.MockedFunction<any>,
	params: jest.MockedFunction<any>,
	timerStore: TimerStore,
}

export interface MockResponse extends Partial<Response> {
	send: jest.MockedFunction<any>,
	status: jest.MockedFunction<any>,
	json: jest.MockedFunction<any>,
};