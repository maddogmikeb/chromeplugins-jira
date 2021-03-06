'use strict'

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
    function iconShowHide(msg) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            var activeTab = tabs[0];
            if (!activeTab || !activeTab.id) return;
            var suffix = "\r\nDisabled - No jira elements to enrich";
            chrome.pageAction.show(activeTab.id);
            chrome.pageAction.setIcon({
                tabId: activeTab.id,
                path: "images/icon48.png"
            });
            chrome.pageAction.getTitle({
                tabId: activeTab.id
            }, function(title) {
                if (title.endsWith(suffix)) {
                    chrome.pageAction.setTitle({
                        tabId: activeTab.id,
                        title: title.replace(suffix, "")
                    })
                }
                if (!msg.showIcon) {
                    chrome.pageAction.hide(activeTab.id);
                    chrome.pageAction.setIcon({
                        tabId: activeTab.id,
                        path: "images/icon48-dimmed.png"
                    });
                    chrome.pageAction.getTitle({
                        tabId: activeTab.id
                    }, function(title) {
                        chrome.pageAction.setTitle({
                            tabId: activeTab.id,
                            title: title + suffix
                        })
                    })
                }
            });
        });
    }

    function refreshPage(msg, sender) {
        chrome.tabs.reload(sender.tab.id);
    }

    function saveExpandedQueues(msg, sender) {
        chrome.storage.sync.set({
            "expandedQueues": msg.expandedQueues
        });
    }

    if (msg.hasOwnProperty('showIcon')) {
        iconShowHide(msg);
    }
    if (msg.hasOwnProperty('refreshPage')) {
        refreshPage(msg, sender);
    }
    if (msg.hasOwnProperty('expandedQueues')) {
        saveExpandedQueues(msg, sender);
    }
});