// Background script for Gold is Great Chrome extension

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open the game in a new tab
  chrome.tabs.create({ url: 'index.html' });
});

// Log extension startup
console.log('Gold is Great extension background service worker started');
