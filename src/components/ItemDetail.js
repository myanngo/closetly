import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faUser,
  faExchangeAlt,
  faPlus,
  faRetweet,
} from "@fortawesome/free-solid-svg-icons";
import "./ItemDetail.css";
import Postcard from "./Postcard";

const sampleItem = {
  id: 1,
  name: "White linen top",
  owner: "@jenny",
  starter: "@jane",
  latestStory: {
    user: "@jenny",
    text: "i wore this outfit to the coldplay concert! had a lot of fun and took some cute pics with friends",
    photo: null,
  },
  swaps: 3,
  details: {
    brand: "Brandy Melville",
    size: "Small",
    wear: "Excellent",
  },
};

const ItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const item = sampleItem;

  return (
    <div className="item-detail-fullscreen">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
      </button>
      <div className="item-detail-header">
        <div className="item-detail-title">{item.name}</div>
        <div className="item-detail-meta">
          <span>
            <FontAwesomeIcon icon={faUser} /> <b>{item.starter}</b> started this
            thread
          </span>
          <span>
            <FontAwesomeIcon icon={faUser} /> <b>{item.owner}</b> currently has
            this piece
          </span>
        </div>
      </div>
      <div className="item-detail-section">
        <div className="item-detail-label">Latest Story</div>
        <Postcard
          user={item.latestStory.user}
          text={item.latestStory.text}
          image={item.latestStory.photo}
        />
      </div>
      <div className="item-detail-actions">
        <button className="style-btn">
          <FontAwesomeIcon icon={faPlus} /> give style input
        </button>
        <button className="swap-btn">
          <FontAwesomeIcon icon={faExchangeAlt} /> offer swap
        </button>
        <button
          className="history-btn"
          onClick={() => navigate(`/item/${item.id}/history`)}
        >
          <FontAwesomeIcon icon={faRetweet} />
          see item history
        </button>
      </div>
      <div className="item-detail-swaps">
        <span className="swap-count">{item.swaps}</span> swaps have been made
        with this item!
      </div>
      <div className="item-detail-info">
        <div className="item-detail-label">Item Details</div>
        <div>
          <b>Brand:</b> {item.details.brand}
        </div>
        <div>
          <b>Size:</b> {item.details.size}
        </div>
        <div>
          <b>Wear:</b> {item.details.wear}
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;
