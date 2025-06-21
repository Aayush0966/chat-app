export default class SuccessResponse<T = any> {
    public readonly success: true = true;
    public readonly message: string;
    public readonly data: T | null;
    public readonly code: number;

    constructor({
                    data = null,
                    message = 'OK',
                    code = 200,
                }: {
        data?: T | null;
        message?: string;
        code?: number;
    } = {}) {
        this.message = message;
        this.data = data;
        this.code = code;
    }
}

import {StandardSchemaV1} from "zod/dist/types/v3/standard-schema";
