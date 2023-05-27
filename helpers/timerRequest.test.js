const { timerRequest } = require("./timerRequest");

describe("timerRequest", () => {
  describe("when timerRequest is called", () => {
    let socket;
    let MOCK_TIMERSTORE;
    beforeEach(() => {
      // mock timerStore
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

    describe("when the timer is counting down", () => {
        it("should emit the timerResponse event with the correct data", () => {
          MOCK_TIMERSTORE["room-1"].secondsRemaining = 9;

        timerRequest({
          timerStore: MOCK_TIMERSTORE,
          roomName: "room-1",
          socket,
        });

        expect(socket.emit).toHaveBeenCalledWith("timerResponse", {
          secondsRemaining: 9,
          isPaused: false,
        });
      });


    });

    describe("when the timer is paused", () => {
      it("should emit the timerResponse event with the correct data", () => {
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
  });
});
