import { ITimerStore } from '@common/types/types';
import {  Response, NextFunction } from 'express';
import { RequestWithTimerStore } from '@common/types/express/types';

export const storeMiddleware = function(store: ITimerStore) {
  return function (req: RequestWithTimerStore, res:Response, next:NextFunction) {
    req.timerStore = store;
    next();
  }
}