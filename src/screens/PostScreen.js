// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Image,
//   TouchableOpacity,
//   SafeAreaView,
//   Dimensions,
// } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// const { width } = Dimensions.get("window");

// export default function PostScreen({ route }) {
//   const navigation = useNavigation();
//   const { post } = route.params;

//   const renderItemDetails = () => {
//     return (
//       <>
//         <View style={styles.itemHeader}>
//           <Text style={styles.itemTitle}>{post.title}</Text>
//           <Text style={styles.brandName}>{post.brand}</Text>
//           <Text style={styles.listedBy}>
//             listed by <Text style={styles.username}>@{post.listedBy}</Text>
//           </Text>
//         </View>

//         <View style={styles.imageContainer}>
//           <Image
//             source={{ uri: post.imageUrl }}
//             style={styles.mainImage}
//             resizeMode="cover"
//           />
//           {post.images && post.images.length > 1 && (
//             <Text style={styles.swipeText}>Swipe to see more photos!</Text>
//           )}
//         </View>

//         <View style={styles.storySection}>
//           <Text style={styles.sectionTitle}>Story</Text>
//           <Text style={styles.storyText}>{post.story}</Text>
//         </View>

//         <View style={styles.detailsSection}>
//           <View style={styles.detailRow}>
//             <Text style={styles.detailLabel}>Item Type</Text>
//             <Text style={styles.detailValue}>{post.itemType}</Text>
//           </View>

//           <View style={styles.detailRow}>
//             <Text style={styles.detailLabel}>Size</Text>
//             <Text style={[styles.detailValue, styles.sizeValue]}>
//               {post.size}
//             </Text>
//           </View>

//           <View style={styles.detailRow}>
//             <Text style={styles.detailLabel}>Brand</Text>
//             <Text style={styles.detailValue}>{post.brand}</Text>
//           </View>

//           <View style={styles.detailRow}>
//             <Text style={styles.detailLabel}>Condition</Text>
//             <Text style={styles.detailValue}>{post.condition}</Text>
//           </View>
//         </View>
//       </>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Ionicons name="arrow-back" size={24} color="#000" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>post example</Text>
//         <TouchableOpacity>
//           <MaterialIcons name="more-vert" size={24} color="#000" />
//         </TouchableOpacity>
//       </View>

//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {renderItemDetails()}
//       </ScrollView>

//       <View style={styles.footer}>
//         <TouchableOpacity style={styles.messageButton}>
//           <Text style={styles.messageButtonText}>Message</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.likeButton}>
//           <Ionicons name="heart-outline" size={24} color="#000" />
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   headerTitle: {
//     fontSize: 16,
//     color: "#0096FF",
//     fontWeight: "500",
//   },
//   content: {
//     flex: 1,
//   },
//   itemHeader: {
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 8,
//   },
//   itemTitle: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   brandName: {
//     fontSize: 16,
//     color: "#ff0000",
//     marginBottom: 4,
//   },
//   listedBy: {
//     fontSize: 14,
//     color: "#666",
//   },
//   username: {
//     color: "#ff0000",
//     fontWeight: "500",
//   },
//   imageContainer: {
//     alignItems: "center",
//     marginVertical: 16,
//   },
//   mainImage: {
//     width: width * 0.75,
//     height: width * 1.5,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
//   swipeText: {
//     marginTop: 8,
//     color: "#999",
//     fontSize: 14,
//   },
//   storySection: {
//     paddingHorizontal: 16,
//     paddingBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "bold",
//     marginBottom: 8,
//   },
//   storyText: {
//     fontSize: 16,
//     lineHeight: 22,
//     color: "#333",
//   },
//   detailsSection: {
//     paddingHorizontal: 16,
//     paddingBottom: 24,
//   },
//   detailRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   detailLabel: {
//     fontSize: 16,
//     color: "#333",
//   },
//   detailValue: {
//     fontSize: 16,
//     color: "#333",
//   },
//   sizeValue: {
//     color: "#ff0000",
//     fontWeight: "500",
//   },
//   footer: {
//     flexDirection: "row",
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: "#f0f0f0",
//   },
//   messageButton: {
//     flex: 1,
//     backgroundColor: "#ff0000",
//     paddingVertical: 12,
//     borderRadius: 24,
//     marginRight: 12,
//     alignItems: "center",
//   },
//   messageButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//     fontSize: 16,
//   },
//   likeButton: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: "#f8f8f8",
//     justifyContent: "center",
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "#e0e0e0",
//   },
// });
