import { StyleSheet } from "react-native";

const loginRegisterStyles = StyleSheet.create({
  loginOuterView: { alignItems: "center", paddingTop: 30 },
  inputView: {
    alignItems: "center",
    flexDirection: "column",
    marginTop: 30,
  },
  inputLabel: { fontSize: 18, fontWeight: "bold" },
  textInput: {
    borderWidth: 1,
    borderColor: "gray",
    width: 300,
    padding: 10,
    fontSize: 18,
    fontWeight: "bold",
  },
  linkRegister: { color: "blue", fontWeight: "bold", fontSize: 18 },
  touchableOpacityLogin: {
    height: 50,
    width: 300,
    backgroundColor: "lightblue",
    borderRadius: 10,
    justifyContent: "center", // Justifies text vertically within button.
    alignItems: "center", // Justifies text horizontally within button.
  },
  textRegister: { fontSize: 18, fontWeight: "bold", color: "blue" },
  viewTouchableOpacity: { alignItems: "center", marginTop: 50 },
  textTouchableOpacity: { fontSize: 18, fontWeight: "bold" },
  touchableOpacityGuest: {
    height: 50,
    width: 300,
    marginTop: 40,
    backgroundColor: "lightgray",
    borderRadius: 10,
    justifyContent: "center", // Justifies text vertically within button.
    alignItems: "center", // Justifies text horizontally within button.
  },
});

export default loginRegisterStyles;
