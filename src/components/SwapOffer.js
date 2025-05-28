import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faExchangeAlt } from "@fortawesome/free-solid-svg-icons";
import "./SwapOffer.css";
import { supabase } from "../config/supabaseClient";

const SwapOffer = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [targetItem, setTargetItem] = useState(null);
  const [userItems, setUserItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState("");
  const [offerType, setOfferType] = useState("swap");
  const [lendDuration, setLendDuration] = useState("");
  const [contactMethod, setContactMethod] = useState("email");
  const [contactInfo, setContactInfo] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setError("Please log in to make offers");
          return;
        }

        // Get user profile
        const { data: userData, error: userDataError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (userDataError) {
          setError("Failed to load user data");
          return;
        }

        setCurrentUser(userData);
        setContactInfo(userData.email || ""); // Default to user's email

        // Get target item details
        const { data: itemData, error: itemError } = await supabase
          .from("posts")
          .select("*")
          .eq("post_id", itemId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (itemError || !itemData || itemData.length === 0) {
          setError("Item not found");
          return;
        }

        setTargetItem(itemData[0]);

        // Get user's available items for swapping
        const { data: userItemsData, error: userItemsError } = await supabase
          .from("posts")
          .select("post_id, title, brand, size, picture")
          .eq("giver", userData.username)
          .is("receiver", null); // Only items user still owns

        if (userItemsError) {
          console.error("Error fetching user items:", userItemsError);
          setUserItems([]);
        } else {
          // Remove duplicate items (same post_id)
          const uniqueItems = userItemsData.reduce((acc, item) => {
            if (!acc.find((existing) => existing.post_id === item.post_id)) {
              acc.push(item);
            }
            return acc;
          }, []);
          setUserItems(uniqueItems);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchData();
    }
  }, [itemId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // Validation
      if (offerType === "swap" && !selectedItem) {
        throw new Error("Please select an item to swap");
      }
      if (offerType === "lend" && !lendDuration) {
        throw new Error("Please specify lending duration");
      }
      if (!contactInfo.trim()) {
        throw new Error("Please provide contact information");
      }

      // Create swap offer
      const offerData = {
        item_id: parseInt(itemId),
        from_user: currentUser.username,
        to_user: targetItem.giver,
        offer_type: offerType,
        message: message.trim() || null,
        contact_method: contactMethod,
        contact_info: contactInfo.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      };

      if (offerType === "swap") {
        offerData.swap_item_id = selectedItem;
      } else if (offerType === "lend") {
        offerData.lend_duration = lendDuration;
      }

      const { error: insertError } = await supabase
        .from("offers")
        .insert(offerData);

      if (insertError) {
        throw new Error("Failed to send offer: " + insertError.message);
      }

      // Success - navigate back
      navigate(`/`, {
        state: { message: "Swap offer sent successfully!" },
      });
    } catch (err) {
      setError(err.message || "Failed to send offer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="swap-offer-modal">
        <div className="swap-offer-content">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </button>
          <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error && !targetItem) {
    return (
      <div className="swap-offer-modal">
        <div className="swap-offer-content">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} size="lg" />
          </button>
          <div style={{ textAlign: "center", padding: "50px", color: "red" }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="swap-offer-modal">
      <div className="swap-offer-content">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>

        <h2 className="swap-offer-title">Make an Offer</h2>

        {error && (
          <div
            style={{ color: "red", marginBottom: "1rem", textAlign: "center" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="swap-offer-form">
          {/* Offer Type Selection */}
          <div className="offer-type-section">
            <h3>What type of offer?</h3>
            <div className="offer-type-buttons">
              <button
                type="button"
                className={`offer-type-btn ${
                  offerType === "swap" ? "selected" : ""
                }`}
                onClick={() => setOfferType("swap")}
              >
                Swap
              </button>
              <button
                type="button"
                className={`offer-type-btn ${
                  offerType === "lend" ? "selected" : ""
                }`}
                onClick={() => setOfferType("lend")}
              >
                Borrow
              </button>
              <button
                type="button"
                className={`offer-type-btn ${
                  offerType === "giveaway" ? "selected" : ""
                }`}
                onClick={() => setOfferType("giveaway")}
              >
                Request
              </button>
            </div>
          </div>

          {/* Target Item Display */}
          <div className="target-item-section">
            <h3>Item you want:</h3>
            <div className="item-preview">
              {targetItem?.picture ? (
                <img
                  src={targetItem.picture}
                  alt={targetItem.title}
                  className="item-image"
                />
              ) : (
                <div className="item-image placeholder" />
              )}
              <div className="item-details">
                <span className="item-name">{targetItem?.title}</span>
                <span className="item-owner">from @{targetItem?.giver}</span>
              </div>
            </div>
          </div>

          {/* Swap Item Selection */}
          {offerType === "swap" && (
            <div className="swap-items-section">
              <h3>Your item to swap:</h3>
              {userItems.length === 0 ? (
                <div style={{ fontStyle: "italic", color: "#666" }}>
                  You don't have any items available for swapping. Add some
                  items first!
                </div>
              ) : (
                <div className="items-grid">
                  {userItems.map((item) => (
                    <div
                      key={item.post_id}
                      className={`item-option ${
                        selectedItem === item.post_id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedItem(item.post_id)}
                    >
                      {item.picture ? (
                        <img
                          src={item.picture}
                          alt={item.title}
                          className="item-image"
                        />
                      ) : (
                        <div className="item-image placeholder" />
                      )}
                      <span className="item-name">{item.title}</span>
                      {item.brand && (
                        <span className="item-brand">{item.brand}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Lend Duration */}
          {offerType === "lend" && (
            <div className="lend-duration-section">
              <label htmlFor="lendDuration">
                How long would you like to borrow it?
              </label>
              <select
                id="lendDuration"
                value={lendDuration}
                onChange={(e) => setLendDuration(e.target.value)}
                required
              >
                <option value="">Select duration</option>
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="Other">Other (discuss in message)</option>
              </select>
            </div>
          )}

          {/* Message */}
          <div className="message-section">
            <label htmlFor="message">
              Add a message{" "}
              {offerType === "giveaway"
                ? "(explain why you would like this item)"
                : "(optional)"}
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                offerType === "swap"
                  ? "Why do you want to swap this item?"
                  : offerType === "lend"
                  ? "Tell them why you'd like to borrow this item"
                  : "Tell them why you'd love to have this item"
              }
              rows={3}
              required={offerType === "giveaway"}
            />
          </div>

          {/* Contact Information */}
          <div className="contact-section">
            <h3>How should they contact you if they accept?</h3>
            <div className="contact-method">
              <label>
                <input
                  type="radio"
                  value="email"
                  checked={contactMethod === "email"}
                  onChange={(e) => setContactMethod(e.target.value)}
                />
                Email
              </label>
              <label>
                <input
                  type="radio"
                  value="phone"
                  checked={contactMethod === "phone"}
                  onChange={(e) => setContactMethod(e.target.value)}
                />
                Phone Number
              </label>
            </div>
            <input
              type={contactMethod === "email" ? "email" : "tel"}
              placeholder={
                contactMethod === "email"
                  ? "your.email@example.com"
                  : "Your phone number"
              }
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              required
              className="contact-input"
            />
          </div>

          <button
            type="submit"
            className="submit-swap"
            disabled={
              submitting ||
              (offerType === "swap" &&
                (!selectedItem || userItems.length === 0)) ||
              (offerType === "lend" && !lendDuration)
            }
          >
            {submitting
              ? "Sending..."
              : `Send ${
                  offerType === "swap"
                    ? "Swap"
                    : offerType === "lend"
                    ? "Borrow"
                    : "Request"
                } Offer`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SwapOffer;
