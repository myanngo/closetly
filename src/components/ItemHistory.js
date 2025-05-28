import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./ItemHistory.css";
import Postcard from "./Postcard";
import { supabase } from "../config/supabaseClient";

// Add timestamp utility function
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000)
    return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

const ItemHistory = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [itemTitle, setItemTitle] = useState("");

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from("posts")
          .select("*")
          .eq("item_id", Number(itemId))
          .order("created_at", { ascending: false }); // Changed to descending order

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        setError("Failed to load item history");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Fetch the item title
    const fetchItemTitle = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("title")
        .eq("id", Number(itemId))
        .single();
      if (!error && data) setItemTitle(data.title);
    };
    fetchItemTitle();
  }, [itemId]);

  if (loading) {
    return (
      <div className="item-history-fullscreen">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading item history...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-history-fullscreen">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
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
    <div className="item-history-fullscreen">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
      </button>

      <div className="item-history-header">
        <h1>Item History</h1>
        {itemTitle && (
          <div
            style={{
              fontWeight: 600,
              fontSize: "1.5em",
              margin: "2px 0",
              fontFamily: "Instrument Serif",
              color: "#ff3b3f",
              marginBottom: "1rem",
              fontWeight: "500",
            }}
          >
            {itemTitle}
          </div>
        )}
      </div>

      <div className="item-history-posts">
        {posts.map((post, index) => (
          <div key={post.id} className="history-post">
            <div className="history-post-header"></div>
            <Postcard
              user={
                post.receiver
                  ? `@${post.giver} → @${post.receiver}`
                  : `@${post.giver}`
              }
              text={post.story || "No story shared"}
              image={post.picture}
              initialLikes={0}
              hideActions={false}
              post_id={post.item_id}
              id={post.id}
              created_at={post.created_at}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemHistory;
