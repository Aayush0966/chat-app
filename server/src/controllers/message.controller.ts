import { Request, Response } from "express";
import { HTTP } from "../utils/httpStatus";
import { userServices } from "../services/user.services";
import { messageServices } from "../services/message.services";
import { Message } from "../types/chat.types";
import { io } from "../server";
import { cloudinaryService } from "../lib/cloudinary";
import fs from 'fs';

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
        const { chatId } = req.params;
        const { limit = "10", cursor } = req.query;

        if (!userId) {
            res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED });
            return;
        }

        if (!chatId) {
            res.error({ error: "Chat ID is required", code: HTTP.BAD_REQUEST });
            return;
        }

        const limitNum = parseInt(limit as string, 10);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
            res.error({ error: "Limit must be between 1 and 50", code: HTTP.BAD_REQUEST });
            return;
        }

        const [error, messages] = await messageServices.getMessageByChatId(
            chatId,
            limitNum,
            userId,
            cursor as string
        );

        if (error) {
            res.error({ error, code: HTTP.INTERNAL });
            return;
        }

        if (!messages) {
            res.success({
                message: "No messages found",
                data: [],
                code: HTTP.OK
            });
            return;
        }

        // Don't reverse messages - they're already in correct order from service
        // (oldest to newest for display)

        // Get cursor for next page (oldest message id from current batch - which is now at index 0)
        const nextCursor = messages.length === limitNum ? messages[0]?.id : null;

        res.success({
            message: "Messages fetched successfully",
            data: {
                messages: messages,
                nextCursor,
                hasMore: messages.length === limitNum
            },
            code: HTTP.OK
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
    },
    readMessage: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        const { messageId } = req.query;

        if (!userId) {
            res.error({ error: "Unauthorized", code: HTTP.UNAUTHORIZED })
            return;
        }

        if (!messageId) {
            res.error({ error: "Message ID is required", code: HTTP.BAD_REQUEST })
            return;
        }

        const [err, result] = await messageServices.markMessageAsRead(String(messageId), userId);
        if (err) {
            res.error({ error: err, code: HTTP.INTERNAL });
            return;
        }

        if (!result) {
            res.error({ error: "Something went wrong", code: HTTP.BAD_REQUEST })
            return;
        }

        res.success({
            success: true,
            message: "Messages marked as read",
            code: HTTP.OK
        })

    },
    markAllMessagesAsReadByChat: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        const { chatId } = req.params;

        if (!userId || !chatId) {
            res.error({ error: "Missing user or chat ID", code: HTTP.BAD_REQUEST });
            return;
        }

        const result = await messageServices.markAllMessagesAsReadByChat(chatId, userId);
        res.success(result);
    },
    getUnreadMessagesByChat: async (req: Request, res: Response): Promise<void> => {
        const userId = req.user?.id;
        const { chatId } = req.params;

        if (!userId || !chatId) {
            res.error({ error: "Missing user or chat ID", code: HTTP.BAD_REQUEST });
            return;
        }

        const [err, messages] = await messageServices.getUnreadMessagesByChat(chatId, userId);
        if (err) {
            res.error({ error: err, code: HTTP.INTERNAL });
            return;
        }

        if (messages?.length == 0) {
            res.error({error:"No unread messages available", code:HTTP.NOT_FOUND})
            return;
        }

        res.success({
            success: true,
            code: HTTP.OK,
            data: messages,
        });
    },
    getReadStatusOfMessage: async (req: Request, res: Response): Promise<void> => {
        const { messageId } = req.params;

        if (!messageId) {
            res.error({ error: "Message ID is required", code: HTTP.BAD_REQUEST });
            return;
        }

        const [err, status] = await messageServices.getMessageReadStatus(messageId);
        if (err) {
            res.error({ error: err, code: HTTP.INTERNAL });
            return;
        }

        res.success({
            success: true,
            code: HTTP.OK,
            data: status,
        });
    },

};
