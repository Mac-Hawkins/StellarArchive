import { Dimensions } from "react-native";

// Constants
export const API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY; // Retrieve NASA_API_KEY from .env file.
export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;
