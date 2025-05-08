import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  text: {
    fontFamily: "CircularStd-Book",
  },
  textMedium: {
    fontFamily: "CircularStd-Medium",
  },
  textBold: {
    fontFamily: "CircularStd-Bold",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export const tabBarStyle = {
  backgroundColor: "#ffffff",
  borderTopWidth: 0,
  elevation: 0,
  height: 100,
  position: "relative",
  overflow: "hidden",
};
