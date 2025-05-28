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
  const [offerType, setOfferType] = useState("");
  const [lendDuration, setLendDuration] = useState("");
  const [contactMethod, setContactMethod] = useState("email");
  const [contactInfo, setContactInfo] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [availableOfferTypes, setAvailableOfferTypes] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");

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
        setUserEmail(userData.email || "");
        setUserPhone(userData.phone_number || "");
        setContactInfo(userData.email || userData.phone_number || ""); // Default to user's email

        console.log("User data: ", userData);

        // Get target item details
        const { data: itemData, error: itemError } = await supabase
          .from("items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (itemError || !itemData) {
          setError("Item not found");
          return;
        }

        setTargetItem(itemData);
        console.log(itemData);

        // Fetch the picture from the latest post using latest_post_id
        if (itemData.latest_post_id) {
          const { data: latestPost, error: latestPostError } = await supabase
            .from("posts")
            .select("picture")
            .eq("id", itemData.latest_post_id)
            .single();
          if (!latestPostError && latestPost && latestPost.picture) {
            setTargetItem((prev) => ({ ...prev, picture: latestPost.picture }));
          }
        }

        // Set available offer types based on letgo_method
        if (itemData.letgo_method) {
          let methods;
          if (typeof itemData.letgo_method === "string") {
            try {
              methods = JSON.parse(itemData.letgo_method);
            } catch {
              methods = [itemData.letgo_method];
            }
          } else if (Array.isArray(itemData.letgo_method)) {
            methods = itemData.letgo_method;
          } else {
            methods = [];
          }
          setAvailableOfferTypes(methods.filter(Boolean));
          if (methods.length > 0) {
            setOfferType(methods[0]);
          }
        }

        // Get user's available items for swapping
        const { data: userItemsData, error: userItemsError } = await supabase
          .from("items")
          .select("id, title, brand, size, current_owner, latest_post_id")
          .eq("current_owner", userData.username);

        if (userItemsData && userItemsData.length > 0) {
          // Get all latest_post_ids that are not null/undefined
          const postIds = userItemsData
            .map((item) => item.latest_post_id)
            .filter(Boolean);

          if (postIds.length > 0) {
            const { data: postsData, error: postsError } = await supabase
              .from("posts")
              .select("id, picture")
              .in("id", postIds);

            if (!postsError && postsData) {
              // Map post id to picture
              const picMap = {};
              postsData.forEach((post) => {
                picMap[post.id] = post.picture;
              });

              // Attach picture to each item
              const itemsWithPics = userItemsData.map((item) => ({
                ...item,
                picture: picMap[item.latest_post_id] || null,
              }));

              setUserItems(itemsWithPics);
            } else {
              setUserItems(userItemsData); // fallback: no pictures
            }
          } else {
            setUserItems(userItemsData); // fallback: no latest_post_id
          }
        } else {
          setUserItems([]);
        }
        if (userItemsError) {
          console.error("Error fetching user items:", userItemsError);
          setUserItems([]);
        }
        console.log("User items: ", userItemsData);
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
        to_user: targetItem.current_owner,
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

  // Contact method toggle handler
  const handleContactMethodChange = (method) => {
    setContactMethod(method);
    if (method === "email") {
      setContactInfo(userEmail);
    } else if (method === "phone") {
      setContactInfo(userPhone);
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
              {availableOfferTypes.includes("swap") && (
                <button
                  type="button"
                  className={`offer-type-btn ${
                    offerType === "swap" ? "selected" : ""
                  }`}
                  onClick={() => setOfferType("swap")}
                >
                  Swap
                </button>
              )}
              {availableOfferTypes.includes("lend") && (
                <button
                  type="button"
                  className={`offer-type-btn ${
                    offerType === "lend" ? "selected" : ""
                  }`}
                  onClick={() => setOfferType("lend")}
                >
                  Borrow
                </button>
              )}
              {availableOfferTypes.includes("giveaway") && (
                <button
                  type="button"
                  className={`offer-type-btn ${
                    offerType === "giveaway" ? "selected" : ""
                  }`}
                  onClick={() => setOfferType("giveaway")}
                >
                  Request
                </button>
              )}
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
                <span className="item-owner">
                  {" "}
                  from @{targetItem?.current_owner}
                </span>
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
                      key={item.id}
                      className={`item-option ${
                        selectedItem === item.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedItem(item.id)}
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
                ? "(Explain why you'd like this item!)"
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
                  ? "Tell them why you'd like to borrow this item!"
                  : "Tell them why you'd love to have this item!"
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
                  onChange={() => handleContactMethodChange("email")}
                />
                Email
              </label>
              <label>
                <input
                  type="radio"
                  value="phone"
                  checked={contactMethod === "phone"}
                  onChange={() => handleContactMethodChange("phone")}
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
