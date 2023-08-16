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
import { TimerStore } from "./common/types/types";
import {
	ClientToServerEvents,
	InterServerEvents,
	ServerToClientEvents,
	SocketData,
	EmitStartCountdownArgs,
	EmitWithRoomNameArgs,
	EmitWorkBreakTimerArgs,
	EmitJoinEventArgs,
} from "./common/types/socket/types";
import connectDB from "./common/models/connectDB";
import { readFromDb, writeToDb } from "./common/models/dbHelpers";

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// middleware
app.use(
	cors({
		origin: [
			"https://admin.socket.io",
			"https://communityfocus.app",
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

/**
 * Store the timers for each room
 * Example of timerStore object
 * {
 * [roomName]:{
 *    timer: setInterval(),
 *    users:[socket.data.nickname, socket.data.nickname, socket.data.nickname]]
 *    secondsRemaining: number,
 *    isPaused: boolean,
 * 	  isBreak: boolean,
 *    destroyTimer?: setTimeout() // optional: Only set if there are no users in the room at any given time
 *    originalDuration: number // Original duration of the timer in seconds for resetting the timer
 *    }
 * }
 */
const timerStore: TimerStore = {};

// routes
app.get("/", (req: Request, res: Response) => {
	res.status(200).json({
		msg: "Welcome to CommunintyFocus. Please see https://communityfocus.app/. If developing locally, please go to http://127.0.0.1:5100/",
	});
});

app.use("/api/v1/", storeMiddleware(timerStore), apiRoutes);

// listen for socket.io connections and handle the countdown events
io.on("connection", (socket) => {
	// get the room name from the query string. Example of roomName: "/:room"
	const roomName = socket.handshake.query.roomName as string;

	io.emit("globalUsers", { globalUsersCount: io.engine.clientsCount });

	// if there's no roomName property for this room, create one
	if (!timerStore[roomName]) {
		timerStore[roomName] = {
			users: [],
			timer: undefined,
			secondsRemaining: 0,
			isPaused: false,
			isBreak: false,
			originalDuration: 0,
			heartbeatCounter: 0,
			isTimerRunning: false,
		};
	}
	// console.log("timerStore", timerStore);

	// if there is a destroy timer countdown, clear it
	if (timerStore[roomName].destroyTimer && roomName !== "default") {
		console.log("Clearing destroy timer for:", roomName);
		clearInterval(timerStore[roomName].destroyTimer);
	}

	// eslint-disable-next-line no-shadow
	socket.on("join", async ({ roomName, userName }: EmitJoinEventArgs) => {
		// join the room
		socket.join(roomName);
		// eslint-disable-next-line no-param-reassign
		socket.data.nickname =
			userName === "defaultUser" ? socket.id : userName;

		if (timerStore[roomName] && roomName !== "default") {
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
						endTimestamp: new Date(
							Date.now() +
								timerStore[roomName].secondsRemaining * 1000
						),
						originalDuration: timerStore[roomName].originalDuration,
					});
				}
			}

			// add the user to the room
			timerStore[roomName].users.push(socket.data.nickname);

			// emit the updated number of users in the room
			io.to(roomName).emit("usersInRoom", {
				numUsers: timerStore[roomName].users.length,
				userList: timerStore[roomName].users,
			});

			console.log(`User ${socket.data.nickname} joined room ${roomName}`);
		}
	});

	console.log(
		`User connected ${socket.data.nickname} ${
			roomName ? `to room ${roomName}` : ""
		}`
	);

	socket.on("changeUsername", ({ userName }: { userName: string }) => {
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
			io.to(roomName).emit("usersInRoom", {
				numUsers: timerStore[roomName].users.length,
				userList: timerStore[roomName].users,
			});
		}
	});

	socket.on("disconnect", () => {
		if (timerStore[roomName] && roomName !== "default") {
			// remove the user from the room. Remove only the first instance of the user
			timerStore[roomName].users.splice(
				timerStore[roomName].users.indexOf(socket.data.nickname),
				1
			);

			console.log(
				`User ${socket.data.nickname} disconnected from room ${roomName}`
			);

			// emit the updated number of users in the room
			io.to(roomName).emit("usersInRoom", {
				numUsers: timerStore[roomName].users.length,
				userList: timerStore[roomName].users,
			});

			if (timerStore[roomName].users.length === 0) {
				// if there are no users left in the room, clear the timer and delete the room after a delay
				console.log(
					"Setting destroyTimer instance to destroy timer instance for:",
					roomName
				);
				timerStore[roomName].destroyTimer = setTimeout(
					() => {
						destroyTimer({ roomName, timerStore });
					},
					120000 // give the users 2 minutes to rejoin
				);
			}
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
			if (roomName !== "default") {
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
				startCountdown({ roomName, durationInSeconds, io, timerStore });
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
		if (roomName !== "default") {
			timerStore[roomName].isPaused = false;
			await writeToDb({
				roomName,
				isPaused: timerStore[roomName].isPaused,
				isBreak: timerStore[roomName].isBreak,
				endTimestamp: new Date(
					Date.now() + timerStore[roomName].originalDuration * 1000
				),
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
		({ roomName, userName }: EmitWorkBreakTimerArgs) => {
			timerStore[roomName].isBreak = true;
			timerStore[roomName].isPaused = false;
			io.to(roomName).emit("workBreakResponse", {
				userNameFromServer: userName,
				isBreakMode: timerStore[roomName].isBreak,
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
	// eslint-disable-next-line no-shadow
	socket.on("workTimer", ({ roomName, userName }: EmitWorkBreakTimerArgs) => {
		timerStore[roomName].isBreak = false;
		timerStore[roomName].isPaused = false;
		io.to(roomName).emit("workBreakResponse", {
			userNameFromServer: userName,
			isBreakMode: timerStore[roomName].isBreak,
		});
		startCountdown({
			roomName,
			durationInSeconds: 0,
			io,
			timerStore,
		});
	});
});

export { io, httpServer, timerStore };
