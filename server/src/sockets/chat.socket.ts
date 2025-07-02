import { Server, Socket } from "socket.io";
import { Message } from "../types/chat.types";
import { chatServices } from "../services/chat.services";

export default function chatHandler(io: Server, socket: Socket) {
    console.log('Chat handler initialized for socket:', socket.id);
    

    socket.on("newMessage", async (message: Message) => {
        console.log('Received new message:', message);

        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(message.chatId)
        if (err || !chatParticipants) {
            console.error('Error getting chat participants:', err);
            socket.emit("message_error", {
                message: "Failed to send messages",
                details: err,
            });
            return;
        }

        console.log('Found chat participants:', chatParticipants);
        
        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== message.senderId)
        console.log('Filtered receivers:', receiver);

        for (const user of receiver) {
            console.log('Emitting message to user:', user.userId);
            io.to(user.userId).emit("newMessage", {
                message
            })
        }
    })
}