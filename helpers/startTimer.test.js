const { set } = require("mongoose");
const { startCountdown } = require("./startTimer");

describe("startCountdown", () => {
  describe("when startCountdown is called", () => {
    let clearIntervalSpy;
    let consoleLogSpy;
    let consoleErrorSpy;
    let roomName;
    let mockTimer;
    let timerStore;
    let io;
    let setIntervalSpy;
    beforeEach(() => {
      jest.useFakeTimers();
      clearIntervalSpy = jest.spyOn(global, "clearInterval")
      setIntervalSpy = jest.spyOn(global, "setInterval")
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      roomName = "room-3";
      io = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      mockTimer = jest.fn().mockImplementation();
      timerStore = {
        [roomName]: {
          timer: mockTimer,
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
            roomName: null,
            durationInSeconds: 10,
            io,
            timerStore,
          });
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Room ${null} does not exist. Failed to start timer`
          );
        });

        it("should not emit a timerResponse event to the room", () => {
          startCountdown({
            roomName: null,
            durationInSeconds: 10,
            io,
            timerStore,
          });
          expect(io.emit).not.toHaveBeenCalled();
        });
      });
      describe("when the durationInSeconds is not valid", () => {
        it("should log an error", () => {
          startCountdown({
            roomName,
            durationInSeconds: null,
            io,
            timerStore,
          });
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Duration ${null} is not valid. Failed to start timer`
          );
        });

        it("should not emit a timerResponse event to the room", () => {
          startCountdown({
            roomName,
            durationInSeconds: null,
            io,
            timerStore,
          });
          expect(io.emit).not.toHaveBeenCalled();
        });
      });
      describe("when the io is not valid", () => {
        it("should log an error", () => {
          startCountdown({
            roomName,
            durationInSeconds: 10,
            io: null,
            timerStore,
          });
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            `Socket.io instance is not valid. Failed to start timer`
          );
        });

        it("should not emit a timerResponse event to the room", () => {
          startCountdown({
            roomName,
            durationInSeconds: 10,
            io: null,
            timerStore,
          });
          expect(io.emit).not.toHaveBeenCalled();
        });
      });
    });

    describe("when the inputs are valid", () => {
      describe("when the timerStore has an existing timer", () => {
        it("should clear the existing timer", () => {

            timerStore['room-4']={
                timer: setInterval(()=>{},1000)
            }
            startCountdown({
                roomName: 'room-4',
                durationInSeconds: 10,
                io,
                timerStore,
            });

            expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(10000);

            expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(1000);

            expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
        });
      });
      describe("when the duration is 0", () => {
        it("should clear the timer", () => {
          startCountdown({
            roomName,
            durationInSeconds: 0,
            io,
            timerStore,
          });
          expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimer);
        });

        it("should set the secondsRemaining to 0", () => {
          startCountdown({
            roomName,
            durationInSeconds: 0,
            io,
            timerStore,
          });
          expect(timerStore[roomName].secondsRemaining).toEqual(0);
        });

        it("should emit a timerResponse event to the room", () => {
          startCountdown({
            roomName,
            durationInSeconds: 0,
            io,
            timerStore,
          });
          expect(io.to).toHaveBeenCalledWith(roomName);
          expect(io.emit).toHaveBeenCalledWith("timerResponse", {
            secondsRemaining: 0,
            isPaused: false,
          });
        });
      });
      describe("when the duration is greater than 0", () => {
        it("should start a new timer", () => {
          startCountdown({
            roomName,
            durationInSeconds: 10,
            io,
            timerStore,
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
            io,
            timerStore,
          });
          expect(timerStore[roomName].secondsRemaining).toEqual(10);
        });

        describe("when the timer is running", () => {
          it("should decrement the secondsRemaining by 1 every second", () => {
            startCountdown({
              roomName,
              durationInSeconds: 10,
              io,
              timerStore,
            });
            jest.advanceTimersByTime(1000);
            expect(timerStore[roomName].secondsRemaining).toEqual(9);
            jest.advanceTimersByTime(1000);
            expect(timerStore[roomName].secondsRemaining).toEqual(8);
          });

          describe("when the secondsRemaining is 0", () => {
            it("should clear the timer once the setInterval has started", () => {
              startCountdown({
                roomName,
                durationInSeconds: 10,
                io,
                timerStore,
              });
              jest.advanceTimersByTime(9000);
              expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimer);
              expect(timerStore[roomName].secondsRemaining).toEqual(1);
              expect(clearIntervalSpy).toHaveBeenCalledTimes(1);

              jest.advanceTimersByTime(1000);
              expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
              expect(timerStore[roomName].secondsRemaining).toEqual(0);

              jest.advanceTimersByTime(1000);
              expect(clearIntervalSpy).toHaveBeenCalledTimes(2);
              expect(timerStore[roomName].secondsRemaining).toEqual(0);
            });

            it("should set the secondsRemaining to 0", () => {
              startCountdown({
                roomName,
                durationInSeconds: 10,
                io,
                timerStore,
              });
              jest.advanceTimersByTime(10000);
              expect(timerStore[roomName].secondsRemaining).toEqual(0);
            });
          });

          it("should not emit a timerResponse event to the room more than once", () => {
            startCountdown({
              roomName,
              durationInSeconds: 10,
              io,
              timerStore,
            });
            jest.advanceTimersByTime(1000);
            jest.advanceTimersByTime(1000);

            expect(io.emit).toHaveBeenCalledTimes(1);
            expect(io.emit).toHaveBeenCalledWith("timerResponse", {
              secondsRemaining: 10,
              isPaused: false,
            });
          });
        });
      });
      it("should emit a timerResponse event to the room", () => {
        startCountdown({
          roomName,
          durationInSeconds: 10,
          io,
          timerStore,
        });
        expect(io.to).toHaveBeenCalledWith(roomName);
        expect(io.emit).toHaveBeenCalledWith("timerResponse", {
          secondsRemaining: 10,
          isPaused: false,
        });
      });
    });
  });
});
