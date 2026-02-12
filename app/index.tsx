import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Image, Text, View } from "react-native";

import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
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
  // Router from expo-router to navigate between screens in the app via swiping.
  const router = useRouter();

  // apods being the APOD itself, and setApod being the function to update the state variable APOD.
  const [apod, setApod] = useState<Apod>(); // State variable to store the fetched APOD.

  const closeSheet = useApodStore((state) => state.closeSheet);
  const bottomSheetRef = useRef<BottomSheet>(null);

  // Gets the data parameter from the passed in url from previous screen.
  // This is used to fetch the APOD for a specific date when users swipe left or right to navigate between APODs.
  // TODO: Determine why date can be returned as an array and not just a string, and if this is a bug or expected behavior.
  const params = useLocalSearchParams();

  let paramsDate = params?.date;
  if (Array.isArray(paramsDate)) {
    paramsDate = paramsDate[0];
  }

  // Gets the date param if available. If not, then set to current date (account for offset as that can cause a bug by showing the next day).
  let date = paramsDate as string;
  let tempDate = new Date();
  if (date === undefined) {
    tempDate.setHours(0, 0, 0, 0);
    date = tempDate.toISOString().split("T")[0];
  }

  console.log("Date parameter from URL:", date); // Debug log to verify the date parameter is being retrieved correctly from the URL.

  // Define swipe gestures to navigate between APODs. Swipe left for previous day, swipe right for next day.
  const swipeLeft = Gesture.Fling()
    .direction(Directions.LEFT)

    // Tells the gesture handler to execute the callback on the JavaScript thread instead of the UI thread.
    // This gives full access to the Date as the UI thread doesn't have a full implementation of it.
    .runOnJS(true)
    .onEnd(() => {
      // If no APOD is loaded, return early with loading text.
      if (apod == null) {
        console.log("APOD is null, cannot navigate to previous day.");
        return;
      }

      // Compute the date for the previous day by subtracting one day from the current date. This allows users to swipe left to see the previous day's APOD.
      const prevDay = new Date(date);
      prevDay.setDate(prevDay.getDate() - 1);

      // Navigate to the index screen with the date parameter set to the previous day.
      // This will trigger a re-render and fetch the APOD for the previous day.
      router.replace({
        pathname: "/",
        params: { date: prevDay.toISOString().split("T")[0] },
      });
    });

  const swipeRight = Gesture.Fling()
    .direction(Directions.RIGHT)

    // Tells the gesture handler to execute the callback on the JavaScript thread instead of the UI thread.
    // This gives full access to the Date as the UI thread doesn't have a full implementation of it.
    .runOnJS(true)
    .onEnd(() => {
      // If no APOD is loaded, return early with loading text.
      if (apod == null) {
        console.log("APOD is null, cannot navigate to next day.");
        return;
      }

      // Compute the date for the next day by adding one day to the current date. This allows users to swipe right to see the next day's APOD.
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Needed to normalize today's date to midnight for accurate comparison

      // Prevent users from swiping right to navigate to future APODs that haven't been released yet.
      // If the current APOD is today's date, return early and don't navigate to the next day.
      if (nextDay >= today) {
        console.log("Cannot navigate to future APODs.");
        return;
      }

      // Navigate to the next day's APOD by pushing a new URL with the next day's date as a parameter.
      // This will trigger a re-render and fetch the APOD for the next day.
      router.replace({
        pathname: "/",
        params: { date: nextDay.toISOString().split("T")[0] },
      });
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
  const gestures = Gesture.Simultaneous(swipeLeft, swipeRight, swipeUp);

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

  const pastQueries = useApodStore((state) => state.pastQueries);
  // useEffect that runs everytime date changes.
  useEffect(() => {
    if (pastQueries[date]) {
      console.log("APOD for this date found in cache, using cached data.");
      setApod(pastQueries[date]);
      return;
    } else {
      // Use API to fetch astronomy images from NASA API when the component mounts.
      fetchApods();
    }
  }, [date]); // Only runs when the date changes

  async function fetchApods() {
    try {
      // Get the APOD based on the date passed as a parameter in the URL. If no date is passed, default to today's APOD.
      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
      );

      // Should retrieve the APOD in JSON.
      const data = await response.json();

      // Debug log for tesing purposes.
      console.log(data);

      // Update the state variable with the fetched APOD data.
      setApod(data);

      // Cache the fetched APOD in the pastQueries dictionary with the date as the key.
      pastQueries[date] = data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (
    // GestureDetector must be wrapped by GestureHandlerRootView.
    <GestureHandlerRootView>
      {/* // Wrap in GestureDetector to handle swipe gestures for navigation between APODs. */}
      <GestureDetector gesture={gestures}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* The title of the APOD image */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 40,
              textAlign: "center",
            }}
          >
            {apod?.title}
          </Text>

          {/* The APOD image itself. resizeMode: "contain" ensures the image fits within the view without stretching or getting cut off. */}
          <Image
            style={{
              width: screenWidth * 0.9,
              height: screenHeight * 0.5,
              resizeMode: "contain",
            }}
            source={{ uri: apod?.url }}
          />

          {/* The date of the APOD image */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginTop: 80,
              textAlign: "center",
            }}
          >
            {apod?.date}
          </Text>
        </View>
      </GestureDetector>
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
