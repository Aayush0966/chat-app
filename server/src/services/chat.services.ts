import {prismaSafe} from "../lib/prismaSafe";
import prisma from "../configs/prisma";

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
                                orderBy: {sentAt: 'desc'},
                                take: 1
                            }
                        }
                    }
                },
            })
        );
    },

};