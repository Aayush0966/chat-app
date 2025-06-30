import { Request, Response } from "express";
import { HTTP } from "../utils/httpStatus";
import { userServices } from "../services/user.services";
import { messageServices } from "../services/message.services";
import { Message } from "../types/chat.types";
import { io } from "../server";

export const messageController = {
    sendMessage: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id || req.body.userId;
        if (!userId) {
            res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED });
            return;
        }
        const { chatId, text, attachment, messageType } = req.body;
        if (!chatId || !messageType) {
            res.error({ error: "Insufficient parameters in payload", code: HTTP.BAD_REQUEST });
            return;
        }

        if (!text && !attachment) {
            res.error({
                error: "Either text or attachment must be provided",
                code: HTTP.BAD_REQUEST,
            });
            return;
        }

        const sender = await userServices.getUserById(userId);

        if (!sender) {
            res.error({ error: "Sender not found", code: HTTP.UNAUTHORIZED })
            return;
        }

        if (messageType === "TEXT") {
            const message: Message = {
                senderId: userId,
                type: "TEXT",
                chatId,
                text
            }
            const [error, result] = await messageServices.sendMessage(message);

            io.to(chatId).emit("new-message", text);
            if (error) {
                res.error({ error, code: HTTP.INTERNAL })
                return;
            }

            if (!result) {
                res.error({ error: "Failed to create message", code: HTTP.INTERNAL })
                return;
            }

            res.success({
                success: true,
                message: "Message sent successfully",
                code: HTTP.CREATED,
                data: result
            });
            return;
        }


    },
    getMessageByChat: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;

        if (!userId) {
            res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED })
            return;
        }
        const chatId = req.params.chatId;
        const { cursor, limit = 20 } = req.query;
        if (!chatId) {
            res.error({ error: "chatId is required", code: HTTP.BAD_REQUEST });
            return;
        }

        const [error, result] = await messageServices.getMessageByChatId(String(chatId), Number(limit), String(userId), cursor ? String(cursor) : undefined);

        if (error) {
            res.error({ error, code: HTTP.INTERNAL });
            return;
        }

        if (!result || result.length === 0) {
            res.error({ error: "No messages found", code: HTTP.NOT_FOUND });
            return;
        }

        res.success({
            success: true,
            message: "Messages fetched successfully",
            code: HTTP.OK,
            data: result
        });
    },
    removeMessageForYourself: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;

        if (!userId) {
            res.error({ error: "Unauthorized!", code: HTTP.UNAUTHORIZED })
            return;
        }
        const messageId = req.params.messageId;
        if (!messageId) {
            res.error({ error: "MessageId is required!", code: HTTP.BAD_REQUEST })
            return;
        }
        const result = await messageServices.deleteMessageForUser(String(messageId), userId)

        if (!result.success) {
            res.error({ error: result.message, code: result.code })
        }
        if (result.data) {
            res.success({ success: true, data: result.data, code: result.code, message: result.message })
        }
    },
    removeMessageForBoth: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;

        if (!userId) {
            res.error({ error: "Unauthorized!", code: HTTP.UNAUTHORIZED })
            return;
        }
        const messageId = req.params.messageId;
        if (!messageId) {
            res.error({ error: "MessageId is required!", code: HTTP.BAD_REQUEST })
            return;
        }
        const result = await messageServices.deleteMessageForBoth(String(messageId), userId)

        if (!result.success) {
            res.error({ error: result.message, code: result.code })
        }
        if (result.data) {
            res.success({ success: true, data: result.data, code: result.code, message: result.message })
        }
    },
    editMessage: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;

        if (!userId) {
            res.error({ error: "Unauthorized!", code: HTTP.UNAUTHORIZED })
            return;
        }
        const messageId = req.params.messageId;
        const { newMessage } = req.body;
        if (!messageId || !newMessage) {
            res.error({ error: "MessageId and new message is required!", code: HTTP.BAD_REQUEST })
            return;
        }
        const result = await messageServices.editMessage(String(messageId), userId, newMessage)

        if (!result.success) {
            res.error({ error: result.message, code: result.code })
        }
        if (result.data) {
            res.success({ success: true, data: result.data, code: result.code, message: result.message })
        }
    },
    searchMessage: async (req: Request, res: Response): Promise<void> => {
        const user = req.user?.id;
        const {chatId, message} = req.query;
        console.log("ChatId: ", chatId )
        console.log("message: ", message)
        if (!user) {
            res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED })
            return;
        }

        if (!chatId || !message) {
            res.error({ error: "ChatId and messageText is required", code: HTTP.BAD_REQUEST })
            return;
        }

        const [error, data] = await messageServices.searchMessage(String(message), String(chatId))

        if (error) {
            res.error({ error, code: HTTP.INTERNAL })
            return;
        }
        if (!data) {
            res.error({ error: "message not found", code: HTTP.NOT_FOUND })
            return;
        }
        res.success({
            message: "Message found successfully",
            code:HTTP.OK,
            data
        })
    }
};
