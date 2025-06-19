import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

import { StatusCodes } from 'http-status-codes';

export function validateData(schema: z.ZodObject<any, any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log("🟡 Incoming Request Body:", req.body); // Log raw input

        try {
            const result = schema.parse(req.body);
            console.log("✅ Validation Success:", result); // Confirm validation passed
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                console.log("❌ Validation Error:", JSON.stringify(error.errors, null, 2)); // Show full error

                const errorMessages = error.errors.map((issue) => ({
                    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
                    message: issue.message,
                }));

                res
                    .status(StatusCodes.BAD_REQUEST)
                    .json({ error: 'Invalid data', details: errorMessages });
            } else {
                console.error("🔥 Unknown Error:", error); // Unexpected exception
                res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ error: 'Internal Server Error' });
            }
        }
    };
}

