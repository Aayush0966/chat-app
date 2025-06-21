import axios from "axios";
import type { LoginFormInputs } from "@/types/user";

const API_URL = "http://localhost:8000/api/auth";

export const loginUser = async (data: LoginFormInputs) => {
  const res = await axios.post(`${API_URL}/login`, {
    phoneNumber: data.phoneNumber,
    password: data.password,
  });
  return res.data;
};
