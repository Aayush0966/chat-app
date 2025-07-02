import { Server } from "socket.io";
import chatHandler from "./chat.socket";
import { socketAuthMiddleware } from "../middlewares/socket.auth.middleware";

export const setupSockets = (io: Server) => {
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {

        const user = socket.data.user;
        if (user?.id) {
            socket.join(user.id);
        }

        socket.on("ping", (data: string) => {
            socket.emit("pong", "Working");
        });

        chatHandler(io, socket);

        socket.on("disconnect", () => {
            console.log("❌ Disconnected:", socket.id);
        });
    });
};