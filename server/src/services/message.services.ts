import {prismaSafe} from "../lib/prismaSafe";
import prisma from "../configs/prisma";
import {HTTP} from "../utils/httpStatus";
import { Message } from "../types/chat.types";


export const messageServices = {
    async sendMessage(message: Message) {
        return await prismaSafe(
            prisma.message.create({
                data: message
            })
        )
    },
    async getMessageByChatId(chatId:string, limit: number = 20, userId: string, cursor?: string,) {
        return await prismaSafe(
            prisma.message.findMany({
                where: {
                    chatId,
                    NOT: {
                        OR: [
                            {
                                deletedMessages: {
                                    some: {
                                        userId: userId
                                    }
                                }
                            },
                            {
                                text: null
                            }
                        ]
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


}