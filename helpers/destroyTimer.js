function destroyTimer({ roomName, timerStore }) {
  if (!roomName || !timerStore || !timerStore[roomName]) {
    console.error(`Room ${roomName} does not exist. Failed to destroy timer`);
  } else {
    clearInterval(timerStore[roomName].timer);
    delete timerStore[roomName];

    console.log(
      `KABOOM: Destroying timer for room ${roomName} due to inactivity`
    );
  }
}

module.exports = { destroyTimer };
