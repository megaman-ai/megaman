/*global chrome*/
import { useEffect, useState } from 'react';
import Header from './components/popup/Header';

import './AppPopup.css';
import SlackCollector from './components/popup/SlackCollector';
import WebpageCollector from './components/popup/WebpageCollector';

function AppPopup() {
  const [webpageSource, setWebpageSource] = useState("");

  useEffect(() => {
    const analyzeTabUrl = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        const url = new URL(tab.url);
        const host = url.hostname;
        if (host.includes('app.slack.com')) {
          setWebpageSource('slack');
        }
      }
    }
    analyzeTabUrl();
  }, []);

  const openDashboard = async () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("main.html")
    });
  }

  return (
    <>
      <Header title={'Megaman'} />
      <div className="card">
        {webpageSource === 'slack' && (
          <SlackCollector openDashboardHandler={openDashboard}/>
        )}
        {webpageSource !== 'slack' && (
          <WebpageCollector openDashboardHandler={openDashboard} />
        )}
      </div>
    </>
  )
}

export default AppPopup
