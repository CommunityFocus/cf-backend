const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;
const { createServer } = require("http");
const { Server } = require("socket.io");
const { startCountdown } = require("./helpers/startTimer");
const { destroyTimer } = require("./helpers/destroyTimer");

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(
    `Server is running on ${
      process.env.NODE_ENV !== "production"
        ? `http://localhost:${PORT}`
        : `port ${PORT}`
    }`
  );
});

const io = new Server(httpServer, {
  cors: {
    // all origins
    origin: ["http://localhost:3000", "http://127.0.0.1:5173", "*"],
    // allow all methods
    methods: ["GET", "POST"],
  },
});

/**
 * Store the timers for each room
 * Example of timerStore object
 * {  roomName:{
 *    timer: setInterval(),
 *    users:[socket.id, socket.id, socket.id]]
 *    }
 * }
 */
const timerStore = {};

// routes
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Hello World" });
});

// listen for socket.io connections and handle the countdown events
io.on("connection", (socket) => {
  let roomName = socket.handshake.query.roomName;

  // if there's no roomName property for this room, create one
  if (!timerStore[roomName]) {
    timerStore[roomName] = {};
  }
  // if there's no users array property for this room, create one
  if (!timerStore[roomName]["users"]) {
    console.log("resetting users");
    timerStore[roomName].users = [];
  }

  // if there's no timer property for this room, create one
  if (!timerStore[roomName].timer) {
    timerStore[roomName].timer = null;
  }

  socket.on("join", (roomName) => {
    // join the room
    socket.join(roomName);
    socket.in(roomName).emit("userJoined");

    // if there is a destroy timer countdown, clear it
    if (timerStore[roomName].destroyTimer) {
      console.log("Clearing destroy timer for:", roomName);
      clearInterval(timerStore[roomName].destroyTimer);
    }

    // add the user to the room
    timerStore[roomName].users.push(socket.id);

    io.to(roomName).emit("userJoined", timerStore[roomName].users);
    io.to(roomName).emit("usersInRoom", timerStore[roomName].users.length);

    console.log(`User ${socket.id} joined room ${roomName}`);
  });

  console.log(
    `User connected ${socket.id} ${roomName ? `to room ${roomName}` : ""}`
  );

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} disconnected from room ${roomName}`);

    // remove the user from the room
    timerStore[roomName].users = timerStore[roomName].users.filter(
      (user) => user !== socket.id
    );

    io.to(roomName).emit("userLeft", timerStore[roomName].users);
    io.to(roomName).emit("usersInRoom", timerStore[roomName].users?.length);

    if (timerStore[roomName].users.length === 0) {
      // if there are no users left in the room, clear the timer and delete the room after a delay
      console.log("Setting destroyTimer instance to destroy timer instance for:", roomName);
      timerStore[roomName].destroyTimer = setTimeout(
        () => {
          destroyTimer({ roomName, timerStore });
        },
        10000 // give the users 10 seconds to rejoin
      );
    }

    // leave the room
    socket.leave(roomName);
  });

  // handle requests to start a countdown
  socket.on("startCountdown", ({ roomName, durationInSeconds }) => {
    console.log({ roomName, durationInSeconds });
    startCountdown({ roomName, durationInSeconds, io, timerStore });
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
