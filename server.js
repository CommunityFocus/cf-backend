const express = require("express");
const app = express();
const { createServer } = require("http");

const { Server } = require("socket.io");
const { startCountdown } = require("./helpers/startTimer");
const PORT = process.env.PORT || 4000;

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

// store the timers for each room
const timerStore = {};

// routes
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Hello World" });
});

// listen for socket.io connections and handle the countdown events
io.on("connection", (socket) => {

  const roomName = Array.from(socket.rooms).filter((id) => id !== socket.id)[1];
  console.log(
    `User connected ${socket.id} ${roomName ? `to room ${roomName}` : ""}`
  );

  socket.on("join", (roomName) => {
    // join the room
    socket.join(roomName);
    socket.to(roomName).emit("userJoined");

    console.log(`User joined room ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected from room ${roomName}`);

    // leave the room
    socket.leave(roomName);
  });

  // handle requests to start a countdown
  socket.on("startCountdown", ({ roomName, durationInSeconds }) => {
    console.log({ roomName, durationInSeconds });
    startCountdown({ roomName, durationInSeconds, io, timerStore });
  });

  // handle requests to pause a countdown
  socket.on("pauseCountdown", (roomName) => {
    // if there's a timer for this room, clear it and emit a message to the room
    if (timerStore[roomName]) {
      clearInterval(timerStore[roomName]);
      io.to(roomName).emit("timerPaused");
    }
  });

  // handle requests to unpause a countdown
  socket.on("unpauseCountdown", ({ roomName, remainingTime }) => {
    // start a new timer with the remaining time and emit a message to the room
    startCountdown({
      roomName,
      durationInSeconds: remainingTime,
      io,
      timerStore,
    });
    io.to(roomName).emit("timerUnpaused", remainingTime);
  });

  // handle requests to reset a countdown
  socket.on("resetCountdown", (roomName) => {
    // if there's a timer for this room, clear it and emit a message to the room
    if (timerStore[roomName]) {
      clearInterval(timerStore[roomName]);
      io.to(roomName).emit("timerReset");
    }
  });
});

module.exports = {
  io,
  httpServer,
  timerStore,
};
