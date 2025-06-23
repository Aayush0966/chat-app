import {Request, Response} from "express";
import {userServices} from "../services/user.services";
import {HTTP} from "../utils/httpStatus";

export const userController = {
    searchUser: async (req:Request, res: Response): Promise<void> => {
        const firstName = req.query.q;
        if (!firstName) {
            res.error({error: "Query is required!", code: HTTP.BAD_REQUEST})
            return;
        }
        const result = await userServices.findUser(String(firstName));

        if (!result.success || !result.data) {
            res.error({error: result.message, code: result.statusCode});
            return;
        }
        if (result.success) {
            res.success({message: "User fetched successfully", data: result.data, code:HTTP.OK})
        }
    }
}