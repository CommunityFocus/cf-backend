import { Server } from "socket.io";
import { writeMessageToDb } from "../common/models/dbHelpers";
import {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "../common/types/socket/types";

export default async ({
	roomName,
	message,
	userName,
	io,
}: {
	roomName: string;
	message: string;
	userName: string;
	io: Server<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>;
}): Promise<void> => {
	await writeMessageToDb({
		roomName,
		message,
		userName,
	});

	io.to(roomName).emit("messageLog", {
		messageLog: message,
		date: new Date(),
	});
};
