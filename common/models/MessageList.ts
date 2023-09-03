import formatTimestamp from "../../helpers/formatTimestamp";

const messageList = ({
	user,
	message,
	room,
	value,
	altValue,
}: {
	user: string;
	message: string;
	room: string;
	value?: string;
	altValue?: string;
}): string => {
	const lowerCaseMessage = message.toLowerCase();

	switch (lowerCaseMessage) {
		case "created":
			return `${user} created the room: ${room}`;
		case "joined":
			return `${user} joined the room`;
		case "changedUsername":
			return `${user} changed their username to ${value}`;
		case "left":
			return `${user} left the room`;
		case "started":
			return `${user} started a ${
				value ? `${formatTimestamp(Number(value) * 60)}` : ""
			} timer ${altValue !== "00:00" ? `at ${altValue} min` : ""}`;

		case "paused":
			return `${user} paused the timer ${
				altValue ? `at ${altValue} min` : ""
			}`;

		case "resumed":
			return `${user} resumed the timer ${
				altValue ? `at ${altValue} min` : ""
			}`;

		case "reset":
			return `${user} reset the timer ${value ? `to ${value} min` : ""} ${
				altValue ? `at ${altValue} min` : ""
			}`;

		case "ended":
			return `The timer has ended!`;

		case "break":
			return `${user} switched to break ${
				altValue ? `at ${altValue} min` : ""
			}`;

		case "work":
			return `${user} switched to work ${
				altValue ? `at ${altValue} min` : ""
			}`;

		case "addedtimer":
			return `${user} added a ${value ? `${value} min` : ""} timer`;

		case "removedtimer":
			return `${user} removed a ${value ? `${value} min` : ""} timer`;
		default:
			return `${user} triggered an event in ${room}`;
	}
};

export default messageList;
