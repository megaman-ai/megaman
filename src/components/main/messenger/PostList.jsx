import { useState, useEffect, useRef } from 'react';
import db from '../../../db/db';
import PostItem from './PostItem';
import './Messenger.css';

const PostList = ({ selectedChannel, handleSelectThread, scrollToPostId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const postsContainerRef = useRef(null);

  // Scroll to bottom when posts are loaded
  useEffect(() => {
    if (posts.length > 0 && postsContainerRef.current) {
      setTimeout(() => {
        postsContainerRef.current.scrollTop = postsContainerRef.current.scrollHeight;
        const postItem = postsContainerRef.current.querySelector(`[data-id="${scrollToPostId}"]`);
        if (postItem) {
          postItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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
        const channelPosts = await db.messengerPosts
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
                <PostItem key={post.id} post={post} handleSelectThread={handleSelectThread} isHighlighted={post.id === scrollToPostId}/>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostList;
