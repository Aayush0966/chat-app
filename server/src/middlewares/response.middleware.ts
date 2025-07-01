import {NextFunction, Request, Response} from "express";
import SuccessResponse from "../dtos/SuccessResponse";
import ErrorResponse from "../dtos/ErrorResponse";

export default function responseHandler(_req: Request, res: Response, next: NextFunction) {
    res.success = function <T = any>(payload: { data?: T | null | undefined; message?: string; code?: number; } | undefined) {
        const response = new SuccessResponse<T>(payload);
        return res.status(response.code).json(response);
    };

    res.error = function <D = any>(payload: { error?: string; details?: D | null | undefined; code?: number; } | undefined) {
        const response = new ErrorResponse<D>(payload);
        return res.status(response.code).json(response);
    };

    next();
}
