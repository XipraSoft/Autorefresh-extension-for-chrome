let tabTimers = {};

function startRefreshing(tabId, url, interval) {
  if (tabTimers[tabId] && tabTimers[tabId].intervalId) {
    clearInterval(tabTimers[tabId].intervalId);
  }

  let timeLeft = interval;
  chrome.action.setBadgeText({ tabId: tabId, text: String(timeLeft) });
  chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#d93025' });

  const intervalId = setInterval(() => {
    timeLeft--;
    chrome.action.setBadgeText({ tabId: tabId, text: String(timeLeft > 0 ? timeLeft : 'R') });

    if (timeLeft <= 0) {
      clearInterval(intervalId);
      chrome.tabs.reload(tabId, { bypassCache: true });
    }
  }, 1000);

  tabTimers[tabId] = { intervalId: intervalId, interval: interval };
  
  chrome.storage.local.set({ [url]: { interval: interval, isRunning: true } });
  console.log(`SUCCESS: URL ${url} ke liye har ${interval}s ka refresh shuru hua.`);
}


function stopRefreshing(url) {
  chrome.storage.local.set({ [url]: { isRunning: false } });
  console.log(`STOPPED: URL ${url} ke liye refresh roka gaya.`);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "start") {
    startRefreshing(request.tabId, request.url, request.interval);
    sendResponse({ status: "Timer started" });
  } else if (request.command === "stop") {
    stopRefreshing(request.url);
    chrome.tabs.query({url: request.url}, (tabs) => {
        tabs.forEach(tab => {
            if(tabTimers[tab.id]) clearInterval(tabTimers[tab.id].intervalId);
            chrome.action.setBadgeText({ tabId: tab.id, text: '' });
        });
    });
    sendResponse({ status: "Timer stopped" });
  } else if (request.command === "getStatus") {
    chrome.storage.local.get(request.url, (result) => {
        sendResponse(result[request.url]);
    });
    return true;
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(tab.url, (result) => {
      const settings = result[tab.url];
      if (settings && settings.isRunning) {
        setTimeout(() => {
          console.log(`RESTARTING: URL ${tab.url} (Tab ID: ${tabId}) ke liye timer shuru kar rahe hain.`);
          startRefreshing(tabId, tab.url, settings.interval);
        }, 500);
      }
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if(tabTimers[tabId]) {
      clearInterval(tabTimers[tabId].intervalId);
      delete tabTimers[tabId];
  }
});