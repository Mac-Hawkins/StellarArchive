import { Text, View } from "react-native";

// Entry point of application. This is the first screen that users see when they open the app.
export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Hello World! This is a page for AstroMobileApp.</Text>
    </View>
  );
}
