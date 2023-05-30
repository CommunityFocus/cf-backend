import express from "express";
import { Server } from "socket.io";
import { startCountdown } from "@helpers/startTimer";
import { timerRequest } from "@helpers/timerRequest";
import { destroyTimer } from "./helpers/destroyTimer"
import apiRoutes from "@routes/apiRoutes";
import { storeMiddleware } from "@middleware/storeMiddleware";
import http, { createServer } from "http";
import https from "https";
import cors from "cors";
import { ITimerStore } from "@common/types/types";
import { Request, Response } from "express";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "@common/types/socket/types";

const app = express();
const PORT = process.env.PORT || 4000;
const httpServer = createServer(app)

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

const io = new Server<
  ServerToClientEvents,
  ClientToServerEvents,
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
 *    destroyTimer?: setTimeout() // optional: Only set if there are no users in the room at any given time
 *    }
 * }
 */
const timerStore: ITimerStore = {};

// routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    msg: "Welcome to time-share-v2. Please see https://github.com/nmpereira/time-share-v2",
  });
});

app.use("/api/v1/", storeMiddleware(timerStore), apiRoutes);

// listen for socket.io connections and handle the countdown events
io.on("connection", (socket) => {
  // get the room name from the query string. Example of roomName: "/:room"
  let roomName = socket.handshake.query.roomName as string;

  // if there's no roomName property for this room, create one
  if (!timerStore[roomName]) {
    timerStore[roomName] = {
      users: [],
      timer: undefined,
      secondsRemaining: 0,
      isPaused: false,
    };
  }
  // console.log("timerStore", timerStore);

  // if there is a destroy timer countdown, clear it
  if (timerStore[roomName].destroyTimer && roomName !== "default") {
    console.log("Clearing destroy timer for:", roomName);
    clearInterval(timerStore[roomName].destroyTimer);
  }

  socket.on("join", (roomName: string) => {
    // join the room
    socket.join(roomName);

    if (timerStore[roomName] && roomName !== "default") {
      // add the user to the room
      timerStore[roomName].users.push(socket.id);

      // emit the updated number of users in the room
      io.to(roomName).emit("usersInRoom", timerStore[roomName].users.length);

      console.log(`User ${socket.id} joined room ${roomName}`);
    }
  });

  console.log(
    `User connected ${socket.id} ${roomName ? `to room ${roomName}` : ""}`
  );

  socket.on("disconnect", () => {
    if (timerStore[roomName] && roomName !== "default") {
      // remove the user from the room
      timerStore[roomName].users = timerStore[roomName].users.filter(
        (user) => user !== socket.id
      );
      console.log(`User ${socket.id} disconnected from room ${roomName}`);

      // emit the updated number of users in the room
      io.to(roomName).emit("usersInRoom", timerStore[roomName].users.length);

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

    // leave the room
    socket.leave(roomName);
  });

  // handle requests to start a countdown
  socket.on(
    "startCountdown",
    ({
      roomName,
      durationInSeconds,
    }: {
      roomName: string;
      durationInSeconds: number;
    }) => {
      console.log({ roomName, durationInSeconds });
      if (roomName !== "default") {
        startCountdown({ roomName, durationInSeconds, io, timerStore });
      }
    }
  );

  socket.on("timerRequest", ({ roomName }: { roomName: string }) => {
    timerRequest({ roomName, timerStore, socket });
  });

  // handle requests to pause a countdown
  socket.on("pauseCountdown", () => {});

  // handle requests to unpause a countdown
  socket.on("unpauseCountdown", () => {});
});

module.exports = {
  io,
  httpServer,
  timerStore,
};
