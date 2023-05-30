import { timerRequest } from "./timerRequest";

describe("timerRequest", () => {
  describe("when inputs are invalid", () => {
    beforeEach(() => {
      jest.spyOn(console, "error").mockImplementation(() => {
        return;
      });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });


    describe("when timerStore[roomName] is undefined | null", () => {
      describe("when timerStore[roomName] is undefined", () => {
        it("should log an error", () => {
          timerRequest({
            timerStore: {},
            roomName: "room-1",
            socket: {},
          });
          expect(console.error).toHaveBeenCalledTimes(1);
        });
      });
      describe("when timerStore[roomName] is null", () => {
        it("should log an error", () => {
          timerRequest({
            timerStore: { [null]:'' },
            roomName: "room-1",
            socket: {},
          });
          expect(console.error).toHaveBeenCalledTimes(1);
        });
      });
    });
    describe("when timerStore[roomName].secondsRemaining is not a number, or is undefined | null", () => {
      describe("when timerStore[roomName].secondsRemaining is undefined", () => {
        it("should log an error", () => {
          timerRequest({
            timerStore: { "room-1": { secondsRemaining: undefined } },
            roomName: "room-1",
            socket: {},
          });
          expect(console.error).toHaveBeenCalledTimes(1);
        });
      });
      describe("when timerStore[roomName].secondsRemaining is null", () => {
        it("should log an error", () => {
          timerRequest({
            timerStore: { "room-1": { secondsRemaining: null } },
            roomName: "room-1",
            socket: {},
          });
          expect(console.error).toHaveBeenCalledTimes(1);
        });
      });
      describe("when timerStore[roomName].secondsRemaining is not a number", () => {
        it("should log an error", () => {
          timerRequest({
            timerStore: { "room-1": { secondsRemaining: "not a number" } },
            roomName: "room-1",
            socket: {},
          });
          expect(console.error).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

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
          expect(socket.emit).toHaveBeenCalledTimes(1);

        });

        describe("when timerStore[roomName].secondsRemaining has changed multiple times", () => {
            it("should not emit 'timerResponse' event more than once", () => {
              jest.useFakeTimers();
              const clearIntervalMock = jest.spyOn(global, "clearInterval");
              timerRequest({
                timerStore: MOCK_TIMERSTORE,
                roomName: "room-1",
                socket,
              });
              
            // should not emit with secondsRemaining: 10
              expect(socket.emit).not.toHaveBeenCalled();
              expect(clearIntervalMock).not.toHaveBeenCalled();
              expect(socket.emit).not.toHaveBeenCalledWith("timerResponse", {
                secondsRemaining: 10,
                isPaused: false,
              });
    
              jest.advanceTimersByTime(1);
              expect(socket.emit).not.toHaveBeenCalled();
    
              // should only emit once, with secondsRemaining: 9
              MOCK_TIMERSTORE["room-1"].secondsRemaining = 9;
              jest.advanceTimersByTime(1);
              expect(socket.emit).toHaveBeenCalledTimes(1);
              expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
                secondsRemaining: 9,
                isPaused: false,
              });

            // should not emit with anything other than secondsRemaining: 9
              MOCK_TIMERSTORE["room-1"].secondsRemaining = 8;
              jest.advanceTimersByTime(1);

              expect(socket.emit).not.toHaveBeenCalledWith("timerResponse", {
                secondsRemaining: 8,
                isPaused: false,
              })
              expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
                secondsRemaining: 9,
                isPaused: false,
              })
              expect(clearIntervalMock).toHaveBeenCalled();
              expect(clearIntervalMock).toHaveBeenCalledTimes(1);
            });
          });


      });
    });
  });
});
