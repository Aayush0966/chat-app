import { prismaSafe } from "../lib/prismaSafe";
import prisma from "../configs/prisma";
import { HTTP } from "../utils/httpStatus";
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
    async getMessageByChatId(chatId: string, limit: number = 20, userId: string, cursor?: string,) {
        const result = await prismaSafe(
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
                orderBy: { sentAt: 'desc' },
                take: limit, ...(cursor && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
                include: {
                    sender: { select: { id: true, firstName: true, lastName: true } },
                    reactions: true,
                    reads: true
                }
            })
        );

        // Reverse the messages to show oldest first (for display order)
        if (result[1] && Array.isArray(result[1])) {
            result[1] = result[1].reverse();
        }

        return result;
    },
    async getMessageById(messageId: string) {
        return await prismaSafe(
            prisma.message.findUnique({
                where: {
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
                where: { id: messageId },
                data: { text: null, attachment: null }
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
                where: { id: messageId },
                data: { text: newMessage }
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

    async searchMessage(messageText: string, chatId: string) {
        return await prismaSafe(
            prisma.message.findMany({
                where: {
                    text: messageText,
                    chatId
                }
            })
        )
    },
    async markMessageAsRead(messageId: string, userId: string) {
        console.log(`[DEBUG] markMessageAsRead called with messageId: ${messageId}, userId: ${userId}`);
        
        try {
            // First verify that the message exists and get its chat
            const message = await prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    chat: {
                        include: {
                            participants: true
                        }
                    }
                }
            });

            if (!message) {
                console.error(`[DEBUG] Message not found: ${messageId}`);
                return ["Message not found", null];
            }

            // Verify user is a participant in the chat
            if (!message.chat.participants.some(p => p.userId === userId)) {
                console.error(`[DEBUG] User ${userId} is not a participant in chat ${message.chatId}`);
                return ["User is not a participant in this chat", null];
            }

            // Now create/update the read record
            const result = await prisma.messageRead.upsert({
                where: {
                    messageId_userId: {
                        messageId,
                        userId
                    }
                },
                update: {
                    readAt: new Date(),
                },
                create: {
                    messageId,
                    userId,
                    readAt: new Date()
                }
            });

            console.log(`[DEBUG] markMessageAsRead successful for messageId: ${messageId}, userId: ${userId}`);
            console.log(`[DEBUG] Database result:`, result);
            return [null, result];
        } catch (error) {
            console.error(`[DEBUG] Error in markMessageAsRead:`, error);
            return [error instanceof Error ? error.message : "Unknown error occurred", null];
        }
    },

    async getUnreadMessagesByChat(chatId: string, userId: string) {
        return await prismaSafe(prisma.message.findMany({
            where: {
                chatId,
                reads: {
                    none: {
                        userId,
                    },
                },
            },
            select: {
                id: true,
            },
        }));

    },
    async markAllMessagesAsReadByChat(chatId: string, userId: string) {
        console.log(`[DEBUG] markAllMessagesAsReadByChat called with chatId: ${chatId}, userId: ${userId}`);
        const [fetchError, unreadMessages] = await this.getUnreadMessagesByChat(chatId, userId);

        if (fetchError) {
            console.error(`[DEBUG] Error fetching unread messages: ${fetchError}`);
            throw new Error('Failed to fetch unread messages');
        }

        if (!unreadMessages || !unreadMessages.length) {
            console.log(`[DEBUG] No unread messages found for chatId: ${chatId}`);
            return {
                message: 'No unread messages.',
                success: false,
                code: HTTP.NOT_FOUND,
            };
        }

        console.log(`[DEBUG] Found ${unreadMessages.length} unread messages for chatId: ${chatId}`);
        const readEntries = unreadMessages.map((msg) => ({
            messageId: msg.id,
            userId,
            readAt: new Date(),
        }));

        const [createError, results] = await prismaSafe(
            prisma.messageRead.createMany({
                data: readEntries,
                skipDuplicates: true,
            })
        );

        if (createError) {
            console.error(`[DEBUG] Error marking messages as read: ${createError}`);
            throw new Error('Failed to mark messages as read');
        }

        console.log(`[DEBUG] Successfully marked ${readEntries.length} messages as read for chatId: ${chatId}`);
        return {
            message: `${readEntries.length} messages marked as read.`,
            success: true,
            code: HTTP.OK,
        };
    },

    async getMessageReadStatus(messageId: string) {
        return await prismaSafe(
            prisma.messageRead.findMany({
                where: {
                    messageId
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                },
                orderBy: {
                    readAt: 'asc'
                }
            })
        );
    },

    async markMessageReactForUser(messageId: string, userId: string, reaction: string) {
        // First check if user already reacted with this emoji
        const existingReaction = await prisma.messageReaction.findFirst({
            where: {
                messageId,
                userId,
                emoji: reaction
            }
        });

        if (existingReaction) {
            // Remove the reaction (toggle off)
            return await prismaSafe(
                prisma.messageReaction.delete({
                    where: {
                        id: existingReaction.id
                    }
                })
            );
        } else {
            // Remove any other reactions from this user for this message (only one reaction per user per message)
            await prisma.messageReaction.deleteMany({
                where: {
                    messageId,
                    userId
                }
            });

            // Add new reaction
            return await prismaSafe(
                prisma.messageReaction.create({
                    data: {
                        messageId,
                        emoji: reaction,
                        userId
                    }
                })
            );
        }
    },




}