import React, { useEffect, useState, forwardRef } from 'react';

const PostItem = ({ post, handleSelectThread, isHighlighted }) => {
  const [hasThreadButton, setHasThreadButton] = useState(false);
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [avatarSrc, setAvatarSrc] = useState("");
  const [internallyHighlighted, setInternallyHighlighted] = useState(false);

  useEffect(() => {
    if (isHighlighted) {
      setInternallyHighlighted(true);
      const timer = setTimeout(() => {
        setInternallyHighlighted(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);

  useEffect(() => {
    const matches = post.id.match(/\d+\.\d+/g);
    if (matches && matches.length >= 1) {
      // Convert Slack timestamp to local time
      // Format: 1747583770.000029 (seconds.microseconds since epoch)
      const timestampParts = matches[0].split('.');
      if (timestampParts.length > 0) {
        const seconds = parseInt(timestampParts[0], 10);
        const date = new Date(seconds * 1000); // Convert seconds to milliseconds
        
        // Format the date as a readable string
        const formattedDate = date.toLocaleString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        setTimestamp(formattedDate);
      }
    }
  }, [post]);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.html, 'text/html');
    const threadButton = doc.querySelector('.c-message__reply_bar_view_thread');
    const textDiv = doc.querySelector('.c-message__message_blocks');
    const senderSpan = doc.querySelector('.c-message__sender > .p-member_profile_hover_card');
    const avatar = doc.querySelector('.c-avatar img');
    const imageSrc = avatar ? avatar.src : null;
    if (imageSrc) {
      setAvatarSrc(imageSrc);
    }
    let text = doc.body.textContent || doc.body.innerText || ""
    if (textDiv) {
      text = textDiv.textContent;
    }
    if (senderSpan) {
      let senderText = senderSpan.textContent
      setSender(senderText);
    }
    setHasThreadButton(threadButton !== null);
    setText(text);
  }, [post.html]);
  
  return (
    <div 
      data-id={post.id} 
      className={`${internallyHighlighted ? 'bg-yellow-200' : ''} transition-colors duration-500`} // Apply conditional background and transition
    >
      {sender && sender.length > 1 && <div className="text-left flex items-center">
        {avatarSrc && <img src={avatarSrc} alt="avatar" className="w-8 h-8 rounded-full mr-2" />}
        <strong>{sender}</strong>
        <a href={`main.html?channelId=${post.channelId}&postId=${post.id}`} className="ml-2 text-blue-500 hover:underline">
          <span className="m-2">{timestamp && <small className="post-timestamp">{timestamp}</small>}</span>
        </a>
      </div>}
      <div className="post-content">
        {text}
      </div>
      {hasThreadButton && (
      <div className="text-left">
          <button
            className="bg-white text-blue-500 font-bold my-1 cursor-pointer"
            onClick={() => handleSelectThread(post.id)}>
            View Thread &gt;&gt;
          </button>
      </div>
      )}
    </div>
  )
}

export default PostItem;