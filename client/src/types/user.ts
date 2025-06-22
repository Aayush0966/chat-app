import type { FieldValues, Control } from "react-hook-form";

export interface LoginFormInputs {
  phoneNumber: string;
  password: string;
  remember: boolean;
}

export interface RegisterFormInputs {
  username: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
}