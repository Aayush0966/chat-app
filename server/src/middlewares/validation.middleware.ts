import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { StatusCodes } from 'http-status-codes';

export function validateData<T extends ZodTypeAny>(schema: T) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map(issue => ({
                    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
                    message: issue.message,
                    code: issue.code,
                }));

                res.status(StatusCodes.BAD_REQUEST).json({
                    error: 'Invalid data',
                    details: errorMessages,
                });
            } else {
                console.error('Unexpected error during validation:', error);
                res
                    .status(StatusCodes.INTERNAL_SERVER_ERROR)
                    .json({ error: 'Internal Server Error' });
            }
        }
    };
}
