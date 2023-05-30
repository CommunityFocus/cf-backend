import { type } from "os";
import { Server } from "socket.io";

export interface EmitStartCountdownArgs {
  roomName: string;
  durationInSeconds: number;
}

export interface EmitTimerRequestArgs {
  roomName: string;
}

export interface EmitTimerResponseArgs {
  secondsRemaining: number;
  isPaused: boolean;
}

// all emit events
export interface ServerToClientEvents {
  usersInRoom: (numUsers: number) => void;
  timerResponse: (data: EmitTimerResponseArgs) => void;
}

// socket.on
export interface ClientToServerEvents {
  startCountdown: (data: EmitStartCountdownArgs) => void;
  timerRequest: (data: EmitTimerRequestArgs) => void;
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

export type ServerType = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;