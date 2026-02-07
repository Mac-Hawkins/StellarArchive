import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Image, Text, View } from "react-native";


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
const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Entry point of application. This is the first screen that users see when they open the app.
export default function Index() {

  // apods being the APOD itself, and setApod being the function to update the state variable APOD.
  const [apod, setApod] = useState<Apod>(); // State variable to store the fetched APOD.

  // Hooks from react to fetch data.
  useEffect(() => {
    // Fetch astronomy images from NASA API when the component mounts.
    fetchApods();
  }, []);

  async function fetchApods() {
    try {
      
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`);

      // Should retrieve the APOD in JSON.
      const data = await response.json(); 

      // Debug log for tesing purposes.
      console.log(data);

      // Update the state variable with the fetched APOD data.
      setApod(data); 
    }
    catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  return (

// Wrap the Link in a View with flex to keep the content center.
<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>

    {/* Links each image by unique date to its corresponding ApodExplanation page. */}
    <Link key={apod?.date} href={{pathname: "/apod_explanation", params: {explanation: apod?.explanation}}}>
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* The title of the APOD image */}
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        {apod?.title}
      </Text>

      
      {/* The APOD image itself. resizeMode: "contain" ensures the image fits within the view without stretching or getting cut off. */}
      <Image 
      style={{ width: screenWidth * 0.9, height: screenHeight * 0.5, resizeMode: "contain" }}
      source={{ uri: apod?.url }}/>
    </View>
    </Link>
    </View>
  );
}
