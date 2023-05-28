const { startCountdown } = require("./startTimer");

describe("startCountdown", () => {
  describe("when the inputs are not valid", () => {
    describe("when the roomName is not valid", () => {});
    describe("when the durationInSeconds is not valid", () => {});
    describe("when the io is not valid", () => {});
  });

  describe("when the inputs are valid", () => {
    let clearIntervalSpy;
    let consoleLogSpy;
    let roomName;
    let mockTimer;
    let timerStore;
    let io;
    beforeEach(() => {
      clearIntervalSpy = jest.spyOn(global, "clearInterval");
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      roomName = "room-3";
      io = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      mockTimer = setInterval(() => {}, 1000);
      timerStore = {
        [roomName]: {
          timer: mockTimer,
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("when the timerStore has an existing timer", () => {
      it("should clear the existing timer", () => {
        startCountdown({
          roomName,
          durationInSeconds: 10,
          io,
          timerStore,
        });
        expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimer);
      });
    });
    describe("when the duration is 0", () => {
        

    });
    describe("when the duration is greater than 0", () => {});
    it("should emit a timerResponse event to the room", () => {});
  });
});
