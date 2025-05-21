import React, { useEffect, useState } from 'react';

const ThreadItem = ({ thread }) => {
  const [text, setText] = useState("");
  const [sender, setSender] = useState("");
  const [timestamp, setTimestamp] = useState("");

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

    const matches = thread.id.match(/\d+\.\d+/g);
    if (matches && matches.length >= 2) {
      const timestampParts = matches[1].split('.');
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
  }, [thread]);
  
  return (
    timestamp && <div>
      {sender && sender.length > 1 && <div className="post-header">
        <strong>{sender}</strong><span className="m-2">{timestamp && <small className="post-timestamp">{timestamp}</small>}</span>
      </div>}
      <div className="post-content">
        {text}
      </div>
    </div>
  )
}

export default ThreadItem;
