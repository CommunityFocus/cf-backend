import { Response, NextFunction } from "express";
import { TimerStore } from "../common/types/types";
import {
	ExpressRouteReturnType,
	RequestWithTimerStore,
} from "../common/types/express/types";

const storeMiddleware = (store: TimerStore) => {
	return (
		req: RequestWithTimerStore,
		res: Response,
		next: NextFunction
	): ExpressRouteReturnType => {
		req.timerStore = store;
		next();
		return undefined;
	};
};

export default storeMiddleware;
