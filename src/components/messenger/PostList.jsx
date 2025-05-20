import { useState, useEffect, useRef } from 'react';
import db from '../../db';
import './Messenger.css';

const PostList = ({ selectedChannel }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const postsContainerRef = useRef(null);
  
  // Scroll to bottom when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && postsContainerRef.current) {
      setTimeout(() => {
        postsContainerRef.current.scrollTop = postsContainerRef.current.scrollHeight;
      }, 100); // Small delay to ensure content is rendered
    }
  }, [loading, posts]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!selectedChannel) {
        setPosts([]);
        return;
      }
      
      setLoading(true);
      try {
        const channelPosts = await db.posts
          .where('channelId')
          .equals(selectedChannel.id)
          .toArray();
        
        // Filter out posts with "divider" in their ID
        const filteredPosts = channelPosts.filter(post => 
          !(String(post.id).includes('divider') || String(post.id).includes('Spacer') || String(post.id).includes('Banner'))
        );
        
        // Sort posts in descending order by postId
        const sortedPosts = filteredPosts.sort((a, b) => {
          // Convert string IDs to numbers if possible for proper sorting
          const idA = typeof a.id === 'string' ? Number(a.id) || a.id : a.id;
          const idB = typeof b.id === 'string' ? Number(b.id) || b.id : b.id;
          
          if (typeof idA === 'number' && typeof idB === 'number') {
            return idA - idB; // Descending order
          }
          // Fallback for string comparison
          return String(idA).localeCompare(String(idB));
        });
        
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPosts();
  }, [selectedChannel]);
  
  // Parse HTML to extract only text content
  const extractTextContent = (html) => {
    if (!html) return "";
    
    // Create a temporary DOM element
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract text content and remove extra whitespace
    return doc.body.textContent || doc.body.innerText || "";
  };
  
  return (
    <div className="post-list">
      {!selectedChannel ? (
        <div className="no-channel-selected">
          <h2>Select a channel to view posts</h2>
        </div>
      ) : (
        <>
          <h2>Posts in #{selectedChannel.name}</h2>
          {loading ? (
            <div className="loading">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="no-posts">No posts found in this channel</div>
          ) : (
            <div className="posts-container" ref={postsContainerRef}>
              {posts.map(post => (
                <div key={post.id} className="post-item">
                  <div className="post-content">
                    {extractTextContent(post.html)}
                  </div>
                  <div className="post-meta">
                    <small>ID: {post.id}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostList;
