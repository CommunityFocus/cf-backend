// all emit events
export interface ServerToClientEvents {
	usersInRoom: (numUsers: number) => void;
	timerResponse: (data: { secondsRemaining: number; isPaused: boolean }) => void;
}

// socket.on
export interface ClientToServerEvents {

    startCountdown: () => void;
    timerRequest: () => void;
    pauseCountdown: () => void;
    unpauseCountdown: () => void;
    join: () => void;
    disconnect: () => void;
}

// io.on
export interface InterServerEvents {
    connection: () => void;
}

// socket.data type
export interface SocketData {}
