import {Request, Response} from "express";
import {authServices} from "../services/auth.services";
import {comparePassword, hashPassword} from "../lib/password";
import {userServices} from "../services/user.services";
import {generateTokenAndUpdate, signJwt, verifyJwt} from "../lib/jwt";
import {sendTransactionalEmail} from "../lib/email";
import {AccountType} from "@prisma/client";
import {HTTP} from "../utils/httpStatus";


export const authController = {
    register: async (req: Request, res: Response): Promise<void> => {
        const {firstName, lastName, phoneNumber, email, password, accountType = AccountType.CREDENTIALS} = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !password) {
            res.error({error: "Missing required fields", code: HTTP.BAD_REQUEST});
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

        if (error) {
            res.error({error: `Something went wrong: ${error}`, code: HTTP.INTERNAL});
            return;
        }

        if (existingUser) {
            res.error({error: "Phone number or email is already used", code: HTTP.BAD_REQUEST});
            return;
        }

        const newUser = await authServices.registerUser(userData, accountType);

        if (newUser.success) {
            res.success({message: "User registered successfully", code: HTTP.CREATED});
        } else {
            res.error({
                error: newUser.error || "Something went wrong",
                code: HTTP.INTERNAL
            });
        }
    },
    login: async (req: Request, res: Response): Promise<void> => {
        const {email, phoneNumber, password} = req.body;

        if ((!email && !phoneNumber) || !password) {
            res.error({error: "Missing required fields", code: HTTP.BAD_REQUEST});
            return;
        }

        const [error, existingUser] = await userServices.getUserByEmailOrPhoneNumber(email, phoneNumber);

        if (error) {
            res.error({error: `Something went wrong: ${error}`, code: HTTP.INTERNAL});
            return;
        }

        if (!existingUser) {
            res.error({error: "Email or Phone number is incorrect.", code: HTTP.BAD_REQUEST});
            return;
        }

        const passwordMatched = existingUser.password
            ? await comparePassword(password, existingUser.password)
            : false;

        if (!passwordMatched) {
            res.error({error: "Password is incorrect", code: HTTP.BAD_REQUEST});
            return;
        }

        try {
            const {accessToken, refreshToken} = await generateTokenAndUpdate(existingUser)
            res.cookie("token", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 72,
            })
            res.success({
                message: "Login successfully",
                data: {accessToken},
                code: HTTP.OK
            });

        } catch (updateError) {
            console.error("Failed to update refresh token:", updateError);
            res.error({
                error: "Internal server error",
                code: HTTP.INTERNAL
            });
        }
    },
    refreshAccessToken: async (req: Request, res: Response): Promise<void> => {
        const token = req.cookies.token;

        if (!token) {
            res.error({error: "Not authenticated", code: HTTP.UNAUTHORIZED});
            return;
        }

        const decodedToken = verifyJwt(token, process.env.JWT_REFRESH_SECRET);
        if (!decodedToken) {
            res.error({error: "Invalid refresh token", code: HTTP.UNAUTHORIZED});
            return;
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(decodedToken.email);

        if (error) {
            res.error({error: `Something went wrong: ${error}`, code: HTTP.INTERNAL});
            return;
        }

        if (!user || user.refreshToken !== token) {
            res.error({error: "Invalid session", code: HTTP.UNAUTHORIZED});
            return;
        }

        const {accessToken, refreshToken} = await generateTokenAndUpdate(user);

        res.cookie("token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 72,
        });

        res.success({
            message: "Token refreshed successfully",
            data: {accessToken},
            code: HTTP.OK
        });
    },

    forgetPassword: async (req: Request, res: Response): Promise<void> => {
        const {email, phoneNumber} = req.body;

        if (!email && !phoneNumber) {
            res.error({error: "Email or phone number is required.", code: HTTP.BAD_REQUEST});
            return;
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(email, phoneNumber);

        if (error || !user) {
            res.error({error: "Email or Phone number is incorrect.", code: HTTP.BAD_REQUEST});
            return;
        }

        const otp = await authServices.forgetPassword(user.id);

        if (!otp) {
            res.error({error: "Something went wrong", code: HTTP.INTERNAL});
            return;
        }
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';

        await sendTransactionalEmail({
            toEmail: email,
            fromEmail: "lowkey11869@gmail.com",
            toName: fullName,
            subject: "Password recovery officer has arrived.",
            htmlContent: `<h1>Hello ${fullName}!</h1><p>Here's your code ${otp}</p>`
        });

        res.success({
            message: "Password reset OTP sent successfully",
            code: HTTP.OK
        });
    },
    validateOTP: async (req: Request, res: Response): Promise<void> => {
        const {OTP, email} = req.body;
        if (!OTP || !email) {
            res.error({error: "OTP and email is required", code: HTTP.UNAUTHORIZED});
            return;
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(email);

        if (error) {
            res.error({error: `Something went wrong: ${error}`, code: HTTP.INTERNAL});
            return;
        }

        if (!user) {
            res.error({error: "User not found", code: HTTP.UNAUTHORIZED});
            return;
        }
        const valid = await authServices.validateOTP(OTP, user.id);

        const tempToken = signJwt(
            {userId: user.id,
            email: user.email,
            sub: user.id},
            '15m',
            process.env.JWT_RESET_SECRET
        );

        if (!valid.success) {
            res.error({error: valid.message, code: HTTP.UNAUTHORIZED});
            return;
        }

        if (valid.success) {
            res.success({message: valid.message, data: tempToken, code: HTTP.OK});
        }
    },

    resetPassword: async (req: Request, res: Response): Promise<void> => {
        const { password } = req.body;

        const token = req.body.token || req.cookies.token || req.headers['authorization'];

        const decodedToken = verifyJwt(token, process.env.JWT_RESET_SECRET);

        if (!password || !token) {
            res.error({error: "Password and token is required", code: HTTP.UNAUTHORIZED});
            return;
        }

        if (!decodedToken) {
            res.error({error: "Token has been expired or invalid", code: HTTP.UNAUTHORIZED});
            return;
        }
        const valid = await authServices.resetPassword(decodedToken?.email ? decodedToken?.email: '', password);

        if (!valid.success) {
            res.error({error: valid.message, code: HTTP.UNAUTHORIZED});
            return;
        }
        if (valid.success) {
            res.success({message: valid.message, code: HTTP.OK});
        }
    }
}