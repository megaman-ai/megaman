import { useState, useEffect } from 'react';
import ChannelList from './ChannelList';
import PostList from './PostList';
import ThreadList from './ThreadList';
import db from '../../../db';
import './Messenger.css';

const Messenger = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Read channelId from URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const channelId = queryParams.get('channelId');
    
    if (channelId) {
      setLoading(true);
      
      // Fetch the channel from the database
      db.channels
        .where('id')
        .equals(channelId)
        .first()
        .then(channel => {
          if (channel) {
            setSelectedChannel(channel);
            console.log(`Selected channel from URL: ${channel.name}`);
          } else {
            console.warn(`Channel with ID ${channelId} not found`);
          }
        })
        .catch(error => {
          console.error("Error fetching channel:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    setSelectedThreadId(null); // Reset thread selection when changing channels
    
    // Update URL with the selected channel ID
    if (channel && channel.id) {
      const url = new URL(window.location);
      url.searchParams.set('channelId', channel.id);
      window.history.pushState({}, '', url);
    }
  };

  const handleSelectThread = async (postId) => {
    const matches = postId.match(/\d+\.\d+/g);
    if (matches && matches.length >= 1) {
      const thread_id = matches[0];
      setSelectedThreadId(thread_id);
      console.log(`Opening thread for post ID: ${thread_id}`);
    }
  }
  
  const handleCloseThread = () => {
    setSelectedThreadId(null);
  }

  return (
    <div className="messenger-container">
      <div className="messenger-sidebar">
        <ChannelList 
          onSelectChannel={handleSelectChannel} 
          selectedChannel={selectedChannel} 
        />
      </div>
      <div className="messenger-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading channel data...</p>
          </div>
        ) : (
          <div className="content-container">
            <div className={`post-list-container ${!selectedThreadId ? 'full-width' : ''}`}>
              <PostList 
                selectedChannel={selectedChannel} 
                handleSelectThread={handleSelectThread} 
              />
            </div>
            {selectedThreadId && (
              <div className="thread-list-container">
              <ThreadList 
                thread_id={selectedThreadId} 
                selectedChannel={selectedChannel}
                onClose={handleCloseThread}
              />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Messenger;
