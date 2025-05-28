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

  // Fetch pending offers and accepted offers
  useEffect(() => {
    const fetchOffers = async () => {
      if (!currentUser) return;

      try {
        // Get all latest posts for each item_id (thread)
        const { data: latestPosts, error: latestPostsError } = await supabase
          .from("posts")
          .select("item_id, post_id, giver, receiver, created_at, title")
          .order("item_id", { ascending: true })
          .order("created_at", { ascending: false });

        if (latestPostsError) {
          console.error("Error fetching latest posts:", latestPostsError);
          setPendingOffers([]);
          setAcceptedOffers([]);
          return;
        }

        // For each item_id, keep only the latest post (by created_at)
        const latestByItem = {};
        for (const post of latestPosts) {
          if (!latestByItem[post.item_id || post.post_id]) {
            latestByItem[post.item_id || post.post_id] = post;
          }
        }

        // Find item_ids where current user is the current owner
        const myItemIds = Object.values(latestByItem)
          .filter(
            (post) =>
              (post.receiver && post.receiver === currentUser.username) ||
              (!post.receiver && post.giver === currentUser.username)
          )
          .map((post) => post.item_id || post.post_id);

        if (myItemIds.length === 0) {
          setPendingOffers([]);
          setAcceptedOffers([]);
          return;
        }

        // Get pending offers for items I own
        const { data: pendingOffersData, error: pendingError } = await supabase
          .from("offers")
          .select(
            `
            *,
            swap_item:swap_item_id(title, brand, size, picture)
          `
          )
          .in("item_id", myItemIds)
          .eq("status", "pending");

        if (pendingError) {
          console.error("Error fetching pending offers:", pendingError);
        } else {
          setPendingOffers(pendingOffersData || []);
        }

        // Get accepted offers where I need to create a post (I'm the offer-er)
        const { data: acceptedOffersData, error: acceptedError } =
          await supabase
            .from("offers")
            .select(
              `
            *,
            original_item:item_id(title, post_id)
          `
            )
            .eq("from_user", currentUser.username)
            .eq("status", "accepted")
            .eq("post_created", false);

        if (acceptedError) {
          console.error("Error fetching accepted offers:", acceptedError);
        } else {
          setAcceptedOffers(acceptedOffersData || []);
        }
      } catch (err) {
        console.error("Error in fetchOffers:", err);
      }
    };

    fetchOffers();
  }, [currentUser]);

  // Get the stories to display based on current feed selection
  const stories = feed === "all" ? allPosts : friendsPosts;

  const handleViewItem = (post) => {
    navigate(`/item/${post.post_id}`);
  };

  const handleViewHistory = (post) => {
    navigate(`/item/${post.post_id}/history`);
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
        .from("posts")
        .select("title, post_id")
        .eq("post_id", offer.item_id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (originalItem && originalItem.length > 0) {
        // Navigate to add item page with pre-filled data
        navigate(
          `/add?mode=received&itemId=${
            originalItem[0].post_id
          }&title=${encodeURIComponent(
            originalItem[0].title
          )}&giver=${encodeURIComponent(offer.to_user)}`
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
                {post.title}
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
                post_id={post.post_id}
                id={post.id}
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
            <h2
              style={{
                marginBottom: 18,
                fontSize: "1.7rem",
                color: "#ff3b3f",
                fontWeight: 500,
                letterSpacing: "-1px",
              }}
            >
              Swap Offers
            </h2>
            {offerActionError && (
              <div style={{ color: "#c83f3f", marginBottom: 10 }}>
                {offerActionError}
              </div>
            )}

            {/* Pending Offers Section */}
            {pendingOffers.length > 0 && (
              <div style={{ marginBottom: 30 }}>
                <h3 style={{ color: "#333", marginBottom: 15 }}>
                  Pending Offers for Your Items
                </h3>
                {pendingOffers.map((offer, idx) => (
                  <div
                    key={offer.id || idx}
                    className="offer-row"
                    style={{
                      borderBottom: "1px solid #eee",
                      padding: "12px 0",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontSize: "1.1rem", marginBottom: 8 }}>
                      <b>@{offer.from_user}</b> wants to{" "}
                      <b>{offer.offer_type}</b> your item
                    </div>

                    {offer.offer_type === "swap" && offer.swap_item && (
                      <div style={{ marginBottom: 8, fontStyle: "italic" }}>
                        Offering: {offer.swap_item.title}{" "}
                        {offer.swap_item.brand && `(${offer.swap_item.brand})`}
                      </div>
                    )}

                    {offer.lend_duration && (
                      <div style={{ marginBottom: 8 }}>
                        Duration: {offer.lend_duration}
                      </div>
                    )}

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

                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                      <button
                        onClick={() => handleAcceptOffer(offer)}
                        disabled={offerActionLoading === offer.id}
                        style={{
                          background: "#2e8b57",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 18px",
                          fontWeight: 500,
                          fontSize: "1.08rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity: offerActionLoading === offer.id ? 0.7 : 1,
                          cursor:
                            offerActionLoading === offer.id
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Accept
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer)}
                        disabled={offerActionLoading === offer.id}
                        style={{
                          background: "#c83f3f",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          padding: "8px 18px",
                          fontWeight: 500,
                          fontSize: "1.08rem",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          opacity: offerActionLoading === offer.id ? 0.7 : 1,
                          cursor:
                            offerActionLoading === offer.id
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Reject
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

            <button
              onClick={() => setShowOffersModal(false)}
              style={{
                marginTop: 16,
                background: "#eee",
                color: "#b85c5c",
                border: "none",
                borderRadius: 6,
                padding: "10px 22px",
                fontWeight: 500,
                fontSize: "1.1rem",
                alignSelf: "center",
                width: "30%",
              }}
            >
              Close
            </button>
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
