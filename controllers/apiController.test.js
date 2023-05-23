const apiController = require("./apiController");
// const slugHelper = require("../helpers/generateSlug");
const { generateSlug } = require("../helpers/generateSlug");

// Mocks
jest.mock('../helpers/generateSlug')

describe('apiController', () => {
	describe('slugHandler', () => {
		let req, res;

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

			generateSlug.mockReset();
		});

		test('should return a slug', async () => {
			generateSlug.mockReturnValue('big-blue-butterfly');

			await apiController.slugHandler(req, res);

			expect(res.json).toHaveBeenCalledWith({ slug: 'big-blue-butterfly' });
		});

		test(
			"should regenerate slug until it finds one that isn't already taken",
			async () => {
				req.timerStore = {
					"first-room-name": {},
					"second-room-name": {},
				};

				// First two values returned should be the names already taken in
				// timerStore, third attempt should succeed with "big-blue-butterfly".
				generateSlug
					.mockReturnValueOnce('first-room-name')
					.mockReturnValueOnce('second-room-name')
					.mockReturnValue('big-blue-butterfly');

				await apiController.slugHandler(req, res);

				expect(generateSlug).toBeCalledTimes(3);
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
				req.timerStore = { test: {} }
				generateSlug.mockReturnValue('test');

				await apiController.slugHandler(req, res);

				expect(res.status).toBeCalledWith(429);
				expect(res.json).toHaveBeenCalledWith({
					message: 'Issue generating slug, no available slugs found.'
				});
			}
		);
	});
});