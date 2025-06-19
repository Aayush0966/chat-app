import {prismaSafe} from "../lib/prismaSafe";
import prisma from "../configs/prisma";

export const userServices = {
    async getUserByEmailOrPhoneNumber(email: string, phoneNumber: string) {
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
    }

}