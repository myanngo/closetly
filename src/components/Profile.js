import React from 'react';
import './Profile.css';
import { useNavigate } from 'react-router-dom';

const user = {
  name: 'Julia Yan',
  username: '@juliayan',
  bio: 'Lover of swaps, stories, and secondhand style!',
  avatar: null,
  friends: [null, null, null, null, null, null],
  items: [
    { id: 1, name: 'White linen top', image: null },
    { id: 2, name: 'Red scarf', image: null },
    { id: 3, name: 'Black turtleneck', image: null },
  ],
  stats: {
    swaps: 16,
    stories: 5,
    suggestions: 2,
  },
};

const Profile = () => {
  const navigate = useNavigate();
  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-placeholder" />
        <div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-username">{user.username}</div>
          <div className="profile-bio">{user.bio}</div>
        </div>
      </div>
      <div className="profile-friends">
        <div className="profile-friends-label">Friends</div>
        <div className="friends-list">
          {user.friends.map((f, i) => (
            <div className="friend-avatar" key={i} />
          ))}
          <div className="friend-avatar add">+</div>
        </div>
      </div>
      <div className="profile-items-carousel">
        <div className="carousel-label">Current Items</div>
        <div className="carousel-scroll">
          {user.items.map(item => (
            <div className="carousel-item" key={item.id} onClick={() => navigate(`/item/${item.id}`)} style={{ cursor: 'pointer' }}>
              <div className="carousel-item-img" />
              <div className="carousel-item-name">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="profile-stats">
        <div><span className="stat-number">{user.stats.swaps}</span> swaps made</div>
        <div><span className="stat-number">{user.stats.stories}</span> stories logged</div>
        <div><span className="stat-number">{user.stats.suggestions}</span> style suggestions offered</div>
      </div>
    </div>
  );
};

export default Profile; 