import React, { useState } from "react";
import "./Postcard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as solidHeart } from "@fortawesome/free-solid-svg-icons";
import { faHeart as regularHeart } from "@fortawesome/free-regular-svg-icons";

const Postcard = ({ user, text, image, initialLikes = 0 }) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  // Split text into lines for postcard effect
  const lines = text.split(/(?<=\.|!|\?)\s|\n/).filter(Boolean);
  const handleLike = () => {
    setLiked((l) => !l);
    setLikes((l) => (liked ? l - 1 : l + 1));
  };
  return (
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
      </div>
      <div className="postcard-v2-right">
        {image ? (
          <img src={image} alt="story" className="postcard-v2-img" />
        ) : (
          <div className="postcard-v2-img placeholder" />
        )}
      </div>
    </div>
  );
};

export default Postcard;
