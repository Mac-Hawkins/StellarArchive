import { Link, useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import loginRegisterStyles from "./LoginRegister.styles";

// Entry point of application. This is the first screen that users see when they open the app.
export default function LoginScreen() {
  const router = useRouter();

  // Verify that user exists with credentials and log in.
  // const onPressLogin = async () => {
  //   alert("Continuing as guest...");
  //   router.push("./UserHome"); // Probably should navigate to user account home page once I make it.
  // };

  return (
    <View style={loginRegisterStyles.loginOuterView}>
      <View style={loginRegisterStyles.inputView}>
        <Text style={loginRegisterStyles.inputLabel}>Username</Text>
        <TextInput
          style={loginRegisterStyles.textInput}
          placeholder="Enter username"
        />
      </View>
      <View style={loginRegisterStyles.inputView}>
        <Text style={loginRegisterStyles.inputLabel}>Password</Text>
        <TextInput
          style={loginRegisterStyles.textInput}
          placeholder="Enter password"
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
          style={loginRegisterStyles.touchableOpacityLogin}
          // onPress={onPressLogin} // Will need to tie in method to login when pressed.
        >
          <Text style={loginRegisterStyles.textTouchableOpacity}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={loginRegisterStyles.touchableOpacityGuest}
          onPress={() => router.push("./Gallery")}
        >
          <Text style={loginRegisterStyles.textTouchableOpacity}>
            Continue as guest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
