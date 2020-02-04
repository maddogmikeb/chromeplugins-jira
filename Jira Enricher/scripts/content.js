'use strict'

Array.prototype.remByVal = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] === val) {
            this.splice(i, 1);
            i--;
        }
    }
    return this;
}

chrome.runtime.sendMessage({
    showIcon: false
});

chrome.storage.sync.onChanged.addListener(function(changes) {
    if (!changes.hasOwnProperty('expandedQueues')) {
        chrome.runtime.sendMessage({
            refreshPage: true
        });
    }
});

chrome.storage.sync.get(['options', 'expandedQueues'], function(storage) {
    (function(options, expandedQueues) {
        function getOrderedColumns(board) {
            var heads = [].map.call(board.querySelectorAll("ul.ghx-column-headers > li.ghx-column"), function(elm) {
                return elm;
            });
            heads.reverse();
            var cols = [];
            heads.forEach(function(head, headIndex) {
                board.querySelectorAll(`li[data-column-id='${head.dataset.id}']`).forEach(function(col) {
                    var swim = col.closest("div[swimlane-id]");
                    col.dataset.visibleRank = parseFloat((headIndex + 1).toString().padStart(3, '0') + (swim ? swim.attributes['swimlane-id'].value : 0).toString().padStart(3, '0'));
                    cols.push(col);
                });
                cols.sort(function(a, b) {
                    return parseFloat(a.dataset.visibleRank) > parseFloat(b.dataset.visibleRank) ? 1 : -1;
                });
            });
            return cols;
        }

        function getOrderedIssues(board) {
            var issues = [];
            var cols = getOrderedColumns(board);
            if (cols.length > 0) {
                cols.forEach(function(col) {
                    var that = col;
                    col.querySelectorAll("div.ghx-issue, div.js-issue").forEach(function(elm, index) {
                        if (elm.classList.contains("ghx-done")) {
                            elm.dataset.visibleRank = Number.MAX_SAFE_INTEGER - index;
                        } else {
                            elm.dataset.visibleRank = parseFloat(that.dataset.visibleRank.toString() + (index + 1).toString().padStart(5, '0'));
                        }
                        issues.push(elm);
                    });
                });
            } else {
                issues = [].map.call(board.querySelectorAll("div.ghx-issue, div.js-issue"), function(elm, index) {
                    if (elm.classList.contains("ghx-done")) {
                        elm.dataset.visibleRank = Number.MAX_SAFE_INTEGER - index;
                    } else {
                        elm.dataset.visibleRank = index;
                    }
                    return elm;
                });
            }
            issues.sort(function(a, b) {
                return parseFloat(a.dataset.visibleRank) > parseFloat(b.dataset.visibleRank) ? 1 : -1;
            });
            return issues;
        }

        var boards = document.querySelectorAll("#ghx-work, #ghx-plan");
        boards.forEach(function(board) {
            utils.observeChanges(board, function() {
                var issues = getOrderedIssues(board);
                issues.forEach(function(issue, index) {
                    enrichIssue(options, issue, index);
                });
            });
        });

        chrome.runtime.sendMessage({
            showIcon: boards.length > 0
        });

        if (options.fixServiceDeskQueues) {
            var frontEnd = document.querySelector("div[id='jira-frontend']");
            if (frontEnd) {
                utils.observeChanges(frontEnd, function() {
                    utils.waitForElement(frontEnd, "div[data-rbd-droppable-id='sd-queues-custom']").then(function() {
                        chrome.runtime.sendMessage({
                            showIcon: true
                        });
                        enrichServiceDeskQueues(options, frontEnd, expandedQueues);
                    });
                });
            }
        }
    })
    (
        (!chrome.runtime.lastError ? (storage.options ? storage.options : defaultOptions) : defaultOptions),
        (!chrome.runtime.lastError ? (storage.expandedQueues ? storage.expandedQueues : []) : [])
    );
});