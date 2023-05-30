import { TimerStore } from "../types";
import { Response } from "express";
import { RequestWithTimerStore } from "../express/types";

export interface MockRequest extends Partial<RequestWithTimerStore> {
  body: jest.MockedFunction<any>;
  params: jest.MockedFunction<any>;
  timerStore: TimerStore;
}

export interface MockResponse extends Partial<Response> {
  send: jest.MockedFunction<any>;
  status: jest.MockedFunction<any>;
  json: jest.MockedFunction<any>;
}

export type ioTestType = {
  to: jest.Mock<any, any, any>;
  emit: jest.Mock<any, any, any>;
};



export type timerStoreTestType = {
	[x: string]: {
	  secondsRemaining?: number;
	  isPaused?: boolean;
	  timer: jest.Mock<any, any, any>;
	  users?: string[];
	};
  };

  export type socketTestType = { emit: jest.Mock<any, any, any> };