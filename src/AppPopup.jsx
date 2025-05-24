/*global chrome*/
import { useEffect, useState, useCallback } from 'react';
import db from './db';
import Header from './components/popup/Header';
import { exportDBToZip } from './db-exporter';

import './AppPopup.css';

// Status enum to track application state
const Status = Object.freeze({
  INITIAL: -1,
  START_COLLECT_POST: 0,
  START_COLLECT_THREAD: 1,
  RETRIEVE_THREAD_LIST: 2,
  CLOSE_THREAD: 3,
  NEXT_THREAD: 4,
  WAITING_FOR_PROCESS: 5,
  END: 6
});

function AppPopup() {
  const [collecting, setCollecting] = useState(false);
  const [status, setStatus] = useState(Status.INITIAL);
  const [channelList, setChannelList] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [postListHtml, setPostListHtml] = useState('');
  const [threadListHtml, setThreadListHtml] = useState('');
  const [postItems, setPostItems] = useState([]);
  const [threadContentItems, setThreadContentItems] = useState([]);
  const [threadCount, setThreadCount] = useState(0);
  const [currentThreadIndex, setCurrentThreadIndex] = useState(-1);

  useEffect(() => {
    channelList.forEach(async (channel) => {
      try {
        await db.channels.add({
          id: channel.id,
          name: channel.name,
          team: channel.team
        });
      } catch (error) {
        if (error.name === 'ConstraintError') {
          console.warn('Key already exists:', error);
        } else {
          console.warn('Error adding channel to DB:', error);
        }
      }
    });
  }, [channelList]);

  useEffect(() => {
    if (currentChannel) {
      console.log('currentChannel', currentChannel);
      setCollecting(true);
      setStatus(Status.START_COLLECT_POST);
    }
  }, [currentChannel]);

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

      if (reachedEnd) {
        setTimeout(() => {
          setStatus(Status.END);
        }, 100);
      } else {
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
    postItems.forEach(async (item) => {
      try {
        await db.posts.add({
          id: item.id,
          channelId: currentChannel.id,
          html: item.html
        });
      } catch (error) {
        if (error.name === 'ConstraintError') {
          console.warn('Key already exists:', error);
        } else {
          console.warn('Error adding channel to DB:', error);
        }
      }
    });
  }, [postItems]);

  useEffect(() => {
    console.log('threadContentItems', threadContentItems);
    threadContentItems.forEach(async (item) => {
      try {
        await db.threads.add({
          id: item.id,
          channelId: currentChannel.id,
          html: item.html
        });
      } catch (error) {
        if (error.name === 'ConstraintError') {
          console.warn('Key already exists:', error);
        } else {
          console.warn('Error adding channel to DB:', error);
        }
      }
    });
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
      case Status.INITIAL:
        console.log('INITIAL');
        break;
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
        setCollecting(false);
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

  const getChannelList = async () => {
    console.log('getChannelList');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          let channelPanelList = document.querySelectorAll('.p-channel_sidebar__channel');
          let teamName = document.querySelector('.p-ia4_home_header_menu__team_name');
          if (channelPanelList && channelPanelList.length > 0) {
            const items = Array.from(channelPanelList).map((channel) => {
              const channelId = channel.getAttribute('data-qa-channel-sidebar-channel-id');
              const channelName = channel.textContent.trim();
              return {
                id: channelId,
                name: channelName,
                team: teamName ? teamName.textContent.trim() : null
              };
            });
            return items;
          } else {
            return null;
          }
        }
      });
      if (results && results[0] && results[0].result) {
        const channelInfo = results[0].result;
        setChannelList(channelInfo);
        channelInfo.forEach((channel) => {
          if (tab.url.includes(channel.id)) {
            setCurrentChannel(channel);
          }
        });
      } else {
        console.log('No channel information found.');
      }
    }
  };

  const startCollecting = async () => {
    getChannelList();
  };

  const viewSlackDB = async () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("main.html")
    });
  }

  const importDBFromZip = async () => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // Handle file selection
    fileInput.onchange = async (event) => {
      try {
        const file = event.target.files[0];
        if (!file) {
          console.log('No file selected');
          return;
        }

        if (!file.name.endsWith('.zip')) {
          alert('Please select a valid ZIP file');
          return;
        }

        setCollecting(true); // Show the loading spinner
        setStatus(Status.INITIAL); // Reset status but keep collecting=true for the spinner

        // Read the zip file
        const JSZip = await import('jszip');
        const zip = new JSZip.default();
        const content = await zip.loadAsync(file);

        // Process each table
        const tables = ['channels', 'posts', 'threads'];
        const importResults = {};

        for (const tableName of tables) {
          const fileName = `${tableName}.json`;
          if (!content.files[fileName]) {
            console.warn(`File ${fileName} not found in zip`);
            importResults[tableName] = { status: 'error', message: 'File not found in zip' };
            continue;
          }

          try {
            // Read the JSON data
            const jsonData = await content.files[fileName].async('text');
            const recordsArray = JSON.parse(jsonData);

            if (!Array.isArray(recordsArray)) {
              console.warn(`Invalid data format in ${fileName}`);
              importResults[tableName] = { status: 'error', message: 'Invalid data format' };
              continue;
            }

            // Clear the table before import
            await db.table(tableName).clear();

            // Import records in batches to improve performance
            let addedCount = 0;
            const batchSize = 100;

            for (let i = 0; i < recordsArray.length; i += batchSize) {
              const batch = recordsArray.slice(i, i + batchSize);
              await db.table(tableName).bulkAdd(batch);
              addedCount += batch.length;
            }

            importResults[tableName] = {
              status: 'success',
              count: addedCount
            };
            console.log(`Imported ${addedCount} records into ${tableName}`);
          } catch (tableError) {
            console.error(`Error importing table ${tableName}:`, tableError);
            importResults[tableName] = { status: 'error', message: tableError.message };
          }
        }

        // Calculate import summary
        const totalSuccess = Object.values(importResults)
          .filter(result => result.status === 'success')
          .length;

        // Update the UI
        if (totalSuccess === tables.length) {
          alert(`Import completed successfully:\n${Object.entries(importResults).map(([table, result]) =>
            `${table}: ${result.count} records imported`
          ).join('\n')}`);
        } else {
          const summary = Object.entries(importResults).map(([table, result]) =>
            `${table}: ${result.status === 'success' ? `${result.count} records imported` : `Failed - ${result.message}`}`
          ).join('\n');

          alert(`Import completed with some issues:\n${summary}`);
        }

      } catch (error) {
        console.error('Error importing database:', error);
        alert(`Import failed: ${error.message}`);
      } finally {
        document.body.removeChild(fileInput);
        setCollecting(false);
      }
    };

    // Trigger the file input dialog
    fileInput.click();
  };

  return (
    <>
      <Header title={'Megaman'} />
      <div className="card">
        <h2 className='text-2xl'>{currentChannel ? `${currentChannel.team} - ${currentChannel.name}` : ''}</h2>
        <div className="flex justify-evenly my-2"> {/* Added flex container */}
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xl"
            onClick={startCollecting}
            disabled={collecting}
          >
            {collecting ? 'Collecting...' : 'Start'}
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xl"
            onClick={viewSlackDB}
            disabled={collecting}
          >
            View
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center">
        {collecting && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-blue-500 font-semibold">Collection in progress... please don't close this extension.</span>
          </>
        )}
        {!collecting && (
          <h3 className='text-xl text-center'>
            Press Start to collect and save slack data then you can view later offline
          </h3>
        )}
        </div>

        <div className="mt-2">
          {status === Status.START_COLLECT_POST && <p>Getting posts...</p>}
          {status === Status.START_COLLECT_THREAD && <p>Finding threads...</p>}
          {status === Status.RETRIEVE_THREAD_LIST && <p>Retrieving thread content...</p>}
          {status === Status.CLOSE_THREAD && <p>Closing thread...</p>}
          {status === Status.NEXT_THREAD && <p>Moving to next thread...</p>}
          {status === Status.WAITING_FOR_PROCESS && <p>Processing...</p>}
          {status === Status.END && <p>Collection complete!</p>}
        </div>
      </div>
    </>
  )
}

export default AppPopup
