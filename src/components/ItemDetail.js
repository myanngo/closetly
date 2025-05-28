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
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [userItems, setUserItems] = useState([]);
  const [selectedSwapItem, setSelectedSwapItem] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [customLendDuration, setCustomLendDuration] = useState("");
  const [offerLoading, setOfferLoading] = useState(false);
  const [offerError, setOfferError] = useState("");
  const [offerSuccess, setOfferSuccess] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [username, setUsername] = useState("");
  const [itemDetails, setItemDetails] = useState(null);
  const [itemFetchError, setItemFetchError] = useState(false);

  useEffect(() => {
    // Fetch item details from items table
    const fetchItemDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("items")
          .select("*")
          .eq("id", Number(itemId))
          .single();
        if (error || !data) {
          setItemFetchError(true);
        } else {
          setItemDetails(data);
          setItemFetchError(false);
        }
      } catch (err) {
        setItemFetchError(true);
      }
    };
    if (itemId) fetchItemDetails();
  }, [itemId]);

  useEffect(() => {
    const fetchItemData = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all posts with the same item_id
        const { data: postsData, error: postsError } = await supabase
          .from("posts")
          .select("*")
          .eq("item_id", Number(itemId))
          .order("created_at", { ascending: true });

        if (postsError) {
          console.error("Error fetching posts:", postsError);
          setError("Failed to load item data");
          return;
        }

        setAllItemPosts(postsData || []);

        if (!postsData || postsData.length === 0) {
          // Don't set error here, let item fetch handle 'item not found'
          return;
        }

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
            id: latestStoryPost.id,
            user: latestStoryPost.receiver || latestStoryPost.giver,
            text: latestStoryPost.story,
            photo: latestStoryPost.picture,
            created_at: latestStoryPost.created_at,
            giver: latestStoryPost.giver,
            receiver: latestStoryPost.receiver,
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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();
        if (userData) setCurrentUsername(userData.username);
        setAuthUser(user);
      }
    };
    fetchCurrentUser();
  }, []);

  // Fetch user's own items for swap (from items table)
  useEffect(() => {
    const fetchUserItems = async () => {
      if (showOfferModal && selectedOption === "swap" && currentUsername) {
        const { data, error } = await supabase
          .from("items")
          .select("id, title, brand, size")
          .eq("current_owner", currentUsername);
        if (!error && data) setUserItems(data);
      }
    };
    fetchUserItems();
  }, [showOfferModal, selectedOption, currentUsername]);

  // Fetch comments for the latest story
  useEffect(() => {
    const fetchComments = async () => {
      if (!latestStory) return;
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, user_id, username, text, created_at")
        .eq("post_id", latestStory.id)
        .order("created_at", { ascending: true });
      setComments(commentsData || []);
    };
    fetchComments();
  }, [latestStory]);

  // Add comment logic
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authUser || !latestStory) return;
    await supabase.from("comments").insert({
      post_id: latestStory.id,
      user_id: authUser.id,
      username: username || "",
      text: newComment.trim(),
    });
    setNewComment("");
    // Refetch comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, user_id, username, text, created_at")
      .eq("post_id", latestStory.id)
      .order("created_at", { ascending: true });
    setComments(commentsData || []);
  };

  const handleStyleInput = () => {
    //TODO
    navigate(`/item/${itemId}/style-input`);
  };

  const handleOfferSwap = () => {
    // TODO
    navigate(`/item/${itemId}/offer-swap`);
  };

  const handleSubmitOffer = async () => {
    setOfferError("");
    setOfferSuccess("");
    if (!selectedOption) {
      setOfferError("Please select how you'd like to get this item.");
      return;
    }
    if (
      selectedOption === "lend" &&
      !(selectedDuration || customLendDuration)
    ) {
      setOfferError("Please select or enter a lend duration.");
      return;
    }
    if (
      selectedOption === "lend" &&
      selectedDuration === "other" &&
      !customLendDuration.trim()
    ) {
      setOfferError("Please enter a custom lend duration.");
      return;
    }
    if (selectedOption === "swap" && !selectedSwapItem) {
      setOfferError("Please select one of your items to swap.");
      return;
    }
    setOfferLoading(true);
    try {
      const lendDurationVal =
        selectedOption === "lend"
          ? selectedDuration === "other"
            ? customLendDuration
            : selectedDuration
          : null;
      const swapItemIdVal = selectedOption === "swap" ? selectedSwapItem : null;
      const { error } = await supabase.from("swap_offers").insert({
        item_id: itemId,
        from_user: currentUsername,
        to_user: currentOwner, // always use the current owner
        status: "pending",
        offer_type: selectedOption,
        swap_item_id: swapItemIdVal,
        lend_duration: lendDurationVal,
        message: offerMessage,
      });
      if (error) {
        setOfferError(error.message || "Failed to submit offer.");
      } else {
        setOfferSuccess("Offer sent! The owner will be notified.");
        setTimeout(() => {
          setShowOfferModal(false);
          setOfferSuccess("");
          setSelectedOption("");
          setSelectedDuration("");
          setCustomLendDuration("");
          setSelectedSwapItem("");
          setOfferMessage("");
        }, 1200);
      }
    } catch (err) {
      setOfferError("An error occurred. Please try again.");
    } finally {
      setOfferLoading(false);
    }
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

  if (
    (itemFetchError && !itemDetails) ||
    (!itemDetails && !allItemPosts.length)
  ) {
    return (
      <div className="item-detail-fullscreen">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
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

      {itemDetails && (
        <div
          style={{
            fontWeight: 600,
            fontSize: "1.5em",
            margin: "2px 0",
            fontFamily: "Instrument Serif",
            color: "#ff3b3f",
            marginBottom: "1rem",
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          {itemDetails.title}
        </div>
      )}

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
          <div className="item-detail-label">
            Latest Story
            <span
              style={{
                fontSize: "0.9rem",
                color: "#666",
                marginLeft: "10px",
                fontWeight: "normal",
              }}
            ></span>
          </div>
          <Postcard
            user={
              latestStory.receiver
                ? `@${latestStory.giver} → @${latestStory.receiver}`
                : `@${latestStory.giver}`
            }
            text={latestStory.text}
            image={latestStory.photo}
            initialLikes={0}
            hideActions={false}
            post_id={item.item_id}
            id={latestStory.id}
            created_at={latestStory.created_at}
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
        {currentUsername && currentUsername === currentOwner && (
          <button
            className="add-story-btn black-btn"
            onClick={() => navigate(`/add?itemId=${itemId}`)}
          >
            <FontAwesomeIcon icon={faPlus} /> add a story
          </button>
        )}
        {currentUsername && currentUsername !== currentOwner && (
          <button
            className="swap-btn black-btn"
            onClick={() => handleOfferSwap(itemId)}
          >
            <FontAwesomeIcon icon={faExchangeAlt} /> make offer
          </button>
        )}
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
