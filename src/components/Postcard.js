import React, { useState, useEffect } from "react";
import "./Postcard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import { faComment, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { faEllipsisH } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";

const Postcard = ({
  user,
  text,
  image,
  initialLikes = 0,
  initialComments = 0,
  hideActions = false,
  post_id,
  id,
  created_at,
}) => {
  const { user: authUser, username = "" } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(Array(initialComments).fill({}));
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Split text into lines for postcard effect
  const lines = text.split(/(?<=\.|!|\?)\s|\n/).filter(Boolean);

  // Utility for relative time
  const getRelativeTime = (dateString) => {
    if (!dateString) return "";
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

  useEffect(() => {
    if (!id) return;
    // Likes
    const fetchLikesAndComments = async () => {
      const { data: likesData } = await supabase
        .from("likes")
        .select("user_id")
        .eq("post_id", id);
      setLikes(likesData ? likesData.length : 0);
      setLiked(
        !!(
          likesData &&
          authUser &&
          likesData.some((like) => like.user_id === authUser.id)
        )
      );
      // Comments
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, user_id, username, text, created_at")
        .eq("post_id", id)
        .order("created_at", { ascending: true });
      setComments(commentsData || []);
    };
    fetchLikesAndComments();
  }, [id, authUser]);

  if (!id) return null;

  // Like/unlike logic
  const handleLike = async () => {
    if (!authUser) return;
    if (liked) {
      // Unlike
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", authUser.id);
      setLiked(false);
      setLikes((l) => l - 1);
    } else {
      // Like
      await supabase.from("likes").insert({
        post_id: id,
        user_id: authUser.id,
        username: username || "",
      });
      setLiked(true);
      setLikes((l) => l + 1);
    }
  };

  // Add comment logic
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !authUser) return;
    await supabase.from("comments").insert({
      post_id: id,
      user_id: authUser.id,
      username: username || "",
      text: newComment.trim(),
    });
    setNewComment("");
    // Refetch comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, user_id, username, text, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setComments(commentsData || []);
  };

  // Delete post logic
  const handleDelete = async () => {
    if (!authUser) return;
    if (!window.confirm("Are you sure you want to delete this story? This cannot be undone.")) return;
    // Fetch the post to get the item_id
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("item_id")
      .eq("id", id)
      .single();
    if (postError || !postData) {
      alert("Failed to find post for deletion.");
      return;
    }
    const itemId = postData.item_id;
    // Delete the post
    await supabase.from("posts").delete().eq("id", id);
    // Check if there are any other posts for this item
    const { data: otherPosts, error: otherPostsError } = await supabase
      .from("posts")
      .select("id")
      .eq("item_id", itemId);
    if (!otherPostsError && (!otherPosts || otherPosts.length === 0)) {
      // No other posts for this item, delete the item
      await supabase.from("items").delete().eq("id", itemId);
    }
    window.location.reload();
  };

  return (
    <>
      <div className="postcard-v2">
        <div className="postcard-v2-left">
          <span className="postcard-v2-user">
            {user}
            {created_at && (
              <span style={{ color: "#888", fontSize: "0.8em", marginLeft: 8 }}>
                • {getRelativeTime(created_at)}
              </span>
            )}
          </span>
          <div className="postcard-v2-lines">
            {lines.map((line, idx) => (
              <div className="postcard-v2-line" key={idx}>
                <span>{line}</span>
              </div>
            ))}
          </div>
          {!hideActions && (
            <div className="postcard-actions">
              <button
                className="postcard-like-btn"
                onClick={handleLike}
                aria-label="Like"
              >
                <FontAwesomeIcon
                  icon={liked ? solidHeart : regularHeart}
                  className={liked ? "liked" : ""}
                />
                <span className="postcard-like-count">{likes}</span>
              </button>
              <button
                className={`postcard-comment-btn${
                  showComments ? " active" : ""
                }`}
                onClick={() => setShowComments(!showComments)}
                aria-label="Comments"
              >
                <FontAwesomeIcon
                  icon={showComments ? faComment : faCommentDots}
                />
                <span className="postcard-comment-count">
                  {comments.length}
                </span>
              </button>
            </div>
          )}
        </div>
        <div className="postcard-v2-right">
          {image ? (
            <img src={image} alt="story" className="postcard-v2-img" />
          ) : (
            <div className="postcard-v2-img placeholder" />
          )}
          {/* Three-dot menu for owner */}
          {authUser && username && user === `@${username}` && !hideActions && (
            <div
              style={{ position: "absolute", top: 10, right: 14, zIndex: 2 }}
            >
              <button
                className="postcard-menu-btn"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                }}
                onClick={() => setMenuOpen((open) => !open)}
                aria-label="Post options"
              >
                <FontAwesomeIcon icon={faEllipsisH} size="lg" color="#fff" />
              </button>
              {menuOpen && (
                <div
                  className="postcard-menu-dropdown"
                  style={{
                    position: "absolute",
                    top: 28,
                    right: 0,
                    background: "#fff",
                    border: "1px solid #eee",
                    borderRadius: 6,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    minWidth: 120,
                    zIndex: 10,
                  }}
                >
                  <button
                    className="postcard-menu-delete"
                    style={{
                      color: "#c83f3f",
                      background: "none",
                      border: "none",
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {!hideActions && showComments && (
        <div className="postcard-comments-below">
          {comments.map((comment) => (
            <div key={comment.id} className="postcard-comment sticky-tab">
              <span className="comment-user">
                @{comment.username || "user"}
              </span>
              <span className="comment-text">{comment.text}</span>
            </div>
          ))}
          <form onSubmit={handleAddComment} className="comment-form">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="comment-input"
            />
            <button type="submit" className="comment-submit">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default Postcard;
