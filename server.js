const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const PORT = process.env.PORT || 4000;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // all origins
    origin: "*",
    // allow all methods
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("create-something", (msg) => {
    console.log("message: ", msg, typeof msg, Number(msg), Number(msg) || 100);

    let countTill = Number(msg) || 100;

    // create a timer
    const timer = setInterval(() => {
      // emit a message to the client
      countTill--;
      socket.emit("timer", countTill);
      console.log(countTill);
    }, 1000);

    // stop the timer when countTill is -1
    setTimeout(() => {
      clearInterval(timer);
    }, countTill * 1000 + 1000);
  });
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

// routes
app.get("/", (req, res) => {
  res.status(200).json({ msg: "Hello World" });
});
