export default class ErrorResponse<D = any> {
    public readonly success: false = false;
    public readonly error: string;
    public readonly details: D | null;
    public readonly code: number;

    constructor({
                    error = 'Internal Server Error',
                    details = null,
                    code = 500,
                }: {
        error?: string;
        details?: D | null;
        code?: number;
    } = {}) {
        this.error = error;
        this.details = details;
        this.code = code;
    }
}
