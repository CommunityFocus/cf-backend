import { Server } from "socket.io";

export interface EmitWorkBreakTimerArgs {
	userName: string;
	roomName: string;
}

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

export interface UpdateLog {
	message: string;
	user: string;
	time: Date;
}

export type UpdateLogArray = UpdateLog[];

// all emit events
export interface ServerToClientEvents {
	usersInRoom: ({ numUsers, userList }: EmitUsersInRoomArgs) => void;
	globalUsers: (data: { globalUsersCount: number }) => void;
	timerResponse: (data: EmitTimerResponseArgs) => void;
	updateLogHistory: (data: { updateLog: UpdateLogArray }) => void;
	updateLog: (data: UpdateLog) => void;
}

// socket.on
export interface ClientToServerEvents {
	startCountdown: (data: EmitStartCountdownArgs) => void;
	join: (roomName: string) => void;
	timerRequest: (data: EmitWithRoomNameArgs) => void;
	pauseCountdown: (data: EmitWithRoomNameArgs) => void;
	resetCountdown: (data: EmitWithRoomNameArgs) => void;
	breakTimer: (data: EmitWorkBreakTimerArgs) => void;
	workTimer: (data: EmitWorkBreakTimerArgs) => void;
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
