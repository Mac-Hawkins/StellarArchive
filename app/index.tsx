import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Image, Text, View } from "react-native";
import {
  Directions,
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

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

  // Gets the data parameter from the passed in url from previous screen.
  // This is used to fetch the APOD for a specific date when users swipe left or right to navigate between APODs.
  // TODO: Determine why date can be returned as an array and not just a string, and if this is a bug or expected behavior.
  const params = useLocalSearchParams();
  let paramsDate = params?.date;
  if (Array.isArray(paramsDate)) {
    paramsDate = paramsDate[0];
  }

  const date = (paramsDate as string) || new Date().toISOString().split("T")[0]; // Default to today;
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

      router.push({
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

      router.push({
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
      // If no APOD is loaded, return early with loading text.
      if (apod == null) {
        console.log("APOD is null, cannot navigate to previous day.");
        return;
      }

      // Compute the date for the previous day by subtracting one day from the current date. This allows users to swipe left to see the previous day's APOD.
      const prevDay = new Date(date);
      prevDay.setDate(prevDay.getDate() - 1);

      router.push({
        pathname: "/apod_explanation",
        params: { explanation: apod?.explanation },
      });
    });

  // Combine gestures
  const gestures = Gesture.Simultaneous(swipeLeft, swipeRight, swipeUp);

  // Hooks from react to fetch data.
  useEffect(() => {
    // Fetch astronomy images from NASA API when the component mounts.
    fetchApods();
  }, [date]); // Re-run the effect when the date changes (i.e., when user swipes to a different day).

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
    </GestureHandlerRootView>
  );
}
