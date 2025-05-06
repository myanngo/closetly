import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Platform,
  ActionSheetIOS,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const ITEM_TYPES = [
  'Shirt', 'Pants', 'Shoes', 'Dress', 'Jacket', 'Skirt', 'Shorts', 
  'Sweater', 'Hoodie', 'Blazer', 'Coat', 'T-shirt', 'Jeans', 'Suit',
  'Accessory', 'Bag', 'Hat', 'Scarf', 'Gloves', 'Socks'
];

const SIZES = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  'US 4', 'US 6', 'US 8', 'US 10', 'US 12', 'US 14', 'US 16',
  'EU 32', 'EU 34', 'EU 36', 'EU 38', 'EU 40', 'EU 42', 'EU 44',
  'UK 4', 'UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16'
];

const BRANDS = [
  'Nike', 'Adidas', 'Zara', 'Uniqlo', 'H&M', 'Gap', 'Levi\'s', 'Gucci',
  'Louis Vuitton', 'Prada', 'Balenciaga', 'Supreme', 'Off-White',
  'Ralph Lauren', 'Tommy Hilfiger', 'Calvin Klein', 'Michael Kors',
  'Coach', 'Kate Spade', 'Forever 21', 'Urban Outfitters', 'ASOS',
  'Topshop', 'Mango', 'Pull&Bear', 'Bershka', 'Other'
];

export default function UploadItemScreen() {
  const navigation = useNavigation();
  const [photos, setPhotos] = useState([null, null, null]);
  const [story, setStory] = useState('');
  const [pickerIndex, setPickerIndex] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Show action sheet/modal for photo picking
  const showPhotoPicker = (index) => {
    setPickerIndex(index);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Upload from Gallery'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) await takePhoto(index);
          if (buttonIndex === 2) await pickImage(index);
        }
      );
    } else {
      setShowModal(true);
    }
  };

  // Camera
  const takePhoto = async (index) => {
    setShowModal(false);
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  // Gallery
  const pickImage = async (index) => {
    setShowModal(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const newPhotos = [...photos];
      newPhotos[index] = result.assets[0].uri;
      setPhotos(newPhotos);
    }
  };

  const canProceed = photos.some(Boolean);

  const handleClose = () => {
    Alert.alert(
      'Are you sure?',
      'Exiting will delete your post in progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => navigation.navigate('HomeTab') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color="#222" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={32} color="#ff0000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.heading}>Upload an item</Text>
          <View style={styles.mainPhotoContainer}>
            <TouchableOpacity style={styles.mainPhotoBox} onPress={() => showPhotoPicker(0)}>
              {photos[0] ? (
                <Image source={{ uri: photos[0] }} style={styles.photoImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <FontAwesome5 name="female" size={96} color="#bbb" style={{ marginBottom: 10 }} />
                  <Text style={styles.photoTextMain}>Upload an outfit with this item!</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.photoRowSquares}>
            {[1,2,3].map(i => (
              <TouchableOpacity key={i} style={styles.photoBoxSmallSquare} onPress={() => showPhotoPicker(i)}>
                {photos[i] ? (
                  <Image source={{ uri: photos[i] }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <FontAwesome5 name="camera" size={36} color="#bbb" />
                    <FontAwesome5 name="plus" size={18} color="#bbb" style={{ position: 'absolute', right: 10, bottom: 10 }} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.storyLabel}>Story</Text>
          <TextInput
            style={styles.storyInput}
            placeholder="Tell us a bit more about this piece. Where have you worn it? Where'd you get it? What does it mean to you?"
            placeholderTextColor="#bbb"
            multiline
            value={story}
            onChangeText={setStory}
          />
          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
            onPress={() => navigation.navigate('AddDetails', { photos, story })}
            disabled={!canProceed}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
        {/* Android modal for photo picker */}
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowModal(false)}>
            <View style={styles.modalSheet}>
              <TouchableOpacity style={styles.modalOption} onPress={() => takePhoto(pickerIndex)}>
                <FontAwesome name="camera" size={20} color="#222" />
                <Text style={styles.modalOptionText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => pickImage(pickerIndex)}>
                <FontAwesome name="image" size={20} color="#222" />
                <Text style={styles.modalOptionText}>Upload from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    flexGrow: 1,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 32,
    color: '#d00',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  mainPhotoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainPhotoBox: {
    width: '92%',
    aspectRatio: 1,
    backgroundColor: '#fdfaf2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoRowSquares: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: '4%',
    marginBottom: 28,
  },
  photoBoxSmallSquare: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#fdfaf2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  photoTextMain: {
    color: '#bbb',
    fontFamily: 'CircularStd-Book',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  storyLabel: {
    fontFamily: 'CircularStd-Bold',
    fontSize: 18,
    color: '#111',
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 2,
  },
  storyInput: {
    minHeight: 120,
    borderWidth: 2,
    borderColor: '#bbb',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    fontFamily: 'CircularStd-Book',
    fontSize: 15,
    marginBottom: 24,
    marginHorizontal: 2,
    textAlignVertical: 'top',
    borderStyle: 'dashed',
  },
  nextButton: {
    backgroundColor: '#d00',
    borderRadius: 22,
    position: 'absolute',
    right: 24,
    bottom: 32,
    paddingHorizontal: 32,
    paddingVertical: 10,
    zIndex: 2,
  },
  nextButtonDisabled: {
    backgroundColor: '#eee',
  },
  nextButtonText: {
    color: '#fff',
    fontFamily: 'CircularStd-Bold',
    fontSize: 18,
  },
  // Modal styles for Android
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 32,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalOptionText: {
    fontFamily: 'CircularStd-Book',
    fontSize: 16,
    marginLeft: 12,
    color: '#222',
  },
  modalCancel: {
    marginTop: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#d00',
    fontFamily: 'CircularStd-Bold',
    fontSize: 16,
  },
}); 