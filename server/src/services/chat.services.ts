import { prismaSafe } from "../lib/prismaSafe";
import prisma from "../configs/prisma";
import { Chat } from "../types/chat.types";

export const chatServices = {
    async createChat(chat: Chat) {
        return await prismaSafe(
            prisma.chat.create({
                data: {
                    name: chat.name,
                    creatorId: chat.creatorId,
                    isGroup: chat.isGroup,
                    participants: {
                        create: chat.participantIds.map((userId) => ({
                            userId,
                        })),
                    },
                },
            })
        );
    },

    async getChatParticipantsByChatId(chatId: string) {
        return await prismaSafe(
            prisma.chatParticipant.findMany({
                where: {
                    chatId
                }
            })
        )
    },

    async checkExistingDirectChat(creatorId: string, participantId: string) {
        return await prismaSafe(
            prisma.chat.findFirst({
                where: {
                    isGroup: false,
                    AND: [
                        {
                            participants: {
                                some: {
                                    userId: creatorId,
                                    deleted: false
                                }
                            }
                        },
                        {
                            participants: {
                                some: {
                                    userId: participantId,
                                    deleted: false
                                }
                            }
                        }
                    ]
                },
                include: {
                    participants: {
                        where: {
                            deleted: false
                        },
                        include: {
                            user: true
                        }
                    }
                }
            })
        );
    },

    async getChatById(chatId: string) {
        return await prismaSafe(
            prisma.chat.findUnique({
                where: {
                    id: chatId
                }
            })
        );
    },

    async getChatsByUser(userId: string) {
        return await prismaSafe(
            prisma.chatParticipant.findMany({
                where: {
                    userId,
                    deleted: false
                },
                include: {
                    chat: {
                        include: {
                            participants: {
                                include: {
                                    user: true
                                }
                            },
                            messages: {
                                orderBy: { sentAt: 'desc' },
                                take: 1
                            }
                        }
                    }
                },
            })
        );
    },
    async getChatParticipantsByChatIdAndUserId(chatId: string, userId: string) {
        return await prismaSafe(
            prisma.chatParticipant.findFirst({
                where: {
                    chatId: chatId,
                    userId: userId,
                    deleted: false
                }
            })
        )
    },
    async removeChat(userId: string, chatId: string) {
        return await prismaSafe(
            prisma.chatParticipant.updateMany({
                where: {
                    userId,
                    chatId,
                },
                data: {
                    deleted: true,
                },
            })
        );

    },
    async checkExistingDirectChatIncludingDeleted(participantIds: string[]) {
        return await prismaSafe(
            prisma.chat.findFirst({
                where: {
                    isGroup: false,
                    AND: [

                        ...participantIds.map(participantId => ({
                            participants: {
                                some: {
                                    userId: participantId
                                }
                            }
                        }))
                    ]
                },
                include: {
                    participants: {
                        include: {
                            user: true
                        }
                    }
                }
            })
        );
    },

    async reactivateChatForUser(userId: string, chatId: string) {
        return await prismaSafe(
            prisma.chatParticipant.updateMany({
                where: {
                    userId,
                    chatId,
                    deleted: true
                },
                data: {
                    deleted: false,
                    // Set joinedAt to current time to mark when user rejoined
                    // This will help filter out old messages
                    joinedAt: new Date()
                }
            })
        );
    }
};