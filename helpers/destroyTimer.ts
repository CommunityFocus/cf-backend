import { ITimerStore } from "@common/types/types";

interface DestroyTimer {
  roomName: string,
  timerStore: ITimerStore,
};

function destroyTimer({ roomName, timerStore }: DestroyTimer) {
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

export { destroyTimer };
