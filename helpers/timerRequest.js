const timerRequest = ({ timerStore, roomName, socket }) => {
  if (!timerStore[roomName]) {
    console.error("timerStore[roomName] is undefined | null");
    return;
  }
  if (
    !timerStore[roomName].secondsRemaining ||
    typeof timerStore[roomName].secondsRemaining !== "number"
  ) {
    console.error(
      "timerStore[roomName].secondsRemaining is not a number, or is undefined | null"
    );
    return;
  }

  if (timerStore[roomName].isPaused) {
    socket.emit("timerResponse", {
      secondsRemaining: timerStore[roomName].secondsRemaining,
      isPaused: timerStore[roomName].isPaused,
    });
    return;
  }

  let currentSecondsRemaining = timerStore[roomName].secondsRemaining;

  // Function to check if secondsRemaining has changed
  const hasSecondsRemainingChanged = () => {
    return timerStore[roomName].secondsRemaining !== currentSecondsRemaining;
  };

  // Emit 'timerResponse' event when secondsRemaining ticks down
  const emitTimerResponse = () => {
    currentSecondsRemaining = timerStore[roomName].secondsRemaining;
    socket.emit("timerResponse", {
      secondsRemaining: currentSecondsRemaining,
      isPaused: timerStore[roomName].isPaused,
    });
    clearInterval(updateChecker);
    return;
  };

  // Check for updates and emit 'timerResponse' every second

  const updateChecker = setInterval(() => {
    if (hasSecondsRemainingChanged()) {
      emitTimerResponse();
    }
  }, 1); // Check every 1 ms
};

module.exports = { timerRequest };
