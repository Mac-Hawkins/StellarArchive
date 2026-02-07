import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";


// This is the screen that appears when users click on an APOD image in the main app.
export default function ApodExplanation() {

    // Hook to access the search parameters from the URL, which includes the date of the APOD.
    const params = useLocalSearchParams(); 

    console.log(params);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >

    {/* Display the explanation of the APOD, which is passed as a parameter. */}
    <Text style={{ fontSize: 18, margin: 20 }}>
        {params.explanation}
    </Text>
        
    </View>
  );
}
