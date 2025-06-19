export interface RegisterUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

export interface loginPayload {
    email?: string;
    phoneNumber?: string;
    password: string;
}