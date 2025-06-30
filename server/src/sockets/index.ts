import { Server } from "socket.io";
import registerChatHandlers from "./chat.socket";


export const setupSockets = (io: Server) => {
    io.on("connection", (socket) => {
        console.log("🔌 New socket connected:", socket.id);

        registerChatHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log("❌ Disconnected:", socket.id);
        });
    });
}