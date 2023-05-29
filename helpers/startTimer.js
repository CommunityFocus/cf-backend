// define the function that will handle the countdown for a room
function startCountdown({ roomName, durationInSeconds, io, timerStore }) {
  // if there's already a timer instance for this room, clear it
  if (timerStore[roomName].timer) {
    // TODO: fix timer being null and throwing an error
    clearInterval(timerStore[roomName].timer);
  }

  // emit a message to the room to let everyone know the countdown has started
  io.to(roomName).emit("timerStarted", durationInSeconds);

  let remainingTime = (timerStore[roomName].secondsRemaining =
    durationInSeconds);
  // set up the timer instance
  timerStore[roomName].timer = setInterval(() => {
    // if the timer has reached zero, clear the interval and emit a message to the room
    if (remainingTime <= 0) {
      clearInterval(timerStore[roomName].timer);

      // update the remainingTime in the timerStore
      timerStore[roomName].secondsRemaining = 0;
      io.to(roomName).emit("timerEnded");
    } else {
      // decrement the remaining time
      remainingTime--;

      // update the remainingTime in the timerStore
      timerStore[roomName].secondsRemaining = remainingTime;
    }
  }, 1000);
  io.to(roomName).emit("timerResponse", {
    secondsRemaining: remainingTime,
    isPaused: false,
  });
}

module.exports = { startCountdown };
