import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userFriends, setUserFriends] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      setError("");
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Please log in to view your friends");
          return;
        }
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("friends")
          .eq("id", user.id)
          .single();
        if (userDataError) {
          setError("Failed to load friends");
          return;
        }
        setUserFriends(userData.friends || []);
        if (userData.friends && userData.friends.length > 0) {
          const { data: friendsData, error: friendsError } = await supabase
            .from("users")
            .select("username, full_name, profile_pic")
            .in("username", userData.friends);
          if (friendsError) {
            setError("Failed to load friends");
            return;
          }
          setFriends(friendsData || []);
        } else {
          setFriends([]);
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const getInitials = (name) => {
    if (!name) return "";
    const words = name.trim().split(" ");
    if (words.length === 1) return words[0][0];
    return words[0][0] + " " + words[1][0];
  };

  return (
    <div className="friends-page" style={{ padding: 24, maxWidth: 400, margin: "auto" }}>
      <button
        style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", marginBottom: 18 }}
        onClick={() => navigate("/profile")}
      >
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>
      <h2 style={{ color: "#ff3b3f", marginBottom: 18 }}>Your Friends</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : friends.length === 0 ? (
        <div style={{ color: "#888", fontStyle: "italic" }}>You have no friends yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {friends.map((f) => (
            <div key={f.username} style={{ display: "flex", alignItems: "center", gap: 12, background: "#faf9f7", borderRadius: 8, padding: 10 }}>
              {f.profile_pic ? (
                <img src={f.profile_pic} alt="pfp" style={{ width: 40, height: 40, borderRadius: "50%" }} />
              ) : (
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                  {f.full_name ? getInitials(f.full_name) : f.username[0]}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600 }}>{f.full_name || f.username}</div>
                <div style={{ color: "#888", fontSize: 13 }}>@{f.username}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends; 