import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import {hashPassword} from "../lib/password";
import {userServices} from "../services/user.services";
import SuccessResponse from "../dtos/SuccessResponse"; // assuming you created this

export const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const { firstName, lastName, phoneNumber, email, password } = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !password) {
            res.status(400).json(new SuccessResponse({ message: "Missing required fields", code: 400 }));
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


        if (error) {
            res.status(400).json(new SuccessResponse({ message: "Phone number or email is already used", code: 400 }));
            return;
        }

        const newUser = await authService.registerUser(userData);

        if (newUser.success) {
            res.status(201).json(new SuccessResponse({ message: "User registered successfully", code: 201 }));
        } else {
            res.status(500).json(new SuccessResponse({
                message: newUser.error || "Something went wrong",
                code: 500
            }));
        }
    }
};
