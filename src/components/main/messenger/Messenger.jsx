import { useState } from 'react';
import ChannelList from './ChannelList';
import PostList from './PostList';
import ThreadList from './ThreadList';
import db from '../../../db';
import './Messenger.css';

const Messenger = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
    setSelectedThreadId(null); // Reset thread selection when changing channels
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
      </div>
    </div>
  );
};

export default Messenger;
