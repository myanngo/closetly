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
      }
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchUserItems = async () => {
      if (showOfferModal && selectedOption === "swap" && currentUsername) {
        const { data, error } = await supabase
          .from("posts")
          .select("id, title, brand, size")
          .eq("giver", currentUsername)
          .is("receiver", null);
        if (!error && data) setUserItems(data);
      }
    };
    fetchUserItems();
  }, [showOfferModal, selectedOption, currentUsername]);

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
    if (selectedOption === "lend" && !(selectedDuration || customLendDuration)) {
      setOfferError("Please select or enter a lend duration.");
      return;
    }
    if (selectedOption === "lend" && selectedDuration === "other" && !customLendDuration.trim()) {
      setOfferError("Please enter a custom lend duration.");
      return;
    }
    if (selectedOption === "swap" && !selectedSwapItem) {
      setOfferError("Please select one of your items to swap.");
      return;
    }
    setOfferLoading(true);
    try {
      const lendDurationVal = selectedOption === "lend"
        ? (selectedDuration === "other" ? customLendDuration : selectedDuration)
        : null;
      const swapItemIdVal = selectedOption === "swap" ? selectedSwapItem : null;
      const { error } = await supabase.from("swap_offers").insert({
        item_id: item.id,
        from_user: currentUsername,
        to_user: currentOwner,
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
        {currentUsername && currentUsername !== currentOwner && (
          <button className="swap-btn" onClick={() => setShowOfferModal(true)}>
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

      {showOfferModal && (
        <div
          className="offer-modal-backdrop"
          onClick={() => setShowOfferModal(false)}
        >
          <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                marginBottom: 16,
                fontSize: "1.7rem",
                fontWeight: 400,
                letterSpacing: "-1px",
              }}
            >
              Make offer for:{" "}
              <span style={{ color: "#b85c5c" }}>{item.title}</span>
            </h2>
            <div style={{ marginBottom: 16 }}>
              <b>How would you like to get this item?</b>
              <div className="offer-options-list">
                {item.available_for &&
                  item.available_for.map((option) => (
                    <label key={option} className="offer-option">
                      <input
                        type="radio"
                        name="offer-type"
                        value={option}
                        checked={selectedOption === option}
                        onChange={() => {
                          setSelectedOption(option);
                          setSelectedDuration("");
                          setCustomLendDuration("");
                          setSelectedSwapItem("");
                        }}
                      />
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </label>
                  ))}
              </div>
            </div>
            {selectedOption === "lend" && (
              <div style={{ marginBottom: 16 }}>
                <b>Choose a lend duration:</b>
                <div className="offer-options-list lend-options-grid">
                  {["1 day", "3 day", ...(item.lend_duration_options || [])]
                    .filter((v, i, arr) => arr.indexOf(v) === i) // unique
                    .map((duration) => (
                      <label key={duration} className="offer-option">
                        <input
                          type="radio"
                          name="lend-duration"
                          value={duration}
                          checked={selectedDuration === duration}
                          onChange={() => {
                            setSelectedDuration(duration);
                            setCustomLendDuration("");
                          }}
                        />
                        {duration}
                      </label>
                    ))}
                  <label className="offer-option lend-other-option">
                    <input
                      type="radio"
                      name="lend-duration"
                      value="other"
                      checked={selectedDuration === "other"}
                      onChange={() => setSelectedDuration("other")}
                    />
                    Other:
                    {selectedDuration === "other" && (
                      <input
                        type="text"
                        className="custom-lend-input"
                        placeholder="Enter custom"
                        value={customLendDuration}
                        onChange={(e) => setCustomLendDuration(e.target.value)}
                        style={{
                          marginLeft: 8,
                          borderRadius: 4,
                          border: "1px solid #ccc",
                          padding: "2px 6px",
                          width: 120,
                          fontSize: "1.1rem",
                        }}
                      />
                    )}
                  </label>
                </div>
              </div>
            )}
            {selectedOption === "swap" && (
              <div style={{ marginBottom: 16 }}>
                <b>Pick one of your items to swap:</b>
                <div className="offer-options-list">
                  {userItems.length === 0 ? (
                    <div style={{ color: "#888", fontStyle: "italic" }}>
                      You have no available items to swap.
                    </div>
                  ) : (
                    userItems.map((item) => (
                      <label key={item.id} className="offer-option">
                        <input
                          type="radio"
                          name="swap-item"
                          value={item.id}
                          checked={selectedSwapItem === String(item.id)}
                          onChange={() => setSelectedSwapItem(String(item.id))}
                        />
                        {item.title} {item.brand && `(${item.brand})`}{" "}
                        {item.size && `- Size ${item.size}`}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <b>Message (optional):</b>
              <textarea
                className="offer-message-input"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                placeholder="Add a message to the current owner! What do you like about this piece? Where will you wear it?"
                rows={4}
                style={{
                  width: "90%",
                  borderRadius: 6,
                  border: "1px solid #ccc",
                  padding: 16,
                  fontSize: "1.1rem",
                  minHeight: 90,
                }}
              />
            </div>
            {offerError && (
              <div style={{ color: "#c83f3f", marginBottom: 10, fontWeight: 500 }}>{offerError}</div>
            )}
            {offerSuccess && (
              <div style={{ color: "#2e8b57", marginBottom: 10, fontWeight: 500 }}>{offerSuccess}</div>
            )}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setShowOfferModal(false)}
                style={{
                  background: "#eee",
                  color: "#b85c5c",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 22px",
                  fontWeight: 500,
                  fontSize: "1.13rem",
                }}
                disabled={offerLoading}
              >
                Cancel
              </button>
              <button
                style={{
                  background: "#b85c5c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 22px",
                  fontWeight: 500,
                  fontSize: "1.13rem",
                  opacity: offerLoading ? 0.7 : 1,
                  cursor: offerLoading ? "not-allowed" : "pointer",
                }}
                onClick={handleSubmitOffer}
                disabled={offerLoading}
              >
                {offerLoading ? "Sending..." : "Make an offer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetail;
