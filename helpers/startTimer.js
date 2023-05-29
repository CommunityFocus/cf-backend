function startCountdown({ roomName, durationInSeconds, io, timerStore }) {
  if (!roomName || !timerStore || !timerStore[roomName]) {
    console.error(`Room ${roomName} does not exist. Failed to start timer`);
    return;
  }

  if (
    durationInSeconds === null ||
    durationInSeconds === undefined ||
    typeof durationInSeconds !== "number"
  ) {
    console.error(
      `Duration ${durationInSeconds} is not valid. Failed to start timer`
    );
    return;
  }

  if (!io) {
    console.error(`Socket.io instance is not valid. Failed to start timer`);
    return;
  }

  // clear the existing timer if it exists
  if (timerStore[roomName].timer) {
    clearInterval(timerStore[roomName].timer);
  }

  let remainingTime = (timerStore[roomName].secondsRemaining =
    durationInSeconds);

  timerStore[roomName].timer = setInterval(() => {
    if (timerStore[roomName].secondsRemaining <= 0) {
      clearInterval(timerStore[roomName].timer);
      timerStore[roomName].secondsRemaining = 0;
    } else {
      remainingTime--;
      timerStore[roomName].secondsRemaining = remainingTime;
    }
  }, 1000);

  io.to(roomName).emit("timerResponse", {
    secondsRemaining: remainingTime,
    isPaused: false,
  });
}

module.exports = { startCountdown };
