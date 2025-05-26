import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faExchangeAlt,
  faPlus,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import "./ItemDetail.css";
import Postcard from "./Postcard";
import { supabase } from "../config/supabaseClient";

const ItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [allItemPosts, setAllItemPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentOwner, setCurrentOwner] = useState("");
  const [originalStarter, setOriginalStarter] = useState("");
  const [latestStory, setLatestStory] = useState(null);
  const [swapCount, setSwapCount] = useState(0);

  useEffect(() => {
    const fetchItemData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all posts with the same post_id
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("post_id", itemId)
          .order("created_at", { ascending: true }); // Oldest first to find starter

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          setError("Failed to load item data");
          return;
        }

        if (!postsData || postsData.length === 0) {
          setError("Item not found");
          return;
        }

        setAllItemPosts(postsData);

        // The first post is the original/starter
        const originalPost = postsData[0];
        setItem(originalPost);
        setOriginalStarter(originalPost.giver);

        // Find current owner (most recent post's receiver, or original giver if no swaps)
        const mostRecentPost = postsData[postsData.length - 1];
        const owner = mostRecentPost.receiver || mostRecentPost.giver;
        setCurrentOwner(owner);

        // Find latest story (most recent post with a story)
        const postsWithStories = postsData
          .filter((post) => post.story && post.story.trim() !== "")
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (postsWithStories.length > 0) {
          const latestStoryPost = postsWithStories[0];
          setLatestStory({
            user: latestStoryPost.receiver || latestStoryPost.giver,
            text: latestStoryPost.story,
            photo: latestStoryPost.picture,
            created_at: latestStoryPost.created_at,
          });
        }

        // Calculate swap count (number of posts - 1, since first post is original)
        setSwapCount(Math.max(0, postsData.length - 1));
      } catch (err) {
        console.error("Error in fetchItemData:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchItemData();
    }
  }, [itemId]);

  const handleStyleInput = () => {
    // Navigate to style input page - you can implement this
    navigate(`/item/${itemId}/style-input`);
  };

  const handleOfferSwap = () => {
    // Navigate to swap offer page - you can implement this
    navigate(`/item/${itemId}/offer-swap`);
  };

  if (loading) {
    return (
      <div className="item-detail-fullscreen">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading item details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="item-detail-fullscreen">
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

  if (!item) {
    return (
      <div className="item-detail-fullscreen">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <div style={{ textAlign: "center", padding: "50px" }}>
          Item not found
        </div>
      </div>
    );
  }

  return (
    <div className="item-detail-fullscreen">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
      </button>

      <div className="item-detail-header">
        <div className="item-detail-title">{item.title}</div>
        <div className="item-detail-meta">
          <span>
            <FontAwesomeIcon icon={faUser} /> <b>@{originalStarter}</b> started
            this thread
          </span>
          <span>
            <FontAwesomeIcon icon={faUser} /> <b>@{currentOwner}</b> currently
            has this piece
          </span>
        </div>
      </div>

      {latestStory ? (
        <div className="item-detail-section">
          <div className="item-detail-label">Latest Story</div>
          <Postcard
            user={`@${latestStory.user}`}
            text={latestStory.text}
            image={latestStory.photo}
            initialLikes={0}
          />
        </div>
      ) : (
        <div className="item-detail-section">
          <div className="item-detail-label">Latest Story</div>
          <div
            style={{
              padding: "20px",
              fontStyle: "italic",
              color: "#666",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
            }}
          >
            No stories shared yet for this item.
          </div>
        </div>
      )}

      <div className="item-detail-actions">
        <button className="style-btn" onClick={handleStyleInput}>
          <FontAwesomeIcon icon={faPlus} /> give style input
        </button>
        <button className="swap-btn" onClick={handleOfferSwap}>
          <FontAwesomeIcon icon={faExchangeAlt} /> offer swap
        </button>
        <button
          className="history-btn"
          onClick={() => navigate(`/item/${itemId}/history`)}
        >
          <FontAwesomeIcon icon={faRetweet} />
          see item history
        </button>
      </div>

      <div className="item-detail-swaps">
        <span className="swap-count">{swapCount}</span>
        {swapCount === 1 ? " swap has" : " swaps have"} been made with this
        item!
      </div>

      <div className="item-detail-info">
        <div className="item-detail-label">Item Details</div>
        <div>
          <b>Brand:</b> {item.brand || "Not specified"}
        </div>
        <div>
          <b>Size:</b> {item.size || "Not specified"}
        </div>
        <div>
          <b>Wear:</b> {item.wear || "Not specified"}
        </div>
        {item.story && (
          <div style={{ marginTop: "10px" }}>
            <b>Original Story:</b> {item.story}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetail;
