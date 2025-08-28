import axios from "axios";
import { serviceBaseUrl } from "../constants/appConstants";

export const logout = async (): Promise<any> => {
  try {
    const response = await axios.post(`${serviceBaseUrl}/logout`);
    return response.data.code;
  } catch (error) {
    throw error;
  }
};
