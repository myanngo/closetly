import React from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSignOutAlt,
  faEdit,
  faArrowLeft,
  faTimes,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [numSwaps, setNumSwaps] = useState(0);
  const [numStories, setNumStories] = useState(0);
  const [numSuggestions, setNumSuggestions] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendDetails, setFriendDetails] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showFriendManagementModal, setShowFriendManagementModal] =
    useState(false);

  const navigate = useNavigate();

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("Please log in to view your profile");
          return;
        }

        // Get user profile data
        const { data: userData, error: fetchError } = await supabase
          .from("users")
          .select()
          .eq("id", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching user data:", fetchError);
          setError("Failed to load profile data");
          return;
        }

        // Set user profile data
        setName(userData.full_name || "");
        setBio(userData.bio || "");
        setNewBio(userData.bio || "");
        setUsername(userData.username || "");
        console.log("User's friends array from database:", userData.friends);
        setFriends(userData.friends || []);
        setBlockedUsers(userData.blocked_users || []);

        // Fetch statistics
        // 1. Swaps made (accepted offers from this user)
        const { count: swapsCount } = await supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("from_user", userData.username)
          .eq("status", "accepted");
        setNumSwaps(swapsCount || 0);

        // 2. Stories logged (posts by this user)
        const { count: storiesCount } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("giver", userData.username);
        setNumStories(storiesCount || 0);

        // 3. Style suggestions (comments by this user)
        const { count: suggestionsCount } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("username", userData.username);
        setNumSuggestions(suggestionsCount || 0);

        // Fetch friend details for the row
        if (userData.friends && userData.friends.length > 0) {
          console.log("Fetching details for friends:", userData.friends);
          const { data: friendsData, error: friendsError } = await supabase
            .from("users")
            .select("username, full_name")
            .in("username", userData.friends);

          if (friendsError) {
            console.error("Error fetching friend details:", friendsError);
            setFriendDetails([]);
          } else {
            console.log("Successfully fetched friend details:", friendsData);
            setFriendDetails(friendsData);
          }
        } else {
          console.log("No friends found in user data");
          setFriendDetails([]);
        }

        // Fetch pending friend requests
        const { data: requestsData, error: requestsError } = await supabase
          .from("friend_requests")
          .select("*")
          .eq("to_username", userData.username)
          .eq("status", "pending");

        if (!requestsError && requestsData) {
          setPendingRequests(requestsData);
        }

        // Fetch user's current items
        const { data: itemData, error: postsError } = await supabase
          .from("items")
          .select("*")
          .eq("current_owner", userData.username)
          .order("created_at", { ascending: false });

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          setError("Failed to load your items");
          return;
        }

        // For each item, fetch the picture from the posts table using latest_post_id
        let itemsWithPics = itemData;
        if (itemData && itemData.length > 0) {
          const postIds = itemData
            .map((item) => item.latest_post_id)
            .filter(Boolean);
          if (postIds.length > 0) {
            const { data: postsData, error: postsError2 } = await supabase
              .from("posts")
              .select("id, picture")
              .in("id", postIds);
            if (!postsError2 && postsData) {
              const picMap = {};
              postsData.forEach((post) => {
                picMap[post.id] = post.picture;
              });
              itemsWithPics = itemData.map((item) => ({
                ...item,
                picture: picMap[item.latest_post_id] || null,
              }));
            }
          }
        }
        setCurrentItems(itemsWithPics || []);
      } catch (err) {
        console.error("Error in fetchUserData:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0];
    return words[0][0] + " " + words[1][0];
  };

  const handleItemClick = (item) => {
    navigate(`/item/${item.id}`);
  };

  const handleBioSave = async () => {
    setEditing(false);
    setBio(newBio);
    await supabase
      .from("users")
      .update({ bio: newBio })
      .eq("username", username);
  };

  // Friend search modal logic
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setAddingFriend(true);
    try {
      // First get all users that match the search query (case-insensitive)
      const { data: searchData, error: searchError } = await supabase
        .from("users")
        .select("username, full_name")
        .ilike("username", `%${searchQuery.trim().toLowerCase()}%`)
        .neq("username", username); // Don't show current user

      if (searchError) throw searchError;

      // Then filter out blocked users
      const filteredResults = searchData.filter(
        (user) => !blockedUsers.includes(user.username)
      );

      // Check which users have pending requests
      const { data: pendingData, error: pendingError } = await supabase
        .from("friend_requests")
        .select("to_username")
        .eq("from_username", username)
        .eq("status", "pending");

      if (!pendingError && pendingData) {
        const pendingUsernames = pendingData.map((req) => req.to_username);
        // Mark users with pending requests
        const resultsWithStatus = filteredResults.map((user) => ({
          ...user,
          requestSent: pendingUsernames.includes(user.username),
        }));
        setSearchResults(resultsWithStatus);
        console.log(resultsWithStatus);
      } else {
        setSearchResults(filteredResults);
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setSearchResults([]);
    } finally {
      setAddingFriend(false);
    }
  };

  const handleSendFriendRequest = async (friendUsername) => {
    try {
      const { error } = await supabase.from("friend_requests").insert({
        from_username: username,
        to_username: friendUsername,
        status: "pending",
      });

      if (error) throw error;

      // Update UI to show pending request
      setSearchResults((prev) =>
        prev.map((user) =>
          user.username === friendUsername
            ? { ...user, requestSent: true }
            : user
        )
      );
    } catch (err) {
      console.error("Error sending friend request:", err);
    }
  };

  const handleAcceptRequest = async (requestId, fromUsername) => {
    try {
      console.log("Accepting friend request from:", fromUsername);

      // Update request status
      const { error: requestError } = await supabase
        .from("friend_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (requestError) {
        console.error("Error updating request status:", requestError);
        throw requestError;
      }
      console.log("Friend request status updated to accepted");

      // Add to friends list for both users
      const newFriends = [...(friends || []), fromUsername];
      setFriends(newFriends);
      console.log("Updating current user's friends list:", newFriends);

      const { error: updateError } = await supabase
        .from("users")
        .update({ friends: newFriends })
        .eq("username", username);

      if (updateError) {
        console.error("Error updating current user's friends:", updateError);
        throw updateError;
      }
      console.log("Current user's friends list updated successfully");

      // Update the other user's friends list
      const { data: otherUser, error: otherUserError } = await supabase
        .from("users")
        .select("friends")
        .eq("username", fromUsername)
        .single();

      if (otherUserError) {
        console.error("Error fetching other user's data:", otherUserError);
        throw otherUserError;
      }

      if (otherUser) {
        const otherUserFriends = [...(otherUser.friends || []), username];
        console.log("Updating other user's friends list:", otherUserFriends);

        const { error: otherUpdateError } = await supabase
          .from("users")
          .update({ friends: otherUserFriends })
          .eq("username", fromUsername);

        if (otherUpdateError) {
          console.error(
            "Error updating other user's friends:",
            otherUpdateError
          );
          console.error(
            "Full error details:",
            JSON.stringify(otherUpdateError, null, 2)
          );
          throw otherUpdateError;
        }
        console.log("Other user's friends list updated successfully");
      }

      // Remove from pending requests
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      console.log("Friend request handling completed successfully");
    } catch (err) {
      console.error("Error accepting friend request:", err);
      console.error("Full error details:", JSON.stringify(err, null, 2));
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) throw error;

      // Remove from pending requests
      setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Error rejecting friend request:", err);
    }
  };

  const handleBlockUser = async (usernameToBlock) => {
    try {
      // Add to blocked users
      const newBlockedUsers = [...blockedUsers, usernameToBlock];
      setBlockedUsers(newBlockedUsers);

      // Update database
      await supabase
        .from("users")
        .update({ blocked_users: newBlockedUsers })
        .eq("username", username);

      // Remove from friends if they were friends
      if (friends.includes(usernameToBlock)) {
        const newFriends = friends.filter((f) => f !== usernameToBlock);
        setFriends(newFriends);
        await supabase
          .from("users")
          .update({ friends: newFriends })
          .eq("username", username);
      }

      // Update friend details
      setFriendDetails((prev) =>
        prev.filter((f) => f.username !== usernameToBlock)
      );
    } catch (err) {
      console.error("Error blocking user:", err);
    }
  };

  const handleRemoveFriend = async (friendUsername) => {
    try {
      // Remove from friends list
      const newFriends = friends.filter((f) => f !== friendUsername);
      setFriends(newFriends);

      await supabase
        .from("users")
        .update({ friends: newFriends })
        .eq("username", username);

      // Update friend details
      setFriendDetails((prev) =>
        prev.filter((f) => f.username !== friendUsername)
      );
    } catch (err) {
      console.error("Error removing friend:", err);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            color: "red",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Logout icon in upper right */}
      <button
        className="logout-icon-btn"
        style={{
          position: "absolute",
          top: 18,
          right: 0,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 23,
        }}
        onClick={logOut}
        title="Log out"
      >
        <FontAwesomeIcon icon={faSignOutAlt} color="#ff3b3f" />
      </button>
      <div className="profile-header">
        <div className="avatar-placeholder" style={{ position: "relative" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: 24,
              color: "#FFFFFF",
            }}
          >
            {getInitials(name)}
          </div>
        </div>
        <div>
          <div className="profile-name">{name}</div>
          <div className="profile-username">@{username}</div>
          <div className="profile-bio">
            {editing ? (
              <>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  rows={2}
                  style={{ width: "100%", borderRadius: 8, padding: 6 }}
                />
                <button onClick={handleBioSave} style={{ marginRight: 8 }}>
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setNewBio(bio);
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>{bio}</>
            )}
          </div>
        </div>
        {/* Single edit button */}
        {!editing && (
          <button
            className="edit-profile-btn"
            style={{
              marginTop: 10,
              color: "#aaa",
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              fontSize: "0.8em",
            }}
            onClick={() => setEditing(true)}
          >
            <FontAwesomeIcon icon={faEdit} style={{ marginRight: 6 }} /> Edit
          </button>
        )}
      </div>

      <div className="profile-friends">
        <div
          className="profile-friends-label"
          style={{
            color: "#ff3b3f",
            marginBottom: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Friends</span>
          {friendDetails.length > 0 && (
            <button
              onClick={() => setShowFriendManagementModal(true)}
              style={{
                background: "none",
                border: "none",
                color: "#666",
                cursor: "pointer",
                fontSize: "0.9em",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Manage
            </button>
          )}
        </div>
        <div
          className="profile-friends-row"
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            alignItems: "center",
            paddingBottom: 8,
            paddingTop: 4,
          }}
        >
          {friendDetails.map((f) => (
            <div
              key={f.username}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 70,
                cursor: "pointer",
              }}
              onClick={() => navigate(`/profile/${f.username}`)}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "#eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "#666",
                  border: "2px solid #fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                {f.full_name ? getInitials(f.full_name) : f.username[0]}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#444",
                  marginTop: 6,
                  textAlign: "center",
                  maxWidth: 70,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                {f.full_name || f.username}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#888",
                  textAlign: "center",
                  maxWidth: 70,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                @{f.username}
              </div>
            </div>
          ))}
          {/* Add friend button */}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "2px dashed #ff3b3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ff3b3f",
              fontSize: 24,
              cursor: "pointer",
              minWidth: 50,
              alignSelf: "flex-start",
            }}
            onClick={() => setShowFriendsModal(true)}
            title="Add friend"
          >
            +
          </div>
        </div>
      </div>

      <div className="profile-items-carousel">
        <div className="carousel-label">
          Current Items ({currentItems.length})
        </div>
        <div className="carousel-scroll">
          {currentItems.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "#666",
                fontStyle: "italic",
              }}
            >
              No items posted yet.
              <span
                style={{
                  color: "#007bff",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={() => navigate("/add")}
              >
                Add your first item!
              </span>
            </div>
          ) : (
            currentItems.map((item) => (
              <div
                className="carousel-item"
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{ cursor: "pointer" }}
              >
                <div
                  className="carousel-item-img"
                  style={{
                    backgroundImage: item.picture
                      ? `url(${item.picture})`
                      : "none",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundColor: item.picture ? "transparent" : "#f0f0f0",
                  }}
                >
                  {!item.picture && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "#999",
                        fontSize: "12px",
                      }}
                    >
                      No Image
                    </div>
                  )}
                </div>
                <div className="carousel-item-name">{item.title}</div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginTop: "4px",
                  }}
                >
                  {item.brand && `${item.brand} • `}
                  {item.size && `Size ${item.size}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="profile-stats">
        <div>
          <span className="stat-number">{numSwaps}</span> swaps made
        </div>
        <div>
          <span className="stat-number">{numStories}</span> stories logged
        </div>
        <div>
          <span className="stat-number">{numSuggestions}</span> style
          suggestions offered
        </div>
      </div>

      {/* Friends Modal */}
      {showFriendsModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowFriendsModal(false)}
        >
          <div
            className="profile-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile-modal-close"
              onClick={() => setShowFriendsModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h2 style={{ color: "#ff3b3f", fontSize: "2rem" }}>Find Friends</h2>
            <p style={{ marginTop: "-1.5em" }}> Who do you want to discover?</p>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    color: "#666",
                    fontSize: "1.1rem",
                    marginBottom: 10,
                  }}
                >
                  Pending Requests
                </h3>
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 10,
                      padding: 10,
                      background: "#f5f5f5",
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                      }}
                    >
                      {request.from_username[0]}
                    </div>
                    <span>@{request.from_username}</span>
                    <div
                      style={{ marginLeft: "auto", display: "flex", gap: 8 }}
                    >
                      <button
                        onClick={() =>
                          handleAcceptRequest(request.id, request.from_username)
                        }
                        style={{
                          background: "#4CAF50",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        style={{
                          background: "#f44336",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 4,
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username"
                style={{
                  width: "90%",
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 30,
                  border: "1px solid #ccc",
                  alignSelf: "center",
                  fontSize: "0.8em",
                }}
              />
              <button
                onClick={handleSearch}
                disabled={addingFriend}
                className="profile-modal-search-btn"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </button>
            </div>
            <div>
              {searchResults.length === 0 && searchQuery && !addingFriend && (
                <div style={{ color: "#888", fontStyle: "italic" }}>
                  No users found.
                </div>
              )}
              {searchResults.map((user) => (
                <div
                  key={user.username}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                    }}
                  >
                    {user.full_name
                      ? getInitials(user.full_name)
                      : user.username[0]}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>
                      {user.full_name || user.username}
                    </div>
                    <div style={{ color: "#888", fontSize: 13, marginTop: 2 }}>
                      @{user.username}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(user.username)}
                    disabled={
                      user.requestSent || friends.includes(user.username)
                    }
                    style={{
                      marginLeft: "auto",
                      background: "#000",
                      borderRadius: 30,
                      fontSize: "0.9em",
                      color: "#FFFFFF",
                      fontFamily: "Manrope",
                      padding: "10px 10px",
                    }}
                  >
                    {user.requestSent
                      ? "Request Sent"
                      : friends.includes(user.username)
                      ? "Added"
                      : "Add Friend"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Friend Management Modal */}
      {showFriendManagementModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowFriendManagementModal(false)}
        >
          <div
            className="profile-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="profile-modal-close"
              onClick={() => setShowFriendManagementModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <h2 style={{ color: "#ff3b3f", fontSize: "2rem" }}>
              Manage Friends
            </h2>
            <div style={{ marginTop: 20 }}>
              {friendDetails.map((friend) => (
                <div
                  key={friend.username}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 15,
                    padding: 10,
                    background: "#f5f5f5",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 600,
                      fontSize: 16,
                      color: "#666",
                    }}
                  >
                    {friend.full_name
                      ? getInitials(friend.full_name)
                      : friend.username[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {friend.full_name || friend.username}
                    </div>
                    <div style={{ color: "#666", fontSize: "0.9em" }}>
                      @{friend.username}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleRemoveFriend(friend.username)}
                      style={{
                        background: "#f44336",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => handleBlockUser(friend.username)}
                      style={{
                        background: "#666",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
