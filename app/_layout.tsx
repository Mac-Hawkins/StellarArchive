import { Stack } from "expo-router";

// "expo-router" allows us to navigate between screens.

export default function RootLayout() {
  // Stack of screens in the app.
  return (
    <Stack
      screenOptions={{
        gestureEnabled: true, // Enable swipe gestures
      }}
    >
      {/* names need to match name of file. */}
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Astronomy Picture of the Day",
          headerTitleAlign: "center", // This centers the title
          headerStyle: { backgroundColor: "#acacc7" },
        }}
      />

      {/* headerBackButtonDisplayMode:minimal  */}
      <Stack.Screen
        name="apod_explanation"
        options={{
          headerTitle: "Explanation",
          headerTitleAlign: "center", // This centers the title
          headerBackButtonDisplayMode: "minimal", // Removes text next to back arrow.
          headerStyle: { backgroundColor: "#6679cc" },
        }}
      />
    </Stack>
  );
}
