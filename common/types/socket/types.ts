import { Server } from "socket.io";

export interface EmitStartCountdownArgs {
	roomName: string;
	durationInSeconds: number;
}

export interface EmitWithRoomNameArgs {
	roomName: string;
}

export interface EmitTimerResponseArgs {
	secondsRemaining: number;
	isPaused: boolean;
}

export interface EmitUsersInRoomArgs {
	numUsers: number;
	userList: string[];
}

// all emit events
export interface ServerToClientEvents {
	usersInRoom: ({ numUsers, userList }: EmitUsersInRoomArgs) => void;
	globalUsers: (data: { globalUsersCount: number }) => void;
	timerResponse: (data: EmitTimerResponseArgs) => void;
}

// socket.on
export interface ClientToServerEvents {
	startCountdown: (data: EmitStartCountdownArgs) => void;
	join: (roomName: string) => void;
	timerRequest: (data: EmitWithRoomNameArgs) => void;
	pauseCountdown: (data: EmitWithRoomNameArgs) => void;
	resetCountdown: (data: EmitWithRoomNameArgs) => void;
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
