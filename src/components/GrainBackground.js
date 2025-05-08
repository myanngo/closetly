import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function GrainBackground({ children }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/grain-overlay.webp")}
        style={styles.grainOverlay}
        resizeMode="repeat"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  grainOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
});
