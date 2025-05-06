import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 20;

function ToggleRow({ label, options, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleOptionsHorizontal}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={styles.toggleOptionHorizontal}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.7}
          >
            <View style={[styles.toggleCircle, value === opt.value && styles.toggleCircleActive]}>
              {value === opt.value && <View style={styles.toggleDot} />}
            </View>
            <Text style={[styles.toggleOptionText, value === opt.value && styles.toggleOptionTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function PreviewItemScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const {
    photos = [], story, itemType, size, brand, condition
  } = route.params || {};
  const [market, setMarket] = useState('yes');
  const [letGo, setLetGo] = useState('give');
  const [currentIndex, setCurrentIndex] = useState(0);
  const validPhotos = photos.filter(Boolean);

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#222" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={32} color="#ff0000" />
          </TouchableOpacity>
        </View>
        <Text style={styles.heading}>Preview your item</Text>
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => setCurrentIndex(i => Math.max(i - 1, 0))}
                disabled={currentIndex === 0}
                style={{ opacity: currentIndex === 0 ? 0.3 : 1, padding: 8 }}
              >
                <FontAwesome name="chevron-left" size={32} color="#bbb" />
              </TouchableOpacity>
              {validPhotos.length > 0 ? (
                <Image
                  source={{ uri: validPhotos[currentIndex] }}
                  style={{ width: '80%', height: 320, borderRadius: 12, backgroundColor: '#fdfaf2', borderWidth: 1, borderColor: '#ddd', marginHorizontal: 8 }}
                  resizeMode="cover"
                />
              ) : null}
              <TouchableOpacity
                onPress={() => setCurrentIndex(i => Math.min(i + 1, validPhotos.length - 1))}
                disabled={currentIndex === validPhotos.length - 1}
                style={{ opacity: currentIndex === validPhotos.length - 1 ? 0.3 : 1, padding: 8 }}
              >
                <FontAwesome name="chevron-right" size={32} color="#bbb" />
              </TouchableOpacity>
            </View>
            {validPhotos.length > 1 && (
              <Text style={{ color: '#bbb', fontSize: 13, marginTop: 4 }}>
                {currentIndex + 1} / {validPhotos.length}
              </Text>
            )}
          </View>
          <Text style={styles.storyLabel}>Story</Text>
          <Text style={styles.storyText}>{story}</Text>
          <View style={styles.detailsTable}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Item Type</Text>
              <Text style={styles.detailValue}>{itemType || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{size || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Brand</Text>
              <Text style={styles.detailValue}>{brand || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Condition</Text>
              <Text style={styles.detailValue}>{condition || '-'}</Text>
            </View>
          </View>
        </View>
        <ToggleRow
          label="Put this item on the market?"
          options={[
            { label: 'Yes, list it!', value: 'yes' },
            { label: 'No, archive it', value: 'no' },
          ]}
          value={market}
          onChange={setMarket}
        />
        <ToggleRow
          label="How do you want to let this go?"
          options={[
            { label: 'Give away', value: 'give' },
            { label: 'Swap', value: 'swap' },
          ]}
          value={letGo}
          onChange={setLetGo}
        />
        <Text style={styles.infoText}>
          Others can bid or comment for this item. You'll always have the final say, and you can edit this anytime.
        </Text>
        <TouchableOpacity style={styles.postButton}>
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContent: {
    paddingHorizontal: CARD_PADDING,
    paddingBottom: 40,
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
    marginRight: 4,
  },
  closeButton: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  heading: {
    fontFamily: 'InstrumentSerif-Regular',
    fontSize: 32,
    color: '#d00',
    textAlign: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  storyLabel: {
    fontFamily: 'CircularStd-Bold',
    fontSize: 18,
    color: '#111',
    marginBottom: 8,
  },
  storyText: {
    fontFamily: 'CircularStd-Book',
    fontSize: 15,
    color: '#222',
    marginBottom: 24,
    lineHeight: 22,
  },
  detailsTable: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontFamily: 'CircularStd-Bold',
    fontSize: 15,
    color: '#222',
  },
  detailValue: {
    fontFamily: 'CircularStd-Bold',
    fontSize: 15,
    color: '#d00',
  },
  toggleRow: {
    marginBottom: 24,
  },
  toggleLabel: {
    fontFamily: 'CircularStd-Bold',
    fontSize: 15,
    color: '#111',
    marginBottom: 12,
  },
  toggleOptionsHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toggleOptionHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#eee',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCircleActive: {
    borderColor: '#d00',
    backgroundColor: '#d00',
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  toggleOptionText: {
    fontFamily: 'CircularStd-Book',
    fontSize: 15,
    color: '#888',
  },
  toggleOptionTextActive: {
    color: '#d00',
    fontFamily: 'CircularStd-Bold',
  },
  infoText: {
    fontFamily: 'CircularStd-Book',
    fontSize: 13,
    color: '#aaa',
    marginBottom: 20,
  },
  postButton: {
    backgroundColor: '#111',
    borderRadius: 22,
    alignSelf: 'flex-end',
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  postButtonText: {
    color: '#fff',
    fontFamily: 'CircularStd-Bold',
    fontSize: 18,
  },
}); 