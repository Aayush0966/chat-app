import jwt from "jsonwebtoken";
import {parse as parseCookie} from "cookie";
import { userServices } from "../services/user.services";
import { generateTokenAndUpdate, verifyJwt } from "../lib/jwt";
import { Socket } from "socket.io";

export const socketAuthMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
    try {
        const cookieHeader = socket.handshake.headers.cookie;

        if (!cookieHeader) {
            return next(new Error("No cookies found"));
        }

        const cookies = parseCookie(cookieHeader);
        const accessToken = cookies["_sid"];
        const refreshToken = cookies["_rid"];

        if (!accessToken) {
            return next(new Error("No access token"));
        }

        let decodedAccess = verifyJwt(accessToken, process.env.JWT_ACCESS_SECRET);

        if (decodedAccess && decodedAccess.sub && decodedAccess.email) {
            socket.data.user = {
                id: decodedAccess.sub,
                email: decodedAccess.email,
            };
            return next();
        }

        if (!refreshToken) {
            return next(new Error("No refresh token"));
        }

        const decodedRefresh = verifyJwt(refreshToken, process.env.JWT_REFRESH_SECRET);

        if (!decodedRefresh) {
            return next(new Error("Invalid refresh token"));
        }

        const [error, user] = await userServices.getUserByEmailOrPhoneNumber(decodedRefresh.email);

        if (!user || user.refreshToken !== refreshToken) {
            return next(new Error("Invalid session or token mismatch"));
        }

        const { accessToken: newAccess, refreshToken: newRefresh } = await generateTokenAndUpdate(user);

        const decodedNew = verifyJwt(newAccess, process.env.JWT_ACCESS_SECRET);

        if (decodedNew && decodedNew.sub && decodedNew.email) {
            socket.data.user = {
                id: decodedNew.sub,
                email: decodedNew.email,
            };
            return next();
        }

        return next(new Error("Failed to verify new token"));
    } catch (err) {
        return next(new Error("Socket auth failed"));
    }
};
