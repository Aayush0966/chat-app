import {z} from "zod"
import { AccountType } from "@prisma/client"

export const registrationSchema = z.object({
    lastName: z.string().nonempty("Last name is required"),
    firstName: z.string().nonempty("first name is required"),
    email: z.string().nonempty("Email is required").email("Invalid email format"),
    phoneNumber: z.string().nonempty("Phone number is required").regex(/^\d{10}$/, "Phone number must be 10 digits"),
    password: z.string().nonempty("Password is required").min(8).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        "Password must include uppercase, lowercase, number, and special character"
    ),
    accountType: z.nativeEnum(AccountType).optional().default(AccountType.CREDENTIALS)
})

export const loginSchema = z.object({
    email: z.string().email("Invalid email format").optional(),
    phoneNumber: z.string().regex(/^\d{10}$/, "Phone must be 10 digits").optional(),
    password: z.string().nonempty("Password is required"),
}).refine((data) => data.email || data.phoneNumber, {
    message: "Either email or phone number is required",
    path: ["email"],
});

export const forgetPasswordSchema = z.object(({
    email: z.string().email("Invalid email format").nonempty("Email is required")
}))