import { AntDesign, Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Alert, Pressable, Text, View } from "react-native";
import UserHomeStyles from "./UserHome.styles";

// Entry point of application. This is the first screen that users see when they open the app.
export default function LoginScreen() {
  const params = useLocalSearchParams();
  const isUserLoggedIn = params.userToken !== undefined; // If there is a userToken param, we can assume the user is logged in.

  const onPressSignOut = () => {
    Alert.alert(
      "Are you sure you want to sign out?",
      "Do you want to continue?",
      [
        {
          text: "No",
          style: "cancel",
          onPress: () => console.log("No pressed"),
        },
        {
          text: "Yes",
          onPress: () =>
            // Just return to Gallery with no user token.
            router.push({
              pathname: "./Gallery",
              params: { userToken: undefined },
            }),
        },
      ],
    );
  };

  const onPressBackToGallery = () => {
    // Pass the user token just to be safe.
    router.push({
      pathname: "./Gallery",
      params: { userToken: params.userToken },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={UserHomeStyles.pressableViewStyle}>
        <Pressable
          onPress={() => onPressSignOut()}
          style={UserHomeStyles.pressableStyle}
        >
          <FontAwesome name="sign-out" size={32} color="white" />
          <Text style={UserHomeStyles.pressableTextStyle}>Sign Out</Text>
        </Pressable>
        <Pressable
          onPress={() => console.log("Not implemented yet...")}
          style={UserHomeStyles.pressableStyle}
        >
          <AntDesign name="comment" size={32} color="white" />
          <Text style={UserHomeStyles.pressableTextStyle}>Your Comments</Text>
        </Pressable>
        <Pressable
          onPress={() => console.log("Not implemented yet...")}
          style={UserHomeStyles.pressableStyle}
        >
          <Ionicons name="star-outline" size={32} color="white" />
          <Text style={UserHomeStyles.pressableTextStyle}>Your Favorites</Text>
        </Pressable>
        <Pressable
          onPress={() => onPressBackToGallery()}
          style={UserHomeStyles.pressableStyle}
        >
          <Entypo name="image" size={32} color="white" />
          <Text style={UserHomeStyles.pressableTextStyle}>Back to Gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}
