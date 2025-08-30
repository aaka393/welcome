import axios from "axios";
import { serviceBaseUrl } from "../constants/appConstants";

// 🔑 Used only after login redirect to verify and store user data
export const verifyTokenForLoginService = async () => {
  const res = await axios.post(`${serviceBaseUrl}/verifyToken`, {});
  return res.data;
};

// 🔄 Used for periodic session checking (every 5s)
export const verifyTokenService = async () => {
  const res = await axios.post(`${serviceBaseUrl}/verifyToken`, {});
  return res.data;
};

export const logoutService = async (): Promise<any> => {
  try {
    const response = await axios.post(`${serviceBaseUrl}/logout`);
    return response.data.code;
  } catch (error) {
    throw error;
  }
};