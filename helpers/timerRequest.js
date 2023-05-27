const timerRequest = ({ io, timerStore, roomName, socket }) => {
  let currentSecondsRemaining = timerStore[roomName].secondsRemaining;
  let isEventEmitted = false;

  while (
    timerStore[roomName].secondsRemaining <= currentSecondsRemaining &&
    !isEventEmitted
  ) {
    if (currentSecondsRemaining <= timerStore[roomName].secondsRemaining) {
      currentSecondsRemaining = timerStore[roomName].secondsRemaining;

      socket.emit("timerResponse", {
        secondsRemaining: currentSecondsRemaining,
        isPaused: timerStore[roomName].isPaused,
      });

      isEventEmitted = true;
      break;
    }
  }
};

module.exports = { timerRequest };
