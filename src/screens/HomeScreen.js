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
  Modal,
  TextInput,
  FlatList,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  FontAwesome,
  FontAwesome5,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { usePosts } from "../utils/PostsContext";

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
  const { posts } = usePosts();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [bids, setBids] = useState({}); // { [postId]: [bid, ...] }
  const [bidType, setBidType] = useState(null); // 'swap' | 'buy' | 'interest'
  const [bidPrice, setBidPrice] = useState("");
  const [swapItem, setSwapItem] = useState(null);
  const [matchedBid, setMatchedBid] = useState({}); // { [postId]: bid }
  const [carouselIndex, setCarouselIndex] = useState(0);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState("");
  const [comments, setComments] = useState({}); // { [postId]: [ { user, text } ] }
  const [newComment, setNewComment] = useState("");

  // Dummy user closet for swap
  const userCloset = [
    { id: 101, title: "Red Hoodie" },
    { id: 102, title: "Blue Jeans" },
    { id: 103, title: "Black Boots" },
  ];
  const currentUser = "feliciayan"; // TODO: replace with real user

  // Filter posts by search query
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.title?.toLowerCase().includes(q) ||
      post.brand?.toLowerCase().includes(q) ||
      post.itemType?.toLowerCase().includes(q) ||
      post.size?.toLowerCase().includes(q) ||
      post.condition?.toLowerCase().includes(q)
    );
  });

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
    setBidType(null);
    setBidPrice("");
    setSwapItem(null);
    setCarouselIndex(0);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
    setBidType(null);
    setBidPrice("");
    setSwapItem(null);
  };

  const submitBid = () => {
    if (!selectedPost) return;
    const postId = selectedPost.id;
    let bid = { type: bidType, user: currentUser };
    if (bidType === "buy") bid.price = bidPrice;
    if (bidType === "swap") bid.item = swapItem;
    setBids((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), bid],
    }));
    setBidType(null);
    setBidPrice("");
    setSwapItem(null);
  };

  const selectBid = (bid) => {
    if (!selectedPost) return;
    setMatchedBid((prev) => ({ ...prev, [selectedPost.id]: bid }));
  };

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
        {filteredPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={[
              styles.gridItem,
              {
                height:
                  post.aspectRatio === "tall" ? ITEM_WIDTH * 1.5 : ITEM_WIDTH,
              },
            ]}
            onPress={() => openModal(post)}
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

  const renderBidSection = () => {
    if (!selectedPost) return null;
    const isSeller = selectedPost.listedBy === currentUser;
    const postId = selectedPost.id;
    const postBids = bids[postId] || [];
    // If seller has matched a bid, show contact info
    if (matchedBid[postId]) {
      return (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "#d00" }}>
            You matched with:
          </Text>
          <Text style={{ marginTop: 8 }}>
            @{matchedBid[postId].user} (contact: email@example.com)
          </Text>
        </View>
      );
    }
    // Show all bids as a comment section
    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
          Bids
        </Text>
        <ScrollView style={{ maxHeight: 180 }}>
          {postBids.length === 0 && (
            <Text style={{ color: "#888", marginBottom: 8 }}>No bids yet. Be the first!</Text>
          )}
          {postBids.map((bid, i) => (
            <View
              key={i}
              style={[
                styles.commentBubble,
                matchedBid[postId] === bid && styles.selectedCommentBubble,
              ]}
            >
              <Text style={styles.commentUser}>@{bid.user}</Text>
              <Text style={styles.commentText}>
                {bid.type === "buy"
                  ? `offered $${bid.price}`
                  : bid.type === "swap"
                  ? `wants to swap: ${bid.item?.title}`
                  : "expressed interest"}
              </Text>
              {isSeller && !matchedBid[postId] && (
                <TouchableOpacity
                  style={styles.selectBidBtn}
                  onPress={() => selectBid(bid)}
                >
                  <Text style={styles.selectBidBtnText}>Select</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
        {/* Bid input/buttons for non-seller */}
        {!isSeller && !bidType && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              Bid on this item:
            </Text>
            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity
                style={styles.bidButton}
                onPress={() => setBidType("swap")}
              >
                <Text style={styles.bidButtonText}>Swap</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bidButton}
                onPress={() => setBidType("buy")}
              >
                <Text style={styles.bidButtonText}>Buy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bidButton}
                onPress={() => {
                  setBidType("interest");
                  submitBid();
                }}
              >
                <Text style={styles.bidButtonText}>Express Interest</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {/* Bid forms for non-seller */}
        {!isSeller && bidType === "buy" && (
          <View style={{ marginTop: 20 }}>
            <Text>Enter your offer price:</Text>
            <TextInput
              style={styles.input}
              placeholder="$ Price"
              value={bidPrice}
              onChangeText={setBidPrice}
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={[styles.bidButton, { marginTop: 10 }]}
              onPress={submitBid}
              disabled={!bidPrice}
            >
              <Text style={styles.bidButtonText}>Submit Bid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => setBidType(null)}
            >
              <Text style={{ color: "#d00" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isSeller && bidType === "swap" && (
          <View style={{ marginTop: 20 }}>
            <Text>Select an item to swap:</Text>
            <FlatList
              data={userCloset}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.swapItem,
                    swapItem?.id === item.id && { borderColor: "#d00" },
                  ]}
                  onPress={() => setSwapItem(item)}
                >
                  <Text>{item.title}</Text>
                </TouchableOpacity>
              )}
              style={{ marginVertical: 10 }}
            />
            <TouchableOpacity
              style={[styles.bidButton, { marginTop: 10 }]}
              onPress={submitBid}
              disabled={!swapItem}
            >
              <Text style={styles.bidButtonText}>Submit Swap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 10 }}
              onPress={() => setBidType(null)}
            >
              <Text style={{ color: "#d00" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderCommentSection = () => {
    if (!selectedPost) return null;
    const postId = selectedPost.id;
    const postComments = comments[postId] || [];
    return (
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8 }}>
          Comments
        </Text>
        <ScrollView style={{ maxHeight: 120 }}>
          {postComments.length === 0 && (
            <Text style={{ color: "#888", marginBottom: 8 }}>No comments yet. Be the first!</Text>
          )}
          {postComments.map((c, i) => (
            <View key={i} style={styles.commentBubbleAlt}>
              <Text style={styles.commentUser}>@{c.user}</Text>
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.commentInputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor="#bbb"
            value={newComment}
            onChangeText={setNewComment}
            onSubmitEditing={() => submitComment()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={styles.commentSendBtn}
            onPress={submitComment}
            disabled={!newComment.trim()}
          >
            <Text style={styles.commentSendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const submitComment = () => {
    if (!selectedPost || !newComment.trim()) return;
    const postId = selectedPost.id;
    setComments((prev) => ({
      ...prev,
      [postId]: [
        ...(prev[postId] || []),
        { user: currentUser, text: newComment.trim() },
      ],
    }));
    setNewComment("");
  };

  const renderPostModal = () => {
    if (!selectedPost) return null;
    const images =
      selectedPost.images && selectedPost.images.length > 0
        ? selectedPost.images
        : [selectedPost.imageUrl];
    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.itemTitle}>{selectedPost.title}</Text>
              <Text style={styles.brandName}>{selectedPost.brand}</Text>
              <Text style={styles.listedBy}>
                Listed by{" "}
                <Text style={styles.username}>@{selectedPost.listedBy}</Text>
              </Text>
              <View style={styles.carouselContainer}>
                <View style={styles.tapeEffect} />
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    {
                      useNativeDriver: false,
                      listener: (e) => {
                        const idx = Math.round(
                          e.nativeEvent.contentOffset.x / (width * 0.8)
                        );
                        setCarouselIndex(idx);
                      },
                    }
                  )}
                  scrollEventThrottle={16}
                  contentContainerStyle={{ alignItems: "center" }}
                  style={{ width: "100%" }}
                >
                  {images.map((uri, idx) => (
                    <Image
                      key={uri}
                      source={{ uri }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
                {images.length > 1 && (
                  <Text style={styles.carouselCount}>
                    {carouselIndex + 1} / {images.length}
                  </Text>
                )}
              </View>
              <Text style={styles.sectionTitle}>Story</Text>
              <Text style={styles.storyText}>{selectedPost.story}</Text>
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Item Type</Text>
                  <Text style={styles.detailValue}>
                    {selectedPost.itemType}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size</Text>
                  <Text style={[styles.detailValue, styles.sizeValue]}>
                    {selectedPost.size}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Brand</Text>
                  <Text style={styles.detailValue}>{selectedPost.brand}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Condition</Text>
                  <Text style={styles.detailValue}>
                    {selectedPost.condition}
                  </Text>
                </View>
              </View>
              {renderBidSection()}
              {renderCommentSection()}
            </ScrollView>
            <TouchableOpacity style={styles.closeModalBtn} onPress={closeModal}>
              <Text style={{ color: "#d00", fontWeight: "bold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="hanger" size={40} color="#ff0000" />
        <View style={{ flex: 1, marginLeft: 16, marginRight: 8 }}>
          <TextInput
            style={styles.searchBar}
            placeholder="Search posts..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {renderFilterTabs()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderPostsGrid()}
      </ScrollView>
      {renderPostModal()}
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
  bidButton: {
    backgroundColor: "#ff0000",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 10,
  },
  bidButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    width: 120,
    backgroundColor: "#fff",
  },
  swapItem: {
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    backgroundColor: "#f8f8f8",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "92%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  closeModalBtn: {
    marginTop: 16,
    alignSelf: "center",
    padding: 8,
  },
  itemTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 4,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#d00",
    marginBottom: 8,
    fontFamily: "InstrumentSerif-Regular",
  },
  listedBy: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  username: {
    fontWeight: "normal",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  storyText: {
    fontSize: 14,
  },
  detailsSection: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: "bold",
  },
  detailValue: {
    fontWeight: "bold",
    color: "#d00",
  },
  carouselContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
    width: "100%",
    position: "relative",
    height: 350,
    justifyContent: "center",
  },
  tapeEffect: {
    position: "absolute",
    top: -10,
    left: "60%",
    transform: [{ translateX: -100 }, { rotate: "-3deg" }],
    width: 150,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  carouselImage: {
    width: width * 0.8,
    height: 350,
    borderRadius: 10,
    backgroundColor: "#fdfaf2",
    borderWidth: 1,
    borderColor: "#ddd",
    marginHorizontal: (width * 0.1) / 2,
  },
  carouselCount: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 4,
    alignSelf: "center",
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 20,
  },
  commentBubble: {
    backgroundColor: '#f8f8f8',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectedCommentBubble: {
    borderColor: '#d00',
    backgroundColor: '#fff2c9',
  },
  commentUser: {
    fontWeight: 'bold',
    color: '#d00',
    marginRight: 8,
  },
  commentText: {
    flex: 1,
    color: '#333',
  },
  selectBidBtn: {
    backgroundColor: '#d00',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectBidBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  commentBubbleAlt: {
    backgroundColor: '#eaf6ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#b3d8f7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#eee',
    color: '#222',
    marginRight: 8,
  },
  commentSendBtn: {
    backgroundColor: '#d00',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentSendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sizeValue: {
    color: "#d00",
  },
});
