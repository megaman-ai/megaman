import { useState, useEffect } from 'react';
import db from '../../../db/db';
import './Messenger.css';

const ChannelList = ({ onSelectChannel, selectedChannel }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const allChannels = await db.messengerChannels.toArray();
        setChannels(allChannels);
      } catch (error) {
        console.error('Error loading channels:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChannels();
  }, []);
  
  return (
    <div className="channel-list">
      <h2>Channels</h2>
      {loading ? (
        <p>Loading channels...</p>
      ) : channels.length === 0 ? (
        <p>No channels found</p>
      ) : (
        <ul>
          {channels.map(channel => (
            <li 
              key={channel.id} 
              className={selectedChannel?.id === channel.id ? 'active' : ''}
            >
              <a href={`?channelId=${channel.id}`} className="channel-link"><span className="channel-name"># {channel.name}</span> </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChannelList;
