import { loginUser } from "@/src/services/users";
import { ToastType } from "@/src/types/enums/ToastType";
import { Link, useRouter } from "expo-router";
import { jwtDecode } from "jwt-decode";
import React, { useEffect, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { showToast } from "../src/utils/ToastMessages";
import loginRegisterStyles from "./LoginRegister.styles";

export default function LoginScreen() {
  const router = useRouter();

  // I will use these to store the text in the user and pass text boxes.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // State to disable buttons while login request is in flight to prevent multiple requests.
  const [disabled, setDisabled] = useState(false);

  // Reset component state when this screen is mounted to ensure clean state
  useEffect(() => {
    return () => {
      // Reset state when component unmounts
      setUsername("");
      setPassword("");
      setDisabled(false);
    };
  }, []);

  // Verify that user exists with credentials and log in.
  const onPressLogin = async () => {
    setDisabled(true);
    // Check to make sure user filled in both fields before sending request.
    if (username === "" || password === "") {
      showToast(
        "Please fill in all fields to login.",
        ToastType.ERROR,
        "center",
      );
      setDisabled(false);
      return;
    }
    try {
      // Send login request to backend.
      const response = await loginUser(username, password);

      const data = await response.json();
      if ("message" in data && data.message.includes("Login successful")) {
        // Get token and user ID from response, then navigate to Account screen with token as param.
        const token = data.token;
        const decoded: any = jwtDecode(token);
        const userId = decoded.userId;
        showToast("Login successful!", ToastType.SUCCESS, "center");
        // Add delay to allow toast to display before navigating
        setTimeout(() => {
          router.push({
            pathname: "./Account",
            params: { userToken: token, userId: userId },
          });
        }, 500);
      } else {
        setDisabled(false); // Explicitly reset disabled state before showing toast
        showToast(
          "Login failed. User doesn't match our records.",
          ToastType.ERROR,
          "center",
        );
      }
    } catch (e) {
      console.error("Login error");
      setDisabled(false); // Explicitly reset disabled state before showing toast
      showToast("Network error.", ToastType.ERROR, "center");
    } finally {
      setDisabled(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={loginRegisterStyles.loginOuterView}>
        <View style={loginRegisterStyles.inputView}>
          <Text style={loginRegisterStyles.inputLabel}>Username</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={loginRegisterStyles.textInput}
            placeholder="Enter username"
            placeholderTextColor="gray"
          />
        </View>
        <View style={loginRegisterStyles.inputView}>
          <Text style={loginRegisterStyles.inputLabel}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={loginRegisterStyles.textInput}
            placeholder="Enter password"
            placeholderTextColor="gray"
            secureTextEntry={true}
          />
        </View>
        <View style={loginRegisterStyles.inputView}>
          <Text style={loginRegisterStyles.inputLabel}>No account?</Text>
          <Link href="./Register" style={loginRegisterStyles.linkRegister}>
            Register here.
          </Link>
        </View>
        <View style={loginRegisterStyles.viewTouchableOpacity}>
          <TouchableOpacity
            disabled={disabled}
            style={{
              height: 50,
              width: 300,
              backgroundColor: "lightblue",
              borderRadius: 10,
              justifyContent: "center", // Justifies text vertically within button.
              alignItems: "center", // Justifies text horizontally within button.
              opacity: disabled ? 0.5 : 1, // Reduce opacity when disabled
            }}
            onPress={onPressLogin}
          >
            <Text style={loginRegisterStyles.textTouchableOpacity}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
