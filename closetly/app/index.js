import { useState } from "react";
import {
  Button,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router"; // Import useRouter for navigation
import { useFonts } from "expo-font"; // Import useFonts for google font

export default function Index() {
  const router = useRouter(); // Hook for navigation

  // const [fontsLoaded] = useFonts({
  //   //font names here
  // });

  // if (!fontsLoaded) {
  //   return null; // Wait for fonts to load
  // }

  // Function to handle the "Log In" button click
  const handleLogin = () => {
    router.push("/tabs"); // Navigate to the next page (e.g., /tabs)
    // to implement
  };

  // Function to handle sign in button
  const handleSignUp = () => {
    console.log("Second button clicked!");
    // to implement!
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondButton} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#B9D59B",
    padding: 20,
  },
  logo: {
    width: 90,
    heigh: 100,
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: "#F7F9C8",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    width: "60%",
  },
  secondButton: {
    backgroundColor: "#F7F9C8",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "60%",
  },
  buttonText: {
    color: "#8DB473",
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
});
