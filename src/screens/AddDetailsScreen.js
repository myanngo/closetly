import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { globalStyles } from "../utils/globalStyles";

const ITEM_TYPES = [
  "Shirt",
  "Pants",
  "Shoes",
  "Dress",
  "Jacket",
  "Skirt",
  "Shorts",
  "Sweater",
  "Coat",
  "Jeans",
  "Accessory",
  "Bag",
  "Other",
];

const SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "US 0",
  "US 2",
  "US 4",
  "US 6",
  "US 8",
  "US 10",
  "US 12",
  "US 14",
  "US 16",
];

const BRANDS = [
  "Nike",
  "Adidas",
  "Zara",
  "Uniqlo",
  "H&M",
  "Gap",
  "Levi's",
  "Gucci",
  "Louis Vuitton",
  "Prada",
  "Balenciaga",
  "Supreme",
  "Off-White",
  "Ralph Lauren",
  "Tommy Hilfiger",
  "Calvin Klein",
  "Michael Kors",
  "Coach",
  "Kate Spade",
  "Forever 21",
  "Urban Outfitters",
  "ASOS",
  "Topshop",
  "Mango",
  "Pull&Bear",
  "Bershka",
  "Aritzia",
  "Brandy Melville",
  "Everlane",
  "Madewell",
  "Reformation",
  "COS",
  "Muji",
  "Other",
];

const CONDITIONS = ["New", "Excellent", "Great", "Good", "Fair", "Worn"];

function SelectRow({ label, value, onPress }) {
  const getIcon = () => {
    switch (label) {
      case "Item Type":
        return (
          <FontAwesome5
            name="tshirt"
            size={16}
            color="#bbb"
            style={{ marginLeft: 6 }}
          />
        );
      case "Size":
        return (
          <FontAwesome5
            name="tape"
            size={16}
            color="#bbb"
            style={{ marginLeft: 6 }}
          />
        );
      case "Brand":
        return (
          <FontAwesome5
            name="tag"
            size={16}
            color="#bbb"
            style={{ marginLeft: 6 }}
          />
        );
      case "Condition":
        return (
          <FontAwesome5
            name="star"
            size={16}
            color="#bbb"
            style={{ marginLeft: 6 }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity style={styles.selectRow} onPress={onPress}>
      <View style={styles.selectLabelContainer}>
        <Text style={styles.selectLabel}>{label}</Text>
        {getIcon()}
      </View>
      <View style={styles.selectValueWrap}>
        <Text style={[styles.selectValue, value && styles.selectValueSelected]}>
          {value || "Select"}
        </Text>
        <FontAwesome
          name="chevron-down"
          size={16}
          color={value ? "#d00" : "#bbb"}
          style={{ marginLeft: 8 }}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function AddDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { photos = [], story } = route.params || {};
  const [itemType, setItemType] = useState("");
  const [size, setSize] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [title, setTitle] = useState("");
  const [picker, setPicker] = useState(null);
  const [brandInput, setBrandInput] = useState("");

  const canProceed =
    itemType && size && brand && condition && photos.some(Boolean) && title.trim();

  const handleSelect = (type, value) => {
    if (type === "itemType") setItemType(value);
    if (type === "size") setSize(value);
    if (type === "brand") {
      setBrand(value);
      setBrandInput("");
    }
    if (type === "condition") setCondition(value);
    setPicker(null);
  };

  const handleClose = () => {
    Alert.alert("Are you sure?", "Exiting will delete your post in progress.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Exit",
        style: "destructive",
        onPress: () => navigation.navigate("HomeTab"),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <FontAwesome name="chevron-left" size={28} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={32} color="#ff0000" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.heading, globalStyles.textBold]}>Add more details</Text>
          <View style={styles.photoBoxRow}>
            {photos.filter(Boolean).map((uri, idx) => (
              <Image key={uri} source={{ uri }} style={styles.photoBoxImg} />
            ))}
          </View>
          <View style={styles.titleContainer}>
            <TextInput
              style={[styles.titleInput, globalStyles.text]}
              placeholder="Add a title..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />
          </View>
          <View style={styles.selects}>
            <SelectRow
              label="Item Type"
              value={itemType}
              onPress={() => setPicker("itemType")}
            />
            <SelectRow
              label="Size"
              value={size}
              onPress={() => setPicker("size")}
            />
            <SelectRow
              label="Brand"
              value={brand}
              onPress={() => setPicker("brand")}
            />
            <SelectRow
              label="Condition"
              value={condition}
              onPress={() => setPicker("condition")}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed && styles.nextButtonDisabled,
            ]}
            onPress={() =>
              navigation.navigate("PreviewItem", {
                photos,
                story,
                itemType,
                size,
                brand,
                condition,
                title,
              })
            }
            disabled={!canProceed}
          >
            <Text style={[styles.nextButtonText, globalStyles.textMedium]}>
              Next
            </Text>
          </TouchableOpacity>
          {/* Simple picker modal */}
          {picker && (
            <View style={styles.pickerModal}>
              <View style={styles.pickerContent}>
                {picker === "brand" && (
                  <TextInput
                    style={styles.brandInput}
                    placeholder="Type a brand..."
                    value={brandInput}
                    onChangeText={setBrandInput}
                    onSubmitEditing={() => {
                      if (brandInput.trim())
                        handleSelect("brand", brandInput.trim());
                    }}
                    returnKeyType="done"
                  />
                )}
                <ScrollView
                  style={{ maxHeight: 220, width: "100%" }}
                  showsVerticalScrollIndicator={true}
                >
                  {(picker === "itemType"
                    ? ITEM_TYPES
                    : picker === "size"
                    ? SIZES
                    : picker === "brand"
                    ? BRANDS
                    : CONDITIONS
                  ).map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.pickerOption}
                      onPress={() => handleSelect(picker, option)}
                    >
                      <Text style={styles.pickerOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.pickerCancel}
                  onPress={() => setPicker(null)}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  heading: {
    fontFamily: "InstrumentSerif-Regular",
    fontSize: 32,
    color: "#d00",
    textAlign: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  photoBoxRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
    marginHorizontal: 2,
    justifyContent: "center",
  },
  photoBoxImg: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: "#fdfaf2",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selects: {
    marginBottom: 24,
    marginHorizontal: 2,
  },
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectLabel: {
    fontFamily: "CircularStd-Bold",
    fontSize: 15,
    color: "#222",
  },
  selectValueWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectValue: {
    fontFamily: "CircularStd-Book",
    fontSize: 15,
    color: "#bbb",
  },
  selectValueSelected: {
    color: "#d00",
    fontFamily: "CircularStd-Bold",
  },
  nextButton: {
    backgroundColor: "#d00",
    borderRadius: 22,
    alignSelf: "flex-end",
    paddingHorizontal: 32,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 16,
    marginRight: 2,
  },
  nextButtonDisabled: {
    backgroundColor: "#eee",
  },
  nextButtonText: {
    color: "#fff",
    fontFamily: "CircularStd-Bold",
    fontSize: 18,
  },
  pickerModal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  pickerContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  pickerOption: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  pickerOptionText: {
    fontFamily: "CircularStd-Book",
    fontSize: 16,
    color: "#222",
  },
  pickerCancel: {
    marginTop: 10,
  },
  pickerCancelText: {
    color: "#d00",
    fontFamily: "CircularStd-Bold",
    fontSize: 16,
  },
  brandInput: {
    fontFamily: "CircularStd-Book",
    fontSize: 16,
    color: "#222",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
    width: "100%",
  },
  titleContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  titleInput: {
    fontSize: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
