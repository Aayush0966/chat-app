import axios from "axios";
import type {
  LoginFormInputs,
  RegisterFormInputs,
  ForgotFormInputs,
  ValidateOTPInputs,
  SendMessageInput,
} from "@/types/user";

const BASE_URL = "http://localhost:8000";

const API_ENDPOINTS = {
  login: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/api/auth/register`,
  forgot: `${BASE_URL}/api/auth/forget-password`,
  validate: `${BASE_URL}/api/auth/validate-otp`,
  getChats: `${BASE_URL}/api/chats/user`,
  sendMessage: `${BASE_URL}/api/message`,
};

export const loginUser = async (data: LoginFormInputs) => {
  const res = await axios.post(
    API_ENDPOINTS.login,
    {
      phoneNumber: data.phoneNumber,
      password: data.password,
    },
    { withCredentials: true }
  );
  return res.data;
};

export const registerUser = async (data: RegisterFormInputs) => {
  const res = await axios.post(API_ENDPOINTS.register, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    password: data.password,
  });
  return res.data;
};

export const forgotPassword = async (data: ForgotFormInputs) => {
  const res = await axios.post(API_ENDPOINTS.forgot, {
    email: data.email,
  });
  return res.data;
};

export const validateOTP = async (data: ValidateOTPInputs) => {
  const res = await axios.post(API_ENDPOINTS.validate, {
    email: data.email,
    OTP: data.OTP,
  });
  return res.data;
};

export const searchUsers = async (query: string) => {
  const res = await axios.get(
    `${BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`,
    {
      withCredentials: true,
    }
  );
  return res.data;
};

export const getChatsByUser = async () => {
  const res = await axios.get(API_ENDPOINTS.getChats, {
    withCredentials: true,
  });
  return res.data;
};

export const sendMessage = async (data: SendMessageInput) => {
  const res = await axios.post(`${BASE_URL}/api/message`, data, {
    withCredentials: true
  });
  return res.data;
};
