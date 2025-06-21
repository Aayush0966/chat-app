import { LoginPayload, RegisterUserPayload } from "../types/authTypes";
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

    async loginUser(loginData: LoginPayload) {
        const { email, password } = loginData;

        const [userError, user] = await userServices.getUserByEmailOrPhoneNumber(email);

        if (userError || !user) {
            return {success: false, message: "Invalid credentials"};
        }

        let isPasswordValid = false;

        if (user.password) {
             isPasswordValid = await comparePassword(password, user.password);
        }

        if (!isPasswordValid) {
            return { success: false, message: "Invalid credentials" };
        }

        // Get user account
        const [accountError, account] = await prismaSafe(
            prisma.account.findUnique({
                where: {
                    userId: user.id
                }
            })
        );

        if (accountError) {
            return { success: false, message: "Error retrieving account", error: accountError };
        }

        return { 
            success: true, 
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
            },
            account
        };
    },

    async verifyOTPAndActivateAccount(otp: string, userId: string) {
        const [otpError, OTP] = await prismaSafe(
            prisma.otp.findFirst({
                where: {
                    userId,
                    code: otp,
                    purpose: "account_verification",
                    used: false
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        );

        if (otpError) {
            return { success: false, message: "Error validating OTP", error: otpError };
        }

        if (!OTP) {
            return { success: false, message: "Invalid verification code" };
        }

        if (OTP.used) {
            return { success: false, message: "Verification code has already been used" };
        }

        if (OTP.expiresAt < new Date()) {
            return { success: false, message: "Verification code has expired" };
        }

        // Update OTP and user in transaction
        const [transactionError, result] = await prismaSafe(
            prisma.$transaction(async (tx) => {
                // Mark OTP as used
                await tx.otp.update({
                    where: {
                        id: OTP.id
                    },
                    data: {
                        used: true
                    }
                });

            })
        );

        if (transactionError) {
            return { success: false, message: "Error activating account", error: transactionError };
        }

        return { success: true, message: "Account activated successfully", user: result };
    }
};