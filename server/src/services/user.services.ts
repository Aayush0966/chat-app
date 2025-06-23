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
    async findUser(firstName: string) {
        const [error, user] = await prismaSafe(
            prisma.user.findMany({
                where: {
                    firstName: {
                        contains: firstName,
                        mode: "insensitive",
                    },
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            })
        );

        if (error) {
            return { success: false, statusCode: 500, message: error || "Internal server error" };
        }

        if (!user) {
            return { success: false, statusCode: 404, message: "User not found" };
        }

        return { success: true, statusCode: 200, data: user };
    }

}