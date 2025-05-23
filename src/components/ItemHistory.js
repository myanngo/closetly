import React from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "./ItemHistory.css";
import Postcard from "./Postcard";

const sampleStories = [
  {
    user: "@jenny",
    text: "i wore this outfit to the coldplay concert! had a lot of fun and took some cute pics with friends",
    photo: null,
  },
  {
    user: "@emily",
    text: "this would look awesome with a pair of low-waisted baggy jeans",
    photo: null,
  },
  {
    user: "@katie",
    text: "this concert was so fun our outfits were actually so cute i love this",
    photo: null,
  },
];

const ItemHistory = () => {
  const navigate = useNavigate();
  return (
    <div className="item-history-fullscreen">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
      </button>
      <div className="item-history-title">
        Item History
        <br />
        <span className="item-history-sub">White linen top</span>
      </div>
      <div className="item-history-list">
        {sampleStories.map((story, idx) => (
          <Postcard
            key={idx}
            user={story.user}
            text={story.text}
            image={story.photo}
          />
        ))}
      </div>
    </div>
  );
};

export default ItemHistory;
