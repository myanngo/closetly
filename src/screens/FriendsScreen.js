import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Dummy data - replace with real data from your backend
const DUMMY_FRIENDS = [
  { id: 1, username: 'sarah_styles', profileImage: null },
  { id: 2, username: 'emma_fashion', profileImage: null },
  { id: 3, username: 'alex_wardrobe', profileImage: null },
];

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState(DUMMY_FRIENDS);

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.addFriendButton}>
          <FontAwesome name="plus" size={16} color="#fff" style={styles.addFriendIcon} />
          <Text style={styles.addFriendText}>Add Friends</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={16} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView style={styles.friendsList}>
        {filteredFriends.map((friend) => (
          <TouchableOpacity key={friend.id} style={styles.friendItem}>
            <View style={styles.friendImageContainer}>
              {friend.profileImage ? (
                <Image source={{ uri: friend.profileImage }} style={styles.friendImage} />
              ) : (
                <FontAwesome name="user" size={24} color="#ccc" />
              )}
            </View>
            <View style={styles.friendInfo}>
              <Text style={styles.friendUsername}>@{friend.username}</Text>
              <Text style={styles.friendStats}>15 items • 8 swaps</Text>
            </View>
            <TouchableOpacity style={styles.messageButton}>
              <FontAwesome name="envelope" size={16} color="#ff0000" />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFriendIcon: {
    marginRight: 8,
  },
  addFriendText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  friendsList: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  friendImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  friendStats: {
    fontSize: 14,
    color: '#666',
  },
  messageButton: {
    padding: 8,
  },
}); 