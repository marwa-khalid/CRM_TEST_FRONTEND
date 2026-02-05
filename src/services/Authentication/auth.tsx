import axiosInstance from "../axiosConfig";

interface LoginPayload {
  user_name: string;
  password: string;
}

interface LoginResponse {
  user_name: string;
  access_token: string;
  token: string;
  first_name: string;

}

interface SignupPayload {
  user_name: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name: string;
}

interface SignupResponse {
  message: string;
  token?: string; // if your API returns a token after signup
}

export const login = async ({
  user_name,
  password,
}: LoginPayload): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>("/auth/login", {
    user_name,
    password,
  });
  return response.data;
};

export const signup = async ({
  user_name,
  password,
  first_name,
  last_name,
  company_name,
}: SignupPayload): Promise<SignupResponse> => {
  const response = await axiosInstance.post<SignupResponse>("/auth/register", {
    user_name,
    password,
    first_name,
    last_name,
    company_name,
  });
  return response.data;
};