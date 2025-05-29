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
  const [showCompletionModal, setShowCompletionModal] = useState(false);
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
        const itemIds = [
          ...new Set(
            (allPostsData || []).map((post) => post.item_id).filter(Boolean)
          ),
        ];
        if (itemIds.length > 0) {
          const { data: itemsData, error: itemsError } = await supabase
            .from("items")
            .select("id, title")
            .in("id", itemIds);
          if (!itemsError && itemsData) {
            const titlesMap = {};
            itemsData.forEach((item) => {
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

  // Add a new useEffect to check for newly created posts
  useEffect(() => {
    if (!currentUser) return;

    const checkForNewPosts = async () => {
      try {
        // Get all accepted offers that don't have a post_id yet
        const { data: offers, error: offersError } = await supabase
          .from("offers")
          .select("*")
          .eq("from_user", currentUser.username)
          .eq("status", "accepted")
          .is("post_id", null);

        if (offersError) {
          console.error("Error fetching offers:", offersError);
          return;
        }

        // For each offer, check if a post exists that was created after the offer
        const updatedOffers = await Promise.all(
          offers.map(async (offer) => {
            const { data: post } = await supabase
              .from("posts")
              .select("id")
              .eq("item_id", offer.item_id)
              .eq("giver", currentUser.username)
              .gt("created_at", offer.created_at)
              .maybeSingle();

            if (post) {
              // Post exists, update the offer with the post_id
              await supabase
                .from("offers")
                .update({ post_id: post.id })
                .eq("id", offer.id);

              // For swap offers, also check the offered item
              if (offer.offer_type === "swap" && offer.offered_item_id) {
                const { data: offeredItemPost } = await supabase
                  .from("posts")
                  .select("id")
                  .eq("item_id", offer.offered_item_id)
                  .eq("giver", currentUser.username)
                  .gt("created_at", offer.created_at)
                  .maybeSingle();

                if (offeredItemPost) {
                  // Both posts exist, update ownership
                  await supabase
                    .from("items")
                    .update({
                      current_owner: offer.to_user,
                    })
                    .in("id", [offer.item_id, offer.offered_item_id]);
                }
              } else {
                // For non-swap offers, update ownership
                await supabase
                  .from("items")
                  .update({
                    current_owner: offer.to_user,
                  })
                  .eq("id", offer.item_id);
              }

              return null; // Remove this offer from the list
            }
            return offer; // Keep this offer in the list
          })
        );

        // Update the accepted offers state with only the offers that don't have posts
        setAcceptedOffers(updatedOffers.filter(Boolean));
      } catch (err) {
        console.error("Error checking for new posts:", err);
      }
    };

    // Check for new posts immediately
    checkForNewPosts();

    // Set up an interval to periodically check for new posts
    const intervalId = setInterval(checkForNewPosts, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [currentUser]);

  // Update the fetchAcceptedOffers function in the other useEffect
  useEffect(() => {
    if (!showOffersModal || !currentUser) return;
    const fetchAcceptedOffers = async () => {
      try {
        // Fetch accepted offers that don't have a post_id yet
        const { data: offers, error: offersError } = await supabase
          .from("offers")
          .select("*")
          .eq("from_user", currentUser.username)
          .eq("status", "accepted")
          .is("post_id", null);

        if (offersError) {
          setAcceptedOffers([]);
          return;
        }

        // For each offer, fetch the item details
        const offersWithItems = await Promise.all(
          offers.map(async (offer) => {
            const { data: requestedItem } = await supabase
              .from("items")
              .select(
                "id, title, brand, size, wear, current_owner, original_owner"
              )
              .eq("id", offer.item_id)
              .single();
            return {
              ...offer,
              item: requestedItem,
              title: requestedItem?.title,
            };
          })
        );
        setAcceptedOffers(offersWithItems.filter(Boolean));
      } catch (err) {
        setAcceptedOffers([]);
      }
    };
    fetchAcceptedOffers();
  }, [showOffersModal, currentUser]);

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
      const { error: rejectError } = await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("item_id", offer.item_id)
        .neq("id", offer.id)
        .eq("status", "pending");

      if (rejectError) {
        console.error("Error rejecting other offers:", rejectError);
        throw rejectError;
      }

      // Update the current_owner of the item
      // Fetch the current owner before updating
      const { data: itemData, error: fetchError } = await supabase
        .from("items")
        .select("current_owner")
        .eq("id", offer.item_id)
        .single();

      if (fetchError || !itemData) {
        throw new Error("Could not fetch current owner for this item.");
      }

      const currentOwner = itemData.current_owner;
      const newOwner = offer.from_user;

      // Update both previous_owner and current_owner
      const { error: updateItemError } = await supabase
        .from("items")
        .update({
          previous_owner: currentOwner,
          current_owner: newOwner,
        })
        .eq("id", offer.item_id);

      if (updateItemError) {
        console.error("Error updating item ownership:", updateItemError);
        throw updateItemError;
      }

      // Show completion modal instead of contact modal
      setShowCompletionModal(true);

      // Remove from pending offers
      setPendingOffers((prev) => prev.filter((o) => o.id !== offer.id));

      // Refresh the pending offers list to reflect the rejected offers
      const { data: updatedOffers, error: offersFetchError } = await supabase
        .from("offers")
        .select("*")
        .eq("to_user", currentUser.username)
        .eq("status", "pending");

      if (!offersFetchError && updatedOffers) {
        // Fetch items for the updated offers
        const offersWithItems = await Promise.all(
          updatedOffers.map(async (updatedOffer) => {
            const { data: item, error: itemError } = await supabase
              .from("items")
              .select(
                "id, title, brand, size, wear, current_owner, original_owner"
              )
              .eq("id", updatedOffer.item_id)
              .single();

            if (itemError) {
              console.error("Error fetching item:", itemError);
              return { ...updatedOffer, item: null };
            }

            return { ...updatedOffer, item };
          })
        );

        setPendingOffers(offersWithItems);
      }
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
      // For swaps, we need to handle both the requested item and the offered item
      if (offer.offer_type === "swap") {
        // First check if posts exist for both items
        const { data: existingPosts, error: postsCheckError } = await supabase
          .from("posts")
          .select("id, item_id")
          .in("item_id", [offer.item_id, offer.offered_item_id])
          .eq("giver", currentUser.username);

        if (postsCheckError) {
          console.error("Error checking for existing posts:", postsCheckError);
          throw postsCheckError;
        }

        if (existingPosts && existingPosts.length === 2) {
          // Both posts exist, mark the offer as complete
          await supabase
            .from("offers")
            .update({ post_created: true })
            .eq("id", offer.id);

          // Update ownership for both items
          const { error: updateError } = await supabase
            .from("items")
            .update({
              current_owner: offer.to_user,
            })
            .in("id", [offer.item_id, offer.offered_item_id]);

          if (updateError) {
            console.error("Error updating item ownership:", updateError);
            throw updateError;
          }

          // Remove from accepted offers list
          setAcceptedOffers((prev) => prev.filter((o) => o.id !== offer.id));
        } else {
          // Navigate to add page in story mode for the items that don't have posts
          const itemsWithoutPosts = [
            offer.item_id,
            offer.offered_item_id,
          ].filter(
            (itemId) => !existingPosts?.some((post) => post.item_id === itemId)
          );
          navigate(`/add?mode=story&itemId=${itemsWithoutPosts[0]}`);
        }
      } else {
        // Handle non-swap offers (giveaway, lend) as before
        const { data: existingPost, error: postCheckError } = await supabase
          .from("posts")
          .select("id")
          .eq("item_id", offer.item_id)
          .eq("giver", currentUser.username)
          .single();

        if (postCheckError && postCheckError.code !== "PGRST116") {
          console.error("Error checking for existing post:", postCheckError);
          throw postCheckError;
        }

        if (existingPost) {
          // Post already exists, just mark the offer as complete
          await supabase
            .from("offers")
            .update({ post_created: true })
            .eq("id", offer.id);

          // Update the item ownership
          const { error: updateError } = await supabase
            .from("items")
            .update({
              current_owner: offer.to_user,
            })
            .eq("id", offer.item_id);

          if (updateError) {
            console.error("Error updating item ownership:", updateError);
            throw updateError;
          }

          // Remove from accepted offers list
          setAcceptedOffers((prev) => prev.filter((o) => o.id !== offer.id));
        } else {
          // Navigate to add page in story mode for the existing item
          navigate(`/add?mode=story&itemId=${offer.item_id}`);
        }
      }
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
                user={post.receiver ? `@${post.receiver}` : `@${post.giver}`}
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
                          setSelectedContact({
                            method: offer.contact_method,
                            info: offer.contact_info,
                            userName: offer.from_user,
                            offerType: offer.offer_type,
                          });
                          setShowContactModal(true);
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
                        Mark Complete
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
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "1.1rem",
                        marginBottom: 8,
                        fontFamily: "Manrope",
                      }}
                    >
                      Your {offer.offer_type} offer for <b>{offer.title}</b> was
                      accepted by <b>@{offer.to_user}</b>!
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        marginBottom: 12,
                        fontFamily: "Manrope",
                      }}
                    >
                      Create a post to complete the transaction and share about
                      your new item.
                    </div>
                    <button
                      onClick={() => handleCreatePost(offer)}
                      style={{
                        background: "#ff3b3f",
                        color: "#fff",
                        border: "none",
                        borderRadius: 30,
                        padding: "10px 20px",
                        fontWeight: 500,
                        fontSize: "1rem",
                        display: "flex",
                        alignSelf: "center",
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
              Contact to Arrange the Swap!
            </h2>
            <p style={{ marginBottom: 20, fontFamily: "Manrope" }}>
              <b>@{selectedContact.userName}</b> can be reached to discuss a{" "}
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
                  fontFamily: "Manrope",
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
                borderRadius: 30,
                padding: "10px 20px",
                fontWeight: 500,
                fontSize: "1rem",
                width: "40%",
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
        <div
          className="offers-modal-backdrop"
          style={{ zIndex: 1001 }}
          onClick={() => setShowCompletionModal(false)}
        >
          <div
            className="offers-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <h2 style={{ color: "#2e8b57", marginBottom: 20 }}>
              Your Item Has Been Sent! 🎉
            </h2>
            <p
              style={{
                marginBottom: 20,
                fontFamily: "Manrope",
                fontSize: "1.1rem",
              }}
            >
              Congratulations on passing on your item! You've helped create a
              more sustainable fashion community.
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
              <div
                style={{ fontSize: "1.2rem", color: "#666", marginBottom: 8 }}
              >
                Keep up with the new owner's stories!
              </div>
            </div>
            <button
              onClick={() => setShowCompletionModal(false)}
              style={{
                background: "#2e8b57",
                color: "#fff",
                border: "none",
                borderRadius: 30,
                padding: "10px 20px",
                fontWeight: 500,
                fontSize: "1rem",
                width: "40%",
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
