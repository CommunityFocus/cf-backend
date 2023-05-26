const timerRequest = ({ io, timerStore, roomName, socket }) => {
  let currentSecondsRemaining = timerStore[roomName].secondsRemaining;
  let currentIsPaused = timerStore[roomName].isPaused;
  let isEventEmitted = false;

  while (
    timerStore[roomName].secondsRemaining <= currentSecondsRemaining &&
    !isEventEmitted
  ) {
    console.log("Emitting timerResponse",{ roomName, currentSecondsRemaining, currentIsPaused, timerSecondsRemaining: timerStore[roomName].secondsRemaining });

    if (currentSecondsRemaining <= timerStore[roomName].secondsRemaining) {
      currentSecondsRemaining = timerStore[roomName].secondsRemaining;
      currentIsPaused = timerStore[roomName].isPaused;
      socket.emit("timerResponse", {
        secondsRemaining: currentSecondsRemaining,
        isPaused: currentIsPaused,
      });
      isEventEmitted = true;
      break;
    }
  }
};

module.exports = { timerRequest };
