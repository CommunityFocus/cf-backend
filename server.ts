import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import { instrument } from "@socket.io/admin-ui";
import startCountdown from "./helpers/startTimer";
import { timerRequest } from "./helpers/timerRequest";
import { destroyTimer } from "./helpers/destroyTimer";
import apiRoutes from "./routes/apiRoutes";
import storeMiddleware from "./middleware/storeMiddleware";

import {
	EmitStartCountdownArgs,
	EmitWithRoomNameArgs,
	EmitWorkBreakTimerArgs,
	EmitJoinEventArgs,
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
} from "./common/types/socket/types";
import connectDB from "./common/models/connectDB";
import {
	readFromDb,
	readMessageFromDb,
	writeToDb,
} from "./common/models/dbHelpers";
import messageList from "./common/models/MessageList";
import formatTimestamp from "./helpers/formatTimestamp";
import { frontendRouteRooms, statRooms } from "./common/common";
import timerStore from "./common/timerStore";
import sendUserCount from "./helpers/sendUserCount";
import sendMessageToDb from "./helpers/sendMessageToDb";

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// middleware
app.use(
	cors({
		origin: [
			"https://admin.socket.io",
			"https://communityfocus.app",
			"https://communityfocus.netlify.app",
			"http://localhost:5100",
			/* use regex to match all Netlify deploy preview URLs.
			 * Example: https://deploy-preview-25--communityfocus.netlify.app/
			 */
			/https:\/\/deploy-preview-[0-9]+--communityfocus.netlify.app/,
		],
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	})
);

httpServer.listen(PORT, () => {
	console.log(
		`Server is running on ${
			process.env.NODE_ENV !== "production"
				? `http://localhost:${PORT}`
				: `port ${PORT}`
		}`
	);
});

// connect to database
connectDB();

const io = new Server<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>(httpServer, {
	cors: {
		origin: [
			"https://admin.socket.io",
			"https://communityfocus.app",
			"https://communityfocus.netlify.app",
			"http://localhost:5100",
			/* use regex to match all Netlify deploy preview URLs.
			 * Example: https://deploy-preview-25--communityfocus.netlify.app/
			 */
			/https:\/\/deploy-preview-[0-9]+--communityfocus.netlify.app/,
		],
		credentials: true,
	},
});

instrument(io, {
	auth: {
		type: "basic",
		username: "admin",
		password: `${process.env.SOCKET_ADMIN_PASS}`,
	},
	mode: "development",
});

// routes
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		msg: "Welcome to CommunintyFocus. Please see https://communityfocus.app/. If developing locally, please go to http://127.0.0.1:5100/",
	});
});

app.use("/api/v1/", storeMiddleware(timerStore), apiRoutes);

// listen for socket.io connections and handle the countdown events
io.on("connection", async (socket) => {
	// get the room name from the query string. Example of roomName: "/:room"
	const roomName = socket.handshake.query.roomName as string;

	io.emit("globalUsers", { globalUsersCount: io.engine.clientsCount });

	// if there's no roomName property for this room, create one
	if (!timerStore[roomName]) {
		timerStore[roomName] = {
			users: [],
			timer: undefined,
			timerButtons: {
				work: [5, 10, 15, 20, 25, 30],
				break: [1, 2, 5, 10, 15, 30],
			},
			secondsRemaining: 0,
			isPaused: false,
			isBreak: false,
			originalDuration: 0,
			heartbeatCounter: 0,
			isTimerRunning: false,
			timerTitle: {
				workTitle: "Let's get some work done!",
				breakTitle: "Time for a break!",
			},
			isPublic: false,
		};
	}

	// if there is a destroy timer countdown, clear it
	if (
		timerStore[roomName].destroyTimer &&
		!frontendRouteRooms.includes(roomName)
	) {
		console.log("Clearing destroy timer for:", roomName);
		clearInterval(timerStore[roomName].destroyTimer);
	}

	// eslint-disable-next-line no-shadow
	socket.on("join", async ({ roomName, userName }: EmitJoinEventArgs) => {
		if (roomName === "admin") {
			try {
				const response = await socket
					.timeout(5000)
					.emitWithAck("require-admin-auth");
				if (
					response.password &&
					response.password === process.env.ADMIN_PASSWORD
				) {
					socket.join("admin");
				}
			} catch (err) {
				console.log("Admin auth failed");
			}
		} else {
			// join the room
			socket.join(roomName);
		}

		// eslint-disable-next-line no-param-reassign
		socket.data.nickname =
			userName === "defaultUser" ? socket.id : userName;

		if (timerStore[roomName] && !frontendRouteRooms.includes(roomName)) {
			if (!timerStore[roomName].timer) {
				const timerData = await readFromDb({ roomName });

				if (timerData) {
					// timeRemaining a continued countdown from endTimestamp to now
					const timeRemaining = Math.floor(
						(timerData.endTimestamp.getTime() - Date.now()) / 1000
					);

					const timeRemainingFromPaused =
						!!timerData.pausedAt &&
						Math.floor(
							(timerData.endTimestamp.getTime() -
								timerData.pausedAt.getTime()) /
								1000
						);

					timerStore[roomName].secondsRemaining =
						timerData.isPaused && timeRemainingFromPaused
							? timeRemainingFromPaused
							: timeRemaining;
					timerStore[roomName].isPaused = timerData.isPaused || false;
					timerStore[roomName].originalDuration =
						timerData.originalDuration;

					timerStore[roomName].timerButtons.work =
						timerData.workTimerButtons;
					timerStore[roomName].timerButtons.break =
						timerData.breakTimerButtons;
					timerStore[roomName].timerTitle.workTitle =
						timerData.workTitle;
					timerStore[roomName].timerTitle.breakTitle =
						timerData.breakTitle;
					timerStore[roomName].isPublic = timerData.isPublic;

					startCountdown({
						roomName,
						durationInSeconds:
							timerStore[roomName].secondsRemaining,
						io,
						timerStore,
					});
				} else {
					await writeToDb({
						roomName,
						isPaused: timerStore[roomName].isPaused,
						isBreak: timerStore[roomName].isBreak,
						workTimerButtons:
							timerStore[roomName].timerButtons.work,
						breakTimerButtons:
							timerStore[roomName].timerButtons.break,
						endTimestamp: new Date(
							Date.now() +
								timerStore[roomName].secondsRemaining * 1000
						),
						originalDuration: timerStore[roomName].originalDuration,
						workTitle: timerStore[roomName].timerTitle.workTitle,
						breakTitle: timerStore[roomName].timerTitle.breakTitle,
					});

					const currentMessage = messageList({
						user: userName,
						room: roomName,
						message: "created",
					});

					await sendMessageToDb({
						roomName,
						message: currentMessage,
						userName,
						io,
					});
				}
			}

			io.to(roomName).emit("togglePublicUpdate", {
				isPublic: timerStore[roomName].isPublic,
			});

			socket.emit("timerButtons", {
				workTimerButtons: timerStore[roomName].timerButtons.work,
				breakTimerButtons: timerStore[roomName].timerButtons.break,
			});

			// add the user to the room
			timerStore[roomName].users.push(socket.data.nickname);

			const currentMessage = messageList({
				user: socket.data.nickname,
				room: roomName,
				message: "joined",
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName,
				io,
			});

			// limit to last 50 messages
			const messageHistory = await readMessageFromDb({ roomName });

			const limitedMessageHistory = messageHistory
				? messageHistory.messageHistory.slice(-50)
				: [];

			socket.emit("messageLogArray", {
				// only keep username, message, and date properties
				messageHistory: limitedMessageHistory.map((message) => ({
					userName: message.userName,
					message: message.message,
					date: message.date,
				})),
			});

			socket.emit("updatedTitle", {
				title: timerStore[roomName].isBreak
					? timerStore[roomName].timerTitle.breakTitle
					: timerStore[roomName].timerTitle.workTitle,
			});

			console.log(`User ${socket.data.nickname} joined room ${roomName}`);
		}

		if (
			timerStore[roomName] &&
			(!frontendRouteRooms.includes(roomName) ||
				statRooms.includes(roomName))
		) {
			// emit the updated number of users in the room
			sendUserCount({ io, roomName, timerStore });
		}
	});

	socket.on("changeUsername", async ({ userName }: { userName: string }) => {
		if (timerStore[roomName]) {
			const oldUserName = socket.data.nickname;
			console.log(
				`User ${oldUserName} changed username to ${userName} in room ${roomName}`
			);
			timerStore[roomName].users.splice(
				timerStore[roomName].users.indexOf(oldUserName),
				1,
				userName
			);

			// eslint-disable-next-line no-param-reassign
			socket.data.nickname = userName;

			const currentMessage = messageList({
				user: oldUserName,
				room: roomName,
				message: "changedUsername",
				value: userName,
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName,
				io,
			});
		}

		if (
			timerStore[roomName] &&
			(!frontendRouteRooms.includes(roomName) ||
				statRooms.includes(roomName))
		) {
			// emit the updated number of users in the room
			sendUserCount({ io, roomName, timerStore });
		}
	});

	socket.on("disconnect", async () => {
		if (timerStore[roomName] && !frontendRouteRooms.includes(roomName)) {
			const currentMessage = messageList({
				user: socket.data.nickname,
				room: roomName,
				message: "left",
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName: socket.data.nickname,
				io,
			});

			// remove the user from the room. Remove only the first instance of the user
			timerStore[roomName].users.splice(
				timerStore[roomName].users.indexOf(socket.data.nickname),
				1
			);

			console.log(
				`User ${socket.data.nickname} disconnected from room ${roomName}`
			);

			if (timerStore[roomName].users.length === 0) {
				// if there are no users left in the room, clear the timer and delete the room after a delay
				console.log(
					"Setting destroyTimer instance to destroy timer instance for:",
					roomName
				);
				timerStore[roomName].destroyTimer = setTimeout(
					() => {
						destroyTimer({ roomName, timerStore });

						// emit the updated number of users in the room
						sendUserCount({ io, roomName, timerStore });
					},
					120000 // give the users 2 minutes to rejoin
				);
			}
		}

		if (
			timerStore[roomName] &&
			(!frontendRouteRooms.includes(roomName) ||
				statRooms.includes(roomName))
		) {
			// emit the updated number of users in the room
			sendUserCount({ io, roomName, timerStore });
		}

		io.emit("globalUsers", { globalUsersCount: io.engine.clientsCount });

		// leave the room
		socket.leave(roomName);
	});

	// handle requests to start a countdown
	socket.on(
		"startCountdown",
		// eslint-disable-next-line no-shadow
		async ({ roomName, durationInSeconds }: EmitStartCountdownArgs) => {
			console.log({ roomName, durationInSeconds });
			if (!frontendRouteRooms.includes(roomName)) {
				timerStore[roomName].isPaused = false;
				timerStore[roomName].originalDuration = durationInSeconds;
				await writeToDb({
					roomName,
					isPaused: timerStore[roomName].isPaused,
					isBreak: timerStore[roomName].isBreak,
					endTimestamp: new Date(
						Date.now() + durationInSeconds * 1000
					),
					originalDuration: timerStore[roomName].originalDuration,
				});

				const currentMessage = messageList({
					user: socket.data.nickname,
					room: roomName,
					message: "started",
					value: `${durationInSeconds / 60}`,
					altValue: formatTimestamp(
						timerStore[roomName].secondsRemaining
					),
				});

				await sendMessageToDb({
					roomName,
					message: currentMessage,
					userName: socket.data.nickname,
					io,
				});

				startCountdown({
					roomName,
					durationInSeconds,
					io,
					timerStore,
				});
			}
		}
	);

	// eslint-disable-next-line no-shadow
	socket.on("timerRequest", ({ roomName }: EmitWithRoomNameArgs) => {
		timerRequest({ roomName, timerStore, socket });
	});

	// handle requests to pause a countdown
	// eslint-disable-next-line no-shadow
	socket.on("pauseCountdown", async ({ roomName }: EmitWithRoomNameArgs) => {
		if (timerStore[roomName]) {
			// eslint-disable-next-line no-unused-expressions
			timerStore[roomName].isPaused === true
				? (timerStore[roomName].isPaused = false)
				: (timerStore[roomName].isPaused = true);
		}

		await writeToDb({
			roomName,
			isPaused: timerStore[roomName].isPaused,
			isBreak: timerStore[roomName].isBreak,
			pausedAt: timerStore[roomName].isPaused ? new Date() : undefined,
			endTimestamp: new Date(
				Date.now() + timerStore[roomName].secondsRemaining * 1000
			),
		});

		const currentMessage = messageList({
			user: socket.data.nickname,
			room: roomName,
			message: timerStore[roomName].isPaused ? "paused" : "resumed",
			altValue: formatTimestamp(timerStore[roomName].secondsRemaining),
		});

		await sendMessageToDb({
			roomName,
			message: currentMessage,
			userName: socket.data.nickname,
			io,
		});

		startCountdown({
			roomName,
			durationInSeconds: timerStore[roomName].secondsRemaining,
			io,
			timerStore,
		});
		timerRequest({ roomName, timerStore, socket });
	});

	// eslint-disable-next-line no-shadow
	socket.on("resetCountdown", async ({ roomName }: EmitWithRoomNameArgs) => {
		if (!frontendRouteRooms.includes(roomName)) {
			timerStore[roomName].isPaused = false;
			await writeToDb({
				roomName,
				isPaused: timerStore[roomName].isPaused,
				isBreak: timerStore[roomName].isBreak,
				endTimestamp: new Date(
					Date.now() + timerStore[roomName].originalDuration * 1000
				),
			});

			const currentMessage = messageList({
				user: socket.data.nickname,
				room: roomName,
				message: "reset",
				value: `${timerStore[roomName].originalDuration / 60}`,
				altValue: formatTimestamp(
					timerStore[roomName].secondsRemaining
				),
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName: socket.data.nickname,
				io,
			});

			startCountdown({
				roomName,
				durationInSeconds: timerStore[roomName].originalDuration,
				io,
				timerStore,
			});
			timerRequest({ roomName, timerStore, socket });
		}
	});

	// handler breakTimer : on emit of "breakTimer" from the cf-frontend

	socket.on(
		"breakTimer",
		// eslint-disable-next-line no-shadow
		async ({ roomName, userName }: EmitWorkBreakTimerArgs) => {
			timerStore[roomName].isBreak = true;
			timerStore[roomName].isPaused = false;
			io.to(roomName).emit("workBreakResponse", {
				userNameFromServer: userName,
				isBreakMode: timerStore[roomName].isBreak,
			});

			const currentMessage = messageList({
				user: socket.data.nickname,
				room: roomName,
				message: "break",
				altValue: formatTimestamp(
					timerStore[roomName].secondsRemaining
				),
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName,
				io,
			});

			io.to(roomName).emit("updatedTitle", {
				title: timerStore[roomName].isBreak
					? timerStore[roomName].timerTitle.breakTitle
					: timerStore[roomName].timerTitle.workTitle,
			});

			startCountdown({
				roomName,
				durationInSeconds: 0,
				io,
				timerStore,
			});
		}
	);

	// handler workTimer : on emit of "workTimer" from the cf-frontend
	socket.on(
		"workTimer",
		// eslint-disable-next-line no-shadow
		async ({ roomName, userName }: EmitWorkBreakTimerArgs) => {
			timerStore[roomName].isBreak = false;
			timerStore[roomName].isPaused = false;
			io.to(roomName).emit("workBreakResponse", {
				userNameFromServer: userName,
				isBreakMode: timerStore[roomName].isBreak,
			});

			const currentMessage = messageList({
				user: socket.data.nickname,
				room: roomName,
				message: "work",
				altValue: formatTimestamp(
					timerStore[roomName].secondsRemaining
				),
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName,
				io,
			});

			io.to(roomName).emit("updatedTitle", {
				title: timerStore[roomName].isBreak
					? timerStore[roomName].timerTitle.breakTitle
					: timerStore[roomName].timerTitle.workTitle,
			});

			startCountdown({
				roomName,
				durationInSeconds: 0,
				io,
				timerStore,
			});
		}
	);

	socket.on(
		"updateTimerButtons",
		// eslint-disable-next-line no-shadow
		async ({ roomName, timerButtons, isBreak }) => {
			const previousTimerButtons =
				timerStore[roomName].timerButtons[isBreak ? "break" : "work"];

			timerStore[roomName].timerButtons[isBreak ? "break" : "work"] =
				timerButtons;

			await writeToDb({
				roomName,
				isPaused: timerStore[roomName].isPaused,
				isBreak: timerStore[roomName].isBreak,
				endTimestamp: new Date(
					Date.now() + timerStore[roomName].secondsRemaining * 1000
				),
				originalDuration: timerStore[roomName].originalDuration,
				workTimerButtons: timerStore[roomName].timerButtons.work,
				breakTimerButtons: timerStore[roomName].timerButtons.break,
			});

			io.to(roomName).emit("timerButtons", {
				workTimerButtons: timerStore[roomName].timerButtons.work,
				breakTimerButtons: timerStore[roomName].timerButtons.break,
			});

			let currentMessage = "";
			// if added a timer, then send a message to the room
			if (previousTimerButtons.length < timerButtons.length) {
				currentMessage = messageList({
					user: socket.data.nickname,
					room: roomName,
					message: "addedTimer",
					value: `${timerButtons[timerButtons.length - 1]}`,
				});
			}

			// if removed a timer, then send a message to the room
			if (previousTimerButtons.length > timerButtons.length) {
				currentMessage = messageList({
					user: socket.data.nickname,
					room: roomName,
					message: "removedTimer",
					value: `${
						previousTimerButtons.filter(
							(timer) =>
								!timerButtons.includes(timer) &&
								timer !== undefined
						)[0]
					}`,
				});
			}

			if (currentMessage.length > 0) {
				await sendMessageToDb({
					roomName,
					message: currentMessage,
					userName: socket.data.nickname,
					io,
				});
			}
		}
	);

	// eslint-disable-next-line no-shadow
	socket.on("togglePublic", async ({ roomName }) => {
		if (timerStore[roomName].isPublic === true) {
			timerStore[roomName].isPublic = false;
		} else {
			timerStore[roomName].isPublic = true;
		}
		io.to(roomName).emit("togglePublicUpdate", {
			isPublic: timerStore[roomName].isPublic,
		});

		// emit the updated number of users in the room
		sendUserCount({ io, roomName, timerStore });
		await writeToDb({
			roomName,
			isPublic: timerStore[roomName].isPublic,
		});

		const currentMessage = messageList({
			user: socket.data.nickname,
			room: roomName,
			message: "publicToggle",
			value: timerStore[roomName].isPublic ? "public" : "private",
		});

		await sendMessageToDb({
			roomName,
			message: currentMessage,
			userName: socket.data.nickname,
			io,
		});

		console.log(
			currentMessage,
			`User ${socket.data.nickname} changed room ${roomName} to ${
				timerStore[roomName].isPublic ? "public" : "private"
			}`
		);
	});

	// eslint-disable-next-line no-shadow
	socket.on("updateTitle", async ({ roomName, title }) => {
		if (
			title.length > 0 &&
			typeof title === "string" &&
			// Alphanumeric characters, spaces, underscores, dash, period, comma, colon, semicolon, apostrophe, question mark, exclamation point, and parentheses
			/^[a-zA-Z0-9 _.,:;'"?!()]+$/.test(title)
		) {
			if (timerStore[roomName].isBreak) {
				await writeToDb({
					roomName,
					breakTitle: title,
					workTitle: timerStore[roomName].timerTitle.workTitle,
				});
				timerStore[roomName].timerTitle.breakTitle = title;
			} else {
				await writeToDb({
					roomName,
					workTitle: title,
					breakTitle: timerStore[roomName].timerTitle.breakTitle,
				});
				timerStore[roomName].timerTitle.workTitle = title;
			}

			io.to(roomName).emit("updatedTitle", {
				title,
			});

			const currentMessage = messageList({
				user: socket.data.nickname,
				room: roomName,
				message: "changedtitle",
				value: title,
				altValue: timerStore[roomName].isBreak ? "break" : "work",
			});

			await sendMessageToDb({
				roomName,
				message: currentMessage,
				userName: socket.data.nickname,
				io,
			});

			console.log(
				`User ${socket.data.nickname} updated title to ${title} in room ${roomName}`
			);
		}
	});
});

export { io, httpServer, timerStore };
