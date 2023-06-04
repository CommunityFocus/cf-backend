import { Server } from "socket.io";

export interface EmitStartCountdownArgs {
	roomName: string;
	durationInSeconds: number;
}

export interface EmitTimerRequestArgs {
	roomName: string;
}

export interface EmitTPauseArgs {
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
	join: (roomName: string) => void;
	timerRequest: (data: EmitTimerRequestArgs) => void;
	pauseCountdown: (data: EmitTPauseArgs) => void;
}

// io.on
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InterServerEvents {
	// connection: () => void;
}

// socket.data type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SocketData {}

export type ServerType = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;
