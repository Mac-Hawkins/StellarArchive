import { Stack } from "expo-router";
import { View } from "react-native";
import Toast from "react-native-toast-message";

// "expo-router" allows us to navigate between screens.

export default function RootLayout() {
  // Stack of screens in the app.
  return (
    <>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Stack>
          <Stack.Screen
            name="Gallery"
            options={{
              headerTitle: "Astronomy Picture of the Day",
              headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
              headerTitleAlign: "center", // This centers the title
              headerBackVisible: false, // Hides the back button on the index screen
              headerStyle: { backgroundColor: "#acacc7" },
              gestureEnabled: true, // Enable swipe gestures
            }}
          />
          {/* names need to match name of file. */}
          <Stack.Screen
            name="Login"
            options={{
              headerTitle: "Login",
              headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
              headerTitleAlign: "center", // This centers the title
              headerBackVisible: false, // Hides the back button on the index screen
              headerStyle: { backgroundColor: "#acacc7" },
            }}
          />
          <Stack.Screen
            name="Register"
            options={{
              headerTitle: "Register",
              headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
              headerTitleAlign: "center", // This centers the title
              headerBackVisible: true, // Hides the back button on the index screen
              headerStyle: { backgroundColor: "#acacc7" },
            }}
          />
        </Stack>
      </View>
      {/* Toast component for showing toast messages across the app. */}
      <Toast />
    </>
  );
}
