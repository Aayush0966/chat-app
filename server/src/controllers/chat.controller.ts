import {Request, Response} from "express";
import {HTTP} from "../utils/httpStatus";
import {chatServices} from "../services/chat.services";

export const chatController = {
    createChat: async (req: Request, res: Response): Promise<void> => {
        const {name, participantIds, creatorId, isGroup} = req.body;
        console.log(creatorId, participantIds, isGroup)
        if (!participantIds || !creatorId || isGroup == null) {
            res.error({error: "All fields are required", code: HTTP.BAD_REQUEST});
            return;
        }
        const [error, _] = await chatServices.createChat({name, participantIds, creatorId, isGroup});
        if (error) {
            res.error({error: error, code: HTTP.BAD_REQUEST})
        }
        res.success({success: true, message: "Chat created successfully", code: HTTP.CREATED})
    },
    getChatById: async (req: Request, res: Response): Promise<void> => {
        const chatId = req.query.q;
        if (!chatId) {
            res.error({error: "ChatId is required!", code: HTTP.BAD_REQUEST})
            return;
        }
        const [error, chat] = await chatServices.getChatById(String(chatId));
        if (error) {
            res.error({error: error, code: HTTP.BAD_REQUEST})
        }
        if (chat) {
            res.success({message: "Fetched successfully", code: HTTP.OK, data: chat})
        }
    },
    getChatsByUser: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id || req.body.userId;

        if (!userId) {
            res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED });
            return;
        }

        const [error, chatParticipants] = await chatServices.getChatsByUser(userId);

        if (error) {
            res.error({ error, code: HTTP.BAD_REQUEST });
            return;
        }

        if (!chatParticipants || chatParticipants.length === 0) {
            res.success({ message: "No chats found", data: [], code: HTTP.OK });
            return;
        }

        const chats = chatParticipants.map((cp) => {
            const chat = cp.chat;
            const lastMessage = chat.messages[0];
            const otherUser = chat.isGroup
                ? null
                : chat.participants.find((p) => p.userId !== userId)?.user;

            return {
                id: chat.id,
                name: chat.isGroup
                    ? chat.name
                    : `${otherUser?.firstName ?? ""} ${otherUser?.lastName ?? ""}`.trim(),
                isGroup: chat.isGroup,
                lastMessage: lastMessage?.text || lastMessage?.attachment || null,
                lastMessageTime: lastMessage?.sentAt,
            };
        });

        res.success({
            message: "Chats fetched successfully",
            data: chats,
            code: HTTP.OK,
        });
    }

}