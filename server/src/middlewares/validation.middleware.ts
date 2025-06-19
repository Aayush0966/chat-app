import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodTypeAny } from 'zod';
import { StatusCodes } from 'http-status-codes';

export function validateData<T extends ZodTypeAny>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsedData = schema.parse(req.body);
            req.body = parsedData; // optionally replace raw input with parsed data
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map(issue => ({
                    field: issue.path.length > 0 ? issue.path.join('.') : 'root',
                    message: issue.message,
                }));

                res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Invalid data',
                    details: errorMessages,
                });
            } else {
                console.error("Unexpected error during validation:", error);
                res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Internal Server Error' });
            }
        }
    };
}
