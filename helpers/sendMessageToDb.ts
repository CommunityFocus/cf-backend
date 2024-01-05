import { writeMessageToDb } from "../common/models/dbHelpers";
import { ServerType } from "../common/types/socket/types";

export default async ({
	roomName,
	message,
	userName,
	io,
}: {
	roomName: string;
	message: string;
	userName: string;
	io: ServerType;
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
