import { Request, Response } from "express";
import { HTTP } from "../utils/httpStatus";
import { userServices } from "../services/user.services";
import { messageServices } from "../services/message.services";
import { Message } from "../types/chat.types";
import { io } from "../server";
import { cloudinaryService } from "../lib/cloudinary";
import fs from 'fs';
import path from 'path';

export const messageController = {
    sendMessage: async (req: Request, res: Response): Promise<void> => {
        const tempFiles: string[] = [];
        try {
            const userId = req.user?.id || req.body.userId;
            if (!userId) {
                res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED });
                return;
            }

            const chatId = req.body.chatId;
            const attachment = req.file;
            // Sanitize text input by removing extra quotes if present
            const text = req.body.text ? JSON.parse(JSON.stringify(req.body.text)) : undefined;
            const messageType = req.body.messageType;

            console.log('Request payload:', {
                chatId,
                attachment,
                text,
                messageType,
                userId
            });


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

            let attachmentUrl: string | undefined;
            
            if (messageType === "ATTACHMENT" && attachment?.path) {
                try {
                    tempFiles.push(attachment.path);
                    
                    attachmentUrl = await cloudinaryService.uploadImage(attachment.path, 'userAttachment');
                    if (!attachmentUrl) {
                        throw new Error('Failed to get upload URL from Cloudinary');
                    }
                } catch (error) {
                    console.error('Cloudinary upload error:', error);
                    res.error({ 
                        error: error instanceof Error ? error.message : "Failed to upload attachment", 
                        code: HTTP.INTERNAL 
                    });
                    return;
                }
            }

            let message: Message = {
                senderId: userId,
                type: messageType,
                chatId,
                text: messageType === "TEXT" ? text : '',
                attachment: attachmentUrl
            };

            const [error, result] = await messageServices.sendMessage(message);

            if (error) {
                console.error('Message service error:', error);
                res.error({ 
                    error: typeof error === 'string' ? error : 'Failed to send message',
                    code: HTTP.INTERNAL 
                });
                return;
            }

            if (!result) {
                res.error({ error: "Failed to create message", code: HTTP.INTERNAL })
                return;
            }

            io.to(chatId).emit("new-message", result);

            res.success({
                success: true,
                message: "Message sent successfully",
                code: HTTP.CREATED,
                data: result
            });
        } catch (error) {
            console.error('Message sending error:', error);
            res.error({ 
                error: error instanceof Error ? error.message : "Internal server error", 
                code: HTTP.INTERNAL 
            });
        } finally {
            for (const filePath of tempFiles) {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Cleaned up temporary file: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`Failed to clean up temporary file ${filePath}:`, error);
                }
            }
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
        const { chatId, message } = req.query;
        console.log("ChatId: ", chatId)
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
            code: HTTP.OK,
            data
        })
    }
};
