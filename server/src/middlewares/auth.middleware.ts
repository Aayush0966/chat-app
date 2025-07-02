import { Request, Response, NextFunction } from 'express';
import { generateTokenAndUpdate, verifyJwt } from '../lib/jwt';
import { userServices } from '../services/user.services';

export const validateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // console.log('🔒 Starting auth validation...');
    const accessToken = req.cookies._sid;
    const refreshToken = req.cookies._rid;
    
    // console.log('📦 Tokens from cookies:', { 
    //     hasAccessToken: !!accessToken,
    //     hasRefreshToken: !!refreshToken 
    // });

    const decodedAccess = verifyJwt(accessToken, process.env.JWT_ACCESS_SECRET);
    // console.log('🔍 Decoded access token:', decodedAccess);

    if (decodedAccess && decodedAccess.sub && decodedAccess.email) {
        // console.log('✅ Valid access token, proceeding with user:', decodedAccess.email);
        req.user = {
            id: decodedAccess.sub,
            email: decodedAccess.email
        };
        next();
        return;
    }

    if (!refreshToken) {
        // console.log('❌ No refresh token found');
        res.status(401).json({ message: "Not authenticated" });
        return;
    }

    const decodedRefresh = verifyJwt(refreshToken, process.env.JWT_REFRESH_SECRET);
    // console.log('🔄 Decoded refresh token:', decodedRefresh);
    
    if (!decodedRefresh) {
        // console.log('❌ Invalid refresh token');
        res.status(401).json({ message: "Session expired" });
        return;
    }

    // console.log('🔍 Looking up user:', decodedRefresh.email);
    const [error, user] = await userServices.getUserByEmailOrPhoneNumber(decodedRefresh.email);
    // console.log('👤 User lookup result:', { error, hasUser: !!user });

    if (!user || user.refreshToken !== refreshToken) {
        // console.log('❌ User not found or refresh token mismatch');
        res.status(401).json({ message: "Invalid session" });
        return;
    }

    // console.log('🔄 Generating new tokens...');
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await generateTokenAndUpdate(user);

    // console.log('🍪 Setting new cookies...');
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

    const decodedNewAccess = verifyJwt(newAccessToken, process.env.JWT_ACCESS_SECRET);
    // console.log('🔍 Verifying new access token:', { isValid: !!decodedNewAccess });

    if (decodedNewAccess && decodedNewAccess.sub && decodedNewAccess.email) {
        // console.log('✅ Auth complete, proceeding with user:', decodedNewAccess.email);
        req.user = {
            id: decodedNewAccess.sub,
            email: decodedNewAccess.email
        };
        next();
        return;
    } else {
        // console.log('❌ New access token verification failed');
        res.status(401).json({ message: "Invalid token" });
        return;
    }
};
