import { ITimerStore } from "@common/types/types";

const timerRequest = ({ timerStore, roomName, socket }:{ timerStore:ITimerStore, roomName:string, socket }) => {
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

  const currentSecondsRemaining = timerStore[roomName].secondsRemaining;
  // Function to check if secondsRemaining has changed
  const hasSecondsRemainingChanged = () => {
    return timerStore[roomName].secondsRemaining !== currentSecondsRemaining;
  };

  // Emit 'timerResponse' event when secondsRemaining ticks down
  const emitTimerResponse = () => {
    socket.emit("timerResponse", {
      secondsRemaining: timerStore[roomName].secondsRemaining,
      isPaused: timerStore[roomName].isPaused,
    });
    clearInterval(updateChecker);
 
  };

  // Check for updates and emit 'timerResponse' every millisecond
  const updateChecker = setInterval(() => {
    if (hasSecondsRemainingChanged()) {
      emitTimerResponse();
    }
  }, 1); // Check every 1 ms
};

export { timerRequest };
