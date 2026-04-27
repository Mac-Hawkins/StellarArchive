import { StyleSheet } from "react-native";

// Both Login and Register screens are very similiar so I figured I'd consolidate their styles here.

const loginRegisterStyles = StyleSheet.create({
  viewBlackBackground: {
    flex: 1,
    backgroundColor: "black",
  },
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
  linkRegister: { color: "#3B82F6", fontWeight: "bold", fontSize: 18 },
  textRegister: { fontSize: 18, fontWeight: "bold" },
  viewTouchableOpacity: { alignItems: "center", marginTop: 50 },
  textTouchableOpacity: { fontSize: 18, fontWeight: "bold" },
});

export default loginRegisterStyles;
