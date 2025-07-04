import { useState, useEffect, useMemo } from "react";
import "./HomeFeed.css";
import { useNavigate } from "react-router-dom";
import Postcard from "./Postcard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRetweet,
  faEye,
  faBell,
  faPlus,
  faStar,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../config/supabaseClient";
import logo from "../assets/logo.png";

// Google Analytics initialization
const GA_TRACKING_ID = 'G-9ZH425SE0M';

// Initialize Google Analytics
const initGA = () => {
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
  
  const script2 = document.createElement('script');
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_TRACKING_ID}');
  `;
  
  document.head.appendChild(script1);
  document.head.appendChild(script2);
};

// Event tracking helper with more descriptive categories
const trackEvent = (category, action, label = null, value = null) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      non_interaction: false
    });
  }
};

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
  const [showMarkCompleteModal, setShowMarkCompleteModal] = useState(false);
  const [markCompleteContact, setMarkCompleteContact] = useState(null);
  const [itemTitles, setItemTitles] = useState({});
  const [feedSort, setFeedSort] = useState("ranked");
  const [friendsSort, setFriendsSort] = useState("chronological");

  // Initialize GA on component mount
  useEffect(() => {
    initGA();
    // Track initial page view
    trackEvent('PageView', 'HomeFeed_Load', 'Initial Load');
  }, []);

  // Track feed view on component mount with more context
  useEffect(() => {
    trackEvent('FeedView', `FeedView_${feed}`, `Viewing ${feed} feed with ${feed === 'all' ? allPosts.length : friendsPosts.length} posts`);
  }, [feed, allPosts.length, friendsPosts.length]);

  // Track feed toggle with more context
  const handleFeedToggle = (newFeed) => {
    setFeed(newFeed);
    trackEvent('FeedNavigation', 'FeedType_Switch', `Switched from ${feed} to ${newFeed} feed`);
  };

  // Track feed sort change with more context
  const handleFeedSort = (newSort) => {
    setFeedSort(newSort);
    trackEvent('FeedNavigation', 'SortOrder_Change', `Changed sort from ${feedSort} to ${newSort}`);
  };

  // Track item view with more context
  const handleViewItem = (post) => {
    trackEvent('ItemInteraction', 'ItemDetail_View', `Viewed details for item ${post.item_id} (${itemTitles[post.item_id] || 'Untitled'})`);
    navigate(`/item/${post.item_id}`);
  };

  // Track history view with more context
  const handleViewHistory = (post) => {
    trackEvent('ItemInteraction', 'ItemHistory_View', `Viewed history for item ${post.item_id} (${itemTitles[post.item_id] || 'Untitled'})`);
    navigate(`/item/${post.item_id}/history`);
  };

  // Track offer actions with more context
  const handleAcceptOffer = async (offer) => {
    trackEvent('OfferManagement', 'Offer_Accept', `Accepted offer ${offer.id} for item ${offer.item?.title || 'Untitled'}`);
    setOfferActionLoading(offer.id);
    setOfferActionError("");
    try {
      // Accept this offer and mark post_created as false initially
      const { error: acceptError } = await supabase
        .from("offers")
        .update({ status: "accepted", post_created: false })
        .eq("id", offer.id);

      if (acceptError) throw acceptError;

      // Reject all other pending offers for this item
      await supabase
        .from("offers")
        .update({ status: "rejected" })
        .eq("item_id", offer.item_id)
        .neq("id", offer.id)
        .eq("status", "pending");

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

      // Show contact information
      setMarkCompleteContact({
        userName: offer.from_user,
      });
      setShowMarkCompleteModal(true);

      // Move offer from pending to accepted
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

      setAcceptedOffers((prev) => [
        ...prev,
        { ...offer, status: "accepted", post_created: false },
      ]);
    } catch (err) {
      trackEvent('OfferManagement', 'Offer_Accept_Error', `Failed to accept offer ${offer.id} for item ${offer.item?.title || 'Untitled'}`);
      console.error("Error accepting offer:", err);
      setOfferActionError("Failed to accept offer. Please try again.");
    } finally {
      setOfferActionLoading(null);
    }
  };

  const handleRejectOffer = async (offer) => {
    trackEvent('OfferManagement', 'Offer_Reject', `Rejected offer ${offer.id} for item ${offer.item?.title || 'Untitled'}`);
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
      trackEvent('OfferManagement', 'Offer_Reject_Error', `Failed to reject offer ${offer.id} for item ${offer.item?.title || 'Untitled'}`);
      console.error("Error rejecting offer:", err);
      setOfferActionError("Failed to reject offer. Please try again.");
    } finally {
      setOfferActionLoading(null);
    }
  };

  const handleCreatePost = async (offer) => {
    trackEvent('PostCreation', 'Post_Create_Initiated', `Started creating post for offer ${offer.id} (${offer.item?.title || 'Untitled'})`);
    try {
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
          trackEvent('PostCreation', 'Post_Create_Swap', `Creating swap post for items ${offer.item_id} and ${offer.offered_item_id}`);
        } else {
          // Navigate to add page in story mode for the items that don't have posts
          const itemsWithoutPosts = [
            offer.item_id,
            offer.offered_item_id,
          ].filter(
            (itemId) => !existingPosts?.some((post) => post.item_id === itemId)
          );

          navigate(
            `/add?mode=story&itemId=${itemsWithoutPosts[0]}&offerId=${offer.id}`
          );
        }
      } else {
        // For non-swap offers: transfer item to user, then navigate to add page
        // Fetch the current owner first (before any update)
        const { data: itemData, error: fetchError } = await supabase
          .from("items")
          .select("current_owner")
          .eq("id", offer.item_id)
          .single();
        if (fetchError || !itemData) {
          throw new Error("Could not fetch current owner for this item.");
        }
        const previousOwner = itemData.current_owner;
        // Now update both fields using the value you just fetched
        await supabase
          .from("items")
          .update({
            previous_owner: previousOwner,
            current_owner: currentUser.username,
          })
          .eq("id", offer.item_id);

        navigate(`/add?mode=story&itemId=${offer.item_id}&offerId=${offer.id}`);
        trackEvent('PostCreation', 'Post_Create_Standard', `Creating standard post for item ${offer.item_id}`);
      }
    } catch (err) {
      trackEvent('PostCreation', 'Post_Create_Error', `Failed to create post for offer ${offer.id}`);
      console.error("Error creating post:", err);
      setOfferActionError("Failed to create post. Please try again.");
    }
  };

  // Track modal interactions with more context
  const handleShowOffersModal = (show) => {
    setShowOffersModal(show);
    trackEvent('ModalInteraction', show ? 'Modal_Open' : 'Modal_Close', `Offers modal ${show ? 'opened' : 'closed'} with ${totalOffers} total offers`);
  };

  const handleShowContactModal = (show) => {
    setShowContactModal(show);
    trackEvent('ModalInteraction', show ? 'Modal_Open' : 'Modal_Close', `Contact modal ${show ? 'opened' : 'closed'} for user ${selectedContact?.userName || 'Unknown'}`);
  };

  const handleShowMarkCompleteModal = (show) => {
    setShowMarkCompleteModal(show);
    trackEvent('ModalInteraction', show ? 'Modal_Open' : 'Modal_Close', `Mark complete modal ${show ? 'opened' : 'closed'} for user ${markCompleteContact?.userName || 'Unknown'}`);
  };

  // Track post interactions
  const handlePostInteraction = (post, action) => {
    trackEvent('PostInteraction', `Post_${action}`, `User performed ${action} on post ${post.id} for item ${itemTitles[post.item_id] || 'Untitled'}`);
  };

  // Track profile navigation
  const handleProfileNavigation = (username) => {
    trackEvent('Navigation', 'Profile_View', `Navigating to profile of user ${username}`);
    navigate(`/profile/${username}`);
  };

  // Track item detail interactions
  const handleItemDetailInteraction = (itemId, action) => {
    trackEvent('ItemDetail', `Item_${action}`, `User performed ${action} on item ${itemId} (${itemTitles[itemId] || 'Untitled'})`);
  };

  // Track item history interactions
  const handleItemHistoryInteraction = (itemId, action) => {
    trackEvent('ItemHistory', `History_${action}`, `User performed ${action} on history of item ${itemId} (${itemTitles[itemId] || 'Untitled'})`);
  };

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
          .order("created_at", { ascending: false });

        if (allPostsError) {
          console.error("Error fetching all posts:", allPostsError);
          setError("Failed to load posts");
          return;
        }

        // Fetch likes and comments counts for each post
        const postsWithCounts = await Promise.all(
          (allPostsData || []).map(async (post) => {
            // Likes count
            const { count: likesCount, error: likesError } = await supabase
              .from("likes")
              .select("id", { count: "exact", head: true })
              .eq("post_id", post.id);
            const likes = likesCount ?? 0;

            // Comments count
            const { count: commentsCount, error: commentsError } =
              await supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id);
            const comments_count = commentsCount ?? 0;

            return {
              ...post,
              likes,
              comments_count,
            };
          })
        );

        setAllPosts(postsWithCounts);

        // Fetch item titles for all posts
        const itemIds = [
          ...new Set(
            (postsWithCounts || []).map((post) => post.item_id).filter(Boolean)
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
            postsWithCounts?.filter(
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
        // Fetch pending offers
        const { data: pendingOffersData, error: pendingOffersError } =
          await supabase
            .from("offers")
            .select("*")
            .eq("to_user", currentUser.username)
            .eq("status", "pending");

        if (pendingOffersError) {
          console.error("Error fetching pending offers:", pendingOffersError);
          setPendingOffers([]);
        } else {
          // Fetch items for pending offers
          const pendingOffersWithItems = await Promise.all(
            (pendingOffersData || []).map(async (offer) => {
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
          setPendingOffers(pendingOffersWithItems);
        }

        // Fetch accepted offers that haven't had posts created yet
        const { data: acceptedOffersData, error: acceptedOffersError } =
          await supabase
            .from("offers")
            .select("*")
            .eq("to_user", currentUser.username)
            .eq("status", "accepted")
            .eq("post_created", false);

        if (acceptedOffersError) {
          console.error("Error fetching accepted offers:", acceptedOffersError);
          setAcceptedOffers([]);
        } else {
          // Fetch items for accepted offers
          const acceptedOffersWithItems = await Promise.all(
            (acceptedOffersData || []).map(async (offer) => {
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
          setAcceptedOffers(acceptedOffersWithItems);
        }
      } catch (err) {
        console.error("Error in fetchOffers:", err);
        setPendingOffers([]);
        setAcceptedOffers([]);
      }
    };
    fetchOffers();
  }, [currentUser]);

  // Refetch accepted offers when the offers modal is opened
  useEffect(() => {
    if (!showOffersModal || !currentUser) return;

    const fetchAcceptedOffers = async () => {
      try {
        // Fetch accepted offers that haven't had posts created yet
        const { data: offers, error: offersError } = await supabase
          .from("offers")
          .select("*")
          .eq("from_user", currentUser.username)
          .eq("status", "accepted")
          .eq("post_created", false);

        if (offersError) {
          setAcceptedOffers([]);
          return;
        }

        // Fetch item details for each offer
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

        setAcceptedOffers(offersWithItems);

        // Check for any posts that might have been created since the offers were accepted
        await checkForCompletedPosts();
      } catch (err) {
        setAcceptedOffers([]);
      }
    };

    fetchAcceptedOffers();
  }, [showOffersModal, currentUser]);

  // Helper to get likes/comments for ranking
  const getRankScore = (post) => {
    const likes = Number(post.likes) || 0;
    const comments = Number(post.comments_count) || 0;
    const score = likes + comments;

    return score;
  };

  // Helper to check for completed posts
  const checkForCompletedPosts = async () => {
    try {
      // Check for any posts that might have been created since the offers were accepted
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, item_id")
        .in("item_id", acceptedOffers.map(offer => offer.item_id));

      if (postsError) {
        console.error("Error checking for completed posts:", postsError);
        return;
      }

      // If posts exist for all items, remove those offers from the list
      if (postsData) {
        const itemsWithPosts = new Set(postsData.map(post => post.item_id));
        setAcceptedOffers(prev => prev.filter(offer => !itemsWithPosts.has(offer.item_id)));
      }
    } catch (err) {
      console.error("Error in checkForCompletedPosts:", err);
    }
  };

  // Debug: log allPosts before sorting
  console.log("allPosts for ranked feed", allPosts);
  // Memoize sorted stories for correct and efficient ordering
  const stories = useMemo(() => {
    if (feed === "all") {
      if (feedSort === "ranked") {
        return [...allPosts].sort((a, b) => getRankScore(b) - getRankScore(a));
      } else {
        return [...allPosts].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      }
    } else {
      // Friends feed: always chronological
      return [...friendsPosts].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    }
  }, [feed, feedSort, allPosts, friendsPosts]);

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
            src={logo || "/placeholder.svg"}
            alt="Closetly logo"
            style={{ height: "2.1rem", width: "auto", display: "block" }}
          />
          <span className="closetly-text">Closetly</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="offers-bell-btn"
            onClick={() => handleShowOffersModal(true)}
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
          onClick={() => handleFeedToggle("all")}
        >
          Feed ({allPosts.length})
        </button>
        <button
          className={feed === "friends" ? "active" : ""}
          onClick={() => handleFeedToggle("friends")}
        >
          Friends ({friendsPosts.length})
        </button>
      </div>

      <h2>View recent swap stories</h2>
      {/* Feed ranking toggle (only for main feed) */}
      {feed === "all" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "0 0 30px 0",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => handleFeedSort(feedSort === "ranked" ? "chronological" : "ranked")}
            style={{
              background: "#fff",
              border: "1px solid #bbb",
              borderRadius: 20,
              padding: "6px 18px",
              fontWeight: 600,
              fontFamily: "Manrope",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "#ff3b3f",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            title={
              feedSort === "ranked"
                ? "Ranked feed (click to switch to chronological)"
                : "Chronological feed (click to switch to ranked)"
            }
            aria-label={
              feedSort === "ranked"
                ? "Ranked feed (click to switch to chronological)"
                : "Chronological feed (click to switch to ranked)"
            }
          >
            <FontAwesomeIcon
              icon={feedSort === "ranked" ? faStar : faClock}
              style={{ color: "#bbb", fontSize: "0.8em" }}
            />
            <span
              style={{ fontSize: "0.8rem", color: "#bbb", fontWeight: 600 }}
            >
              {feedSort === "ranked" ? "Ranked" : "Chronological"}
            </span>
          </button>
        </div>
      )}

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
                initialLikes={post.likes}
                initialComments={post.comments_count}
                hideActions={false}
                post_id={post.item_id}
                id={post.id}
                created_at={post.created_at}
                onInteraction={(action) => handlePostInteraction(post, action)}
                onProfileClick={() => handleProfileNavigation(post.giver)}
                onItemDetailClick={() => handleItemDetailInteraction(post.item_id, 'View')}
                onHistoryClick={() => handleItemHistoryInteraction(post.item_id, 'View')}
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
          onClick={() => handleShowOffersModal(false)}
        >
          <div
            className="offers-modal offers-modal-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative" }}>
              <button
                onClick={() => handleShowOffersModal(false)}
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
                          handleShowContactModal(true);
                        }}
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => handleAcceptOffer(offer)}
                        disabled={offerActionLoading === offer.id}
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
                          cursor:
                            offerActionLoading === offer.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: offerActionLoading === offer.id ? 0.6 : 1,
                        }}
                      >
                        {offerActionLoading === offer.id
                          ? "Processing..."
                          : "Mark Complete"}
                      </button>
                      <button
                        onClick={() => handleRejectOffer(offer)}
                        disabled={offerActionLoading === offer.id}
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
                          cursor:
                            offerActionLoading === offer.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: offerActionLoading === offer.id ? 0.6 : 1,
                        }}
                      >
                        {offerActionLoading === offer.id
                          ? "Processing..."
                          : "Reject"}
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
                      Your {offer.offer_type} offer for{" "}
                      <b>{offer.title || offer.item?.title || ""}</b> was
                      accepted by{" "}
                      <b>
                        @
                        {offer.to_user === currentUser.username
                          ? offer.from_user
                          : offer.to_user}
                      </b>
                      !
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
          onClick={() => handleShowContactModal(false)}
        >
          <div
            className="offers-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <h2 style={{ color: "#ff3b3f", marginBottom: 20 }}>
              Contact to Arrange the Meet-up!
            </h2>
            <p style={{ marginBottom: 20, fontFamily: "Manrope" }}>
              Contact <b>@{selectedContact.userName}</b> to arrange the{" "}
              {selectedContact.offerType} and find a time and place to meet on
              campus!
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
                style={{
                  fontWeight: 600,
                  marginBottom: 8,
                  fontFamily: "Manrope",
                }}
              >
                {selectedContact.method === "email" ? "Email:" : "Phone:"}
              </div>
              <div
                style={{
                  fontSize: "1.2rem",
                  color: "#ff3b3f",
                  fontWeight: 600,
                  fontFamily: "Manrope",
                }}
              >
                {selectedContact.info}
              </div>
            </div>
            <button
              onClick={() => handleShowContactModal(false)}
              style={{
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 30,
                padding: "10px 20px",
                fontWeight: 500,
                fontSize: "1rem",
                width: "50%",
                fontFamily: "Manrope",
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Offer Marked Complete Modal - FIXED */}
      {showMarkCompleteModal && markCompleteContact && (
        <div
          className="offers-modal-backdrop"
          style={{ zIndex: 1001 }}
          onClick={() => handleShowMarkCompleteModal(false)}
        >
          <div
            className="offers-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "400px" }}
          >
            <h2 style={{ color: "#ff3b3f", marginBottom: 20 }}>
              Congrats! Your item has found a new home.
            </h2>
            <p style={{ marginBottom: 20, fontFamily: "Manrope" }}>
              Keep up with the current owner by adding{" "}
              <b>@{markCompleteContact.userName}</b> as a new friend!
            </p>
            <button
              onClick={() => handleShowMarkCompleteModal(false)}
              style={{
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 30,
                padding: "10px 20px",
                fontWeight: 500,
                fontSize: "1rem",
                width: "50%",
                fontFamily: "Manrope",
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
