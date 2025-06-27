import axios from "axios";
import type { LoginFormInputs } from "@/types/user";
import type { RegisterFormInputs } from "@/types/user";
import type { ForgotFormInputs } from "@/types/user";

const API_URL =
  "https://chatapp-backend-dsa2fkh8e4ahgdhz.southeastasia-01.azurewebsites.net/api/auth";

export const loginUser = async (data: LoginFormInputs) => {
  const res = await axios.post(`${API_URL}/login`, {
    phoneNumber: data.phoneNumber,
    password: data.password,
  });
  return res.data;
};

export const registerUser = async (data: RegisterFormInputs) => {
  const res = await axios.post(`${API_URL}/register`, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    password: data.password,
  });
  return res.data;
};

export const forgotPassword = async (data: ForgotFormInputs) => {
  const res = await axios.post(`${API_URL}/forget-password`, {
    email: data.email,
  });
  return res.data;
};
