// define the function that will handle the countdown for a room
function startCountdown({ roomName, durationInSeconds, io, timerStore }) {
  // if there's already a timer instance for this room, clear it
  if (timerStore[roomName].timer) {
    // TODO: fix timer being null and throwing an error
    clearInterval(timerStore[roomName].timer);
  }

  // emit a message to the room to let everyone know the countdown has started
  io.to(roomName).emit("timerStarted", durationInSeconds);

  // set up the timer instance
  let remainingTime = durationInSeconds;
  timerStore[roomName].timer = setInterval(() => {
    // if the timer has reached zero, clear the interval and emit a message to the room
    if (remainingTime <= 0) {
      clearInterval(timerStore[roomName].timer);
      io.to(roomName).emit("timerEnded");
    } else {
      // decrement the remaining time
      remainingTime--;

      // emit the updated remaining time to the room
      io.to(roomName).emit("timerUpdated", remainingTime);
    }
    console.log({ roomName, remainingTime });
  }, 1000);
}

module.exports = { startCountdown };
