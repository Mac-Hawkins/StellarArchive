import { getFavorites } from "@/src/services/favorites";
import { Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AccountStyles from "./Account.styles";

// Entry point of application. This is the first screen that users see when they open the app.
export default function LoginScreen() {
  const params = useLocalSearchParams();

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(
    params.userId !== undefined, // If we got to this screen then this should definitely be true.
  );

  // useStates to track which tab is selected in the user home screen.
  // Only one can be selected at a time, and the selected tab will be highlighted in the UI.
  const [favoritesTabSelected, setFavoritesTabSelected] = useState(true);
  const [areFavoritesShown, setAreFavoritesShown] = useState(false); //State variable to store and update the status of the favorites being displayed.
  const [commentsTabSelected, setCommentsTabSelected] = useState(false);
  const [backToGalleryTabSelected, setBackToGalleryTabSelected] =
    useState(false);
  const [signOutTabSelected, setSignOutTabSelected] = useState(false);

  // A defined list of favorites will be sent from the gallery, but an undefined one will be sent on first login.
  // So if a valid user favorites list are passed as params, then use that.
  // Otherwise, retrieve the list of the user's favorites from the back end.
  const [userFavorites, setUserFavorites] = useState<
    { [apodId: number]: any } | undefined
  >(
    params.userFavorites !== undefined
      ? JSON.parse(params.userFavorites as string)
      : undefined,
  ); // Map of apod_id => favorite_id for quick lookups without API calls

  // Fetch user's favorites list once when they log in to avoid repeated API calls
  useEffect(() => {
    if (isUserLoggedIn) {
      setAreFavoritesShown(false);
      fetchUserFavoritesMap();
      setAreFavoritesShown(true);
    } else {
      setUserFavorites({}); // Clear favorites if user logs out
    }
  }, [isUserLoggedIn]);

  // Fetch all user favorites once and build a map for O(1) lookup
  const fetchUserFavoritesMap = async () => {
    try {
      const getFavoriteResp = await getFavorites(
        params.userId,
        params.userToken,
      );

      const data = await getFavoriteResp.json();

      // Parse the favorites data and build a map of apod_id => favorite_id
      const favoritesMap: { [apodId: number]: any } = {};
      if (data.message) {
        try {
          // Loop through the favorites data and populate the favoritesMap with apod_id as the key and favorite_id as the value for O(1) lookups later when determining if an APOD is favorited.
          data.message.forEach((fav: { apod_id: number; id: any }) => {
            favoritesMap[fav.apod_id] = fav;
          });
        } catch (e) {
          console.error("Error parsing favorites data.");
        }
      }

      setUserFavorites(favoritesMap);
    } catch (error) {
      console.error("Error fetching user favorites.");
    }
  };

  const OnPressFavoritesIcon = () => {
    setBackToGalleryTabSelected(false);
    setCommentsTabSelected(false);
    setSignOutTabSelected(false);
    setFavoritesTabSelected(true);
  };

  const onPressSignOut = () => {
    setBackToGalleryTabSelected(false);
    setFavoritesTabSelected(false);
    setCommentsTabSelected(false);
    setSignOutTabSelected(true);
    Alert.alert(
      "Are you sure you want to sign out?",
      "Do you want to continue?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            setUserFavorites({}); // Clear favorites if user logs out
            // Just return to Gallery with no user token.
            router.push({
              pathname: "./Gallery",
              params: { userId: undefined },
            });
          },
        },
      ],
    );
  };

  const onPressFavoriteItem = (item: any) => {
    console.log("Pressed favorite item with APOD ID:", item.fav);

    router.push({
      pathname: "./Gallery",
      params: {
        userToken: params.userToken,
        userId: params.userId,
        userFavorites: JSON.stringify(userFavorites),
        selectedApod: JSON.stringify(item.fav), // Pass the selected APOD data to the Gallery screen to display it in the bottom sheet.
      },
    });
  };

  const onPressBackToGallery = () => {
    setFavoritesTabSelected(false);
    setCommentsTabSelected(false);
    setSignOutTabSelected(false);
    setBackToGalleryTabSelected(true);
    // Pass the user token just to be safe.
    router.push({
      pathname: "./Gallery",
      params: {
        userToken: params.userToken,
        userId: params.userId,
        userFavorites: JSON.stringify(userFavorites),
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View style={AccountStyles.pressableViewStyle}>
        <Pressable
          onPress={() => onPressBackToGallery()}
          style={{
            alignItems: "center",
            backgroundColor: backToGalleryTabSelected ? "gray" : "transparent",
            borderRadius: 5,
          }}
        >
          <Entypo name="image" size={32} color="white" />
          <Text style={AccountStyles.pressableTextStyle}>Back to Gallery</Text>
        </Pressable>
        <Pressable
          onPress={() => OnPressFavoritesIcon()}
          style={{
            alignItems: "center",
            backgroundColor: favoritesTabSelected ? "gray" : "transparent",
            borderRadius: 5,
          }}
        >
          <Ionicons name="star-outline" size={32} color="white" />
          <Text style={AccountStyles.pressableTextStyle}>Your Favorites</Text>
        </Pressable>

        <Pressable
          onPress={() => onPressSignOut()}
          style={{
            alignItems: "center",
            backgroundColor: signOutTabSelected ? "gray" : "transparent",
            borderRadius: 5,
          }}
        >
          <FontAwesome name="sign-out" size={32} color="white" />
          <Text style={AccountStyles.pressableTextStyle}>Sign Out</Text>
        </Pressable>
      </View>
      <View style={AccountStyles.viewLoading}>
        {!areFavoritesShown && (
          <Text style={AccountStyles.textLoading}>Loading...</Text>
        )}
      </View>

      {/* Show the list of their favorites */}
      <View style={{ flex: 1 }}>
        {favoritesTabSelected && (
          <FlatList
            data={
              userFavorites
                ? Object.entries(userFavorites).map(([apodId, fav]) => ({
                    apodId,
                    fav,
                  }))
                : []
            }
            keyExtractor={(item) => item.apodId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onPressFavoriteItem(item)}>
                <Text style={AccountStyles.itemText}>{item.fav.title}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
