import { router, Tabs } from "expo-router";
import { StyleSheet, View, TouchableOpacity, Image } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShow: false,
        tabBarStyle: styles.navBar,
        tabBarPosition: "bottom",
        contentStyle: {
          marginBottom: 120,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="hanger" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="plus-circle" color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          tabBarLabel: "profile",
          tabBarShowLabel: false,
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="user" color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: "absolute",
    backgroundColor: "#D9DDDC",
    height: 90,
    overflow: "hidden",
    paddingTop: 20,
    justifyContent: "center",
  },
});
