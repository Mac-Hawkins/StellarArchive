import {
    AWS_AUTHORIZATION,
    AWS_BASE_URL,
    AWS_LOGIN_ENDPOINT,
    AWS_REGISTER_ENDPOINT,
} from "../constants/config";

export async function registerUser(username: string, password: string) {
  const response = await fetch(AWS_BASE_URL + `${AWS_REGISTER_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${AWS_AUTHORIZATION}`,
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return response;
}

export async function loginUser(username: string, password: string) {
  const response = await fetch(AWS_BASE_URL + `${AWS_LOGIN_ENDPOINT}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${AWS_AUTHORIZATION}`,
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return response;
}
