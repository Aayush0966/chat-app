import {Request, Response} from "express";
import {userServices} from "../services/user.services";
import {HTTP} from "../utils/httpStatus";

export const userController = {
    searchUser: async (req:Request, res: Response): Promise<void> => {
        const name = req.query.q;
        if (!name) {
            res.error({error: "Query is required!", code: HTTP.BAD_REQUEST});
            return;
        }
        const [firstName, lastName] = String(name).split(' ');
        const result = await userServices.findUser(firstName, lastName);

        if (!result.success || !result.data) {
            res.error({error: result.message, code: result.statusCode});
            return;
        }
        
        res.success({message: "User fetched successfully", data: result.data, code:HTTP.OK});
    }
}