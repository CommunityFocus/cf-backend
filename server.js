const express = require("express");
const app = express();
const { createServer } = require("http");
const morgan = require("morgan");

const { Server } = require("socket.io");
const { startCountdown } = require("./helpers/startTimer");
const PORT = process.env.PORT || 4000;

const httpServer = createServer(app, {
  function(req, res) {
    var done = finalhandler(req, res);
    logger(req, res, function (err) {
      if (err) return done(err);

      // respond to request
      res.setHeader("content-type", "text/plain");
      res.end("hello, world!");
    });
  },
});

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
