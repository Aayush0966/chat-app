import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import {comparePassword, hashPassword} from "../lib/password";
import {userServices} from "../services/user.services";
import SuccessResponse from "../dtos/SuccessResponse";
import jwt from "jsonwebtoken";
import {generateTokenAndUpdate, signJwt, verifyJwt} from "../lib/jwt";
import prisma from "../configs/prisma";

export const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const {firstName, lastName, phoneNumber, email, password} = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !password) {
            res.status(400).json(new SuccessResponse({message: "Missing required fields", code: 400}));
            return;
        }

        const userData = {
            firstName: String(firstName),
            lastName: String(lastName),
            phoneNumber: String(phoneNumber),
            email: String(email),
            password: await hashPassword(String(password))
        };

        const [error, existingUser] = await userServices.getUserByEmailOrPhoneNumber(
            userData.email,
            userData.phoneNumber
        );


        if (existingUser) {
            res.status(400).json(new SuccessResponse({message: "Phone number or email is already used", code: 400}));
            return;
        }

        const newUser = await authService.registerUser(userData);

        if (newUser.success) {
            res.status(201).json(new SuccessResponse({message: "User registered successfully", code: 201}));
        } else {
            res.status(500).json(new SuccessResponse({
                message: newUser.error || "Something went wrong",
                code: 500
            }));
        }
    },
    login: async (req: Request, res: Response): Promise<void> => {
        const {email, phoneNumber, password} = req.body;

        if ((!email && !phoneNumber) || !password) {
            res.status(400).json(new SuccessResponse({ message: "Missing required fields", code: 400 }));
            return;
        }

        const [error, existingUser] = await userServices.getUserByEmailOrPhoneNumber(email, phoneNumber);

        if (!existingUser) {
            res.status(400).json(new SuccessResponse({message: "Email or Phone number is incorrect.", code: 400}));
            return;
        }

        const passwordMatched = existingUser.password
            ? await comparePassword(password, existingUser.password)
            : false;

        if (!passwordMatched) {
            res.status(400).json(new SuccessResponse({message: "Password is incorrect", code: 400}));
            return;
        }

        try {
           const {accessToken, refreshToken } = await generateTokenAndUpdate(existingUser)
            res.cookie("token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 72,
            } )
            res.status(200).json(new SuccessResponse({
                message: "Login successfully",
                data: {accessToken}
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
        console.log("Received cookie: ", req.cookies)
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

        res.cookie("token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 72,
        });

        res.status(200).json(new SuccessResponse({
            message: "Token refreshed successfully",
            data: { accessToken },
        }));
    }

}