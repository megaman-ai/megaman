/*global chrome*/
import { useEffect, useState } from 'react';

import './App.css';

function App() {

  const [postListHtml, setPostListHtml] = useState('');

  useEffect(() => {
    console.log('postListHtml', postListHtml);
  }, [postListHtml]);

  const getPostList = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let postList = document.querySelector('[data-qa="slack_kit_list"].c-virtual_list__scroll_container[role="list"]');
          if (postList) {
            return postList.outerHTML;
          } else {
            return null;
          }
        }
      });
      // Extract the result from the returned array
      if (results && results[0] && results[0].result) {
        setPostListHtml(results[0].result);
      } else {
        setPostListHtml('');
      }
    }
  }

  const scrollUpSlack = async () => {
    console.log('scrollUpSlack');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (!window.getScrollableParent) {
            window.getScrollableParent = function (el) {
              while (el && el !== document.body) {
                const style = getComputedStyle(el);
                if (/(auto|scroll)/.test(style.overflowY)) {
                  return el;
                }
                el = el.parentElement;
              }
              return null;
            };
          }
          if (!window._myScrollEl) {
              window._myScrollEl = document.querySelector('[data-qa="slack_kit_list"].c-virtual_list__scroll_container[role="list"]');
              const scrollParent = window.getScrollableParent(window._myScrollEl);
              window._myScrollEl = scrollParent;
          }
          if (window._myScrollEl) {
            const offset = window._myScrollEl.clientHeight;
            window._myScrollEl.scrollBy(0, -offset);
            let event = new MouseEvent('mouseover', { bubbles: true });
            window._myScrollEl.dispatchEvent(event);
          }
        }
      });
    }
  }

  const openThread = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            window._threadButtonList = document.querySelectorAll('.c-message__reply_count');
            if (window._threadButtonList && window._threadButtonList.length > 0) {
                try {
                    const button = window._threadButtonList[0];
                    button.click();
                    setTimeout(() => {
                        let threadContentList = document.querySelectorAll('[data-qa="slack_kit_list"].c-virtual_list__scroll_container[role="list"][aria-label^="Thread"] > div');
                        console.log('threadContentList', threadContentList);
                    }, 1000);
                } catch (e) {
                    console.error("Error opening thread:", e);
                }
            }
        }
      });
    }
  }

  const scrollUpThread = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (!window.getScrollableParent) {
            window.getScrollableParent = function (el) {
              while (el && el !== document.body) {
                const style = getComputedStyle(el);
                if (/(auto|scroll)/.test(style.overflowY)) {
                  return el;
                }
                el = el.parentElement;
              }
              return null;
            };
          }
          window._myScrollThreadEl = document.querySelector('[data-qa="slack_kit_list"].c-virtual_list__scroll_container[role="list"][aria-label^="Thread"]');
          if (window._myScrollThreadEl) {
              const children = window._myScrollThreadEl.children;
              console.log(children.length);
              for (let i = 0; i < children.length; i++) {
                  const child = children[i];
                  if (child.textContent.trim() !== "") {
                      console.log(child.textContent);
                      window._myScrollThreadEl = child;
                      break;
                  }
              }
              const scrollParent = window.getScrollableParent(window._myScrollThreadEl);
              console.log(window._myScrollThreadEl.scrollHeight, window._myScrollThreadEl.clientHeight);
              console.log(scrollParent.scrollHeight, scrollParent.clientHeight);
              window._myScrollThreadEl = scrollParent;

              const offset = 200;
              console.log(offset);
              window._myScrollThreadEl.scrollBy(0, -offset);
              let event = new MouseEvent('mouseover', { bubbles: true });
              window._myScrollThreadEl.dispatchEvent(event);
          }
        }
      });
    }
  }

  const closeThread = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let closeButton = document.querySelector('[aria-label="Close"]');
          if (closeButton) {
              closeButton.click();
          }
        }
      });
    }
  }

  return (
    <>
      <div className="card">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={scrollUpSlack}>
          Scroll up
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={getPostList}>
          Get Post List
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={openThread}>
          Open thread
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={scrollUpThread}>
          Scroll up thread
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={closeThread}>
          Close thread
        </button>
      </div>
    </>
  )
}

export default App
