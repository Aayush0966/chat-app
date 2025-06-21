import { LoginPayload, RegisterUserPayload } from "../types/auth.types";
import prisma from "../configs/prisma";
import { prismaSafe } from "../lib/prismaSafe";
import { AccountType } from "@prisma/client";
import { generateOTP } from "../utils/helper";
import { userServices } from "./user.services";
import { comparePassword, hashPassword } from "../lib/password";

export const authService = {
    async registerUser(registerData: RegisterUserPayload, accountType: AccountType) {
        const [transactionError, result] = await prismaSafe(
            prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: registerData
                });

                const account = await tx.account.create({
                    data: {
                        userId: user.id,
                        accountType
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

    async forgetPassword(userId: string) {
        const code = generateOTP();
        console.log("Code: ", code);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Use upsert to handle existing OTP records
        const [error, newOtp] = await prismaSafe(
            prisma.otp.upsert({
                where: {
                    userId: userId
                },
                update: {
                    code,
                    purpose: "forgetpassword",
                    used: false,
                    expiresAt,
                    createdAt: new Date() // Update creation time for new OTP
                },
                create: {
                    userId,
                    code,
                    purpose: "forgetpassword",
                    used: false,
                    expiresAt
                }
            })
        );

        if (error) {
            return null;
        }

        return code;
    },

    async validateOTP(otp: string, userId: string) {
        const [error, OTP] = await prismaSafe(
            prisma.otp.findFirst({
                where: {
                    userId,
                    code: otp,
                    purpose: "forgetpassword",
                    used: false
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        );

        if (error) {
            return { success: false, message: "Error validating OTP", error };
        }

        if (!OTP) {
            return { success: false, message: "Invalid OTP" };
        }

        if (OTP.used) {
            return { success: false, message: "OTP has been used" };
        }

        if (OTP.expiresAt < new Date()) {
            return { success: false, message: "OTP has expired" };
        }

        if (OTP.code === otp) {
            const [updateError] = await prismaSafe(
                prisma.otp.update({
                    where: {
                        id: OTP.id
                    },
                    data: {
                        used: true
                    }
                })
            );

            if (updateError) {
                return { success: false, message: "Error updating OTP status", error: updateError };
            }

            return { success: true, message: "OTP validated successfully" };
        }

        return { success: false, message: "Invalid OTP" };
    },

    async resetPassword(email: string, newPassword: string) {
        const [userError, user] = await userServices.getUserByEmailOrPhoneNumber(email);
        
        if (userError || !user) {
            return { success: false, message: "User not found" };
        }

        const hashedPassword = await hashPassword(newPassword);

        const [updateError, updatedUser] = await prismaSafe(
            prisma.user.update({
                where: {
                    email
                },
                data: {
                    password: hashedPassword
                }
            })
        );

        if (updateError) {
            return { success: false, message: "Error resetting password", error: updateError };
        }

        return { success: true, message: "Password has been reset successfully" };
    },
};