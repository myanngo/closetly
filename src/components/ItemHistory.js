import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./ItemHistory.css";
import Postcard from "./Postcard";
import { supabase } from "../config/supabaseClient";

const ItemHistory = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [itemTitle, setItemTitle] = useState("");
  const [allItemPosts, setAllItemPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchItemHistory = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all posts with the same post_id, ordered by creation date
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("post_id", Number(itemId))
          .order("created_at", { ascending: true }); // Oldest first to show chronological history

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          setError("Failed to load item history");
          return;
        }

        if (!postsData || postsData.length === 0) {
          setError("Item not found");
          return;
        }

        setAllItemPosts(postsData);

        // Set the item title from the first post (original post)
        setItemTitle(postsData[0].title || "Unknown Item");
      } catch (err) {
        console.error("Error in fetchItemHistory:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemHistory();
    }
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

  // Filter posts that have stories to display
  const postsWithStories = allItemPosts.filter(
    (post) => post.story && post.story.trim() !== ""
  );

  return (
    <div className="item-history-fullscreen">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
      </button>
      <div className="item-history-title">
        Item History
        <br />
        <span className="item-history-sub">{itemTitle}</span>
      </div>

      {postsWithStories.length > 0 ? (
        <div className="item-history-list">
          {postsWithStories.map((post, idx) => {
            // Determine the user who created this story post
            const storyUser = post.receiver || post.giver;

            return (
              <Postcard
                key={`${post.id}-${idx}`}
                user={`@${storyUser}`}
                text={post.story}
                image={post.picture}
                initialLikes={0}
                hideActions={false}
                post_id={post.post_id}
              />
            );
          })}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "50px",
            fontStyle: "italic",
            color: "#666",
          }}
        >
          No stories have been shared for this item yet.
        </div>
      )}
    </div>
  );
};

export default ItemHistory;
