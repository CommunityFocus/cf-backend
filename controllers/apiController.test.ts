import { RequestWithTimerStore } from "../common/types/express/types";
import { MockRequest, MockResponse } from "../common/types/test/types";
import { generateSlug } from "../helpers/generateSlug";
import { Response } from "express";
import { slugHandler } from "./apiController";

// Mocks
jest.mock('../helpers/generateSlug')
const generateSlugMock = jest.mocked(generateSlug, { shallow: true });

describe('apiController', () => {
	describe('slugHandler', () => {
		let req: MockRequest,
		    res: MockResponse;

		beforeEach(() => {
			req = {
				body: jest.fn().mockReturnThis(),
				params: jest.fn().mockReturnThis(),
				timerStore: {},
			};
			res = {
				send: jest.fn().mockReturnThis(),
				status: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
			};

			generateSlugMock.mockReset();
		});

		test('should return a slug', async () => {
			generateSlugMock.mockReturnValue('big-blue-butterfly');

			// await slugHandler(req as RequestWithTimerStore, res as Response);
			await slugHandler(req as RequestWithTimerStore, res as Response);

			expect(res.json).toHaveBeenCalledWith({ slug: 'big-blue-butterfly' });
		});

		test(
			"should regenerate slug until it finds one that isn't already taken",
			async () => {
				req.timerStore = {
					"first-room-name": {
						users: [],
						timer: undefined,
						secondsRemaining: 0,
						isPaused: false
					},
					"second-room-name": {
						users: [],
						timer: undefined,
						secondsRemaining: 0,
						isPaused: false
					},
				};

				// First two values returned should be the names already taken in
				// timerStore, third attempt should succeed with "big-blue-butterfly".
				generateSlugMock
					.mockReturnValueOnce('first-room-name')
					.mockReturnValueOnce('second-room-name')
					.mockReturnValue('big-blue-butterfly');

				// await slugHandler(req as RequestWithTimerStore, res as Response);
				await slugHandler(req as RequestWithTimerStore, res as Response);

				expect(generateSlugMock).toBeCalledTimes(3);
				expect(res.json).toHaveBeenCalledWith({ slug: 'big-blue-butterfly' });
			}
		);

		test(
			"should return an error and status 429 if it cannot generate a slug that isn't already taken after 50 tries",
			async () => {
				/*
					Give timerStore the same key name as the mock return value of
					generateSlug, that way it will trigger the 50 retry limit and return
					an error response.
				*/
				req.timerStore = {
					test: {
						users: [],
						timer: undefined,
						secondsRemaining: 0,
						isPaused: false
					}
				}
				generateSlugMock.mockReturnValue('test');

				// await slugHandler(req as RequestWithTimerStore, res as Response);
				await slugHandler(req as RequestWithTimerStore, res as Response);

				/*
					generateSlug is called 51 times - once for the initial slug
					generation, and 50 retry attempts.
				*/
				expect(generateSlugMock).toBeCalledTimes(51);
				expect(res.status).toBeCalledWith(429);
				expect(res.json).toHaveBeenCalledWith({
					message: 'Issue generating slug, no available slugs found.'
				});
			}
		);

		test(
			"should return an error and status 500 if timer store is missing on request object",
			async () => {

				req.timerStore = undefined as any;
				
				await slugHandler(req as RequestWithTimerStore, res as Response);

				expect(res.status).toBeCalledWith(500);
				expect(res.json).toHaveBeenCalledWith({
					message: 'Timer Store was not found in request.'
				});
			}
		);
	});
});