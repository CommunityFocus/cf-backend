const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app);
const {startCountdown} = require("./helpers/startTimer");
const io = new Server(httpServer, {
  cors: {
    // all origins
    origin: "*",
    // allow all methods
    methods: ["GET", "POST"],
  },
});

// io.on("connection", (socket) => {
//   console.log("a user connected");

//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
//   socket.on("create-something", (msg) => {
//     console.log("message: ", msg, typeof msg, Number(msg), Number(msg) || 100);

//     let countTill = Number(msg) || 100;

//     // get room
//     // get 2nd argument from the set
//     const roomId= Array.from(socket.rooms).filter(id=>id!==socket.id)[0];

//     console.log("roomId: ", roomId);

//     if(!roomId) return;

//     // if a timer is already running, stop it and start a new one

//     // create a timer
//     const timer = setInterval(() => {
//       // emit a message to the client
//       countTill--;
//       // socket.emit("timer", countTill);
//       io.to(roomId).emit("timer", countTill);
//       console.log(countTill);
//     }, 1000);

//     // stop the timer when countTill is -1
//     setTimeout(() => {
//       clearInterval({intervalId: timer});
//     }, countTill * 1000 + 1000);
//   });

//   socket.on("join", (room) => {
//     socket.join(room);
//     console.log("joined room: ", room);
//   });
// });

httpServer.listen(PORT, () => {
  console.log(
    `Server is running on ${
      process.env.NODE_ENV !== "production"
        ? `http://localhost:${PORT}`
        : `port ${PORT}`
    }`
  );
});

// routes
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Hello World" });
});

// assuming you have already set up your socket.io server and have a 'io' object

// store the timers for each room
const timerStore = {};



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
    startCountdown({roomName, durationInSeconds,io, timerStore});
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
    startCountdown({roomName, durationInSeconds: remainingTime,io, timerStore});
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

module.exports = { timerStore };
