import { StyleSheet } from "react-native";

const AccountStyles = StyleSheet.create({
  pressableViewStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "black",
  },
  pressableStyle: {
    alignItems: "center",
  },
  pressableTextStyle: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
  },
});

export default AccountStyles;
