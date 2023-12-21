import { Server } from "socket.io";

export interface EmitWithRoomNameArgs {
	roomName: string;
}

export interface EmitJoinEventArgs extends EmitWithRoomNameArgs {
	userName: string;
}
export interface EmitWorkBreakTimerArgs extends EmitWithRoomNameArgs {
	userName: string;
}

export interface EmitWorkBreakResponseArgs {
	userNameFromServer: string;
	isBreakMode: boolean;
}

export interface EmitStartCountdownArgs extends EmitWithRoomNameArgs {
	durationInSeconds: number;
}

export interface EmitTimerResponseArgs {
	secondsRemaining: number;
	isPaused: boolean;
	isTimerRunning: boolean;
	isBreakMode: boolean;
}

export interface EmitUsersInRoomArgs {
	numUsers: number;
	userList: string[];
}

export interface EmitTimerButtonsArgs {
	workTimerButtons: number[];
	breakTimerButtons: number[];
}

export interface EmitTimerButtonUpdateArgs {
	timerButtons: number[];
	isBreak: boolean;
	roomName: string;
}

// all emit events
export interface ServerToClientEvents {
	usersInRoom: ({ numUsers, userList }: EmitUsersInRoomArgs) => void;
	publicTimers: (data: { globalUsersCount: number }) => void;
	globalUsers: (data: { globalUsersCount: number }) => void;
	timerResponse: (data: EmitTimerResponseArgs) => void;
	workBreakResponse: (data: EmitWorkBreakResponseArgs) => void;
	messageLog: (data: { messageLog: string; date: Date }) => void;
	messageLogArray: (data: {
		messageHistory: { userName: string; message: string; date?: Date }[];
	}) => void;
	timerButtons: (data: EmitTimerButtonsArgs) => void;
	updatedTitle: (data: { title: string }) => void;
	endTimer: (data: { isBreakMode: boolean }) => void;
}

// socket.on
export interface ClientToServerEvents {
	startCountdown: (data: EmitStartCountdownArgs) => void;
	join: (data: EmitJoinEventArgs) => void;
	timerRequest: (data: EmitWithRoomNameArgs) => void;
	pauseCountdown: (data: EmitWithRoomNameArgs) => void;
	resetCountdown: (data: EmitWithRoomNameArgs) => void;
	breakTimer: (data: EmitWorkBreakTimerArgs) => void;
	workTimer: (data: EmitWorkBreakTimerArgs) => void;
	changeUsername: (data: { userName: string }) => void;
	updateTimerButtons: (data: EmitTimerButtonUpdateArgs) => void;
	updateTitle: (data: { roomName: string; title: string }) => void;
}

// io.on
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InterServerEvents {
	// connection: () => void;
}

// socket.data type
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SocketData {
	nickname: string;
}

export type ServerType = Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;
