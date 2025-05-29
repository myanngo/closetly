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
  const [profilePic, setProfilePic] = useState("");
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
  const [newPicFile, setNewPicFile] = useState(null);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [addingFriend, setAddingFriend] = useState(false);

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
        setFriends(userData.friends || []);
        setNumSwaps(userData.num_swaps || 0);
        setNumStories(userData.num_stories || 0);
        setNumSuggestions(userData.num_suggestions || 0);
        setProfilePic(userData.profile_pic || "");

        // Fetch friend details for the row
        if (userData.friends && userData.friends.length > 0) {
          const { data: friendsData, error: friendsError } = await supabase
            .from("users")
            .select("username, full_name, profile_pic")
            .in("username", userData.friends);
          if (!friendsError && friendsData) {
            setFriendDetails(friendsData);
          } else {
            setFriendDetails([]);
          }
        } else {
          setFriendDetails([]);
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

  const handlePicSave = async () => {
    if (!newPicFile) return;
    // Upload image to storage (implement as needed)
    const fileExt = newPicFile.name.split(".").pop();
    const fileName = `${username}-profile.${fileExt}`;
    const filePath = `profile/${fileName}`;
    const { error: uploadError } = await supabase.storage
      .from("profile")
      .upload(filePath, newPicFile, { upsert: true });
    if (!uploadError) {
      const { data } = supabase.storage.from("profile").getPublicUrl(filePath);
      setProfilePic(data.publicUrl);
      await supabase
        .from("users")
        .update({ profile_pic: data.publicUrl })
        .eq("username", username);
    }
    setEditing(false);
    setNewPicFile(null);
  };

  // Friend search modal logic
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setAddingFriend(true);
    const { data, error } = await supabase
      .from("users")
      .select("username, full_name")
      .ilike("username", `%${searchQuery.trim()}%`);
    setSearchResults(data || []);
    setAddingFriend(false);
  };

  const handleAddFriend = async (friendUsername) => {
    if (friends.includes(friendUsername)) return;
    const newFriends = [...friends, friendUsername];
    setFriends(newFriends);
    await supabase
      .from("users")
      .update({ friends: newFriends })
      .eq("username", username);
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
          {profilePic ? (
            <img
              src={profilePic}
              alt="profile"
              className="profile-pic-img"
              style={{ width: 64, height: 64, borderRadius: "50%" }}
            />
          ) : (
            getInitials(name)
          )}
          {editing && (
            <input
              type="file"
              accept="image/*"
              style={{ position: "absolute", bottom: 0, right: 0 }}
              onChange={(e) => setNewPicFile(e.target.files[0])}
            />
          )}
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
                    setNewPicFile(null);
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
          style={{ color: "#ff3b3f", marginBottom: 8 }}
        >
          Friends
        </div>
        <div
          className="profile-friends-row"
          style={{
            display: "flex",
            gap: 18,
            overflowX: "auto",
            alignItems: "center",
            paddingBottom: 8,
          }}
        >
          {friendDetails.map((f) => (
            <div
              key={f.username}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minWidth: 60,
              }}
            >
              {f.profile_pic ? (
                <img
                  src={f.profile_pic}
                  alt="pfp"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
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
                  {f.full_name ? getInitials(f.full_name) : f.username[0]}
                </div>
              )}
              <div
                style={{
                  fontSize: 12,
                  color: "#444",
                  marginTop: 2,
                  textAlign: "center",
                  maxWidth: 60,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {f.full_name || f.username}
              </div>
            </div>
          ))}
          {/* Add friend button */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px dashed #ff3b3f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ff3b3f",
              fontSize: 22,
              cursor: "pointer",
              minWidth: 40,
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
            <p style={{ marginTop: "-1.5em" }}> Search for people you know!</p>
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
                  <span>@{user.username}</span>
                  <button
                    onClick={() => handleAddFriend(user.username)}
                    disabled={friends.includes(user.username)}
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
                    {friends.includes(user.username) ? "Added" : "Add Friend"}
                  </button>
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
