import {Request, Response} from "express";
import {HTTP} from "../utils/httpStatus";
import {chatServices} from "../services/chat.services";

export const chatController = {
    createChat: async (req: Request, res: Response): Promise<void> => {
        const {name, participantIds, creatorId, isGroup} = req.body;
        if (!participantIds || !creatorId || isGroup == null) {
            res.error({error: "All fields are required", code: HTTP.BAD_REQUEST});
            return;
        }

        if (!isGroup && participantIds.length === 2) {
            const [existingChatErr, existingChat] = await chatServices.checkExistingDirectChatIncludingDeleted(participantIds);


            if (existingChatErr) {
                res.error({error: existingChatErr, code: HTTP.BAD_REQUEST});
                return;
            }

            if (existingChat) {
                const creatorParticipant = existingChat.participants.find(p => p.userId === creatorId);
                if (creatorParticipant && creatorParticipant.deleted) {
                    const [reactivateErr, reactivatedChat] = await chatServices.reactivateChatForUser(creatorId, existingChat.id);
                    
                    if (reactivateErr) {
                        res.error({error: reactivateErr, code: HTTP.INTERNAL});
                        return;
                    }

                    res.success({
                        success: true, 
                        message: "Chat reactivated successfully", 
                        code: HTTP.OK,
                        data: { chatId: existingChat.id }
                    });
                    return;
                }

                res.error({error: "A direct chat already exists between these users", code: HTTP.CONFLICT});
                return;
            }
        }

        const [error, data] = await chatServices.createChat({name, participantIds, creatorId, isGroup});
        if (error) {
            res.error({error: error, code: HTTP.INTERNAL})
            return;
        }
        if (!data) {
            res.error({error: "Failed to create chat. Please try again later.", code: HTTP.INTERNAL});
            return;
        }
        res.success({success: true, message: "Chat created successfully", details: data.id, code: HTTP.CREATED})
    },
    getChatById: async (req: Request, res: Response): Promise<void> => {
        const chatId = req.query.q;
        if (!chatId) {
            res.error({error: "ChatId is required!", code: HTTP.BAD_REQUEST})
            return;
        }
        const [error, chat] = await chatServices.getChatById(String(chatId));
        if (error) {
            res.error({error: error, code: HTTP.INTERNAL})
        }
        if (!chat) {
            res.error({error: "Chat not found", code: HTTP.NOT_FOUND})
        }

        res.success({message: "Fetched successfully", code: HTTP.OK, data: chat})

    },
    getChatsByUser: async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = req.user?.id || req.body.userId;

            if (!userId) {
                console.error("Unauthorized access: userId is missing");
                res.error({error: "Unauthorized", code: HTTP.UNAUTHORIZED});
                return;
            }

            console.log("Fetching chats for userId:", userId);
            const [error, chatParticipants] = await chatServices.getChatsByUser(userId);

            if (error) {
                console.error("Error fetching chats:", error);
                res.error({error, code: HTTP.INTERNAL});
                return;
            }

            if (!chatParticipants || chatParticipants.length === 0) {
                console.log("No chats found for userId:", userId);
                res.success({message: "No chats found", data: [], code: HTTP.NOT_FOUND});
                return;
            }

            const chats = chatParticipants.map((cp) => {
                const chat = cp.chat;
                const lastMessage = chat.messages?.[0];
                const otherUser = chat.isGroup
                    ? null
                    : chat.participants.find((p) => p.userId !== userId)?.user;

                return {
                    id: chat.id,
                    name: chat.isGroup
                        ? chat.name
                        : `${otherUser?.firstName ?? ""} ${otherUser?.lastName ?? ""}`.trim(),
                    isGroup: chat.isGroup,
                    userId: chat.isGroup ? undefined : otherUser?.id,
                    lastMessage: lastMessage?.text || lastMessage?.attachment || null,
                    lastMessageTime: lastMessage?.sentAt || null,
                    lastMessageSenderId: lastMessage?.senderId || null,
                    lastMessageType: lastMessage?.type || null 
                };
            });

            console.log("Chats fetched successfully for userId:", userId);
            res.success({
                message: "Chats fetched successfully",
                data: chats,
                code: HTTP.OK,
            });
        } catch (err) {
            console.error("Unexpected error in getChatsByUser:", err);
            res.error({error: "Internal Server Error", code: HTTP.INTERNAL});
        }
    },
    deleteChatForUser: async (req: Request, res: Response): Promise<void> => {
        const chatId = req.params.chatId;
        const userId = req.user?.id || req.body.userId;

        if (!chatId) {
            res.error({error: "ChatId is required", code: HTTP.BAD_REQUEST});
            return;
        }

        const [error, chatData] = await chatServices.getChatParticipantsByChatIdAndUserId(chatId, userId);

        if (error) {
            res.error({error: error, code: HTTP.INTERNAL})
            return;
        }

        if (!chatData) {
            res.error({
                error: "You are not the participant of this chat or chat is not available for you",
                code: HTTP.NOT_FOUND
            })
            return;
        }


        const [err, data] = await chatServices.removeChat(userId, chatId);
        if (err) {
            res.error({error: err, code: HTTP.INTERNAL})
            return;
        }

        if (!data) {
            res.error({error: "chat is not available.", code: HTTP.NOT_FOUND})
            return;
        }


        res.success({
            success: true,
            message: "Chat deleted successfully",
            code: HTTP.OK
        })
    }
}