import { Server, Socket } from "socket.io";
import { Message } from "../types/chat.types";
import { chatServices } from "../services/chat.services";

export default function chatHandler(io: Server, socket: Socket) {
    console.log('Chat handler initialized for socket:', socket.id);
    
    // Store typing timeouts for cleanup
    const typingTimeouts = new Map<string, NodeJS.Timeout>();
    

    socket.on("newMessage", async (message: Message) => {

        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(message.chatId)
        if (err || !chatParticipants) {
            console.error('Error getting chat participants:', err);
            socket.emit("message_error", {
                message: "Failed to send messages",
                details: err,
            });
            return;
        }

        
        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== message.senderId)

        for (const user of receiver) {
            console.log('Emitting message to user:', user.userId);
            io.to(user.userId).emit("newMessage", {
                message
            })
        }
    })

    socket.on("typing", async(typingDetails) => {
        console.log('Typing event received:', typingDetails);
        
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(typingDetails.chatId)
        if (err || !chatParticipants) {
            console.error('Error getting chat participants:', err);
            socket.emit("message_error", {
                message: "Failed to get chat participants",
                details: err,
            });
            return;
        }
        
        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== typingDetails.typingUserId)
        const timeoutKey = `${typingDetails.typingUserId}-${typingDetails.chatId}`;

        // Check if this user is already in a typing state for this chat
        const isAlreadyTyping = typingTimeouts.has(timeoutKey);

        // Only emit startTyping if this is a new typing session (not already typing)
        if (!isAlreadyTyping) {
            console.log('User started typing, emitting startTyping for:', typingDetails.typingUserName);
            for (const user of receiver) {
                console.log('Emitting startTyping to user:', user.userId, 'for typing user:', typingDetails.typingUserName);
                io.to(user.userId).emit("startTyping", typingDetails)
            }
        } else {
            // Clear the existing timeout since user is still typing
            console.log('User still typing, resetting timeout for:', typingDetails.typingUserName);
            clearTimeout(typingTimeouts.get(timeoutKey)!);
        }

        // Set a timeout to automatically stop typing after 5 seconds of inactivity
        const timeout = setTimeout(async () => {
            console.log('Auto-stopping typing for user:', typingDetails.typingUserName);
            
            // Emit stopTyping to all receivers
            for (const user of receiver) {
                io.to(user.userId).emit("stopTyping", typingDetails);
            }
            
            // Clean up the timeout - this allows startTyping to be sent again next time
            typingTimeouts.delete(timeoutKey);
        }, 5000);

        typingTimeouts.set(timeoutKey, timeout);
    })

    socket.on("stopTyping", async(typingDetails) => {
        console.log('Stop typing event received:', typingDetails);
        
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(typingDetails.chatId)
        if (err || !chatParticipants) {
            console.error('Error getting chat participants:', err);
            return;
        }
        
        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== typingDetails.typingUserId)

        for (const user of receiver) {
            console.log('Emitting stopTyping to user:', user.userId, 'for typing user:', typingDetails.typingUserName);
            io.to(user.userId).emit("stopTyping", typingDetails)
        }

        // Clear the timeout since user explicitly stopped typing
        const timeoutKey = `${typingDetails.typingUserId}-${typingDetails.chatId}`;
        if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey)!);
            typingTimeouts.delete(timeoutKey);
        }
    })
}