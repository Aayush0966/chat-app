import { Server, Socket } from "socket.io";

export default function registerChatHandlers(io: Server, socket: Socket) {
    socket.on("join-chat", (chatId: string) => {
        socket.join(chatId);
        console.log(`🔗 Socket ${socket.id} joined chat ${chatId}`);
    });

    socket.on("leave-chat", (chatId: string) => {
        socket.leave(chatId);
    })
}