import axios from "axios";
import type {
  LoginFormInputs,
  RegisterFormInputs,
  ForgotFormInputs,
  ValidateOTPInputs,
  SendMessageInput,
} from "@/types/user";

export const BASE_URL = "http://localhost:8000";

const API_ENDPOINTS = {
  login: `${BASE_URL}/api/auth/login`,
  register: `${BASE_URL}/api/auth/register`,
  forgot: `${BASE_URL}/api/auth/forget-password`,
  validate: `${BASE_URL}/api/auth/validate-otp`,
  getChats: `${BASE_URL}/api/chats/user`,
  sendMessage: `${BASE_URL}/api/message`,
  getMessages: `${BASE_URL}/api/message`,
  createChat: `${BASE_URL}/api/chats`,
  searchUsers: `${BASE_URL}/api/users/search`,
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
  
  // Store user data in localStorage for persistence
  if (res.data?.data?.safeUser) {
    localStorage.setItem('currentUser', JSON.stringify(res.data.data.safeUser));
  }
  
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
    `${API_ENDPOINTS.searchUsers}?q=${encodeURIComponent(query)}`,
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

export const getMessagesByChat = async (chatId: string, limit: number = 20, cursor?: string) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append('cursor', cursor);
  
  const res = await axios.get(`${BASE_URL}/api/message/${chatId}?${params.toString()}`, {
    withCredentials: true,
  });
  return res.data;
};

export const createChat = async (data: {
  name?: string;
  participantIds: string[];
  creatorId: string;
  isGroup: boolean;
}) => {
  const res = await axios.post(API_ENDPOINTS.createChat, data, {
    withCredentials: true,
  });
  return res.data;
};

export const logout = async () => {
  const res = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
    withCredentials: true,
  });
  
  // Clear stored user data
  localStorage.removeItem('currentUser');
  
  return res.data;
};

export const deleteChatForUser = async (chatId: string) => {
  const res = await axios.delete(`${BASE_URL}/api/chats/user/${chatId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteMessageForYourself = async (messageId: string) => {
  const res = await axios.delete(`${BASE_URL}/api/message/user/${messageId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const deleteMessageForBoth = async (messageId: string) => {
  const res = await axios.delete(`${BASE_URL}/api/message/both/${messageId}`, {
    withCredentials: true,
  });
  return res.data;
};

export const editMessage = async (messageId: string, text: string) => {
  const res = await axios.patch(`${BASE_URL}/api/message/${messageId}`, { text }, {
    withCredentials: true,
  });
  return res.data;
};


