import { useState } from 'react';
import ChannelList from './ChannelList';
import PostList from './PostList';
import './Messenger.css';

const Messenger = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);

  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel);
  };

  return (
    <div className="messenger-container">
      <div className="messenger-sidebar">
        <ChannelList 
          onSelectChannel={handleSelectChannel} 
          selectedChannel={selectedChannel} 
        />
      </div>
      <div className="messenger-content">
        <PostList selectedChannel={selectedChannel} />
      </div>
    </div>
  );
};

export default Messenger;
