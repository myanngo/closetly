import React from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { useEffect, useState } from "react";

const Profile = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [numSwaps, setNumSwaps] = useState(0);
  const [numStories, setNumStories] = useState(0);
  const [numSuggestions, setNumSuggestions] = useState(0);
  const [friends, setFriends] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setUsername(userData.username || "");
        setFriends(userData.friends || []);
        setNumSwaps(userData.num_swaps || 0);
        setNumStories(userData.num_stories || 0);
        setNumSuggestions(userData.num_suggestions || 0);

        // Fetch user's current posts/items
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

        setCurrentItems(itemData || []);
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
    navigate(`/item/${item.post_id}`);
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
      <div className="profile-header">
        <div className="avatar-placeholder">{getInitials(name)}</div>
        <div>
          <div className="profile-name">{name}</div>
          <div className="profile-username">@{username}</div>
          <div className="profile-bio">{bio}</div>
        </div>
      </div>

      <div className="profile-friends">
        <div className="profile-friends-label">Friends</div>
        <div className="friends-list">
          {friends.map((f, i) => (
            <div className="friend-avatar" key={i} /> // TODO: GET THEIR INITIALS TOO FOR PFP
          ))}
          <div className="friend-avatar add">+</div>
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
                key={item.post_id}
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

      <div className="log-out">
        <div onClick={() => logOut()} className="log-out-text">
          Log out
        </div>
      </div>
    </div>
  );
};

export default Profile;
