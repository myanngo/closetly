import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { postsData } from "../../data/postsDummyData";

const FILTER_OPTIONS = [
  { id: "all", label: "All", icon: "th-large" },
  { id: "size", label: "Size", icon: "tape" },
  { id: "style", label: "Style", icon: "tag" },
  { id: "type", label: "Item Type", icon: "shopping-bag" },
  { id: "color", label: "Color", icon: "paint-brush" },
];

const { width } = Dimensions.get("window");
const ITEM_MARGIN = 8;
const ITEM_WIDTH = width / 2 - ITEM_MARGIN * 3;

export default function HomeScreen() {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState("all");

  const renderFilterTabs = () => {
    return (
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_OPTIONS.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              style={[
                styles.filterTab,
                selectedFilter === filter.id && styles.selectedFilterTab,
              ]}
            >
              {filter.icon &&
                (filter.id === "size" ? (
                  <FontAwesome5
                    name={filter.icon}
                    size={16}
                    color={selectedFilter === filter.id ? "#fff" : "#B89B5E"}
                  />
                ) : (
                  <FontAwesome
                    name={filter.icon}
                    size={16}
                    color={selectedFilter === filter.id ? "#fff" : "#B89B5E"}
                  />
                ))}
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.id && styles.selectedFilterText,
                  !filter.icon && { marginLeft: 0 },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const navigateToPost = (post) => {
    navigation.navigate("Post", { post });
  };

  const renderPostsGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {postsData.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[
              styles.gridItem,
              {
                height:
                  post.aspectRatio === "tall" ? ITEM_WIDTH * 1.5 : ITEM_WIDTH,
              },
            ]}
            //onPress={() => navigateToPost(post)} TODO
          >
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="hanger" size={40} color="#ff0000" />
        <TouchableOpacity onPress={() => navigation.navigate("Search")}>
          <FontAwesome name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {renderFilterTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPostsGrid()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  filterWrapper: {},
  filterContainer: {
    paddingVertical: 15,
  },
  filterContent: {
    paddingHorizontal: 15,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#fff2c9",
  },
  selectedFilterTab: {
    backgroundColor: "#ff0000",
  },
  filterText: {
    color: "#B89B5E",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  selectedFilterText: {
    color: "#fff",
  },
  content: {
    flex: 1,
    marginBottom: 60, // Space for bottom navigation
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: ITEM_MARGIN,
  },
  gridItem: {
    width: ITEM_WIDTH,
    margin: ITEM_MARGIN,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#D8D8D8",
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  bottomNavigation: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: "row",
    backgroundColor: "#FFF8E7",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  navButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
