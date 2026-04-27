import { StyleSheet } from "react-native";

const AccountStyles = StyleSheet.create({
  pressableViewStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "black",
    borderBottomColor: "white",
    borderBottomWidth: 1,
  },
  viewCenterIconWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
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
  viewLoading: {
    backgroundColor: "black",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
  },
  textLoading: { color: "white" },
  itemText: { fontSize: 24, color: "white" },
});

export default AccountStyles;
