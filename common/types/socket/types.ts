import { type } from "os";
import { Server } from "socket.io";

export interface TimerResponseArgs {
  secondsRemaining: number;
  isPaused: boolean;
}

export interface StartCountdownArgs {
  roomName: string;
  durationInSeconds: number;
}

export interface TimerRequestArgs {
  roomName: string;
}

// all emit events
export interface ServerToClientEvents {
  usersInRoom: (numUsers: number) => void;
  timerResponse: (data: TimerResponseArgs) => void;
}

// socket.on
export interface ClientToServerEvents {
  startCountdown: (data: StartCountdownArgs) => void;
  timerRequest: (data: TimerRequestArgs) => void;
  pauseCountdown: () => void;
  unpauseCountdown: () => void;
  join: (roomName: string) => void;
  // disconnect: () => void;
}

// io.on
export interface InterServerEvents {
  // connection: () => void;
}

// socket.data type
export interface SocketData {}

