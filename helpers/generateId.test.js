const { generateId } = require("./generateId");

const MOCK_TIMESTORE = {};

describe("generateId", () => {
  describe("when generateId is called", () => {
    it("should return an id thats an alphanumeric string and is 11 characters long, seperated at every 3 chars by a '-'", () => {
      const id = generateId({ timerStore: MOCK_TIMESTORE });

      expect(id).toMatch(/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/);
    });
    it("should add the id to the timerStore object", () => {
      const id = generateId({ timerStore: MOCK_TIMESTORE });
      console.log("mock", MOCK_TIMESTORE);

      expect(MOCK_TIMESTORE[id]).toBeDefined();
    });
    describe("when generateId is called multiple times", () => {
      it("should return a different id each time", () => {
        for (let i = 0; i < 100000; i++) {
          const id = generateId({ timerStore: MOCK_TIMESTORE });

          expect(id).toMatch(/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/);
          expect(MOCK_TIMESTORE[id]).not.toBeUndefined();
        }
      });
    });

    describe("when the id is in the timeStore object", () => {
      it("should call generateId again", () => {
        const randomReturnValues = [0.123456789, 0.987654321];
        jest
          .spyOn(Math, "random")
          .mockReturnValueOnce(randomReturnValues[0])
          .mockReturnValueOnce(randomReturnValues[1]);
        // add the id to the timerStore object
        MOCK_TIMESTORE["4fz-yo8-2mv"] = 0;
        const id = generateId({ timerStore: MOCK_TIMESTORE });
        expect(id).toMatch(/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/);
        expect(id).toEqual("dj4-e90-cb4");
      });
    });

    describe("when Math.random returns specific values", () => {
      it("should return a specific id", () => {
        const randomReturnValues = [0, 1, 0.1, 0.9, 0.0, 0.9999999999999999];

        randomReturnValues.forEach((value) => {
          jest.spyOn(Math, "random").mockReturnValueOnce(value);
          const id = generateId({ timerStore: MOCK_TIMESTORE });
          expect(id).toMatch(/^[a-z0-9]{3}-[a-z0-9]{3}-[a-z0-9]{3}$/);
          // console.log("id", id, "value", value);
        });
      });
    });
  });
});
