import type { FieldValues, Control } from "react-hook-form";

export interface LoginFormInputs {
  phoneNumber: string;
  password: string;
}

export interface RegisterFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface ForgotFormInputs {
  email: string;
}

export interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
}