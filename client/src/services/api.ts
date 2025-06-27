import axios from "axios";
import type {
  LoginFormInputs,
  RegisterFormInputs,
  ForgotFormInputs,
  CreateChat,
} from "@/types/user";

const BASE_URL =
  "https://chatapp-backend-dsa2fkh8e4ahgdhz.southeastasia-01.azurewebsites.net";

export const loginUser = async (data: LoginFormInputs) => {
  const res = await axios.post(
    `${BASE_URL}/api/auth/login`,
    {
      phoneNumber: data.phoneNumber,
      password: data.password,
    },
    { withCredentials: true }
  );
  return res.data;
};

export const registerUser = async (data: RegisterFormInputs) => {
  const res = await axios.post(`${BASE_URL}/api/auth/register`, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    password: data.password,
  });
  return res.data;
};

export const forgotPassword = async (data: ForgotFormInputs) => {
  const res = await axios.post(`${BASE_URL}/api/auth/forget-password`, {
    email: data.email,
  });
  return res.data;
};

export const searchUsers = async (query: string) => {
  const accessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbWM1dTA5bTIwMDAwN25maDJ5bDdmYnVqIiwiZW1haWwiOiJsb3drZXk2OUBnbWFpbC5jb20iLCJpYXQiOjE3NTEwMTkwNjUsImV4cCI6MTc1MTAyMjY2NX0.tWCAs1u3V7tfZzR3cmw7H4jFvZ75lptaXIQgIYYDhp4";
  const res = await axios.get(
    `${BASE_URL}/api/users/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return res.data;
};

export const createChat = async (data: CreateChat) => {
  const accessToken = localStorage.getItem("accessToken");
  const res = await axios.post(
    `${BASE_URL}/api/chats`,
    {
      creatorId: data.creatorId,
      participantIds: data.participantIds,
      isGroup: data.isGroup,
      name: data.name,
    },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  return res.data;
};

export const getChatsByUser = async () => {
  const accessToken = localStorage.getItem("accessToken");
  const res = await axios.get(`${BASE_URL}/api/chats/user`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data;
};
