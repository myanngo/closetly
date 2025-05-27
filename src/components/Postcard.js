import React, { useState } from "react";
import "./Postcard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";
import { faComment, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { faCommentDots } from "@fortawesome/free-regular-svg-icons";

const Postcard = ({ user, text, image, initialLikes = 0, hideActions = false }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  // Split text into lines for postcard effect
  const lines = text.split(/(?<=\.|!|\?)\s|\n/).filter(Boolean);

  const handleLike = () => {
    setLiked((l) => !l);
    setLikes((l) => (liked ? l - 1 : l + 1));
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([
        ...comments,
        {
          id: Date.now(),
          user: "@currentuser", // This would come from auth context
          text: newComment,
          timestamp: new Date(),
        },
      ]);
      setNewComment("");
    }
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
              <span className="comment-user">{comment.user}</span>
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
