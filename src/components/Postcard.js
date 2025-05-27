import React, { useState, useEffect } from "react";
import "./Postcard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import { faComment, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faCommentDots } from "@fortawesome/free-regular-svg-icons";
import { supabase } from "../config/supabaseClient";
import { useAuth } from "../context/AuthContext";

const Postcard = ({ user, text, image, initialLikes = 0, hideActions = false, post_id }) => {
  const { user: authUser, username = "" } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  // Split text into lines for postcard effect
  const lines = text.split(/(?<=\.|!|\?)\s|\n/).filter(Boolean);

  useEffect(() => {
    if (!post_id) return;
    // Likes
    const fetchLikesAndComments = async () => {
      const { data: likesData } = await supabase
        .from("likes")
        .select("user_id")
        .eq("post_id", post_id);
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
        .eq("post_id", post_id)
        .order("created_at", { ascending: true });
      setComments(commentsData || []);
    };
    fetchLikesAndComments();
  }, [post_id, authUser]);

  if (typeof post_id !== 'number' || !post_id) return null;

  // Like/unlike logic
  const handleLike = async () => {
    if (!authUser) return;
    if (liked) {
      // Unlike
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post_id)
        .eq("user_id", authUser.id);
      setLiked(false);
      setLikes((l) => l - 1);
    } else {
      // Like
      await supabase.from("likes").insert({
        post_id,
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
      post_id,
      user_id: authUser.id,
      username: username || "",
      text: newComment.trim(),
    });
    setNewComment("");
    // Refetch comments
    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, user_id, username, text, created_at")
      .eq("post_id", post_id)
      .order("created_at", { ascending: true });
    setComments(commentsData || []);
  };

  return (
    <>
      <div className="postcard-v2">
        <div className="postcard-v2-left">
          <span className="postcard-v2-user">{user}</span>
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
                className={`postcard-comment-btn${showComments ? " active" : ""}`}
                onClick={() => setShowComments(!showComments)}
                aria-label="Comments"
              >
                <FontAwesomeIcon
                  icon={showComments ? faComment : faCommentDots}
                />
                <span className="postcard-comment-count">{comments.length}</span>
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
        </div>
      </div>
      {!hideActions && showComments && (
        <div className="postcard-comments-below">
          {comments.map((comment) => (
            <div key={comment.id} className="postcard-comment sticky-tab">
              <span className="comment-user">@{comment.username || "user"}</span>
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
