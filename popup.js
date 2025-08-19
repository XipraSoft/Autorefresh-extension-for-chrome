document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusDiv = document.getElementById('status');

  let activeTab; 

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return; 
    activeTab = tabs[0];
    const tabUrl = activeTab.url;

    chrome.runtime.sendMessage({ command: "getStatus", url: tabUrl }, (response) => {
      if (response && response.isRunning) {
        intervalInput.value = response.interval;
        statusDiv.textContent = `Refreshing every ${response.interval}s`;
        updateButtonState(true);
      } else {
        statusDiv.textContent = "Timer is stopped.";
        updateButtonState(false);
        if (response && response.interval) {
          intervalInput.value = response.interval;
        }
      }
    });
  });

  startBtn.addEventListener('click', () => {
    const interval = parseInt(intervalInput.value);
    if (interval >= 5) {
      chrome.runtime.sendMessage({ command: "start", tabId: activeTab.id, url: activeTab.url, interval: interval });
      statusDiv.textContent = `Refreshing every ${interval}s`;
      updateButtonState(true);
    } else {
      statusDiv.textContent = "Interval must be at least 5s.";
    }
  });

  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: "stop", url: activeTab.url });
    statusDiv.textContent = "Timer is stopped.";
    updateButtonState(false);
  });

  function updateButtonState(isRefreshing) {
    startBtn.disabled = isRefreshing;
    stopBtn.disabled = !isRefreshing;
  }
});