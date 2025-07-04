import { Server, Socket } from "socket.io";
import { Message } from "../types/chat.types";
import { chatServices } from "../services/chat.services";
import { userServices } from "../services/user.services";

const onlineUsers = new Map<string, { socketId: string; firstName: string }>();
const socketToUser = new Map<string, string>();

export default function chatHandler(io: Server, socket: Socket) {
    const typingTimeouts = new Map<string, NodeJS.Timeout>();

    const handleDisconnection = async (socketId: string) => {
        const userId = socketToUser.get(socketId);
        if (!userId) return;

        socketToUser.delete(socketId);
        const userData = onlineUsers.get(userId);

        if (userData && userData.socketId === socketId) {
            onlineUsers.delete(userId);

            const [err, userChats] = await chatServices.getChatsByUser(userId);
            if (!err && userChats) {
                for (const chat of userChats) {
                    const [err, participants] = await chatServices.getChatParticipantsByChatId(chat.chatId);
                    if (!err && participants) {
                        participants
                            .filter(participant => participant.userId !== userId)
                            .forEach(participant => {
                                io.to(participant.userId).emit("userStatusChanged", {
                                    userId,
                                    status: "offline",
                                    firstName: userData.firstName
                                });
                            });
                    }
                }
            }
        }
    };

    socket.on("newMessage", async (message: Message) => {
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(message.chatId)
        if (err || !chatParticipants) {
            socket.emit("message_error", {
                message: "Failed to send messages",
                details: err,
            });
            return;
        }

        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== message.senderId)

        for (const user of receiver) {
            io.to(user.userId).emit("newMessage", {
                message
            })
        }
    })

    socket.on("userConnected", async (userId: string) => {
        const user = await userServices.getUserById(userId);
        if (!user) return;

        socketToUser.set(socket.id, userId);
        onlineUsers.set(userId, {
            socketId: socket.id,
            firstName: user.firstName || 'Unknown'
        });

        socket.join(userId);

        const [err, userChats] = await chatServices.getChatsByUser(userId);
        if (!err && userChats) {
            const participants = new Set<string>();
            for (const chat of userChats) {
                const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(chat.chatId);
                if (!err && chatParticipants) {
                    chatParticipants
                        .filter(p => p.userId !== userId)
                        .forEach(p => participants.add(p.userId));
                }
            }

            participants.forEach(participantId => {
                io.to(participantId).emit("userStatusChanged", {
                    userId,
                    status: "online",
                    firstName: user.firstName || 'Unknown'
                });

                if (onlineUsers.has(participantId)) {
                    const onlineUser = onlineUsers.get(participantId)!;
                    socket.emit("userStatusChanged", {
                        userId: participantId,
                        status: "online",
                        firstName: onlineUser.firstName
                    });
                }
            });
        }
    });

    socket.on("disconnect", () => handleDisconnection(socket.id));
    socket.on("disconnecting", () => handleDisconnection(socket.id));

    socket.on("userLogout", async (userId: string) => {
        if (userId) {
            handleDisconnection(socket.id);
        }
    });

    socket.on("getUserStatus", async (userId: string) => {
        const user = await userServices.getUserById(userId);
        if (!user) return;

        const isOnline = onlineUsers.has(userId);
        socket.emit("userStatusResponse", {
            userId,
            status: isOnline ? "online" : "offline",
            firstName: user.firstName || 'Unknown'
        });
    });

    socket.on("typing", async (typingDetails) => {
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(typingDetails.chatId)
        if (err || !chatParticipants) {
            socket.emit("message_error", {
                message: "Failed to get chat participants",
                details: err,
            });
            return;
        }

        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== typingDetails.typingUserId)
        const timeoutKey = `${typingDetails.typingUserId}-${typingDetails.chatId}`;

        const isAlreadyTyping = typingTimeouts.has(timeoutKey);

        if (!isAlreadyTyping) {
            for (const user of receiver) {
                io.to(user.userId).emit("startTyping", typingDetails)
            }
        } else {
            clearTimeout(typingTimeouts.get(timeoutKey)!);
        }

        const timeout = setTimeout(async () => {
            for (const user of receiver) {
                io.to(user.userId).emit("stopTyping", typingDetails);
            }

            typingTimeouts.delete(timeoutKey);
        }, 5000);

        typingTimeouts.set(timeoutKey, timeout);
    })

    socket.on("messageDelete", async (data: { messageId: string, chatId: string, deletedBy: string }) => {
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(data.chatId)
        if (err || !chatParticipants) {
            socket.emit("message_error", {
                message: "Failed to get chat participants",
                details: err,
            });
            return;
        }

        const otherParticipants = chatParticipants.filter(participant => participant.userId !== data.deletedBy);

        for (const participant of otherParticipants) {
            io.to(participant.userId).emit("messageDeleted", {
                messageId: data.messageId,
                chatId: data.chatId,
                deletedBy: data.deletedBy
            });
        }
    });

    socket.on("stopTyping", async (typingDetails) => {
        const [err, chatParticipants] = await chatServices.getChatParticipantsByChatId(typingDetails.chatId)
        if (err || !chatParticipants) return;

        const receiver = chatParticipants?.filter((chatParticipant) => chatParticipant.userId !== typingDetails.typingUserId)

        for (const user of receiver) {
            io.to(user.userId).emit("stopTyping", typingDetails)
        }

        const timeoutKey = `${typingDetails.typingUserId}-${typingDetails.chatId}`;
        if (typingTimeouts.has(timeoutKey)) {
            clearTimeout(typingTimeouts.get(timeoutKey)!);
            typingTimeouts.delete(timeoutKey);
        }
    })
}
