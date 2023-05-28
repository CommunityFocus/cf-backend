const e = require("express");
const { timerRequest } = require("./timerRequest");

describe("timerRequest", () => {
  describe("when timerRequest is called", () => {
    let socket;
    let MOCK_TIMERSTORE;
    beforeEach(() => {
      MOCK_TIMERSTORE = {
        ["room-1"]: {
          secondsRemaining: 10,
          isPaused: false,
          timer: null,
          users: [],
        },
      };
      socket = {
        emit: jest.fn(),
      };

      jest.mock("socket.io-client", () => {
        return jest.fn(() => {
          return {
            on: jest.fn(),
            emit: jest.fn(),
          };
        });
      });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    describe("when timerStore[roomName].isPaused is true", () => {
      it("should emit 'timerResponse' event with secondsRemaining and isPaused", () => {
        MOCK_TIMERSTORE["room-1"].isPaused = true;
        timerRequest({
          timerStore: MOCK_TIMERSTORE,
          roomName: "room-1",
          socket,
        });
        expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
          secondsRemaining: 10,
          isPaused: true,
        });
      });
    });

    describe("when timerStore[roomName].isPaused is false", () => {
      describe("when timerStore[roomName].secondsRemaining has not changed", () => {
        it("should not emit 'timerResponse' event", () => {
          jest.useFakeTimers();
          timerRequest({
            timerStore: MOCK_TIMERSTORE,
            roomName: "room-1",
            socket,
          });
          expect(socket.emit).not.toHaveBeenCalled();
        });
      });

      describe("when checking for infinite loop", () => {
        it("should not emit 'timerResponse' event more than once", () => {
          jest.useFakeTimers();
          const clearIntervalMock = jest.spyOn(global, "clearInterval");
          timerRequest({
            timerStore: MOCK_TIMERSTORE,
            roomName: "room-1",
            socket,
          });

          expect(socket.emit).not.toHaveBeenCalled();
          expect(clearIntervalMock).not.toHaveBeenCalled();

          jest.advanceTimersByTime(1);
          expect(socket.emit).not.toHaveBeenCalled();

          MOCK_TIMERSTORE["room-1"].secondsRemaining = 9;
          jest.advanceTimersByTime(1);
          expect(socket.emit).toHaveBeenCalledTimes(1);
          expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
            secondsRemaining: 9,
            isPaused: false,
          });
          expect(clearIntervalMock).toHaveBeenCalled();
        });
      });

      describe("when timerStore[roomName].secondsRemaining has changed", () => {
        it("should emit 'timerResponse' event", () => {
          jest.useFakeTimers();

          timerRequest({
            timerStore: MOCK_TIMERSTORE,
            roomName: "room-1",
            socket,
          });

          expect(socket.emit).not.toHaveBeenCalled();

          MOCK_TIMERSTORE["room-1"].secondsRemaining = 9;
          jest.advanceTimersByTime(1);
          expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
            secondsRemaining: 9,
            isPaused: false,
          });
        });

        describe("when timerStore[roomName].secondsRemaining has changed multiple times", () => {
          it("should emit 'timerResponse' event only once", () => {
            jest.useFakeTimers();
            timerRequest({
              timerStore: MOCK_TIMERSTORE,
              roomName: "room-1",
              socket,
            });
            expect(socket.emit).not.toHaveBeenCalled();

            MOCK_TIMERSTORE["room-1"].secondsRemaining = 9;
            jest.advanceTimersByTime(1);
            expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
              secondsRemaining: 9,
              isPaused: false,
            });

            MOCK_TIMERSTORE["room-1"].secondsRemaining = 8;
            jest.advanceTimersByTime(1);
            expect(socket.emit).not.toHaveBeenCalledWith("timerResponse", {
              secondsRemaining: 8,
              isPaused: false,
            });
          });
        });
      });
    });
  });
});
