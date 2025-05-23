import React, { useState } from 'react';
import './HomeFeed.css';
import { useNavigate } from 'react-router-dom';
import Postcard from './Postcard';

const allStories = [
  {
    id: 1,
    user: '@jenny',
    text: 'i wore this outfit to the coldplay concert! had a lot of fun and took some cute pics with friends',
    image: null,
    itemName: 'White linen top',
    from: '@jane',
    to: '@jenny',
    likes: 3,
  },
  {
    id: 2,
    user: '@alex',
    text: 'wore this to a halloween party as a pirate!','image': null,
    itemName: 'Red scarf',
    from: '@emily',
    to: '@alex',
    likes: 1,
  },
];

const friendsStories = [
  {
    id: 1,
    user: '@jenny',
    text: 'i wore this outfit to the coldplay concert! had a lot of fun and took some cute pics with friends',
    image: null,
    itemName: 'White linen top',
    from: '@jane',
    to: '@jenny',
    likes: 3,
  },
];

const HomeFeed = () => {
  const navigate = useNavigate();
  const [feed, setFeed] = useState('all');
  const stories = feed === 'all' ? allStories : friendsStories;

  return (
    <div className="home-feed">
      <div className="feed-toggle">
        <button className={feed === 'all' ? 'active' : ''} onClick={() => setFeed('all')}>All</button>
        <button className={feed === 'friends' ? 'active' : ''} onClick={() => setFeed('friends')}>Friends</button>
      </div>
      <h2>View recent swap stories</h2>
      {stories.map(story => (
        <div key={story.id} className="feed-post-container">
          <div style={{ color: '#b85c5c', fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            <span style={{ color: '#222' }}>{story.from}</span> <span style={{ fontSize: '1.1em' }}>→</span> <span style={{ color: '#222' }}>{story.to}</span> <span style={{ color: '#d36c6c', fontWeight: 600 }}>{story.itemName}</span>
          </div>
          <Postcard user={story.user} text={story.text} image={story.image} initialLikes={story.likes} />
          <div className="swap-actions">
            <button onClick={() => navigate(`/item/${story.id}`)}>view item</button>
            <button onClick={() => navigate(`/item/${story.id}/history`)}>see item history</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HomeFeed; 