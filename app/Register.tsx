import {
  AWS_AUTHORIZATION,
  AWS_BASE_URL,
  AWS_REGISTER_ENDPOINT,
} from "@/src/constants/config";
import { ToastType } from "@/src/types/enums/ToastType";
import { showToast } from "@/src/utils/ToastMessages";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import loginRegisterStyles from "./LoginRegister.styles";

// Entry point of application. This is the first screen that users see when they open the app.
export default function LoginScreen() {
  const router = useRouter();

  // I will use these to store the text in the user and pass text boxes.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");

  // State to disable buttons while register request is in flight to prevent multiple requests.
  const [disabled, setDisabled] = useState(false);

  // Verify that user exists with credentials and log in.
  const onPressRegister = async () => {
    setDisabled(true);

    // Check to make sure user filled in both fields before sending request.
    if (username === "" || password === "") {
      showToast(
        "Please fill in all fields to resgister.",
        ToastType.ERROR,
        "center",
      );
      setDisabled(false);
      return;
    }

    // Check to make sure password and confirmed password match before sending request.
    if (password !== confirmedPassword) {
      showToast(
        "Register failed. Passwords do not match.",
        ToastType.ERROR,
        "center",
      );
      setDisabled(false);
      return;
    }

    try {
      // Attempt to register user with backend.
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

      const data = await response.json();
      if (data.message.includes("User created")) {
        alert("Register successful! Please login with your new credentials.");
        const token = data.token; // Store token for future authenticated requests
        router.push({
          pathname: "./Login",
          params: { userToken: token },
        });
        //router.push("./UserHome"); // Eventually go to this instead.
      } else {
        showToast("Register failed.", ToastType.ERROR, "center");
      }
    } catch (e) {
      showToast("Network error", ToastType.ERROR, "center");
    } finally {
      setDisabled(false);
    }
  };

  // Rendering

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={loginRegisterStyles.loginOuterView}>
        <View style={loginRegisterStyles.inputView}>
          <Text style={loginRegisterStyles.inputLabel}>Username</Text>
          <TextInput
            style={loginRegisterStyles.textInput}
            placeholder="Enter username"
            placeholderTextColor="gray"
            value={username}
            onChangeText={setUsername}
          />
        </View>
        <View style={loginRegisterStyles.inputView}>
          <Text style={loginRegisterStyles.inputLabel}>New Password</Text>
          <TextInput
            style={loginRegisterStyles.textInput}
            placeholder="Enter new password"
            placeholderTextColor="gray"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <View style={loginRegisterStyles.inputView}>
          <Text style={loginRegisterStyles.inputLabel}>
            Confirm New Password
          </Text>
          <TextInput
            style={loginRegisterStyles.textInput}
            placeholder="Confirm new password"
            placeholderTextColor="gray"
            secureTextEntry={true}
            value={confirmedPassword}
            onChangeText={setConfirmedPassword}
          />
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
            onPress={() => {
              onPressRegister();
            }}
          >
            <Text style={loginRegisterStyles.textTouchableOpacity}>
              Register
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
