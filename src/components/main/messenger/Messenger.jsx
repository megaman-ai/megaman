import { useState, useEffect } from 'react';
import ChannelList from './ChannelList';
import PostList from './PostList';
import ThreadList from './ThreadList';
import SearchResultsList from './SearchResultsList'; // Added import
import db from '../../../db';
import './Messenger.css';

const Messenger = () => {
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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
    setSearchResults([]); // Clear search results when selecting a channel
    setSearchTerm(""); // Clear search term
    
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = async (event) => {
    if (event.key === 'Enter' && searchTerm.trim() !== '') {
      console.log('Searching for:', searchTerm);
      setLoading(true);
      // Clear existing selections
      setSelectedChannel(null);
      setSelectedThreadId(null);
      setSearchResults([]); // Clear previous search results
      try {
        const posts = await db.posts
          .filter(post => post.html.toLowerCase().includes(searchTerm.toLowerCase()))
          .toArray();
        
        // In a real scenario, you might want to search threads separately
        // or have a more complex data structure for search results.
        // For now, we'll just use the post's text content.
        // We also need to decide how to display these results.
        // This example will just store them in searchResults.
        setSearchResults(posts); 
        console.log('Search results:', posts);
      } catch (error) {
        console.error("Error during search:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="messenger-container">
      <div className="messenger-sidebar">
        <div className="p-2">
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
        </div>
        <ChannelList 
          onSelectChannel={handleSelectChannel} 
          selectedChannel={selectedChannel} 
        />
      </div>
      <div className="messenger-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading data...</p> {/* Changed loading text slightly for clarity */}
          </div>
        ) : searchResults.length > 0 ? (
          <SearchResultsList 
            searchResults={searchResults} 
            handleSelectThread={handleSelectThread} 
          />
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
