import { Server, Socket } from "socket.io";
import { chatServices } from "../services/chat.services";
import { messageServices } from "../services/message.services";
import { Message } from "../types/chat.types";

export default function messageHandler(io: Server, socket: Socket) {
    socket.on("newMessage", async (message: Message, callback?: (response: any) => void) => {
        const user = socket.data.user;

        if (!user) {
            console.error("[DEBUG] Unauthorized user trying to send message");
            callback?.({ success: false, error: "Unauthorized" });
            return;
        }

        message.senderId = user.id;

        try {
            const tempId = message.id;
            const [err, result] = await messageServices.sendMessage(message);
            
            if (err || !result) {
                console.error(`[DEBUG] Failed to save message: ${err}`);
                callback?.({ success: false, error: err, tempId });
                return;
            }
            if (typeof result === 'string') {
                console.error(`[DEBUG] Unexpected string result: ${result}`);
                callback?.({ success: false, error: "Internal server error" });
                return;
            }

            const savedMessage = result;
            const [participantsErr, chatParticipants] = await chatServices.getChatParticipantsByChatId(message.chatId);
            
            if (participantsErr || !chatParticipants) {
                console.error(`[DEBUG] Failed to get chat participants: ${participantsErr}`);
                callback?.({ success: false, error: "Failed to notify other participants" });
                return;
            }

            const receivers = chatParticipants.filter(participant => participant.userId !== user.id);
            receivers.forEach(participant => {
                io.to(participant.userId).emit("newMessage", {
                    message: savedMessage
                });
            });

            callback?.({ success: true, message: savedMessage });
        } catch (error) {
            console.error("[DEBUG] Error in newMessage handler:", error);
            callback?.({ success: false, error: "Internal server error" });
            return;
        }
    });

    socket.on("messageDelete", async (data) => {
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(data.chatId);
        if (err || !chatParticipants) {
            socket.emit("message_error", {
                message: "Failed to get chat participants",
                details: err,
            });
            return;
        }

        const otherParticipants = chatParticipants.filter((participant) => participant.userId !== data.deletedBy);

        for (const participant of otherParticipants) {
            io.to(participant.userId).emit("messageDeleted", {
                messageId: data.messageId,
                chatId: data.chatId,
                deletedBy: data.deletedBy,
            });
        }
    });

    socket.on("message:read", async (messageId: string, chatId: string, callback?: (response: any) => void) => {
        const user = socket.data.user;
        
        if (!messageId || !chatId || !user) {
            console.error("[DEBUG] Invalid messageId, chatId, or user");
            callback?.({ success: false, error: "Invalid parameters" });
            return;
        }

        try {
            const [err, result] = await messageServices.markMessageAsRead(messageId, user.id);
            if (err || !result) {
                console.error(`[DEBUG] Failed to mark message as read: ${err}`);
                callback?.({ success: false, error: err });
                return;
            }
            const [participantsErr, chatParticipants] = await chatServices.getChatParticipantsByChatId(chatId);
            
            if (participantsErr || !chatParticipants) {
                console.error(`[DEBUG] Failed to get chat participants: ${participantsErr}`);
                callback?.({ success: false, error: "Failed to notify other participants" });
                return;
            }

            chatParticipants.forEach(participant => {
                io.to(participant.userId).emit("messageRead", {
                    messageId,
                    userId: user.id,
                    chatId
                });
            });

            callback?.({ success: true });
        } catch (error) {
            console.error("[DEBUG] Error in message:read handler:", error);
            callback?.({ success: false, error: "Internal server error" });
            return;
        }
    });

    socket.on("message:readAll", async (chatId: string) => {
        const user = socket.data.user;
        if (!chatId) {
            console.error("[DEBUG] Invalid chatId");
            return;
        }
        try {
            const result = await messageServices.markAllMessagesAsReadByChat(chatId, user.id);
            if (!result.success) {
                console.error(`[DEBUG] Failed to mark all messages as read: ${result.message}`);
                return;
            }
            // Use io.to() to ensure all users in the chat receive the notification
            io.to(chatId).emit("chat:readAll:notify", {
                chatId,
                userId: user.id
            });
        } catch (err) {
            console.error("[DEBUG] Error in message:readAll handler:", err);
            return;

        }
    });

    socket.on("messageDelivered", async (data) => {
        const { messageId, chatId } = data;
        const user = socket.data.user;

        if (!messageId || !chatId || !user) {
            console.error("Invalid data for messageDelivered event");
            return;
        }

        io.to(chatId).emit("messageDelivered", { messageId, chatId });
    });
}
