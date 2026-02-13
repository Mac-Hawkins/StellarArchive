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
import { useApodStore } from "./store/ApodStore.js";

// useEffect is a hook that allows us to fetch data.
// useState is a hook that allows us to manage state in a state variable that we can then display.

// Interface to represent the Astronomy Picture of the Day (APOD) data structure returned by the NASA API.
interface Apod {
  date: string;
  explanation: string;
  media_type: string;
  service_version: string;
  title: string;
  url: string;
}

// Retrieve NASA_API_KEY from .env file.
const API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY;

// Get the screen dimenstions to use for styling the APOD image.
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

// Entry point of application. This is the first screen that users see when they open the app.
export default function Index() {
  // apods being the APOD itself, and setApod being the function to update the state variable APOD.
  const [apod, setApod] = useState<Apod>(); // State variable to store the fetched APOD.
  const [showPicker, setShowPicker] = useState(false); // State variable to control whether the date picker is visible or not.
  const [datePicked, setDatePicked] = useState(new Date()); // State variable to store the date selected from the date picker. Defaults to current date.
  const [isFullScreen, setIsFullScreen] = useState(false); // State variable to track whether the APOD image is in full screen mode or not.

  const closeSheet = useApodStore((state) => state.closeSheet);
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
  const showToast = (message: string) => {
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
      console.log("Selected date:", selectedDate.toISOString().split("T")[0]);

      selectedDate.setHours(0, 0, 0, 0); // Normalize the selected date to midnight to avoid timezone issues.
      let selectedDateStr: string = selectedDate.toISOString().split("T")[0];

      // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
      setDate(selectedDateStr, "prev");
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
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);

    // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    setDate(prevDay.toISOString().split("T")[0], "prev");

    translateX.value = withSpring(-screenWidth); // Slide off screen to left (entire screen width).

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

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Needed to normalize today's date to midnight for accurate comparison

    // Prevent users from swiping right to navigate to future APODs that haven't been released yet.
    // If the current APOD is today's date, return early and don't navigate to the next day.
    if (nextDay >= today) {
      showToast("No APODs from the future!"); // Show a toast message to inform the user that they can't navigate to future APODs.
      return false;
    }

    translateX.value = withSpring(screenWidth); // Slide off screen to right (entire screen width).

    // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    setDate(nextDay.toISOString().split("T")[0], "next");

    return true;
  };

  const panHorizontal = Gesture.Pan()
    .activeOffsetX([-20, 20]) // Start the gesture after a horizontal movement of 50 pixels to avoid conflicts with vertical gestures.
    .onUpdate((event) => {
      translateX.value = event.translationX; // Update the shared value with the current horizontal translation of the gesture.
    })
    .runOnJS(true)
    .onEnd(() => {
      let wasNavigated = false; // Flag to track if navigation occurred
      const threshold = screenWidth * 0.3; // Swipe 30% of screen to trigger navigation.
      // translateX increases when swiping right and decreases when swiping left,
      // so we check if it's greater than the positive threshold for right swipe
      // and less than the negative threshold for left swipe.
      if (translateX.value > threshold) {
        console.log("Swiped right to navigate to next day.", translateX.value);
        // User swiped right past the threshold, navigate to the next day.
        wasNavigated = navigateToNextDay();
      } else if (translateX.value < -threshold) {
        console.log(
          "Swiped left to navigate to previous day.",
          translateX.value,
        );
        // User swiped left past the threshold, navigate to the previous day.
        wasNavigated = navigateToPrevDay();
      }
      if (!wasNavigated) {
        console.log(
          "Swipe did not reach threshold, snapping back to original position.",
          translateX.value,
        );
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
      [-screenWidth, 0, screenWidth],
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
      let tempDate = new Date();
      tempDate.setHours(0, 0, 0, 0);
      date = tempDate.toISOString().split("T")[0];
      console.log("Date was empty, set to current date:", date);
      //return; // The store update will trigger this useEffect to run again with the correct date.
    }

    if (pastQueries[date]) {
      console.log("APOD for this date found in cache, using cached data.");
      translateX.value = swipeDirection === "next" ? -screenWidth : screenWidth;
      setApod(pastQueries[date]);
      translateX.value = withSpring(0);

      return;
    } else {
      // Use API to fetch astronomy images from NASA API when the component mounts.
      fetchApods();
    }
  }, [date]); // Only runs when the date changes

  // Use effect for moving the screen left and right a little bit to indicate that user's can swipe to a new APOD.
  useEffect(() => {
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    let currentDateStr = currentDate.toISOString().split("T")[0];
    // Only run the animation if we are looking at the APOD for the current date (basically home screen).
    if (currentDateStr === date) {
      // Wait a tiny bit after mount so the user sees the photo first
      const timeout = setTimeout(() => {
        // withSpring needs to be nested in each other as they are async and therefore non-blocking.
        // 1. Peek Left
        translateX.value = withSpring(-40, {}, () => {
          // 3. Snap back to Center
          translateX.value = withSpring(0);
        });
      }, 2000); // Wait a bit after the APOD loads to start the peek animation

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
      let maxTries = 5;
      let i = 0;
      while (data.media_type !== "image" && i < maxTries) {
        console.log("Media type is not an image, skipping ahead.");

        if (swipeDirection === "prev") {
          // If the user was navigating to the previous day, keep going back one day until we find an image.
          const prevDay = new Date(date);
          prevDay.setDate(prevDay.getDate() - 1);
          date = prevDay.toISOString().split("T")[0];
        } else if (swipeDirection === "next") {
          // If the user was navigating to the next day, keep going forward one day until we find an image.
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);
          date = nextDay.toISOString().split("T")[0];
        }

        // Fetch the APOD with the new date.
        const nextResponse = await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
        );
        data = await nextResponse.json();
        i++;
      }

      // Debug log for tesing purposes.
      console.log("fetchApods", data);

      // 1. Instantly move the card to the OTHER side (invisible)
      // If they swiped Right, we want the new card to slide in from the Left
      translateX.value = swipeDirection === "next" ? -screenWidth : screenWidth;

      // 2. Set the new image data
      // Update the state variable with the fetched APOD data.
      setApod(data);

      // 3. Smoothly slide the new card into the center
      translateX.value = withSpring(0);

      // Cache the fetched APOD in the pastQueries dictionary with the date as the key.
      pastQueries[date] = data;
      console.log(
        "About to update store apod date and swipe:",
        date,
        swipeDirection,
      );
      setDate(date, swipeDirection); // Update the current date and swipe direction in ApodStore so that the next screen can fetch the correct APOD based on the date and direction.
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

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
            maximumDate={new Date()} // Prevent selecting future dates
          />
        )}
      </View>
      {/* // Wrap in GestureDetector to handle swipe gestures for navigation between APODs. */}
      <GestureDetector gesture={gestures}>
        <Animated.View style={[{ flex: 1 }, animatedCardStyle]}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View style={{ alignItems: "center", paddingTop: 30 }}>
              {/* The title of the APOD image */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                {apod?.title}
              </Text>
            </View>

            {/* APOD image (centered) */}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <TouchableWithoutFeedback onPress={() => setIsFullScreen(true)}>
                {/* The APOD image itself. resizeMode: "contain" ensures the image fits within the view without stretching or getting cut off. */}
                <Image
                  style={{
                    width: screenWidth * 0.9,
                    height: screenHeight * 0.6,
                    resizeMode: "contain",
                  }}
                  source={{ uri: apod?.url }}
                />
              </TouchableWithoutFeedback>
            </View>

            <View style={{ alignItems: "center", paddingBottom: 40 }}>
              {/* The date of the APOD image */}
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "100%",
                }}
              >
                {apod?.date}
              </Text>
            </View>
            <Toast />
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Modal to display the APOD image in full screen when the user taps on it. */}
      <Modal visible={isFullScreen} statusBarTranslucent={true}>
        <TouchableWithoutFeedback onPress={() => setIsFullScreen(false)}>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgb(0, 0, 0)",
            }}
          >
            <Image
              style={{
                height: "99%",
                width: "99%",
                resizeMode: "contain",
              }}
              source={{ uri: apod?.url }}
            />
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
            <Text
              style={{
                backgroundColor: "#1a181820",
                borderRadius: 20,
                fontSize: 24,
                margin: 20,
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Explanation
            </Text>

            {/* Display the explanation of the APOD, which is passed as a parameter. */}
            <Text
              style={{
                fontSize: 18,
                margin: 20,
              }}
            >
              {apod?.explanation}
            </Text>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}
