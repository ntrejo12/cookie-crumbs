console.log("Cookie Crumbs background service worker loaded!");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Cookie Crumbs installed successfully!");
});
