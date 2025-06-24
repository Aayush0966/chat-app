import {NextFunction, Request, Response} from "express";
import SuccessResponse from "../dtos/SuccessResponse";
import {verifyJwt} from "../lib/jwt";
import {userServices} from "../services/user.services";

export function validateUser() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.startsWith('Bearer ') 
            ? authHeader.substring(7)
            : null;
            
        if (!token) {
            res.status(401).json(new SuccessResponse({message: "Token is required"}));
            return;
        }
        
        const decodedToken = verifyJwt(token);

        if (!decodedToken) {
            res.status(401).json(new SuccessResponse({message: "Invalid token"}));
            return;
        }

        const user = await userServices.getUserById(decodedToken.sub); // Use 'sub' instead of 'userId'
        if (!user) {
            res.status(401).json(new SuccessResponse({message: "Invalid token"}));
            return;
        }
        req.user = user;
        next();
    }
}