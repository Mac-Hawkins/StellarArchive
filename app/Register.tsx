import { useRouter } from "expo-router";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import loginRegisterStyles from "./LoginRegister.styles";

// Entry point of application. This is the first screen that users see when they open the app.
export default function LoginScreen() {
  const router = useRouter();
  // Rendering

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
        <Text style={loginRegisterStyles.inputLabel}>New Password</Text>
        <TextInput
          style={loginRegisterStyles.textInput}
          placeholder="Enter new password"
          secureTextEntry={true}
        />
      </View>
      <View style={loginRegisterStyles.inputView}>
        <Text style={loginRegisterStyles.inputLabel}>Confirm New Password</Text>
        <TextInput
          style={loginRegisterStyles.textInput}
          placeholder="Confirm new password"
          secureTextEntry={true}
        />
      </View>

      <View style={loginRegisterStyles.viewTouchableOpacity}>
        <TouchableOpacity
          style={loginRegisterStyles.touchableOpacityLogin}
          // onPress={onPress} // Will need to tie in method to register when pressed.
        >
          <Text style={loginRegisterStyles.textTouchableOpacity}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
