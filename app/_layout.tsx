import { Stack } from "expo-router";

// "expo-router" allows us to navigate between screens.

export default function RootLayout() {
  // Stack of screens in the app.
  return (
    <Stack>
      {/* names need to match name of file. */}
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Astronomy Picture of the Day",
          headerTitleStyle: { fontSize: 24, fontWeight: "bold" },
          headerTitleAlign: "center", // This centers the title
          headerBackVisible: false, // Hides the back button on the index screen
          headerStyle: { backgroundColor: "#acacc7" },
          gestureEnabled: true, // Enable swipe gestures
        }}
      />
    </Stack>
  );
}
