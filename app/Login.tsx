import { ToastType } from "@/src/types/enums/ToastType";
import { fetch } from "cross-fetch"; // or use 'node-fetch' or the native fetch in RN 0.64+
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  AWS_AUTHORIZATION,
  AWS_BASE_URL,
  AWS_LOGIN_ENDPOINT,
} from "../src/constants/config";
import { showToast } from "../src/utils/ToastMessages";
import loginRegisterStyles from "./LoginRegister.styles";

// Entry point of application. This is the first screen that users see when they open the app.
export default function LoginScreen() {
  const router = useRouter();

  // I will use these to store the text in the user and pass text boxes.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // State to disable buttons while login request is in flight to prevent multiple requests.
  const [disabled, setDisabled] = useState(false);

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

      const data = await response.json();
      if (data.message.includes("Login successful")) {
        showToast("Login successful!", ToastType.SUCCESS, "center");
        const token = data.token; // Store token for future authenticated requests
        router.push({
          pathname: "./Gallery",
          params: { userToken: token },
        });
        //router.push("./UserHome"); // Eventually go to this instead.
      } else {
        showToast(
          "Login failed. User doesn't match our records.",
          ToastType.ERROR,
          "center",
        );
      }
    } catch (e) {
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
