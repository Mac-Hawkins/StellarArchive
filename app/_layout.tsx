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
          headerBackVisible: false, // Hides the back button on the index screen
          headerStyle: { backgroundColor: "#acacc7" },
        }}
      />

      <Stack.Screen
        name="apod_explanation"
        options={{
          title: "Explanation",
          headerShown: false, // Hide native header to use a custom one (gorhom bottom-sheet).
          headerTitleAlign: "center", // This centers the title
          headerBackButtonDisplayMode: "minimal", // Removes back arrow.
          headerStyle: { backgroundColor: "#6679cc" },
          presentation: "transparentModal", // This makes the screen appear as a modal, sliding up from the bottom.
        }}
      />
    </Stack>
  );
}
