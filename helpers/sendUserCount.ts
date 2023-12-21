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
	io.to("admin")
		.to("timerlist")
		.emit("publicTimers", {
			roomStats: Object.keys(timerStore).map((room) => ({
				room,
				numUsers: timerStore[room].users.length,
				userList: timerStore[room].users,
			})),
		});
};
