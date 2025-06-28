import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { comparePassword, hashPassword } from "../lib/password";
import { userServices } from "../services/user.services";
import SuccessResponse from "../dtos/SuccessResponse";
import jwt from "jsonwebtoken";
import { generateTokenAndUpdate, signJwt, verifyJwt } from "../lib/jwt";
import prisma from "../configs/prisma";
import { sendTransactionalEmail } from "../lib/email";
import { AccountType } from "@prisma/client";

export const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const { firstName, lastName, phoneNumber, email, password, accountType = AccountType.CREDENTIALS } = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !password) {
            res.status(400).json(new SuccessResponse({ message: "Missing required fields", code: 400 }));
            return;
        }

        const userData = {
            firstName: String(firstName),
            lastName: String(lastName),
            phoneNumber: String(phoneNumber),
            email: String(email),
            password: await hashPassword(String(password)),
        };

        const [error, existingUser] = await userServices.getUserByEmailOrPhoneNumber(
            userData.email,
            userData.phoneNumber
        );

        if (existingUser) {
            res.status(400).json(new SuccessResponse({ message: "Phone number or email is already used", code: 400 }));
            return;
        }

        const newUser = await authService.registerUser(userData, accountType);

        if (newUser.success) {
            res.status(201).json(new SuccessResponse({ message: "User registered successfully", code: 201 }));
        } else {
            res.status(500).json(new SuccessResponse({
                message: newUser.error || "Something went wrong",
                code: 500
            }));
        }
    },
    login: async (req: Request, res: Response): Promise<void> => {
        const { email, phoneNumber, password } = req.body;

        if ((!email && !phoneNumber) || !password) {
            res.status(400).json(new SuccessResponse({ message: "Missing required fields", code: 400 }));
            return;
        }

        const [error, existingUser] = await userServices.getUserByEmailOrPhoneNumber(email, phoneNumber);

        if (!existingUser) {
            res.status(400).json(new SuccessResponse({ message: "Email or Phone number is incorrect.", code: 400 }));
            return;
        }

        const passwordMatched = existingUser.password
            ? await comparePassword(password, existingUser.password)
            : false;

        if (!passwordMatched) {
            res.status(400).json(new SuccessResponse({ message: "Password is incorrect", code: 400 }));
            return;
        }

        try {
            const { accessToken, refreshToken } = await generateTokenAndUpdate(existingUser)
            res.cookie("_sid", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 15 * 60 * 1000,
            });


            res.cookie("_rid", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 72,
            });
            const { password, verificationOTP, refreshToken: userRefreshToken, ...safeUser } = existingUser;

            res.status(200).json(new SuccessResponse({
                message: "Login successfully",
                data: { user: safeUser }
            }));

        } catch (updateError) {
            console.error("Failed to update refresh token:", updateError);
            res.status(500).json(new SuccessResponse({
                message: "Internal server error",
                code: 500
            }));
        }
    },
    refreshAccessToken: async (req: Request, res: Response): Promise<void> => {
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json(new SuccessResponse({ message: "Not authenticated", code: 401 }));
            return;
        }

        const decodedToken = verifyJwt(token, process.env.JWT_REFRESH_SECRET);
        if (!decodedToken) {
            res.status(401).json(new SuccessResponse({ message: "Invalid refresh token", code: 401 }));
            return;
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(decodedToken.email);

        if (!user || user.refreshToken !== token) {
            res.status(401).json(new SuccessResponse({ message: "Invalid session", code: 401 }));
            return;
        }

        const { accessToken, refreshToken } = await generateTokenAndUpdate(user);

        res.cookie("_sid", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });


        res.cookie("_rid", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 72,
        });

        res.status(200).json(new SuccessResponse({
            message: "Token refreshed successfully",
            data: { accessToken },
        }));
    },

    forgetPassword: async (req: Request, res: Response): Promise<void> => {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            res.status(400).json(new SuccessResponse({ message: "Email or phone number is required.", code: 400 }));
            return;
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(email, phoneNumber);

        if (error || !user) {
            res.status(400).json(new SuccessResponse({ message: "Email or Phone number is incorrect.", code: 400 }));
            return;
        }

        const otp = await authService.forgetPassword(user.id);

        if (!otp) {
            res.status(400).json(new SuccessResponse({ message: "Something went wrong", code: 500 }));
        }
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

        await sendTransactionalEmail({
            toEmail: email,
            fromEmail: "lowkey11869@gmail.com",
            toName: fullName,
            subject: "Password recovery officer has arrived.",
            htmlContent: `<h1>Hello ${fullName}!</h1><p>Here's your code ${otp}</p>`
        });

        res.status(200).json(new SuccessResponse({
            message: "Password reset OTP sent successfully",
            code: 200
        }));
    },
    validateOTP: async (req: Request, res: Response): Promise<void> => {
        const { OTP, email } = req.body;
        if (!OTP || !email) {
            res.status(401).json(new SuccessResponse({ message: "OTP and email is required", code: 401 }));
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(email);
        if (!user) {
            res.status(401).json(new SuccessResponse({ message: "User not found" }))
            return;
        }
        const valid = await authService.validateOTP(OTP, user.id);

        const tempToken = signJwt(
            {
                userId: user.id,
                email: user.email,
                sub: user.id
            },
            '15m',
            process.env.JWT_RESET_SECRET
        );

        if (!valid.success) {
            res.status(401).json(new SuccessResponse({ message: valid.message }))
        }

        if (valid.success) {
            res.status(200).json(new SuccessResponse({ message: valid.message, data: tempToken }))
        }
    },

    resetPassword: async (req: Request, res: Response): Promise<void> => {
        const { password } = req.body;

        const token = req.body.token || req.cookies.token || req.headers['authorization'];

        const decodedToken = verifyJwt(token, process.env.JWT_RESET_SECRET);

        if (!password || !token) {
            res.status(401).json(new SuccessResponse({ message: "Password and email and token is required", code: 401 }));
        }

        if (!decodedToken) {
            res.status(401).json(new SuccessResponse({ message: "Token has been expired or invalid", code: 401 }));
        }
        const valid = await authService.resetPassword(decodedToken?.email ? decodedToken?.email : '', password);

        if (!valid.success) {
            res.status(401).json(new SuccessResponse({ message: valid.message }))
        }
        if (valid.success) {
            res.status(200).json(new SuccessResponse({ message: valid.message }))
        }
    },
    logout: async (req: Request, res: Response): Promise<void> => {
        res.cookie('_sid', '', { maxAge: 0 });
        res.cookie('_rid', '', { maxAge: 0 });

        res.status(200).json(new SuccessResponse({
            message: "Logged out successfully"
        }));
    }
}