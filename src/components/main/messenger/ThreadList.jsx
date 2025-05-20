import { useState, useEffect, useRef } from 'react';
import db from '../../../db';
import './Messenger.css';

const ThreadList = ({ thread_id, selectedChannel, onClose }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const threadsContainerRef = useRef(null);
  
  // Scroll to bottom when threads are loaded
  useEffect(() => {
    if (threads.length > 0 && threadsContainerRef.current) {
      setTimeout(() => {
        threadsContainerRef.current.scrollTop = threadsContainerRef.current.scrollHeight;
      }, 100); // Small delay to ensure content is rendered
    }
  }, [loading, threads]);

  useEffect(() => {
    const loadThreads = async () => {
      if (!thread_id || !selectedChannel) {
        setThreads([]);
        return;
      }
      
      setLoading(true);
      try {
        // Query threads where id includes the thread_id string
        const threadResults = await db.threads
          .filter(thread => 
            String(thread.id).includes(thread_id) && 
            thread.channelId === selectedChannel.id
          )
          .toArray();
        
        // Sort threads by ID if needed
        const sortedThreads = threadResults.sort((a, b) => {
          // Convert string IDs to numbers if possible for proper sorting
          const idA = typeof a.id === 'string' ? Number(a.id) || a.id : a.id;
          const idB = typeof b.id === 'string' ? Number(b.id) || b.id : b.id;
          
          if (typeof idA === 'number' && typeof idB === 'number') {
            return idA - idB; // Ascending order
          }
          // Fallback for string comparison
          return String(idA).localeCompare(String(idB));
        });
        
        setThreads(sortedThreads);
      } catch (error) {
        console.error('Error loading threads:', error);
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadThreads();
  }, [thread_id, selectedChannel]);
  
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
    <div className="thread-list">
      <div className="thread-header">
        <h2>Thread Messages</h2>
        <button 
          className="thread-close-button" 
          onClick={onClose} 
          aria-label="Close thread"
        >
          ×
        </button>
      </div>
      {loading ? (
        <div className="loading">Loading threads...</div>
      ) : threads.length === 0 ? (
        <div className="no-threads">No thread messages found</div>
      ) : (
        <div className="threads-container" ref={threadsContainerRef}>
          {threads.map(thread => (
            <div key={thread.id} className="thread-item">
              <div className="thread-content">
                {extractTextContent(thread.html)}
              </div>
              <div className="thread-meta">
                <small>ID: {thread.id}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThreadList;
