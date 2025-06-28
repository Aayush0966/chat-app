import { Request, Response } from "express";
import { HTTP } from "../utils/httpStatus";
import { userServices } from "../services/user.services";
import { messageServices } from "../services/message.services";
import { Message } from "../types/chat.types";

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
        const chatId = req.params.chatId;
        const { cursor, limit = 20 } = req.query;
        if (!chatId) {
            res.error({ error: "chatId is required", code: HTTP.BAD_REQUEST });
            return;
        }

        const [error, result] = await messageServices.getMessageByChatId(String(chatId), Number(limit), cursor ? String(cursor) : undefined);

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
    }
};
