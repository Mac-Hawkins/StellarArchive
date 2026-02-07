import { useEffect } from "react";
import { Text, View } from "react-native";


// useEffect is a hook that allows us to fetch data.
// useState is a hook that allows us to manage state in a state variable that we can then display.

// Retrieve NASA_API_KEY from .env file.
const API_KEY = process.env.EXPO_PUBLIC_NASA_API_KEY;

// Entry point of application. This is the first screen that users see when they open the app.
export default function Index() {

  // Hooks from react to fetch data.
  useEffect(() => {
    // Fetch astronyomy images from NASA API when the component mounts.
    fetchAstroImgs();
  }, []);

  async function fetchAstroImgs() {
    try {
      
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`);

      // Should retrieve the APOD in JSON.
      const data = await response.json(); 

      // Debug log for tesing purposes.
      console.log(data);
    }
    catch (error) {
      console.error("Error fetching data:", error);
    }
  }

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
