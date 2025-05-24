import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faExchangeAlt } from '@fortawesome/free-solid-svg-icons';
import './SwapOffer.css';

const SwapOffer = ({ itemId, onClose }) => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState('');
  
  // Dummy data for user's items
  const userItems = [
    { id: 1, name: 'Black turtleneck', image: null },
    { id: 2, name: 'Blue jeans', image: null },
    { id: 3, name: 'White sneakers', image: null },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would handle the swap offer submission
    // For now, we'll just close the modal
    onClose();
  };

  return (
    <div className="swap-offer-modal">
      <div className="swap-offer-content">
        <button className="back-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faArrowLeft} size="lg" />
        </button>
        
        <h2 className="swap-offer-title">Offer a Swap</h2>
        
        <form onSubmit={handleSubmit} className="swap-offer-form">
          <div className="swap-items">
            <div className="swap-item">
              <h3>Their Item</h3>
              <div className="item-preview">
                <div className="item-image placeholder" />
                <span className="item-name">White linen top</span>
              </div>
            </div>
            
            <div className="swap-arrow">
              <FontAwesomeIcon icon={faExchangeAlt} />
            </div>
            
            <div className="swap-item">
              <h3>Your Item</h3>
              <div className="items-grid">
                {userItems.map(item => (
                  <div
                    key={item.id}
                    className={`item-option ${selectedItem === item.id ? 'selected' : ''}`}
                    onClick={() => setSelectedItem(item.id)}
                  >
                    <div className="item-image placeholder" />
                    <span className="item-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="message-section">
            <label htmlFor="message">Add a message (optional)</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Why do you want to swap this item?"
              rows={3}
            />
          </div>
          
          <button
            type="submit"
            className="submit-swap"
            disabled={!selectedItem}
          >
            Send Swap Offer
          </button>
        </form>
      </div>
    </div>
  );
};

export default SwapOffer; 