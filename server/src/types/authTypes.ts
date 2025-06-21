export interface RegisterUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface LoginPayload {
    email?: string;
    phoneNumber?: string;
    password: string;
}
