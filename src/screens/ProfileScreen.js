import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { usePosts } from "../utils/PostsContext";
import { useNavigation } from "@react-navigation/native";
import GrainBackground from "../components/GrainBackground";
import { globalStyles } from "../utils/globalStyles";

const { width } = Dimensions.get("window");
const ITEM_SIZE = width / 3 - 16;

// Dummy data - replace with real data from your backend
const DUMMY_USER = {
  username: "janedoe",
  bio: "I wear mostly streetwear!",
  friends: 12,
  items: 4,
  swaps: 8,
  profileImage: null,
};

const TABS = {
  ACTIVE: "Active Listings",
  ARCHIVE: "Archive",
};

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(TABS.ACTIVE);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...DUMMY_USER });
  const { posts } = usePosts();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () =>
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          }),
      },
    ]);
  };

  // Filter posts by type (active/archive)
  const activePosts = posts.filter(
    (post) => post.listedBy === DUMMY_USER.username && !post.archived
  );
  const archivedPosts = posts.filter(
    (post) => post.listedBy === DUMMY_USER.username && post.archived
  );

  const renderProfileImage = () => (
    <View style={styles.profileImageContainer}>
      {DUMMY_USER.profileImage ? (
        <Image
          source={{ uri: DUMMY_USER.profileImage }}
          style={styles.profileImage}
        />
      ) : (
        <View style={styles.profileImage}>
          <FontAwesome5 name="user-alt" size={40} color="#ccc" />
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.stats}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{DUMMY_USER.items}</Text>
        <Text style={styles.statLabel}>Items</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{DUMMY_USER.swaps}</Text>
        <Text style={styles.statLabel}>Swaps</Text>
      </View>
      <TouchableOpacity
        style={styles.statItem}
        onPress={() => navigation.navigate("Friends")}
      >
        <Text style={styles.statNumber}>{DUMMY_USER.friends}</Text>
        <Text style={styles.statLabel}>Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {Object.values(TABS).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPostGrid = (posts) => (
    <View style={styles.gridContainer}>
      {posts.map((post) => (
        <TouchableOpacity key={post.id} style={styles.gridItem}>
          <Image source={{ uri: post.imageUrl }} style={styles.gridItemImage} />
          {activeTab === TABS.ARCHIVE && (
            <TouchableOpacity
              style={styles.unarchiveButton}
              onPress={() => handleUnarchive(post.id)}
            >
              <MaterialCommunityIcons
                name="archive-arrow-up"
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEditProfileModal = () => (
    <Modal
      visible={editModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setEditModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Profile</Text>

          <TouchableOpacity style={styles.imagePickerButton}>
            {editedProfile.profileImage ? (
              <Image
                source={{ uri: editedProfile.profileImage }}
                style={styles.editProfileImage}
              />
            ) : (
              <View style={styles.editProfileImage}>
                <FontAwesome5 name="camera" size={24} color="#666" />
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            value={editedProfile.username}
            onChangeText={(text) =>
              setEditedProfile((prev) => ({ ...prev, username: text }))
            }
          />

          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={editedProfile.bio}
            onChangeText={(text) =>
              setEditedProfile((prev) => ({ ...prev, bio: text }))
            }
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={() => {
                // Save profile changes here
                setEditModalVisible(false);
              }}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <GrainBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <FontAwesome5 name="sign-out-alt" size={20} color="#d00" />
              <Text style={[styles.logoutText, globalStyles.textMedium]}>
                Logout
              </Text>
            </TouchableOpacity>
            {renderProfileImage()}
            <Text style={[styles.username, globalStyles.textBold]}>
              @{DUMMY_USER.username}
            </Text>
            <Text style={[styles.bio, globalStyles.text]}>
              {DUMMY_USER.bio}
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
            >
              <FontAwesome
                name="pencil"
                size={16}
                color="#fff"
                style={styles.editIcon}
              />
              <Text style={[styles.editButtonText, globalStyles.textMedium]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>

          {renderStats()}
          {renderTabs()}

          <View style={styles.contentContainer}>
            {activeTab === TABS.ACTIVE && renderPostGrid(activePosts)}
            {activeTab === TABS.ARCHIVE && renderPostGrid(archivedPosts)}
          </View>
        </ScrollView>
        {renderEditProfileModal()}
      </SafeAreaView>
    </GrainBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    fontFamily: "CircularStd-Bold",
  },
  bio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
    fontFamily: "CircularStd-Book",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "CircularStd-Bold",
  },
  statLabel: {
    color: "#666",
    fontSize: 14,
    fontFamily: "CircularStd-Book",
  },
  editButton: {
    backgroundColor: "#ff0000",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editIcon: {
    marginRight: 8,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "CircularStd-Bold",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#ff0000",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    fontFamily: "CircularStd-Bolds",
  },
  activeTabText: {
    color: "#ff0000",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  gridItemImage: {
    width: "100%",
    height: "100%",
  },
  unarchiveButton: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 16,
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  imagePickerButton: {
    alignSelf: "center",
    marginBottom: 20,
  },
  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f8f8f8",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#ff0000",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  logoutButton: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
  },
  logoutText: {
    marginLeft: 8,
    color: "#d00",
    fontSize: 16,
  },
});
