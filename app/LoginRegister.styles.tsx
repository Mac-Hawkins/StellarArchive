import { StyleSheet } from "react-native";

const loginRegisterStyles = StyleSheet.create({
  loginOuterView: { alignItems: "center", paddingTop: 30 },
  inputView: {
    alignItems: "center",
    flexDirection: "column",
    marginTop: 30,
  },
  inputLabel: { fontSize: 18, fontWeight: "bold", color: "white" },
  textInput: {
    borderWidth: 1,
    borderColor: "gray",
    width: 300,
    padding: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  linkRegister: { color: "blue", fontWeight: "bold", fontSize: 18 },
  textRegister: { fontSize: 18, fontWeight: "bold", color: "blue" },
  viewTouchableOpacity: { alignItems: "center", marginTop: 50 },
  textTouchableOpacity: { fontSize: 18, fontWeight: "bold" },
});

export default loginRegisterStyles;
