import { TextStyle } from "react-native";
import Toast from "react-native-toast-message";

// General method for showing a toast message at the bottom of the screen.
export const showToast = (
  message: string,
  type: string,
  textAlignment?: string,
) => {
  const textAlignmentTyped: TextStyle["textAlign"] =
    textAlignment as TextStyle["textAlign"];

  Toast.show({
    type: type,
    text1: message,
    position: "bottom",
    text1Style: { textAlign: textAlignmentTyped },
  });
};
