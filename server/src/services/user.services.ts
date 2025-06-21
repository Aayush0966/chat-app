import {prismaSafe} from "../lib/prismaSafe";
import prisma from "../configs/prisma";

export const userServices = {
    async getUserByEmailOrPhoneNumber(email?: string, phoneNumber?: string) {
        return await prismaSafe(
            prisma.user.findFirst({
                where: {
                    OR: [
                        { email },
                        { phoneNumber },
                    ],
                },
            })
        );
    },
    async getUserById(userId: string) {
        const [error, user] = await prismaSafe(
            prisma.user.findUnique({
                where: {
                    id: userId
                }
            })
        )
        if (error) {
            return null;
        }
        if (user) {
            return user
        }
        return null;

    }

}