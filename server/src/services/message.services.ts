import {prismaSafe} from "../lib/prismaSafe";
import prisma from "../configs/prisma";
import {HTTP} from "../utils/httpStatus";
import { Message } from "../types/chat.types";


export const messageServices = {
    async sendMessage(message: Message) {
        try {
            if (!message.text && !message.attachment) {
                throw new Error("Message must contain either text or attachment");
            }

            if (!message.chatId || !message.senderId || !message.type) {
                throw new Error("Missing required fields: chatId, senderId, or type");
            }

            const chat = await prisma.chat.findUnique({
                where: { id: message.chatId },
                include: { participants: true }
            });

            if (!chat) {
                throw new Error("Chat not found");
            }

            if (!chat.participants.some(p => p.userId === message.senderId)) {
                throw new Error("User is not a participant in this chat");
            }

            return await prismaSafe(
                prisma.message.create({
                    data: {
                        chatId: message.chatId,
                        senderId: message.senderId,
                        type: message.type,
                        text: message.text || null,
                        attachment: message.attachment || null
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                })
            );
        } catch (error) {
            console.error('Error creating message:', error);
            return [error instanceof Error ? error.message : 'Failed to create message', null];
        }
    },
    async getMessageByChatId(chatId:string, limit: number = 20, userId: string, cursor?: string,) {
        return await prismaSafe(
            prisma.message.findMany({
                where: {
                    chatId,
                    NOT: {
                        deletedMessages: {
                            some: {
                                userId: userId
                            }
                        }
                    }
                },
                orderBy: { sentAt: 'desc'},
                take: limit, ...(cursor && {
                    skip: 1,
                    cursor: {id: cursor},
                }),
                include: {
                    sender: {select: {id: true, firstName: true, lastName: true}},
                    reactions: true,
                    reads: true
                }
            })
        )
    },
    async getMessageById(messageId:string) {
        return await prismaSafe(
            prisma.message.findUnique({
                where:{
                    id: messageId
                }
            })
        )
    },
    async deleteMessageForUser(messageId: string, userId: string) {
        const [error, message] = await this.getMessageById(messageId);

        if (error) {
            return { success: false, message: error, code: HTTP.BAD_REQUEST };
        }

        if (!message) {
            return { success: false, message: "Message not found", code: HTTP.NOT_FOUND };
        }

        // if (message.senderId !== userId) {
        //     return { success: false, message: "Unauthorized", code: HTTP.UNAUTHORIZED };
        // }

        const [deleteError, deletedMessage] = await prismaSafe(
            prisma.deletedMessage.create({
                data: {
                    messageId,
                    userId
                }
            })
        );

        if (deleteError) {
            return { success: false, message: deleteError, code: HTTP.INTERNAL };
        }

        return {
            success: true,
            message: "Message has been deleted",
            code: HTTP.OK,
            data: deletedMessage,
        };
    },
    async deleteMessageForBoth(messageId: string, userId: string) {
        const [error, message] = await this.getMessageById(messageId);

        if (error) {
            return { success: false, message: error, code: HTTP.BAD_REQUEST };
        }

        if (!message) {
            return { success: false, message: "Message not found", code: HTTP.NOT_FOUND };
        }

        if (message.senderId !== userId) {
            return { success: false, message: "Unauthorized", code: HTTP.UNAUTHORIZED };
        }

        const [updateErr, data] = await prismaSafe(
            prisma.message.update({
                where: {id: messageId},
                data: {text: null, attachment: null}
            })
        );

        if (updateErr) {
            return { success: false, message: updateErr, code: HTTP.INTERNAL };
        }

        return {
            success: true,
            message: "Message has been deleted",
            data,
            code: HTTP.OK,
        };
    },
    async editMessage(messageId: string, userId: string, newMessage: string) {
        const [error, message] = await this.getMessageById(messageId);

        if (error) {
            return { success: false, message: error, code: HTTP.BAD_REQUEST };
        }

        if (!message) {
            return { success: false, message: "Message not found", code: HTTP.NOT_FOUND };
        }

        if (message.senderId !== userId) {
            return { success: false, message: "Unauthorized", code: HTTP.UNAUTHORIZED };
        }

        const [editError, editedMessage] = await prismaSafe(
            prisma.message.update({
                where: {id: messageId },
                data: {text: newMessage}
            })
        );

        if (editError) {
            return { success: false, message: editError, code: HTTP.INTERNAL };
        }

        return {
            success: true,
            message: "Message has been Edited",
            code: HTTP.OK,
            data: editedMessage,
        };
    },

    async searchMessage(messageText: string,chatId: string) {
        return await prismaSafe(
            prisma.message.findMany({
                where: {
                    text: messageText,
                    chatId
                }
            })
        )
    }
}