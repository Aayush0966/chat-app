import {NextFunction, Request, Response} from "express";
import SuccessResponse from "../dtos/SuccessResponse";
import {verifyJwt} from "../lib/jwt";
import {userServices} from "../services/user.services";

export function validateUser() {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers['authorization']?.replace("Bearer", "")
        if (!token) {
            res.status(401).json(new SuccessResponse({message: "Token is required"}));
            return;
        }
        const decodedToken = verifyJwt(token);

        if (!decodedToken) {
            res.status(401).json(new SuccessResponse({message: "Invalid token"}));
            return;
        }

        const user = await userServices.getUserById(decodedToken.userId)
        if (!user) {
            res.status(401).json(new SuccessResponse({message: "Invalid token"}));
            return;
        }
        req.body.email = user.email;
        req.body.userId = user.id;
        next();
    }
}
