/*global chrome*/
import { useEffect, useState, useCallback } from 'react';

import './App.css';

// Status enum to track application state
const Status = Object.freeze({
  INITIAL: -1,
  LOADING: 0,
  LOADED: 1, 
  OPEN_THREAD: 2,
  RETRIEVE_THREAD_LIST: 3,
  CLOSE_THREAD: 4,
  NEXT_THREAD: 5,
  END: 6
});

function App() {
  const [status, setStatus] = useState(Status.INITIAL);
  const [postListHtml, setPostListHtml] = useState('');
  const [threadListHtml, setThreadListHtml] = useState('');
  const [postItems, setPostItems] = useState([]);
  const [threadCount, setThreadCount] = useState(0);
  const [currentThreadIndex, setCurrentThreadIndex] = useState(-1);

  useEffect(() => {
    if (postListHtml) {
      // Parse the HTML string into a DOM object
      const parser = new DOMParser();
      const doc = parser.parseFromString(postListHtml, 'text/html');
      console.log('doc', doc);
      
      // Get all direct children divs from the post list
      const childDivs = doc.querySelectorAll('body > div > div');

      let reachedEnd = false;
      
      // Convert NodeList to Array and extract content
      const items = Array.from(childDivs).map((div) => {
        const divId = div.getAttribute('id');
        if (divId === 'message-list_0000000000.000001') {
          reachedEnd = true;
        }
        return {
          id: divId,
          html: div.outerHTML,
          text: div.textContent.trim()
        };
      });
      setPostItems(items);
      console.log('Parsed post items:', items);

      if (!reachedEnd) {
        setTimeout(() => {
          scrollUpSlack();
          
          // Wait for 100ms before getting the post list
          setTimeout(() => {
            getPostList();
          }, 500);
        }, 100);
      }
    } else {
      setPostItems([]);
    }
  }, [postListHtml]);

  useEffect(() => {
    console.log('threadListHtml', threadListHtml);
  }, [threadListHtml]);

  const getPostList = async () => {
    console.log('getPostList');
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

  const findThreads = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            window._threadButtonList = document.querySelectorAll('.c-message__reply_count');
            if (window._threadButtonList && window._threadButtonList.length > 0) {
              return window._threadButtonList.length;
            }
        }
      });
      if (results && results[0] && results[0].result) {
        const threadCount = results[0].result;
        console.log('threadCount', threadCount);
        setThreadCount(threadCount);
        if (currentThreadIndex === -1) {
          setCurrentThreadIndex(0);
        } else {
          setCurrentThreadIndex((prevIndex) => (prevIndex + 1) % threadCount);
        }
      } else {
        setThreadCount(0);
      }
    }
  }

  useEffect(() => {
    if (currentThreadIndex === -1) {
      return;
    }
    const openThread = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: async (index) => {
              window._sleep = function (ms) {
                  return new Promise(resolve => setTimeout(resolve, ms));
              }
              window._threadButtonList = document.querySelectorAll('.c-message__reply_count');
              if (window._threadButtonList && window._threadButtonList.length > 0) {
                try {
                    const button = window._threadButtonList[index];
                    button.click();
                } catch (e) {
                    console.error("Error opening thread:", e);
                }
              }
          },
          args: [currentThreadIndex]
        });
        setStatus(Status.RETRIEVE_THREAD_LIST);
      }
    }
    openThread();
  }, [currentThreadIndex]);

  const retrieveThreadContent = useCallback(async () => {
    if (currentThreadIndex === -1) {
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
            window._sleep = function (ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }
            let threadContentList = document.querySelector('[data-qa="slack_kit_list"].c-virtual_list__scroll_container[role="list"][aria-label^="Thread"]');
            if (threadContentList) {
              return threadContentList.outerHTML;
            } else {
              return null;
            }
        }
      });
      if (results && results[0] && results[0].result) {
        setThreadListHtml(results[0].result);
      }
      else {
        setThreadListHtml('');
      }
      setStatus(Status.CLOSE_THREAD);
    }
  }, [currentThreadIndex]);

  const closeThreadContent = useCallback(async () => {
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
      setStatus(Status.NEXT_THREAD);
    }
  }, []);

  useEffect(() => {
    switch (status) {
      case Status.RETRIEVE_THREAD_LIST:
        console.log('RETRIEVE_THREAD_LIST');
        setTimeout(() => {
          retrieveThreadContent();
        }, 500);
        break;
      case Status.CLOSE_THREAD:
        console.log('CLOSE_THREAD');
        setTimeout(() => {
          closeThreadContent();
        }, 500);
        break;
      case Status.NEXT_THREAD:
        console.log('NEXT_THREAD');
        if (currentThreadIndex < (threadCount - 1)) {
          console.log('open next thread');
          setCurrentThreadIndex(currentThreadIndex + 1);
        } else {
          setStatus(Status.END);
        }
        break;
      case Status.END:
        console.log('END');
        break;
    }
  }, [status, threadCount, currentThreadIndex, retrieveThreadContent, closeThreadContent, setCurrentThreadIndex]);

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
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={findThreads}>
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
