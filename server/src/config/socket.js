const { Server } = require("socket.io");

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        io.on("connection", (socket) => {
            console.log(`[SOCKET] Client connected: ${socket.id}`);

            socket.on("join_room", (roomName) => {
                socket.join(roomName);
                console.log(`[SOCKET] Client ${socket.id} joined room: ${roomName}`);
            });

            socket.on("disconnect", () => {
                console.log(`[SOCKET] Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
