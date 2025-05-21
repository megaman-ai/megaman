import React, { useEffect, useState } from 'react';

const PostItem = ({ post, handleSelectThread }) => {
  const [hasThreadButton, setHasThreadButton] = useState(false);
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.html, 'text/html');
    const threadButton = doc.querySelector('.c-message__reply_bar_view_thread');
    const textDiv = doc.querySelector('.c-message__message_blocks');
    const senderSpan = doc.querySelector('.c-message__sender > .p-member_profile_hover_card');
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
    <div className="post-item">
      {sender && sender.length > 1 && <div className="post-header">
        <strong>{sender}</strong>
      </div>}
      <div className="post-content">
        {text}
      </div>
      <div className="post-meta">
        {hasThreadButton && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 mx-2 rounded"
            onClick={() => handleSelectThread(post.id)}>
            View Thread
          </button>
        )}
        <small>ID: {post.id}</small>
      </div>
    </div>
  )
}

export default PostItem;