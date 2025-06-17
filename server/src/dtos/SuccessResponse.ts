export default class SuccessResponse<T = any> {
    public readonly success: true = true;
    public readonly message: string;
    public readonly data: T | null;
    public readonly code: number;

    /**
     * @param params.data
     * @param params.message
     * @param params.code
     */
    constructor({
                    data = null,
                    message = 'OK',
                    code = 200,
                }: {
        data?: T;
        message?: string;
        code?: number;
    } = {}) {
        this.message = message;
        this.data    = data ?? null;
        this.code    = code;
    }
}
