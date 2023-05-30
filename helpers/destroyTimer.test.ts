import { destroyTimer } from "./destroyTimer";

describe("destroyTimer", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe("when the inputs are not valid", () => {
    describe("when the roomName is not valid", () => {
      it("should console.error with the roomName", () => {
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation();
        destroyTimer({ roomName: null, timerStore: {} });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Room null does not exist. Failed to destroy timer"
        );
      });
    });
    describe("when the timerStore is not valid", () => {
      it("should console.error with the roomName", () => {
        const consoleErrorSpy = jest
          .spyOn(console, "error")
          .mockImplementation();
        destroyTimer({ roomName: "roomName", timerStore: null });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Room roomName does not exist. Failed to destroy timer"
        );
      });
    });
  });

  describe("when the inputs are valid", () => {
    let clearIntervalSpy;
    let consoleLogSpy;
    let roomName;
    let mockTimer;
    let timerStore;
    beforeEach(() => {
      clearIntervalSpy = jest.spyOn(global, "clearInterval");
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      roomName = "room-3";

      mockTimer = setInterval(() => {}, 1000);
      timerStore = {
        [roomName]: {
          timer: mockTimer,
        },
      };
    });

    it("should clear the existing timer", () => {
      destroyTimer({ roomName, timerStore });
      expect(clearIntervalSpy).toHaveBeenCalledWith(mockTimer);
    });
    it("should delete the timerStore", () => {
      destroyTimer({ roomName, timerStore });
      expect(timerStore[roomName]).toBeUndefined();
    });
    it("should console.log with the roomName", () => {
      destroyTimer({ roomName, timerStore });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `KABOOM: Destroying timer for room ${roomName} due to inactivity`
      );
    });
  });
});
