const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;
const { createServer } = require("http");
const { Server } = require("socket.io");
const { startCountdown } = require("./helpers/startTimer");
const { timerRequest } = require("./helpers/timerRequest");

const { destroyTimer } = require("./helpers/destroyTimer");
const apiRoutes = require("./routes/apiRoutes");
const { storeMiddleware } = require("./middleware/storeMiddleware");
const httpServer = createServer(app);
const cors = require("cors");


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

const io = new Server(httpServer, {
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
const timerStore = {};

// routes
app.get("/", (req, res) => {
  res.status(200).json({
    msg: "Welcome to time-share-v2. Please see https://github.com/nmpereira/time-share-v2",
  });
});

app.use("/api/v1/", storeMiddleware(timerStore), apiRoutes);

// listen for socket.io connections and handle the countdown events
io.on("connection", (socket) => {
  // get the room name from the query string. Example of roomName: "/:room"
  let roomName = socket.handshake.query.roomName;

  // if there's no roomName property for this room, create one
  if (!timerStore[roomName]) {
    timerStore[roomName] = {
      users: [],
      timer: null,
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

  socket.on("join", (roomName) => {
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
  socket.on("startCountdown", ({ roomName, durationInSeconds }) => {
    console.log({ roomName, durationInSeconds });
    if (roomName !== "default") {
      startCountdown({ roomName, durationInSeconds, io, timerStore });
    }
  });

  socket.on("timerRequest", ({ roomName }) => {
    timerRequest({ roomName, io, timerStore, socket });
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
