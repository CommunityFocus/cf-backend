const messageList = ({
	user,
	message,
	room,
	value,
}: {
	user: string;
	message: string;
	room: string;
	value?: string;
}): string => {
	const lowerCaseMessage = message.toLowerCase();

	switch (lowerCaseMessage) {
		case "created":
			return `${user} created the room ${room}`;
		case "joined":
			return `${user} joined the room ${room}`;
		case "changedUsername":
			return `${user} changed their username to ${value}`;
		case "left":
			return `${user} left the room ${room}`;
		case "started":
			return `${user} started a ${
				value ? `${value} min ` : ""
			}timer in ${room}`;

		case "paused":
			return `${user} paused the timer in ${room}`;

		case "resumed":
			return `${user} resumed the timer in ${room}`;

		case "reset":
			return `${user} reset the timer ${
				value ? `to ${value} min ` : ""
			}in ${room}`;

		case "ended":
			return `The timer in ${room} has ended!`;

		case "break":
			return `${user} switched to break in ${room}`;

		case "work":
			return `${user} switched to work in ${room}`;
		default:
			return `${user} triggered an event in ${room}`;
	}
};

export default messageList;
