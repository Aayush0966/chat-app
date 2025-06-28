import { Request, Response, NextFunction } from 'express';
import { generateTokenAndUpdate, verifyJwt } from '../lib/jwt';
import { userServices } from '../services/user.services';

export const validateUser = async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.cookies._sid;
    const refreshToken = req.cookies._rid;

    if (!accessToken) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const decodedAccess = verifyJwt(accessToken, process.env.JWT_ACCESS_SECRET);

    if (decodedAccess) {
        req.user = decodedAccess;
        return next();
    }

    if (!refreshToken) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const decodedRefresh = verifyJwt(refreshToken, process.env.JWT_REFRESH_SECRET);
    if (!decodedRefresh) {
        return res.status(401).json({ message: "Session expired" });
    }

    const [error, user] = await userServices.getUserByEmailOrPhoneNumber(decodedRefresh.email);
    if (!user || user.refreshToken !== refreshToken) {
        return res.status(401).json({ message: "Invalid session" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await generateTokenAndUpdate(user);

    res.cookie("_sid", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
    });

    res.cookie("_rid", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    req.user = verifyJwt(newAccessToken, process.env.JWT_ACCESS_SECRET);
    next();
};