import {RegisterUserPayload} from "../types/authTypes";
import prisma from "../configs/prisma";
import {prismaSafe} from "../lib/prismaSafe";

export const authService = {
    async registerUser (registerData: RegisterUserPayload)  {
           const [error, user] = await prismaSafe(
               prisma.user.create({
                   data: registerData
               })
           )
            if (user) return {success: true, user}
            return {success: false, error}
    }


}
