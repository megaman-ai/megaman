/*global chrome*/
import { useEffect, useState, useCallback } from 'react';

import './App.css';

// Status enum to track application state
const Status = Object.freeze({
  INITIAL: -1,
  START_COLLECT_POST: 0,
  LOADED: 1, 
  START_COLLECT_THREAD: 2,
  RETRIEVE_THREAD_LIST: 3,
  CLOSE_THREAD: 4,
  NEXT_THREAD: 5,
  WAITING_FOR_PROCESS: 6,
  END: 7
});

function App() {
  const [status, setStatus] = useState(Status.INITIAL);
  const [postListHtml, setPostListHtml] = useState('');
  const [threadListHtml, setThreadListHtml] = useState('');
  const [postItems, setPostItems] = useState([]);
  const [threadContentItems, setThreadContentItems] = useState([]);
  const [threadCount, setThreadCount] = useState(0);
  const [currentThreadIndex, setCurrentThreadIndex] = useState(-1);

  useEffect(() => {
    if (postListHtml) {
      // Parse the HTML string into a DOM object
      const parser = new DOMParser();
      const doc = parser.parseFromString(postListHtml, 'text/html');
      
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

      if (!reachedEnd) {
        setTimeout(() => {
          setStatus(Status.START_COLLECT_THREAD);
        }, 100);
      }
    } else {
      setPostItems([]);
    }
  }, [postListHtml]);

  useEffect(() => {
    console.log('postItems', postItems);
  }, [postItems]);

  useEffect(() => {
    console.log('threadContentItems', threadContentItems);
  }, [threadContentItems]);

  useEffect(() => {
    console.log('parse threadListHtml');
    if (threadListHtml) {
      // Parse the HTML string into a DOM object
      const parser = new DOMParser();
      const doc = parser.parseFromString(threadListHtml, 'text/html');
      
      // Get all direct children divs from the post list
      const childDivs = doc.querySelectorAll('body > div > div');

      let reachedEnd = false;

      // Convert NodeList to Array and extract content
      const items = Array.from(childDivs).map((div) => {
        const divId = div.getAttribute('id');
        const matches = divId.match(/\d+\.\d+/g);
        if (matches && matches.length >= 2) {
          const thread_id = matches[0];
          const thread_content_id = matches[1];
          if (thread_id === thread_content_id) {
            console.log("thread_id and thread_content_id are equal. Reached the top of the thread.");
            reachedEnd = true;
          }
        }
        return {
          id: divId,
          html: div.outerHTML,
          text: div.textContent.trim()
        };
      });
      setThreadContentItems(items);
      if (!reachedEnd) {
        setTimeout(() => {
          scrollUpThread();
          
          // Wait for 100ms before getting the post list
          setTimeout(() => {
            getThreadContentList();
          }, 500);
        }, 100);
      } else {
        setTimeout(() => {
          closeThread();
        }, 500);
      }
    } else {
      setThreadContentItems([]);
    }
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
        setCurrentThreadIndex(-1);
        setTimeout(() => {
          scrollUpSlack();
          // Wait for 100ms before getting the post list
          setTimeout(() => {
            setStatus(Status.START_COLLECT_POST);
          }, 500);
        }, 100);
      }
    }
  }

  const openThread = useCallback(async (threadIndex) => {
    console.log('openThread', threadIndex);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (index) => {
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
        args: [threadIndex]
      });
      setStatus(Status.RETRIEVE_THREAD_LIST);
    }
  }, [currentThreadIndex, setStatus]);

  useEffect(() => {
    if (currentThreadIndex === -1) {
      return;
    }
    console.log('currentThreadIndex', currentThreadIndex);
    if (currentThreadIndex >= threadCount) {
      console.log('No more threads to process. Should close the thread and go to next post.');
      setThreadCount(0);
      setCurrentThreadIndex(-1);
      scrollUpSlack();
      // Wait for 100ms before getting the post list
      setTimeout(() => {
        setStatus(Status.START_COLLECT_POST);
      }, 100);
      return;
    }
    openThread(currentThreadIndex);
  }, [currentThreadIndex, threadCount, openThread]);

  const retrieveThreadContent = useCallback(async () => {
    if (currentThreadIndex === -1) {
      return;
    }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
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
      case Status.START_COLLECT_POST:
        console.log('START');
        setTimeout(() => {
          getPostList();
        }, 500);
        break;
      case Status.START_COLLECT_THREAD:
        console.log('START_COLLECT_THREAD');
        setTimeout(() => {
          findThreads();
        }, 500);
        setStatus(Status.WAITING_FOR_PROCESS);
        break;
      case Status.RETRIEVE_THREAD_LIST:
        console.log('RETRIEVE_THREAD_LIST');
        setTimeout(() => {
          retrieveThreadContent();
        }, 500);
        setStatus(Status.WAITING_FOR_PROCESS);
        break;
      case Status.CLOSE_THREAD:
        console.log('CLOSE_THREAD');
        setTimeout(() => {
          closeThreadContent();
        }, 500);
        break;
      case Status.NEXT_THREAD:
        console.log('NEXT_THREAD');
        setTimeout(() => {
          setCurrentThreadIndex(currentThreadIndex + 1);
        }, 500);
        setStatus(Status.WAITING_FOR_PROCESS);
        break;
      case Status.WAITING_FOR_PROCESS:
        console.log('WAITING_FOR_PROCESS');
        break;
      case Status.END:
        console.log('END');
        break;
      default:
        console.log('Unknown status:', status);
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
              window._myScrollThreadEl = scrollParent;

              const offset = 200;
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

  const openThreadPanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
            window._threadButtonList = document.querySelectorAll('.c-message__reply_count');
            if (window._threadButtonList && window._threadButtonList.length > 0) {
              try {
                  const button = window._threadButtonList[0];
                  button.click();
              } catch (e) {
                  console.error("Error opening thread:", e);
              }
            }
        }
      });
    }
  }

  const getThreadContentList = async () => {
    console.log('getThreadContentList');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
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
    }
  };

  const startCollecting = async () => {
    setStatus(Status.START_COLLECT_POST);
  };

  return (
    <>
      <div className="card">
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={startCollecting}>
          Start Collecting
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={scrollUpSlack}>
          Scroll up
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={getPostList}>
          Get Post List
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={findThreads}>
          Go through threads
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={openThreadPanel}>
          Open Thread
        </button>
        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded" onClick={getThreadContentList}>
          Get Thread Content List
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
