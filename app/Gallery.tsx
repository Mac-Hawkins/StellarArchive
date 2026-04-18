import { ApodCard } from "@/src/components/ApodCard";
import { ApodFullScreenModal } from "@/src/components/ApodFullScreenModal";
import { DatePicker } from "@/src/components/DatePicker";
import { ExplanationBottomSheet } from "@/src/components/ExplanationBottomSheet";
import { ExplanationIndicator } from "@/src/components/ExplanationIndicator";
import { AntDesign, Feather, Fontisto, Ionicons } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useIsFocused } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StatusBar, Text, View } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  API_KEY,
  AWS_APODS_ENDPOINT,
  AWS_AUTHORIZATION,
  AWS_BASE_URL,
  AWS_FAVORITES_ENDPOINT,
  AWS_USERS_ENDPOINT,
  SCREEN_WIDTH,
} from "../src/constants/config";
import { useApodStore } from "../src/store/ApodStore";
import { SwipeDirection } from "../src/types/enums/SwipeDirection";
import { ToastType } from "../src/types/enums/ToastType";
import { Apod } from "../src/types/interfaces/Apod";
import {
  createCurrentDate,
  decrementDate,
  formatDateToStr,
  incrementDate,
} from "../src/utils/DateFormatting";
import { showToast } from "../src/utils/ToastMessages";
import GalleryStyles from "./Gallery.styles";

// Constants
export const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // Swipe 30% of screen to trigger navigation.
export const CARD_ANIMATION_DELAY = 2000; // Time to wait before new APOD swipes in. Need time to wait for APOD to load.
export const MAX_APOD_SKIPS = 5; // Number of tries to get the next or prev APOD if current one isn't an image.

// Entry point of application. This is the first screen that users see when they open the app.
export default function Gallery() {
  // Get params from URL. This is used to determine whether the user is logged in or not,
  // which can then be used to conditionally render certain features
  // (e.g., hiding the account icon and showing a toast message if they click on it that they need an account).
  const params = useLocalSearchParams();

  // useEffect is a hook that allows us to fetch data.
  // useState is a hook that allows us to manage state in a state variable that we can then display.

  // States
  const [apod, setApod] = useState<Apod>(); // State variable to store and update the APOD.
  const [showDatePicker, setShowDatePicker] = useState(false); // State variable to control whether the date picker is visible or not.
  const [datePicked, setDatePicked] = useState(new Date()); // State variable to store the date selected from the date picker. Defaults to current date.
  const [isFullScreen, setIsFullScreen] = useState(false); // State variable to track whether the APOD image is in full screen mode or not.
  const closeSheet = useApodStore((state) => state.closeSheet); // getter for close explanation sheet state var.
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(
    params.userId !== undefined,
  );
  const [isApodFavorited, setIsApodFavorited] = useState(false); // Needs to be a state variable so that the component re-renders when the user favorites or un-favorites an APOD to update the color of the star icon.
  const [favoriteId, setFavoriteId] = useState<number | null>(null); // Store the id of the favorite entry for this APOD so we can delete it if the user un-favorites the APOD.
  const [userFavorites, setUserFavorites] = useState<{
    [apodId: number]: number;
  }>({}); // Map of apod_id => favorite_id for quick lookups without API calls
  //const [iconFavoriteColor, setIconFavoriteColor] = useState("white"); // State variable to control the color of the favorite icon based on whether the APOD is favorited or not. I don't think I need this.

  // Determine the color of the favorite icon based on whether the user is logged in and whether the APOD is favorited or not.
  let iconFavoriteColor = !isUserLoggedIn
    ? "gray"
    : isApodFavorited
      ? "yellow"
      : "white"; // If the user is logged in and the APOD is favorited, show a yellow star. If the user is logged in but the APOD isn't favorited, show a white star. If the user isn't logged in, show a gray star to indicate that they need to log in to favorite APODs.

  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Create hooks to swipe direction and current date in stored apod data.
  // Have to use this instead of getState() as that would just do a snapshot in time,
  // and the app wouldn't know to run the use state logic if the var changed.
  let swipeDirection = useApodStore((state) => state.swipeDirection); // getter
  let date = useApodStore((state) => state.currentDate); // getter
  const pastQueries = useApodStore((state) => state.pastQueries);
  const setDate = useApodStore((state) => state.setApodDate); // setter
  const cacheApod = useApodStore((state) => state.cacheApodData);

  console.log("Date parameter from URL:", date); // Debug log to verify the date parameter is being retrieved correctly from the URL.

  // useSharedValue to track the horizontal translation of the swipe gesture.
  // This is used to determine how far the user has swiped left or right,
  // which can be used to trigger navigation between APODs when a certain threshold is reached.
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Hides the status/natification bar to when the image is enlarged make it more immersive.
  // When the user exits full screen mode, show the status bar again.
  useEffect(() => {
    if (isFullScreen) {
      StatusBar.setHidden(true);
    } else {
      StatusBar.setHidden(false);
    }
    return () => StatusBar.setHidden(false);
  }, [isFullScreen]);

  // Update isUserLoggedIn when params change (e.g., when user logs in/out)
  useEffect(() => {
    setIsUserLoggedIn(params.userId !== undefined);
  }, [params.userId]);

  // Fetch user's favorites list once when they log in to avoid repeated API calls
  useEffect(() => {
    if (isUserLoggedIn) {
      fetchUserFavoritesMap();
    } else {
      setUserFavorites({}); // Clear favorites if user logs out
    }
  }, [isUserLoggedIn]);

  // Update favorite status whenever apod or userFavorites changes
  useEffect(() => {
    if (apod) {
      const apodId = apod.id;
      const isFavorited = apodId in userFavorites;
      setIsApodFavorited(isFavorited);
      setFavoriteId(isFavorited ? userFavorites[apodId] : null);
    }
  }, [apod, userFavorites]);

  const onPressAccount = (isUserLoggedIn: boolean) => {
    if (!isUserLoggedIn) {
      router.push("./Login");
    } else {
      router.push({
        pathname: "./UserHome",
        params: { userToken: params.userToken, userId: params.userId },
      });
    }
  };

  const onPressFavorite = async (isUserLoggedIn: boolean) => {
    if (!isUserLoggedIn) {
      showToast("Please log in to favorite APODs!", ToastType.INFO, "center");
    } else if (isApodFavorited) {
      const deleteFavoriteResp = await fetch(
        AWS_BASE_URL +
          `${AWS_USERS_ENDPOINT}/${params.userId}${AWS_FAVORITES_ENDPOINT}/${favoriteId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.userToken}`,
          },
        },
      );

      if (!deleteFavoriteResp.ok) {
        showToast(
          "Error un-favoriting APOD. Please try again later.",
          ToastType.ERROR,
          "center",
        );
      } else {
        showToast(
          "APOD un-favorited successfully!",
          ToastType.SUCCESS,
          "center",
        );
        // Remove from cached favorites
        const newFavorites = { ...userFavorites };
        delete newFavorites[apod?.id ?? -1];
        setUserFavorites(newFavorites);
        console.log(
          "APOD un-favorited successfully, removed from favorites cache.",
        );
      }
    } else {
      const apod_id = apod?.id.toString();

      const postFavoriteResp = await fetch(
        AWS_BASE_URL +
          `${AWS_USERS_ENDPOINT}/${params.userId}${AWS_FAVORITES_ENDPOINT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.userToken}`,
          },
          body: JSON.stringify({
            apod_id,
          }),
        },
      );

      if (!postFavoriteResp.ok) {
        showToast(
          "Error favoriting APOD. Please try again later.",
          ToastType.ERROR,
          "center",
        );
      } else {
        showToast("APOD favorited successfully!", ToastType.SUCCESS, "center");
        const data = await postFavoriteResp.json();
        // Add to cached favorites
        setUserFavorites({
          ...userFavorites,
          [apod?.id ?? -1]: data.favorite_id,
        });
        console.log("favorite added to cache.");
      }
    }
  };

  // This function runs when a date is selected from the date picker element.
  const onDatePicked = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
  ): void => {
    // 1. Hide the picker (important for Android)
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      // Update local state
      setDatePicked(selectedDate);

      let selectedDateStr: string = formatDateToStr(selectedDate);
      console.log("Selected date:", selectedDateStr);

      // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
      setDate(selectedDateStr, SwipeDirection.LEFT);
    }
  };

  // Function to navigate to the previous day's APOD when the user swipes left.
  const navigateToPrevDay = () => {
    // If no APOD is loaded, return early with loading text.
    if (apod == null) {
      console.log("APOD is null, cannot navigate to previous day.");
      return false;
    }

    // Compute the date for the previous day by subtracting one day from the current date. This allows users to swipe left to see the previous day's APOD.
    const prevDay = decrementDate(date);

    // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    setDate(prevDay, SwipeDirection.LEFT);

    translateX.value = withSpring(-SCREEN_WIDTH); // Slide off screen to left (entire screen width).

    return true;
  };

  // Function to navigate to the next day's APOD when the user swipes right.
  const navigateToNextDay = () => {
    // If no APOD is loaded, return early with loading text.
    if (apod == null) {
      console.log("APOD is null, cannot navigate to next day.");
      return false;
    }

    // Compute the date for the next day by adding one day to the current date. This allows users to swipe right to see the next day's APOD.
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const today = createCurrentDate(); // Needed to normalize today's date to midnight for accurate comparison

    // Prevent users from swiping right to navigate to future APODs that haven't been released yet.
    // If the current APOD is today's date, return early and don't navigate to the next day.
    if (nextDay >= today) {
      showToast("No APODs from the future!", ToastType.INFO, "center"); // Show a toast message to inform the user that they can't navigate to future APODs.
      return false;
    }

    translateX.value = withSpring(SCREEN_WIDTH); // Slide off screen to right (entire screen width).

    // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    setDate(nextDay.toISOString().split("T")[0], SwipeDirection.RIGHT);

    return true;
  };

  // Gestures
  const panHorizontal = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Start the gesture after a horizontal movement of 50 pixels to avoid conflicts with vertical gestures.
    .onUpdate((event) => {
      translateX.value = event.translationX; // Update the shared value with the current horizontal translation of the gesture.
    })
    .runOnJS(true)
    .onEnd(() => {
      let wasNavigated = false; // Flag to track if navigation occurred
      // translateX increases when swiping right and decreases when swiping left,
      if (translateX.value > SWIPE_THRESHOLD) {
        // User swiped right past the threshold, navigate to the next day.
        wasNavigated = navigateToNextDay();
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        // User swiped left past the threshold, navigate to the previous day.
        wasNavigated = navigateToPrevDay();
      }
      if (!wasNavigated) {
        // We didn't reach the threshold so snap back to normal position.
        translateX.value = withSpring(0);
      }
    });

  const swipeUp = Gesture.Fling()
    .direction(Directions.UP)
    // Tells the gesture handler to execute the callback on the JavaScript thread instead of the UI thread.
    // This gives full access to the Date as the UI thread doesn't have a full implementation of it.
    .runOnJS(true)
    .onEnd(() => {
      // Set the state of useApodStore to open. This will allow us to open the bottom sheet, even if it was closed previously.
      useApodStore.getState().openSheet();

      console.log("Swiped up to open bottom sheet with explanation.");
    });

  // Combine gestures
  const gestures = Gesture.Simultaneous(panHorizontal, swipeUp);

  // Animation to make the screen tilt when the user starts swiping horizontally.
  const animatedCardStyle = useAnimatedStyle(() => {
    // Tilt the card up to 10 degrees as it moves
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-10, 0, 10],
    );

    return {
      transform: [{ translateX: translateX.value }, { rotate: `${rotate}deg` }],
    };
  });

  // Returns true if this is the top screen in the stack, false if it's buried under another screen.
  // This is important to determine whether we should open or close the bottom sheet when the isSheetOpen state changes,
  // as we only want to move the sheet if this screen is currently focused.
  const isFocused = useIsFocused();

  // Get the isSheetOpen state from ApodStore to determine whether the bottom sheet should be open or closed.
  const isSheetOpen = useApodStore((state) => state.isSheetOpen);

  // useEffect that runs everytime isSheetOpen changes.
  useEffect(() => {
    // Only run the following if this screen is currently focused.
    if (!isFocused) return;

    // When the isSheetOpen state changes, either expand or close the bottom sheet based on the new state.
    // This ensures that the bottom sheet's visibility is in sync with the state in ApodStore.
    if (isSheetOpen) {
      console.log("Opening bottom sheet.");
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isSheetOpen, isFocused]); // Re-run the effect when the date or sheet state changes (i.e., when user swipes to a different day).

  // Use effect for moving the screen left and right a little bit to indicate that user's can swipe to a new APOD.
  useEffect(() => {
    let currentDateStr = formatDateToStr(new Date());
    // Only run the animation if we are looking at the APOD for the current date (basically home screen).
    if (currentDateStr === date) {
      // Wait a tiny bit after mount so the user sees the photo first
      const timeout = setTimeout(() => {
        // withSpring needs to be nested in each other as they are async and therefore non-blocking.
        // 1. Peek Left
        translateX.value = withSpring(-40, {}, () => {
          // 2. Snap back to Center
          translateX.value = withSpring(0);
        });
      }, CARD_ANIMATION_DELAY); // Wait a bit after the APOD loads to start the peek animation

      return () => clearTimeout(timeout);
    }
  }, [date]); // Re-runs briefly every time a new APOD loads

  // useEffect for fetching the next/prev APOD. Runs everytime date changes.
  useEffect(() => {
    if (date === "") {
      date = formatDateToStr(new Date());
      console.log("Date was empty, setting to current date:", date);
    }

    if (pastQueries[date]) {
      console.log("APOD for this date found in cache, using cached data.");
      // Swipe card in from opposite direction of swipe.
      translateX.value =
        swipeDirection === SwipeDirection.RIGHT ? -SCREEN_WIDTH : SCREEN_WIDTH;
      setApod(pastQueries[date]);
      // Place card at 0 position.
      translateX.value = withSpring(0);

      return;
    } else {
      // Use API to fetch astronomy images from NASA API when the component mounts.
      fetchApods();
    }
  }, [date]); // Only runs when the date changes

  // Use effect for moving the carrot up from the bottom to indicate that users can swipe up.
  useEffect(() => {
    // Start the bounce animation when component mounts
    translateY.value = withRepeat(
      withTiming(-20, { duration: 1500 }), // Move up 10px over 800ms
      -1, // Repeat infinitely
      true, // Reverse (bounce back down)
    );
  }, []); // Only start when the component originally mounts.

  const fetchApodsFromBackendOrNasa = async (date: string) => {
    let data = null;
    try {
      let apodWasFetchedFromBackend = false; // Flag to track if we successfully fetched the APOD from the backend cache.

      // Try getting the APOD first from the backend to see if we have it cached there from a previous fetch. If not, then fetch from the NASA API.
      let apodResponse = await fetch(
        AWS_BASE_URL + `${AWS_APODS_ENDPOINT}` + `/${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${AWS_AUTHORIZATION}`,
          },
        },
      );

      if (!apodResponse.ok) {
        console.log("APOD not found in backend cache, fetching from NASA API.");
        // Get the APOD based on the date passed as a parameter in the URL. If no date is passed, default to today's APOD.
        apodResponse = await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
        );
      } else {
        apodWasFetchedFromBackend = true;
      }

      // Should retrieve the APOD in JSON.
      data = await apodResponse.json();

      // If we successfully fetched the APOD from the NASA API (i.e., it wasn't cached on the backend),
      // then cache it on the backend for future use.
      if (!apodWasFetchedFromBackend) {
        let { title, url, explanation } = data;
        let image_url = url; // Rename url to image_url for clarity when caching on the backend.
        data["image_url"] = url; // Add image_url field to the data object for caching on the backend.
        // Cache the APOD on the backend.
        await fetch(AWS_BASE_URL + `${AWS_APODS_ENDPOINT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${AWS_AUTHORIZATION}`,
          },
          body: JSON.stringify({
            date,
            title,
            image_url,
            explanation,
          }),
        });

        // Retrieve the APOD again from the backend to get the id added by the backend,
        // and to ensure consistency in the data structure we are using throughout the app.
        // TODO: We could optimize this by having the backend return the cached APOD data in the response when we cache it, so we don't have to make a second fetch request to get the same data right after caching it.
        apodResponse = await fetch(
          AWS_BASE_URL + `${AWS_APODS_ENDPOINT}` + `/${date}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `${AWS_AUTHORIZATION}`,
            },
          },
        );

        // Should retrieve the APOD in JSON.
        data = await apodResponse.json();
      } else {
        data = data.message[0];
        const dateOnly = data.date.slice(0, 10);
        data.date = dateOnly; // Format the date to only include the date portion (YYYY-MM-DD) for consistency and display purposes.
      }
    } catch (error) {
      translateX.value = 0;
      console.error("Error fetching data");
      showToast(
        "Not able to retrieve image data! Please try again later.",
        ToastType.ERROR,
        "center",
      );
    }
    return data;
  };

  // Fetch all user favorites once and build a map for O(1) lookup

  const fetchUserFavoritesMap = async () => {
    try {
      const getFavoriteResp = await fetch(
        AWS_BASE_URL +
          `${AWS_USERS_ENDPOINT}/${params.userId}${AWS_FAVORITES_ENDPOINT}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.userToken}`,
          },
        },
      );

      const data = await getFavoriteResp.json();

      // Parse the favorites data and build a map of apod_id => favorite_id
      const favoritesMap: { [apodId: number]: number } = {};
      if (data.message) {
        try {
          // Loop through the favorites data and populate the favoritesMap with apod_id as the key and favorite_id as the value for O(1) lookups later when determining if an APOD is favorited.
          data.message.forEach((fav: { apod_id: number; id: number }) => {
            favoritesMap[fav.apod_id] = fav.id;
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

  const fetchApods = async () => {
    let data: any = await fetchApodsFromBackendOrNasa(date);

    try {
      // Make a loop to skip any APODs that aren't images (e.g., videos) and fetch the next one until we find an
      // image or reach a maximum number of tries to avoid infinite loops in case of unexpected API behavior.
      let i = 0;
      while (
        data["image_url"].includes(".jpg") === false &&
        i < MAX_APOD_SKIPS
      ) {
        showToast(
          "Media type is not an image, skipping to the next one.",
          ToastType.INFO,
          "center",
        );
        console.log("Media type is not an image, skipping ahead.");
        console.log("swipeDirection:", swipeDirection);

        // If the user was navigating to the next day,
        // keep going forward one day until we find an image.
        // Otherwise keep going back.
        date =
          swipeDirection === SwipeDirection.RIGHT
            ? incrementDate(date)
            : decrementDate(date);

        data = await fetchApodsFromBackendOrNasa(date);
        i++;
      }

      // 1. Instantly move the card to the OTHER side (invisible)
      // If they swiped Right, we want the new card to slide in from the Left
      translateX.value =
        swipeDirection === SwipeDirection.RIGHT ? -SCREEN_WIDTH : SCREEN_WIDTH;

      // 2. Set the new image data
      // Update the state variable with the fetched APOD data.
      console.log("Fetched APOD data:", data);
      setApod(data);

      // 3. Smoothly slide the new card into the center
      translateX.value = withSpring(0);

      // Cache the fetched APOD in the pastQueries dictionary with the date as the key.
      pastQueries[date] = data;
      setDate(date, swipeDirection); // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    } catch (error) {
      translateX.value = 0;
      console.error("Error in processing APODs.");
    }
  };

  // Rendering
  return (
    // GestureDetector must be wrapped by GestureHandlerRootView.
    <GestureHandlerRootView>
      {/* Makes the entire screen black, including the area behind the status bar. */}
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <View style={GalleryStyles.pressableViewStyle}>
          <Pressable onPress={() => onPressAccount(isUserLoggedIn)}>
            <Ionicons name="person-circle-outline" size={32} color="white" />
            <Text style={GalleryStyles.pressableTextStyle}>Account</Text>
          </Pressable>
          {/* </Pressable> */}
          <Pressable>
            <Ionicons name="search-outline" size={32} color="white" />
            <Text style={GalleryStyles.pressableTextStyle}>Search</Text>
          </Pressable>
          <Pressable onPress={() => setShowDatePicker(true)}>
            <Fontisto name="date" size={32} color="white" />

            {/* The component for picking the date to go to. */}
            <DatePicker
              showDatePicker={showDatePicker}
              datePicked={datePicked}
              setShowDatePicker={() => setShowDatePicker(true)}
              onDatePicked={onDatePicked}
            />
            <Text style={GalleryStyles.pressableTextStyle}>Date</Text>
          </Pressable>
          <Pressable>
            <AntDesign name="comment" size={32} color="white" />
            <Text style={GalleryStyles.pressableTextStyle}>Comments</Text>
          </Pressable>
          <Pressable onPress={() => onPressFavorite(isUserLoggedIn)}>
            <Feather name="star" size={32} color={iconFavoriteColor} />
            <Text style={GalleryStyles.pressableTextStyle}>
              {isApodFavorited ? "Unfavorite" : "Favorite"}
            </Text>
          </Pressable>
        </View>

        {/* // Wrap in GestureDetector to handle swipe gestures for navigation between APODs. */}
        <GestureDetector gesture={gestures}>
          <Animated.View style={[{ flex: 1 }, animatedCardStyle]}>
            {/* The component for the APOD title, image, and date. */}
            <ApodCard
              apod={apod}
              onOpen={() => setIsFullScreen(true)}
            ></ApodCard>
          </Animated.View>
        </GestureDetector>

        {/* Modal to display the APOD image in full screen when the user taps on it. */}
        <ApodFullScreenModal
          apod={apod}
          isFullScreen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
        ></ApodFullScreenModal>

        <Animated.View style={{ transform: [{ translateY }] }}>
          <ExplanationIndicator />
        </Animated.View>

        {/* The component for the APOD explanation, which can be dragged up from bottom. */}
        <ExplanationBottomSheet
          apod={apod}
          bottomSheetRef={bottomSheetRef}
          onCloseSheet={closeSheet}
        ></ExplanationBottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}
