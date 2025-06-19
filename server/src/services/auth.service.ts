import { LoginPayload, RegisterUserPayload } from "../types/authTypes";
import prisma from "../configs/prisma";
import { prismaSafe } from "../lib/prismaSafe";

export const authService = {
    async registerUser(registerData: RegisterUserPayload) {
        const [transactionError, result] = await prismaSafe(
            prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: registerData
                });

                const account = await tx.account.create({
                    data: {
                        userId: user.id
                    }
                });

                return { user, account };
            })
        );

        if (result) {
            return { success: true, user: result.user };
        }
        
        return { success: false, error: transactionError };
    },

    async loginUser(loginData: LoginPayload) {
        // Implementation here
    }
};