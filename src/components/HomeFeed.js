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
  const [offerActionLoading, setOfferActionLoading] = useState(null);
  const [offerActionError, setOfferActionError] = useState("");

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

  // Fetch pending offers for items the user owns
  useEffect(() => {
    const fetchOffers = async () => {
      if (!currentUser) return;
      // Get all posts where current user is the owner (giver, receiver null)
      const { data: myItems } = await supabase
        .from("posts")
        .select("id")
        .eq("giver", currentUser.username)
        .is("receiver", null);
      const myItemIds = (myItems || []).map((item) => item.id);
      if (myItemIds.length === 0) {
        setPendingOffers([]);
        return;
      }
      // Get all pending offers for these items
      const { data: offers } = await supabase
        .from("swap_offers")
        .select(
          "*, from_user, offer_type, message, lend_duration, swap_item_id"
        )
        .in("item_id", myItemIds)
        .eq("status", "pending");
      setPendingOffers(offers || []);
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
        .from("swap_offers")
        .update({ status: "accepted" })
        .eq("id", offer.id);
      // Reject all other pending offers for this item
      await supabase
        .from("swap_offers")
        .update({ status: "rejected" })
        .eq("item_id", offer.item_id)
        .neq("id", offer.id)
        .eq("status", "pending");
      if (acceptError) throw acceptError;
      // Refresh offers
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
        .from("swap_offers")
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
            {pendingOffers.length > 0 && (
              <span className="offers-badge">{pendingOffers.length}</span>
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
              }}
            >
              <span style={{ color: "#222" }}>@{post.giver}</span>{" "}
              <span style={{ fontSize: "1.1em" }}>→</span>{" "}
              <span style={{ color: "#222" }}>
                @{post.receiver || "someone"}
              </span>{" "}
              <span style={{ color: "#d36c6c", fontWeight: 600 }}>
                {post.title}
              </span>
            </div>

            <Postcard
              user={`@${post.receiver || "someone"}`}
              text={post.story || "Received this amazing item!"}
              image={post.picture}
              initialLikes={0} // You can add a likes field to your posts table later
            />

            <div className="swap-actions">
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
            {pendingOffers.length === 0 ? (
              <div
                style={{
                  color: "#888",
                  fontStyle: "italic",
                  fontFamily: "Manrope",
                }}
              >
                No pending offers for your items.
              </div>
            ) : (
              <div>
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
                    <div style={{ fontSize: "1.1rem" }}>
                      <b>@{offer.from_user}</b> wants to{" "}
                      <b>{offer.offer_type}</b>
                    </div>
                    {offer.lend_duration && (
                      <div>Lend duration: {offer.lend_duration}</div>
                    )}
                    {offer.message && (
                      <div style={{ fontStyle: "italic", color: "#555" }}>
                        {offer.message}
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
    </div>
  );
};

export default HomeFeed;
