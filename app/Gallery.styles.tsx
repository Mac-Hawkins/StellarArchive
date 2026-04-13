import { Dimensions, StyleSheet } from "react-native";

// Get the screen dimenstions to use for styling the APOD image.
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

const GalleryStyles = StyleSheet.create({
  containerApodView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pressableViewStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "lightgray",
  },
  pressableTextStyle: { fontSize: 8, fontWeight: "bold", textAlign: "center" },
  textApodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  containerImgView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  imageApodNormal: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.6,
    resizeMode: "contain",
  },
  textDate: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    width: "100%",
  },
  viewImageFull: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(0, 0, 0)",
  },
  imageFull: {
    height: "99%",
    width: "99%",
    resizeMode: "contain",
  },
  textExplanationIndicator: {
    fontSize: 60,
    fontWeight: "bold",
    textAlign: "center",
    color: "lightgray",
    marginBottom: 0,
  },
  textExplanationTitle: {
    backgroundColor: "#1a181820",
    borderRadius: 20,
    fontSize: 24,
    margin: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  textExplanation: {
    fontSize: 18,
    margin: 20,
  },
});

export default GalleryStyles;
