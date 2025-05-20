import React, { useEffect, useState } from 'react';

const PostItem = ({ post, handleSelectThread }) => {
  const [hasThreadButton, setHasThreadButton] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.html, 'text/html');
    console.log(doc);
    const threadButton = doc.querySelector('.c-message__reply_bar_view_thread');
    console.log(threadButton);
    setHasThreadButton(threadButton !== null);
    setText(doc.body.textContent || doc.body.innerText || "");
  }, [post.html]);
  
  return (
    <div className="post-item">
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