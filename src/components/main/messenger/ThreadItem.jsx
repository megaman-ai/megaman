import React, { useEffect, useState } from 'react';

const ThreadItem = ({ thread }) => {
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(thread.html, 'text/html');
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
    setText(text);
  }, [thread.html]);
  
  return (
    <div className="post-item">
      {sender && sender.length > 1 && <div className="post-header">
        <strong>{sender}</strong>
      </div>}
      <div className="post-content">
        {text}
      </div>
      <div className="post-meta">
        <small>ID: {thread.id}</small>
      </div>
    </div>
  )
}

export default ThreadItem;
