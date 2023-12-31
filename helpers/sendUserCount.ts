import { Server } from "socket.io";
import {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "../common/types/socket/types";
import { TimerStore } from "../common/types/types";
import { frontendRouteRooms } from "../common/common";

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
	io.to("admin").emit("publicTimers", {
		roomStats: Object.keys(timerStore)
			.filter((x) => !frontendRouteRooms.includes(x))
			.sort(
				(a, b) =>
					timerStore[b].users.length - timerStore[a].users.length
			)
			.map((room) => ({
				room,
				numUsers: timerStore[room].users.length,
				userList: timerStore[room].users,
			})),
	});

	io.to("timerlist").emit("publicTimers", {
		roomStats: Object.keys(timerStore)
			.filter((x) => !frontendRouteRooms.includes(x))
			.filter((x) => timerStore[x].isPublic)
			.sort(
				(a, b) =>
					timerStore[b].users.length - timerStore[a].users.length
			)
			.map((room) => ({
				room,
				numUsers: timerStore[room].users.length,
				userList: timerStore[room].users,
			})),
	});
};
