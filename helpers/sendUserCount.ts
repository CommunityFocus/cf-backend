import { Server } from "socket.io";
import {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "../common/types/socket/types";
import { TimerStore } from "../common/types/types";

export default (
	io: Server<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>,
	roomName: string,
	timerStore: TimerStore
): void => {
	// emit the updated number of users in the room
	io.to(roomName).emit("usersInRoom", {
		numUsers: timerStore[roomName].users.length,
		userList: timerStore[roomName].users,
	});

	// emit the list of users, count of users in the room, and count of users globally to 'timerlist' room
	io.to("timerlist").emit("publicTimers", {
		globalUsersCount: Object.keys(timerStore).length,
	});

	console.log("user count updated");
};
