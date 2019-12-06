console.log("Running 'Things that shit me about Jira' Plugin...");

var baseUrl = "https://" + window.location.hostname;

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

function fixColors(issue) {
    if (issue.style.backgroundColor == "") {
        var bar = issue.querySelector("div.ghx-grabber");
        if (bar.style.backgroundColor != "#eeeeee" && bar.style.backgroundColor != "rgb(238, 238, 238)") {
            issue.style.backgroundColor = utils.convertHex(bar.style.backgroundColor, 0.2);
        }
    }
}

function fixFlags(issue) {
    var config = { subtree: true, childList: true };
    var observer = new MutationObserver(function () {
        observer.disconnect();
        issue.querySelectorAll("span.ghx-flag-priority").forEach(function (flag) { getFlaggedReason(flag) });
        observer.observe(issue, config);
    });
    issue.querySelectorAll("span.ghx-flag-priority").forEach(function (flag) { getFlaggedReason(flag) });
    observer.observe(issue, config);
}

function getFlaggedReason(flag) {
    try {
        var child = flag.lastElementChild;
        while (child) {
            flag.removeChild(child);
            child = flag.lastElementChild;
        }
        flag.innerHTML = '<span class="aui-icon aui-icon-small" data-tooltip="Loading flagged reason..." original-title=""></span>';
    } catch (e) {
        //
    }
    var key = flag.closest("div.ghx-issue").dataset.issueKey;
    utils.pagedJIRA(baseUrl + "/rest/api/2/issue/" + key + "/comment?", "comments", function (comments) {
        flag.querySelector("span").dataset.tooltip = "No reason for flagged mentioned.";
        comments.reverse();
        comments.forEach(function (comment) {
            if (comment.body.startsWith('(flag) Flag added')) {
                flag.querySelector("span").dataset.tooltip = comment.body.replace('(flag) Flag added', '').trim();
            }
        });
    });
}

function fixSubtasks(issue) {
    issue.querySelectorAll("span.ghx-extra-field").forEach(function (field) {
        getSubTasks(field, issue.dataset.issueKey);
    });
}

function getSubTasks(field, key) {
    if (field.dataset.tooltip && field.dataset.tooltip.startsWith("Sub-tasks:")) {
        if (field.dataset.tooltip == "Sub-tasks: None") {
            field.querySelectorAll("span.ghx-extra-field-content").forEach(function (subtasks) {
                subtasks.innerHTML = "No sub-tasks"
            });
        } else {
            utils.pagedJIRA(baseUrl + "/rest/api/2/search?jql=issuetype in subTaskIssueTypes() and parent=" + key + " order by statusCategoryChangedDate desc&fields=key,status,assignee,summary&", "issues", function (subtasks) {
                if (subtasks.length > 0) {
                    var subtaskDataTable = "";
                    var done = 0;
                    subtasks.forEach(function (subtask) {
                        done += subtask.fields.status.statusCategory.name.toUpperCase() == "DONE" ? 1 : 0;
                        subtaskDataTable += `
                            <div style="margin-bottom: 3px;">
                                <div style="display: inline-block; position: relative; outline: 0px; height: 16px; width: 100%;">
                                    <div style="display: inline-block; position: relative; outline: 0px; height: 16px; width: 64px;">
                                        <span class="sc-ikTlrC uPJwe" style="font-weight: bold;">
                                            ${subtask.key}
                                        </span>
                                    </div>
                                    <div class="aui-lozenge aui-lozenge-overflow aui-lozenge-subtle aui-lozenge-success fusion-widget-tooltip">
                                        <span>
                                            ${subtask.fields.status.name.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style="display: inline-block; position: relative; outline: 0px; height: 16px; width: 16px; float: right;">
                                        <span>
                                            <span role="img" aria-label="${subtask.fields.assignee ? subtask.fields.assignee.displayName : ''}" style="background-color: transparent; background-image: url(&quot;${subtask.fields.assignee ? subtask.fields.assignee.avatarUrls['16x16'] : ''}&quot;); background-position: center center; background-repeat: no-repeat; background-size: cover; border-radius: 50%; display: flex; flex: 1 1 100%; height: 100%; width: 100%;"></span>
                                        </span>
                                    </div>
                                </div>
                                <div style="margin-bottom: 5px;">
                                    <span style="display: inline-block; text-overflow: ellipsis; font-size: 12px; line-height: 12px; white-space: nowrap; overflow: hidden; margin-right: 5px; max-width: 190px;">
                                        ${subtask.fields.summary}
                                    </span>
                                </div>
                            </div>
                        `;
                    });
                    field.dataset.tooltip = `
                        <div style="font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif">
                            <div>
                                <h2 style="width: 100%; background-color: #eeeeee; font-weight: 600; font-size: 14px; display: inline-block; line-height: 24px;">
                                    <span style="float: left; margin-left: 5px;">Subtasks</span>
                                    <span style="float: right; margin-right: 5px;">${done}/${subtasks.length}</span>
                                </h2>
                            </div>
                            <div>${subtaskDataTable}</div>
                        </div>
                    `;
                } else {
                    field.dataset.tooltip = "";
                }
            });
        }
    }
}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "clicked_browser_action") {
            chrome.runtime.sendMessage({
                "message": "open_new_tab",
                "url": "http://www.smexdigital.com/chromeplugins"
            });
        }
    }
);

utils.waitForDocument(function () {
    setTimeout(function () {
        document.querySelectorAll("div.ghx-issue").forEach(function (issue) {
            fixColors(issue);
            fixFlags(issue);
            fixSubtasks(issue);
        });
    }, 1500);
    setInterval(function () {
        document.querySelectorAll("div.ghx-issue").forEach(function (issue) {
            fixColors(issue);
        });
    }, 3000);
});