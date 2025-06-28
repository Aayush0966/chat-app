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
        }

        if (messageType === "TEXT") {
            const message: Message = {
                senderId: userId,
                type: "TEXT",
                chatId,

            }
            const [result, error] = await messageServices.sendMessage(message);
            if (error) {
                res.error({ error: error, code: HTTP.BAD_REQUEST })
            }
            if (!result || result?.length == 0) {
                res.error({ error: "Something went wrong while sending message", code: HTTP.INTERNAL })
            }

            if (result) {
                res.success({ success: true, message: "Message sent successfully", code: HTTP.CREATED })
            }

        }


    },
};
