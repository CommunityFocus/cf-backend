function generateId ({ timerStore }) {
  try {
    // create a random id that is 8 characters long and is alphanumeric. Split each 3 characters with a dash.
    const id = Math.floor((Math.random() + 1) * 1e40)
      .toString(36)
      .substring(2, 11)
      .match(/.{1,3}/g)
      .join("-");

    if (id.length !== 11) {
      return generateId({ timerStore });
    }

    // check if the id is in the timerStore object
    if (timerStore.hasOwnProperty(id)) {
      // if it is, then create a different id
      return generateId({ timerStore });
    } else {
      // add the id to the timerStore object
      timerStore[id] = 0;
      // if not, then return the id
      return id;
    }
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = { generateId };
