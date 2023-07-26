import startCountdown from "./startTimer";
import { ioTestType, timerStoreTestType } from "../common/types/test/types";

describe("startCountdown", () => {
	describe("when startCountdown is called", () => {
		let clearIntervalSpy: jest.SpyInstance;
		let consoleErrorSpy: jest.SpyInstance;
		let roomName: string;
		let mockTimer: jest.Mock<any, any, any>;
		let timerStore: timerStoreTestType;
		let io: ioTestType;
		let setIntervalSpy: jest.SpyInstance;

		beforeEach(() => {
			jest.useFakeTimers();
			clearIntervalSpy = jest.spyOn(global, "clearInterval");
			setIntervalSpy = jest.spyOn(global, "setInterval");
			consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
			roomName = "room-3";
			io = {
				to: jest.fn().mockReturnThis(),
				emit: jest.fn(),
			};

			mockTimer = jest.fn().mockImplementation();
			timerStore = {
				[roomName]: {
					timer: mockTimer,
					isPaused: false,
				},
			};
		});

		afterEach(() => {
			jest.clearAllMocks();
			jest.clearAllTimers();
		});

		describe("when the inputs are not valid", () => {
			describe("when the roomName is not valid", () => {
				it("should log an error", () => {
					startCountdown({
						roomName: null as any,
						durationInSeconds: 10,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(consoleErrorSpy).toHaveBeenCalledWith(
						`Room ${null} does not exist. Failed to start timer`
					);
				});

				it("should not emit a timerResponse event to the room", () => {
					startCountdown({
						roomName: null as any,
						durationInSeconds: 10,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(io.emit).not.toHaveBeenCalled();
				});
			});
			describe("when the durationInSeconds is not valid", () => {
				it("should log an error", () => {
					startCountdown({
						roomName,
						durationInSeconds: null as any,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(consoleErrorSpy).toHaveBeenCalledWith(
						`Duration ${null} is not valid. Failed to start timer`
					);
				});

				it("should not emit a timerResponse event to the room", () => {
					startCountdown({
						roomName,
						durationInSeconds: null as any,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(io.emit).not.toHaveBeenCalled();
				});
			});
			describe("when the io is not valid", () => {
				it("should log an error", () => {
					startCountdown({
						roomName,
						durationInSeconds: 10,
						io: null as any,
						timerStore: timerStore as any,
					});
					expect(consoleErrorSpy).toHaveBeenCalledWith(
						`Socket.io instance is not valid. Failed to start timer`
					);
				});

				it("should not emit a timerResponse event to the room", () => {
					startCountdown({
						roomName,
						durationInSeconds: 10,
						io: null as any,
						timerStore: timerStore as any,
					});
					expect(io.emit).not.toHaveBeenCalled();
				});
			});
		});

		describe("when the inputs are valid", () => {
			describe("when the timerStore has an existing timer", () => {
				it("when the timer property in the room is a falsy value, it should not clear the timer", () => {
					timerStore["room-4"] = {
						timer: NaN as any,
					};
					startCountdown({
						roomName: "room-4",
						durationInSeconds: 10,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(clearIntervalSpy).not.toHaveBeenCalled();
				});
			});
			describe("when the duration is 0", () => {
				it("should clear the timer", () => {
					startCountdown({
						roomName,
						durationInSeconds: 0,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimer);
				});

				it("should set the secondsRemaining to 0", () => {
					startCountdown({
						roomName,
						durationInSeconds: 0,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(timerStore[roomName].secondsRemaining).toEqual(0);
				});

				it("should emit a timerResponse event to the room", () => {
					startCountdown({
						roomName,
						durationInSeconds: 0,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(io.to).toHaveBeenCalledWith(roomName);
					expect(io.emit).toHaveBeenCalledWith("timerResponse", {
						secondsRemaining: 0,
						isPaused: false,
						isTimerRunning: false,
						isBreakMode: undefined,
					});
				});
			});
			describe("when the duration is greater than 0", () => {
				it("should start a new timer", () => {
					startCountdown({
						roomName,
						durationInSeconds: 10,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(setIntervalSpy).toHaveBeenCalledWith(
						expect.any(Function),
						1000
					);
				});

				it("should set the secondsRemaining to the durationInSeconds", () => {
					startCountdown({
						roomName,
						durationInSeconds: 10,
						io: io as any,
						timerStore: timerStore as any,
					});
					expect(timerStore[roomName].secondsRemaining).toEqual(10);
				});

				describe("when the timer is running", () => {
					it("should decrement the secondsRemaining by 1 every second", () => {
						startCountdown({
							roomName,
							durationInSeconds: 10,
							io: io as any,
							timerStore: timerStore as any,
						});
						jest.advanceTimersByTime(1000);
						expect(timerStore[roomName].secondsRemaining).toEqual(
							9
						);
						jest.advanceTimersByTime(1000);
						expect(timerStore[roomName].secondsRemaining).toEqual(
							8
						);
					});

					it("should emit a timerResponse event (heartbeat) to the room 10 seconds", () => {
						startCountdown({
							roomName,
							durationInSeconds: 100,
							io: io as any,
							timerStore: timerStore as any,
						});

						expect(io.emit).toHaveBeenCalledWith("timerResponse", {
							secondsRemaining: 100,
							isPaused: false,
							isTimerRunning: true,
							isBreakMode: undefined,
						});

						// clear the mock call so we can check the next call
						io.emit.mockClear();

						jest.advanceTimersByTime(1000);
						// 1 second has passed, so the timerResponse event should not be emitted
						expect(io.emit).not.toHaveBeenCalled();

						jest.advanceTimersByTime(9000);
						// 10 seconds have passed, so the timerResponse event should be emitted
						expect(io.emit).toHaveBeenCalledWith("timerResponse", {
							secondsRemaining: 90,
							isPaused: false,
							isTimerRunning: true,
							isBreakMode: undefined,
						});

						io.emit.mockClear();

						jest.advanceTimersByTime(1000);
						// 11 seconds have passed, so the timerResponse event should not be emitted
						expect(io.emit).not.toHaveBeenCalled();

						jest.advanceTimersByTime(9000);

						// 20 seconds have passed, so the timerResponse event should be emitted
						expect(io.emit).toHaveBeenCalledWith("timerResponse", {
							secondsRemaining: 80,
							isPaused: false,
							isTimerRunning: true,
							isBreakMode: undefined,
						});
					});

					it("should not emit the timerResponse event (heartbeat) to the room if the timer is under 20 seconds", () => {
						startCountdown({
							roomName,
							durationInSeconds: 35,
							io: io as any,
							timerStore: timerStore as any,
						});

						expect(io.emit).toHaveBeenCalledWith("timerResponse", {
							secondsRemaining: 35,
							isPaused: false,
							isTimerRunning: true,
							isBreakMode: undefined,
						});

						// clear the mock call so we can check the next call
						io.emit.mockClear();

						jest.advanceTimersByTime(10000);
						// 10 seconds have passed, so the timerResponse event should be emitted since it is over 20 seconds. i.e. 35 - 10 = 25 seconds remaining
						expect(io.emit).toHaveBeenCalledWith("timerResponse", {
							secondsRemaining: 25,
							isPaused: false,
							isTimerRunning: true,
							isBreakMode: undefined,
						});

						io.emit.mockClear();

						jest.advanceTimersByTime(10000);
						// 20 seconds have passed, so the timerResponse event should be emitted since it is under 20 seconds. i.e. 35 - 20 = 15 seconds remaining
						expect(io.emit).not.toHaveBeenCalled();
					});

					describe("when the secondsRemaining is 0", () => {
						it("should clear the timer once the setInterval has started", () => {
							startCountdown({
								roomName,
								durationInSeconds: 10,
								io: io as any,
								timerStore: timerStore as any,
							});
							jest.advanceTimersByTime(9000);
							expect(clearIntervalSpy).toHaveBeenCalledWith(
								mockTimer
							);
							expect(
								timerStore[roomName].secondsRemaining
							).toEqual(1);
							expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

							jest.advanceTimersByTime(1000);
							expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
							expect(
								timerStore[roomName].secondsRemaining
							).toEqual(0);

							jest.advanceTimersByTime(1000);
							expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
							expect(
								timerStore[roomName].secondsRemaining
							).toEqual(0);
						});

						it("should set the secondsRemaining to 0", () => {
							startCountdown({
								roomName,
								durationInSeconds: 10,
								io: io as any,
								timerStore: timerStore as any,
							});
							jest.advanceTimersByTime(10000);
							expect(
								timerStore[roomName].secondsRemaining
							).toEqual(0);
						});
					});

					it("should not emit a timerResponse event to the room more than once (unless its a heartbeat)", () => {
						startCountdown({
							roomName,
							durationInSeconds: 10,
							io: io as any,
							timerStore: timerStore as any,
						});
						jest.advanceTimersByTime(1000);
						jest.advanceTimersByTime(1000);

						expect(io.emit).toHaveBeenCalledTimes(1);
						expect(io.emit).toHaveBeenCalledWith("timerResponse", {
							secondsRemaining: 10,
							isPaused: false,
							isTimerRunning: true,
							isBreakMode: undefined,
						});
					});
				});
			});

			describe("when the timer is paused", () => {
				describe("when the timer is paused before the timer is started", () => {
					it("should not decrement the secondsRemaining", () => {
						timerStore[roomName].isPaused = true;
						startCountdown({
							roomName,
							durationInSeconds: 10,
							io: io as any,
							timerStore: timerStore as any,
						});
						jest.advanceTimersByTime(1000);
						expect(timerStore[roomName].secondsRemaining).toEqual(
							10
						);
					});

					it("should not clear the timer", () => {
						timerStore[roomName].isPaused = true;
						startCountdown({
							roomName,
							durationInSeconds: 10,
							io: io as any,
							timerStore: timerStore as any,
						});
						jest.advanceTimersByTime(1000);
						// should only be called once when the timer is started
						expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
					});
				});
			});
			it("should emit a timerResponse event to the room", () => {
				startCountdown({
					roomName,
					durationInSeconds: 10,
					io: io as any,
					timerStore: timerStore as any,
				});
				expect(io.to).toHaveBeenCalledWith(roomName);
				expect(io.emit).toHaveBeenCalledWith("timerResponse", {
					secondsRemaining: 10,
					isPaused: false,
					isTimerRunning: true,
					isBreakMode: undefined,
				});
			});
		});
	});
});
