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
  const [lastSelectedChannelBeforeSearch, setLastSelectedChannelBeforeSearch] = useState(null);

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
    setLastSelectedChannelBeforeSearch(null); // Clear last selected channel before search
    
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
      setLastSelectedChannelBeforeSearch(selectedChannel); // Store current channel
      setSelectedChannel(null); // Clear current channel for search results view
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

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedChannel(lastSelectedChannelBeforeSearch);
    setLastSelectedChannelBeforeSearch(null);
    // If there was a thread open from the search results, it should naturally close
    // as selectedChannel changes and PostList re-evaluates.
    // If a thread was open from the original channel, selectedThreadId might need reset if it was tied to search.
    // For now, assume thread selection is reset when channel changes or search happens.
    setSelectedThreadId(null); 
  };

  return (
    <div className="messenger-container">
      <div className="messenger-sidebar">
        <div className="p-2 relative">
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full p-2 border rounded pr-8" // Added pr-8 for X button space
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-0 top-0 mt-2 mr-3 text-gray-500 hover:text-gray-700 p-2 focus:outline-none"
              aria-label="Clear search"
            >
              &#x2715; {/* This is a Unicode 'X' character */}
            </button>
          )}
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
