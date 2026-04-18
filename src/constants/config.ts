import { Dimensions } from "react-native";

// Constants
export const API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY; // Retrieve NASA_API_KEY from .env file.
export const AWS_BASE_URL = process.env.EXPO_PUBLIC_AWS_BASE_URL; // Retrieve AWS_BASE_URL from .env file.
export const AWS_AUTHORIZATION = process.env.EXPO_PUBLIC_AWS_AUTHORIZATION; // Retrieve EXPO_PUBLIC_AWS_AUTHORIZATION from .env file.
export const AWS_BEARER_TOKEN = process.env.EXPO_PUBLIC_AWS_BEARER_TOKEN; // Retrieve EXPO_PUBLIC_AWS_BEARER_TOKEN from .env file.
export const AWS_LOGIN_ENDPOINT = process.env.EXPO_PUBLIC_AWS_LOGIN_ENDPOINT; // Retrieve AWS_LOGIN_ENDPOINT from .env file.
export const AWS_REGISTER_ENDPOINT =
  process.env.EXPO_PUBLIC_AWS_REGISTER_ENDPOINT; // Retrieve AWS_REGISTER_ENDPOINT from .env file.
export const AWS_APODS_ENDPOINT = process.env.EXPO_PUBLIC_AWS_APODS_ENDPOINT; // Retrieve AWS_APODS_ENDPOINT from .env file.
export const AWS_FAVORITES_ENDPOINT =
  process.env.EXPO_PUBLIC_AWS_FAVORITES_ENDPOINT; // Retrieve AWS_FAVORITES_ENDPOINT from .env file.
export const AWS_USERS_ENDPOINT = process.env.EXPO_PUBLIC_AWS_USERS_ENDPOINT; // Retrieve AWS_USERS_ENDPOINT from .env file.

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;
