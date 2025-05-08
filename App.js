import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FontAwesome5 } from "@expo/vector-icons";
import * as SplashScreen from "expo-splash-screen";

// Import screens
import HomeScreen from "./src/screens/HomeScreen";
import UploadItemScreen from "./src/screens/UploadItemScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import AddDetailsScreen from "./src/screens/AddDetailsScreen";
import PreviewItemScreen from "./src/screens/PreviewItemScreen";

// Import font loader and styles
import { loadFonts } from "./src/utils/fonts";
import { PostsProvider } from "./src/utils/PostsContext";
import { globalStyles, tabBarStyle } from "./src/utils/globalStyles";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Upload") {
            iconName = "plus";
          } else if (route.name === "Profile") {
            iconName = "user-alt";
          }

          return <FontAwesome5 name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff0000",
        tabBarInactiveTintColor: "#B89B5E",
        tabBarShowLabel: true,
        headerShown: false,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: {
          marginTop: 10,
          fontSize: 12,
          fontFamily: "CircularStd-Medium",
        },
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            <Image
              source={require("./assets/grain-overlay.webp")}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0.4,
              }}
              resizeMode="repeat"
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Upload"
        component={UploadItemScreen}
        options={{
          tabBarStyle: { display: "none" },
          tabBarIcon: ({ focused, color, size }) => (
            <FontAwesome5 name="plus" size={size + 4} color={color} />
          ),
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await loadFonts();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <PostsProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: "none",
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="AddDetails" component={AddDetailsScreen} />
            <Stack.Screen name="PreviewItem" component={PreviewItemScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </PostsProvider>
    </GestureHandlerRootView>
  );
}
