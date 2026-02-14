import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Button,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
  withSpring,
} from "react-native-reanimated";
import Toast from "react-native-toast-message";
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
import { styles } from "./index.styles";

// Constants
const API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY; // Retrieve NASA_API_KEY from .env file.
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3; // Swipe 30% of screen to trigger navigation.
const CARD_ANIMATION_DELAY = 2000; // Time to wait before new APOD swipes in. Need time to wait for APOD to load.
const MAX_APOD_SKIPS = 5; // Number of tries to get the next or prev APOD if current one isn't an image.

// Entry point of application. This is the first screen that users see when they open the app.
export default function Index() {
  // useEffect is a hook that allows us to fetch data.
  // useState is a hook that allows us to manage state in a state variable that we can then display.

  // States
  const [apod, setApod] = useState<Apod>(); // State variable to store and update the APOD.
  const [showPicker, setShowPicker] = useState(false); // State variable to control whether the date picker is visible or not.
  const [datePicked, setDatePicked] = useState(new Date()); // State variable to store the date selected from the date picker. Defaults to current date.
  const [isFullScreen, setIsFullScreen] = useState(false); // State variable to track whether the APOD image is in full screen mode or not.
  const closeSheet = useApodStore((state) => state.closeSheet); // getter for close explanation sheet state var.

  // Refs
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Create hooks to swipe direction and current date in stored apod data.
  // Have to use this instead of getState() as that would just do a snapshot in time,
  // and the app wouldn't know to runt he use state logic if the var changed.
  let swipeDirection = useApodStore((state) => state.swipeDirection); // getter
  let date = useApodStore((state) => state.currentDate); // getter
  const pastQueries = useApodStore((state) => state.pastQueries);
  const setDate = useApodStore((state) => state.setApodDate); // setter

  console.log("Date parameter from URL:", date); // Debug log to verify the date parameter is being retrieved correctly from the URL.

  // useSharedValue to track the horizontal translation of the swipe gesture.
  // This is used to determine how far the user has swiped left or right,
  // which can be used to trigger navigation between APODs when a certain threshold is reached.
  const translateX = useSharedValue(0);

  // General method for showing a toast message at the bottom of the screen.
  const showToast = (message: string, type: string) => {
    Toast.show({
      type: "info",
      text1: message,
      position: "bottom",
    });
  };

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

  // This function runs when a date is selected from the date picker element.
  const onDateSelected = (event: any, selectedDate: Date | undefined): void => {
    // 1. Hide the picker (important for Android)
    setShowPicker(false);
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
      showToast("No APODs from the future!", ToastType.INFO); // Show a toast message to inform the user that they can't navigate to future APODs.
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

  // useEffect that runs everytime date changes.
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

  async function fetchApods() {
    try {
      // Get the APOD based on the date passed as a parameter in the URL. If no date is passed, default to today's APOD.
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
      );

      // Should retrieve the APOD in JSON.
      let data = await response.json();

      // Make a loop to skiip any APODs that aren't images (e.g., videos) and fetch the next one until we find an
      // image or reach a maximum number of tries to avoid infinite loops in case of unexpected API behavior.
      let i = 0;
      while (data.media_type !== "image" && i < MAX_APOD_SKIPS) {
        console.log("Media type is not an image, skipping ahead.");

        // If the user was navigating to the next day,
        // keep going forward one day until we find an image.
        // Otherwise keep going back.
        date =
          swipeDirection === SwipeDirection.RIGHT
            ? incrementDate(date)
            : decrementDate(date);

        // Fetch the APOD with the new date.
        const nextResponse = await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
        );
        data = await nextResponse.json();
        i++;
      }

      // Debug log for testing purposes.
      console.log("fetchApods", data);

      // 1. Instantly move the card to the OTHER side (invisible)
      // If they swiped Right, we want the new card to slide in from the Left
      translateX.value =
        swipeDirection === SwipeDirection.RIGHT ? -SCREEN_WIDTH : SCREEN_WIDTH;

      // 2. Set the new image data
      // Update the state variable with the fetched APOD data.
      setApod(data);

      // 3. Smoothly slide the new card into the center
      translateX.value = withSpring(0);

      // Cache the fetched APOD in the pastQueries dictionary with the date as the key.
      pastQueries[date] = data;
      setDate(date, swipeDirection); // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    } catch (error) {
      translateX.value = 0;
      console.error("Error fetching data:", error);
      showToast(
        "No able to retrieve image data! Please try again later.",
        ToastType.ERROR,
      );
    }
  }

  // Rendering
  return (
    // GestureDetector must be wrapped by GestureHandlerRootView.
    <GestureHandlerRootView>
      <View>
        <Button title="Select a Date" onPress={() => setShowPicker(true)} />

        {showPicker && (
          <DateTimePicker
            value={datePicked}
            mode="date"
            display="default"
            onChange={onDateSelected}
            minimumDate={new Date("1995-06-16")} // APOD started on June 16, 1995, so set that as the minimum date.
            maximumDate={createCurrentDate()} // Prevent selecting future dates
          />
        )}
      </View>
      {/* // Wrap in GestureDetector to handle swipe gestures for navigation between APODs. */}
      <GestureDetector gesture={gestures}>
        <Animated.View style={[{ flex: 1 }, animatedCardStyle]}>
          <View style={styles.containerApodView}>
            {/* The title of the APOD image */}
            <View style={{ alignItems: "center", paddingTop: 30 }}>
              <Text style={styles.textApodTitle}>{apod?.title}</Text>
            </View>

            {/* APOD image (centered) */}
            <View style={styles.containerImgView}>
              <TouchableWithoutFeedback onPress={() => setIsFullScreen(true)}>
                <Image
                  style={styles.imageApodNormal}
                  source={{ uri: apod?.url }}
                />
              </TouchableWithoutFeedback>
            </View>

            {/* The date of the APOD image */}
            <View style={{ alignItems: "center", paddingBottom: 40 }}>
              <Text style={styles.textDate}>{apod?.date}</Text>
            </View>
            <Toast />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Modal to display the APOD image in full screen when the user taps on it. */}
      <Modal visible={isFullScreen} statusBarTranslucent={true}>
        <TouchableWithoutFeedback onPress={() => setIsFullScreen(false)}>
          <View style={styles.viewImageFull}>
            <Image style={styles.imageFull} source={{ uri: apod?.url }} />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Used a BottomSheet to make it a little more obvious that it can be dragged and swiped away. */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enablePanDownToClose={true} // Allows swiping away the bottom sheet by swiping down.
        snapPoints={["25%", "80%"]}
        onClose={closeSheet} // When the bottom sheet is closed, call the closeSheet function to update the state in ApodStore.
      >
        {/* Used a BottomSheetScrollView so I could have a title */}
        <BottomSheetScrollView>
          {/* Header */}
          <View>
            <Text style={styles.textExplanationTitle}>Explanation</Text>

            {/* Display the explanation of the APOD, which is passed as a parameter. */}
            <Text style={styles.textExplanation}>{apod?.explanation}</Text>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
