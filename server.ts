import express, { Request, Response } from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
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
} from "./common/types/socket/types";
import connectDB from "./common/models/connectDB";
import {
	modifyUpdateLog,
	readFromDb,
	writeToDb,
} from "./common/models/dbHelpers";

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app);

// middleware
app.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
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
		origin: "*",
	},
});

/**
 * Store the timers for each room
 * Example of timerStore object
 * {
 * [roomName]:{
 *    timer: setInterval(),
 *    users:[socket.id, socket.id, socket.id]]
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
		};
	}
	// console.log("timerStore", timerStore);

	// if there is a destroy timer countdown, clear it
	if (timerStore[roomName].destroyTimer && roomName !== "default") {
		console.log("Clearing destroy timer for:", roomName);
		clearInterval(timerStore[roomName].destroyTimer);
	}

	// eslint-disable-next-line no-shadow
	socket.on("join", async (roomName: string) => {
		// join the room
		socket.join(roomName);

		if (timerStore[roomName] && roomName !== "default") {
			const timerData = await readFromDb({ roomName });
			if (!timerStore[roomName].timer) {
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

				await modifyUpdateLog({
					roomName,
					message: `joined the room`,
					user: socket.id,
					io,
				});
			}

			// add the user to the room
			timerStore[roomName].users.push(socket.id);

			// emit the updated number of users in the room
			io.to(roomName).emit("usersInRoom", {
				numUsers: timerStore[roomName].users.length,
				userList: timerStore[roomName].users,
			});

			io.to(roomName).emit("updateLogHistory", {
				updateLog: timerData?.updateLog || [],
			});

			console.log(`User ${socket.id} joined room ${roomName}`);
		}
	});

	console.log(
		`User connected ${socket.id} ${roomName ? `to room ${roomName}` : ""}`
	);

	socket.on("disconnect", async () => {
		if (timerStore[roomName] && roomName !== "default") {
			// remove the user from the room
			timerStore[roomName].users = timerStore[roomName].users.filter(
				(user) => user !== socket.id
			);
			console.log(`User ${socket.id} disconnected from room ${roomName}`);

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

		await modifyUpdateLog({
			roomName,
			message: `left the room`,
			user: socket.id,
			io,
		});

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

				// round the duration to the nearest minute
				await modifyUpdateLog({
					roomName,
					message: `started a countdown for ${
						(Math.round(durationInSeconds / 60) * 60) / 60
					} minutes`,
					user: socket.id,
					io,
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
		startCountdown({
			roomName,
			durationInSeconds: timerStore[roomName].secondsRemaining,
			io,
			timerStore,
		});
		timerRequest({ roomName, timerStore, socket });

		await modifyUpdateLog({
			roomName,
			message: `${
				timerStore[roomName].isPaused ? "paused" : "unpaused"
			} the countdown`,
			user: socket.id,
			io,
		});
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

			await modifyUpdateLog({
				roomName,
				message: `reset the countdown to ${
					timerStore[roomName].originalDuration / 60
				} minutes`,
				user: socket.id,
				io,
			});
		}
	});

	// handler breakTimer : on emit of "breakTimer" from the cf-frontend
	socket.on("breakTimer", async (breakTimer: EmitWorkBreakTimerArgs) => {
		console.log("Console log from the 'breakTimer' emit event", {
			Username: `Client's user name is ${breakTimer.userName}`,
			roomName: `Client's roomName is ${breakTimer.roomName}`,
		});

		await modifyUpdateLog({
			roomName,
			message: `switched the timer to break mode`,
			user: socket.id,
			io,
		});
	});

	// handler workTimer : on emit of "workTimer" from the cf-frontend
	socket.on("workTimer", async (workTimer: EmitWorkBreakTimerArgs) => {
		console.log("Console log from the 'workTimer' emit event", {
			Username: `Client's user name is ${workTimer.userName}`,
			roomName: `Client's roomName is ${workTimer.roomName}`,
		});

		await modifyUpdateLog({
			roomName,
			message: `switched the timer to work mode`,
			user: socket.id,
			io,
		});
	});
});

export { io, httpServer, timerStore };
