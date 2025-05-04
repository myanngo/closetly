import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All', icon: 'th-large' },
  { id: 'size', label: 'Size', icon: 'ruler' },
  { id: 'style', label: 'Style', icon: 'tag' },
  { id: 'type', label: 'Item Type', icon: 'shopping-bag' },
  { id: 'color', label: 'Color', icon: 'paint-brush' },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState('all');

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
                selectedFilter === filter.id && styles.selectedFilterTab
              ]}
            >
              <FontAwesome 
                name={filter.icon} 
                size={16} 
                color={selectedFilter === filter.id ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.filterText,
                selectedFilter === filter.id && styles.selectedFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderPlaceholderGrid = () => {
    return (
      <View style={styles.gridContainer}>
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <View key={item} style={styles.gridItem} />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="exchange" size={24} color="#ff0000" />
        <TouchableOpacity onPress={() => navigation.navigate('Search')}>
          <FontAwesome name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {renderFilterTabs()}
      
      <ScrollView style={styles.content}>
        {renderPlaceholderGrid()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterContainer: {
    paddingVertical: 15,
  },
  filterContent: {
    paddingHorizontal: 15,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
  },
  selectedFilterTab: {
    backgroundColor: '#ff0000',
  },
  filterText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedFilterText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 0.8,
    backgroundColor: '#f8f8f8',
    margin: '1%',
    borderRadius: 10,
  },
}); 