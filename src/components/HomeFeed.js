import React, { useState, useEffect } from "react";
import "./HomeFeed.css";
import { useNavigate } from "react-router-dom";
import Postcard from "./Postcard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRetweet,
  faEye,
  faBell,
  faCheck,
  faTimes,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../config/supabaseClient";
import logo from "../assets/logo.png";

const HomeFeed = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState("all");
  const [allPosts, setAllPosts] = useState([]);
  const [friendsPosts, setFriendsPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [pendingOffers, setPendingOffers] = useState([]);
  const [acceptedOffers, setAcceptedOffers] = useState([]);
  const [offerActionLoading, setOfferActionLoading] = useState(null);
  const [offerActionError, setOfferActionError] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [itemTitles, setItemTitles] = useState({});

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
          setError("Please log in to view home");
          return;
        }

        // Get user profile data to access friends list
        const { data: userData, error: fetchUserError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchUserError) {
          console.error("Error fetching user data:", fetchUserError);
          setError("Failed to load user data");
          return;
        }

        setCurrentUser(userData);

        const { data: allPostsData, error: allPostsError } = await supabase
          .from("posts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20); // Limit for performance

        if (allPostsError) {
          console.error("Error fetching all posts:", allPostsError);
          setError("Failed to load posts");
          return;
        }

        setAllPosts(allPostsData || []);

        // Fetch item titles for all posts
        const itemIds = [...new Set((allPostsData || []).map(post => post.item_id).filter(Boolean))];
        if (itemIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("items")
            .select("id, title")
            .in("id", itemIds);
          if (!itemsError && itemsData) {
            const titlesMap = {};
            itemsData.forEach(item => {
              titlesMap[item.id] = item.title;
            });
            setItemTitles(titlesMap);
          }
        }

        // Filter friends' posts if user has friends
        if (userData.friends && userData.friends.length > 0) {
          const friendsPostsData =
            allPostsData?.filter(
              (post) =>
                userData.friends.includes(post.giver) ||
                userData.friends.includes(post.receiver)
            ) || [];
          setFriendsPosts(friendsPostsData);
        } else {
          setFriendsPosts([]);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch pending offers for items the user owns
  useEffect(() => {
    const fetchOffers = async () => {
      if (!currentUser) return;
      try {
        // First fetch the offers
        const { data: offers, error: offersError } = await supabase
          .from("offers")
          .select("*")
          .eq("to_user", currentUser.username)
          .eq("status", "pending");

        if (offersError) {
          console.error("Error fetching offers:", offersError);
          setPendingOffers([]);
          return;
        }

        // Then fetch the items for each offer
        const offersWithItems = await Promise.all(
          offers.map(async (offer) => {
            const { data: item, error: itemError } = await supabase
              .from("items")
              .select(
                "id, title, brand, size, wear, current_owner, original_owner"
              )
              .eq("id", offer.item_id)
              .single();

            if (itemError) {
              console.error("Error fetching item:", itemError);
              return { ...offer, item: null };
            }

            return { ...offer, item };
          })
        );

        setPendingOffers(offersWithItems || []);
      } catch (err) {
        console.error("Error in fetchOffers:", err);
        setPendingOffers([]);
      }
    };
    fetchOffers();
  }, [currentUser]);

  // Get the stories to display based on current feed selection
  const stories = feed === "all" ? allPosts : friendsPosts;

  const handleViewItem = (post) => {
    navigate(`/item/${post.item_id}`);
  };

  const handleViewHistory = (post) => {
    navigate(`/item/${post.item_id}/history`);
  };

  // Accept offer logic
  const handleAcceptOffer = async (offer) => {
    setOfferActionLoading(offer.id);
    setOfferActionError("");
    try {
      // Accept this offer
      const { error: acceptError } = await supabase
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offer.id);

      if (acceptError) throw acceptError;

      // Reject all other pending offers for this item
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("item_id", offer.item_id)
        .neq("id", offer.id)
        .eq("status", "pending");

      // Show contact information
      setSelectedContact({
        method: offer.contact_method,
        info: offer.contact_info,
        userName: offer.from_user,
        offerType: offer.offer_type,
      });
      setShowContactModal(true);

      // Remove from pending offers
      setPendingOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch (err) {
      setOfferActionError("Failed to accept offer. Please try again.");
    } finally {
      setOfferActionLoading(null);
    }
  };

  // Reject offer logic
  const handleRejectOffer = async (offer) => {
    setOfferActionLoading(offer.id);
    setOfferActionError("");
    try {
      const { error } = await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("id", offer.id);

      if (error) throw error;

      setPendingOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch (err) {
      setOfferActionError("Failed to reject offer. Please try again.");
    } finally {
      setOfferActionLoading(null);
    }
  };

  // Handle creating post for accepted offer
  const handleCreatePost = async (offer) => {
    try {
      // Mark offer as post_created to remove from list
      await supabase
        .from("offers")
        .update({ post_created: true })
        .eq("id", offer.id);

      // Get original item details
      const { data: originalItem } = await supabase
        .from("items")
        .select("id, title, brand, size, wear, letgo_method")
        .eq("id", offer.item_id)
        .single();

      if (originalItem) {
        // Create new item entry
        const { data: newItem, error: itemError } = await supabase
          .from("items")
          .insert({
            title: originalItem.title,
            brand: originalItem.brand,
            size: originalItem.size,
            wear: originalItem.wear,
            current_owner: offer.to_user,
            original_owner: offer.from_user,
            letgo_method: originalItem.letgo_method,
          })
          .select()
          .single();

        if (itemError) {
          console.error("Error creating item:", itemError);
          throw itemError;
        }

        // Navigate to add item page with pre-filled data
        navigate(
          `/add?mode=received&itemId=${
            newItem.id
          }&title=${encodeURIComponent(
            originalItem.title
          )}&giver=${encodeURIComponent(offer.from_user)}`
        );
      }

      // Remove from accepted offers list
      setAcceptedOffers((prev) => prev.filter((o) => o.id !== offer.id));
    } catch (err) {
      setOfferActionError("Failed to create post. Please try again.");
    }
  };

  const totalOffers = pendingOffers.length + acceptedOffers.length;

  if (loading) {
    return (
      <div className="home-feed">
        <div style={{ textAlign: "center", padding: "50px" }}>
          Loading stories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-feed">
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
    <div className="home-feed">
      {/* Header bar with logo and offers bell */}
      <div className="home-header-bar">
        <div className="home-header-logo">
          <img
            src={logo}
            alt="Closetly logo"
            style={{ height: "2.1rem", width: "auto", display: "block" }}
          />
          <span className="closetly-text">Closetly</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="offers-bell-btn"
            onClick={() => setShowOffersModal(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginRight: 10,
            }}
          >
            <FontAwesomeIcon
              icon={faBell}
              size="2xl"
              color="#ff3b3f"
              style={{ fontSize: "1.5rem" }}
            />
            <span
              style={{
                fontWeight: 600,
                color: "#ff3b3f",
                fontSize: "0.9rem",
                letterSpacing: "-0.5px",
                fontFamily: "Manrope",
              }}
            >
              Offers
            </span>
            {totalOffers > 0 && (
              <span className="offers-badge">{totalOffers}</span>
            )}
          </button>
        </div>
      </div>

      {/* Feed toggle below header */}
      <div className="feed-toggle">
        <button
          className={feed === "all" ? "active" : ""}
          onClick={() => setFeed("all")}
        >
          All ({allPosts.length})
        </button>
        <button
          className={feed === "friends" ? "active" : ""}
          onClick={() => setFeed("friends")}
        >
          Friends ({friendsPosts.length})
        </button>
      </div>

      <h2>View recent swap stories</h2>

      {stories.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#666",
            fontStyle: "italic",
            fontFamily: "Manrope",
          }}
        >
          {feed === "all"
            ? "No swap stories yet. Items need to be given away to create stories!"
            : "No stories from friends yet. Add some friends or check back later!"}
        </div>
      ) : (
        stories.map((post) => (
          <div key={post.id} className="feed-post-container">
            <div
              style={{
                color: "#b85c5c",
                fontFamily: "Manrope",
                fontSize: "1rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ color: "#222" }}>@{post.giver}</span>{" "}
              {post.receiver && (
                <>
                  <span style={{ fontSize: "1.1em" }}>→</span>{" "}
                  <span style={{ color: "#222" }}>@{post.receiver}</span>{" "}
                </>
              )}
              <span
                style={{ color: "#d36c6c", fontWeight: 600, marginLeft: 18 }}
              >
                {itemTitles[post.item_id] || ""}
              </span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <Postcard
                user={
                  post.receiver
                    ? `@${post.giver} → @${post.receiver}`
                    : `@${post.giver}`
                }
                text={post.story || "Received this amazing item!"}
                image={post.picture}
                initialLikes={0}
                hideActions={false}
                post_id={post.item_id}
                id={post.id}
                created_at={post.created_at}
              />
            </div>

            <div className="swap-actions" style={{ marginTop: 8 }}>
              <button onClick={() => handleViewItem(post)}>
                <FontAwesomeIcon icon={faEye} /> view item
              </button>
              <button onClick={() => handleViewHistory(post)}>
                <FontAwesomeIcon icon={faRetweet} /> see item history
              </button>
            </div>
          </div>
        ))
      )}

      {/* Offers Modal */}
      {showOffersModal && (
        <div
          className="offers-modal-backdrop"
          style={{ zIndex: 1000 }}
          onClick={() => setShowOffersModal(false)}
        >
          <div
            className="offers-modal offers-modal-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowOffersModal(false)}
                style={{
                  position: "absolute",
                  right: 0,
                  top: 0,
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  color: "#666",
                  cursor: "pointer",
                  padding: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  transition: "background-color 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f0f0f0")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                ×
              </button>
              <h2
                style={{
                  marginBottom: 18,
                  fontSize: "1.9rem",
                  color: "#ff3b3f",
                  fontWeight: 500,
                  letterSpacing: "-1px",
                }}
              >
                Swap Offers
              </h2>
            </div>
            {offerActionError && (
              <div style={{ color: "#c83f3f", marginBottom: 10 }}>
                {offerActionError}
              </div>
            )}

            {/* Pending Offers Section */}
            {pendingOffers.length > 0 && (
              <div style={{ marginBottom: 30 }}>
                <h3
                  style={{
                    color: "#333",
                    marginBottom: 15,
                    fontSize: "1.5rem",
                  }}
                >
                  Pending Offers for Your Items
                </h3>
                {pendingOffers.map((offer, idx) => (
                  <div
                    key={offer.id || idx}
                    className="offer-row"
                    style={{
                      borderBottom: "2px solid #eee",
                      padding: "20px 0",
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.1rem",
                        marginBottom: 8,
                        fontFamily: "Manrope",
                      }}
                    >
                      <b>@{offer.from_user}</b>{" "}
                      {(() => {
                        if (offer.offer_type === "giveaway")
                          return "wants to receive this item from you";
                        if (offer.offer_type === "lend")
                          return "wants to borrow your item";
                        if (offer.offer_type === "swap")
                          return "offered a swap for your item";
                        return "sent an offer for your item";
                      })()}{" "}
                      {offer.item && (
                        <span style={{ color: "#b85c5c" }}>
                          <b>({offer.item.title})</b>
                        </span>
                      )}
                    </div>
                    {offer.message && (
                      <div
                        style={{
                          fontStyle: "italic",
                          color: "#555",
                          marginBottom: 8,
                        }}
                      >
                        "{offer.message}"
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        marginTop: 8,
                        justifyContent: "center",
                      }}
                    >
                      <button
                        style={{
                          background: "#000",
                          color: "#fff",
                          border: "none",
                          borderRadius: 30,
                          padding: "8px 18px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          fontFamily: "Manrope",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (offer.contact_method && offer.contact_info) {
                            window.alert(
                              `Contact @${offer.from_user} via ${offer.contact_method}: ${offer.contact_info}`
                            );
                          } else {
                            window.alert("No contact info provided.");
                          }
                        }}
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => handleAcceptOffer(offer)}
                        style={{
                          background: "#fff",
                          color: "#c83f3f",
                          border: "1px solid #c83f3f",
                          borderRadius: 30,
                          padding: "8px 18px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          fontFamily: "Manrope",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer)}
                        style={{
                          background: "#c83f3f",
                          color: "#fff",
                          border: "none",
                          borderRadius: 30,
                          padding: "8px 18px",
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          fontFamily: "Manrope",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Accepted Offers Section */}
            {acceptedOffers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ color: "#333", marginBottom: 15 }}>
                  Create Posts for Accepted Offers
                </h3>
                {acceptedOffers.map((offer, idx) => (
                  <div
                    key={offer.id || idx}
                    className="offer-row"
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "12px 0",
                      marginBottom: 8,
                      backgroundColor: "#f0f8f0",
                      borderRadius: 8,
                      paddingLeft: 12,
                      paddingRight: 12,
                    }}
                  >
                    <div style={{ fontSize: "1.1rem", marginBottom: 8 }}>
                      Your {offer.offer_type} offer was accepted by{" "}
                      <b>@{offer.to_user}</b>!
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        marginBottom: 12,
                      }}
                    >
                      Create a post to complete the transaction.
                    </div>
                    <button
                      onClick={() => handleCreatePost(offer)}
                      style={{
                        background: "#ff3b3f",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 20px",
                        fontWeight: 500,
                        fontSize: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      <FontAwesomeIcon icon={faPlus} /> Create Post
                    </button>
                  </div>
                ))}
              </div>
            )}

            {totalOffers === 0 && (
              <div
                style={{
                  color: "#888",
                  fontStyle: "italic",
                  fontFamily: "Manrope",
                }}
              >
                No pending offers for your items.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedContact && (
        <div
          className="offers-modal-backdrop"
          style={{ zIndex: 1001 }}
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="offers-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <h2 style={{ color: "#2e8b57", marginBottom: 20 }}>
              Offer Accepted!
            </h2>
            <p style={{ marginBottom: 20 }}>
              Contact <b>@{selectedContact.userName}</b> to arrange the{" "}
              {selectedContact.offerType}:
            </p>
            <div
              style={{
                background: "#f8f9fa",
                padding: 20,
                borderRadius: 8,
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {selectedContact.method === "email" ? "Email:" : "Phone:"}
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  color: "#ff3b3f",
                  fontWeight: 500,
                }}
              >
                {selectedContact.info}
              </div>
            </div>
            <button
              onClick={() => setShowContactModal(false)}
              style={{
                background: "#2e8b57",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "10px 20px",
                fontWeight: 500,
                fontSize: "1rem",
                width: "100%",
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeFeed;
