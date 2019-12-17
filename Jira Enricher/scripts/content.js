/*
This extension fixes some of the flaws of Jira's kanban boards by showing more detail on mouseover for flags, sub-tasks, and changing the whole card colour (not just the bar down the side!). More to come, please leave a comment :)
http://www.smexdigital.com
*/
'use strict'

//'https://github.com/lucianogaube/JiraPlugin/blob/develop/JiraSubTaskCreator/background.js'

var options = {
    addRank: true,
    fixColors: true,
    fixFlags: true,
    fixSubtasks: true,
}

function enrichIssue(options, issue, index) {
    var baseUrl = "https://" + window.location.hostname;
    var OneDay = new Date().getTime() - (1 * 24 * 60 * 60 * 1000);

    function addRank(issue, index) {
        issue.querySelectorAll("section.ghx-stat-fields, div.ghx-plan-main-fields").forEach(function(fieldContainer) {
            if (!fieldContainer.querySelector("div.ghx-stat-0") && !issue.classList.contains("ghx-done")) {
                fieldContainer.prepend(utils.createElementFromHTML(issue, `<div class="ghx-row ghx-stat-0" style="margin-right: 3px; display: inline-block; text-decoration: overline"><span title="Visual Rank Only"><b>${(index + 1)}</b></span></div>`));
            }
        });
    }

    function fixColors(issue) {
        var bar = issue.querySelector("div.ghx-grabber");
        if (bar.style.backgroundColor != "#eeeeee" && bar.style.backgroundColor != "rgb(238, 238, 238)") {
            issue.style.backgroundColor = utils.convertHex(bar.style.backgroundColor, 0.2);
            issue.querySelectorAll(".ghx-items-container").forEach(function(flag) {
                flag.style.backgroundColor = `transparent`;
            });
        }
    }

    function fixFlags(issue) {
        issue.querySelectorAll("span.ghx-flag-priority").forEach(function(flag) {
            utils.removeAllChildren(flag);
            flag.innerHTML = '<span class="aui-icon aui-icon-small" data-tooltip="Loading flagged reason..." original-title=""></span>';

            var icon = flag.querySelector("span");
            icon.dataset.tooltip = "No reason for flagged mentioned.";

            utils.pagedJIRA(baseUrl + "/rest/api/2/issue/" + issue.dataset.issueKey + "/comment?", "comments", function(comments) {
                comments.forEach(function(comment) {
                    if (comment.body.startsWith('(flag) Flag added')) {
                        var com = comment.body.replace('(flag) Flag added', '').trim();
                        icon.dataset.tooltip = com;
                        icon.title = com;
                        return;
                    }
                });
            }, function(exception) {
                throw exception;
            });
        });
    }

    function fixSubtasks(issue) {
        issue.querySelectorAll("span.ghx-extra-field").forEach(function(field) {
            if (field.dataset.tooltip && field.dataset.tooltip.startsWith("Sub-tasks:")) {
                if (field.dataset.tooltip == "Sub-tasks: None") {
                    field.querySelector("span.ghx-extra-field-content").innerHTML = "No sub-tasks";
                } else {
                    getSubTasks(field, issue.dataset.issueKey);
                }
            }
        });
        issue.querySelectorAll("span.ghx-sub-tasks-count").forEach(function(field) {
            getSubTasks(field, issue.dataset.issueKey);
        });
    }

    function getSubTasks(field, key) {
        utils.pagedJIRA(baseUrl + "/rest/api/2/search?jql=issuetype in subTaskIssueTypes() and parent=" + key + "&fields=key,status,statuscategorychangedate,assignee,summary&", "issues", function(subtasks) {
            var subtaskHTMLs = [];
            var subtaskDataTable = "";
            var done = 0;
            subtasks.sort(function(a, b) {
                if (a.fields.status.statusCategory.name.toUpperCase() == b.fields.status.statusCategory.name.toUpperCase()) {
                    return (new Date(a.fields.statuscategorychangedate).getTime()) < (new Date(b.fields.statuscategorychangedate).getTime());
                }
                if (a.fields.status.statusCategory.name.toUpperCase() == "IN PROGRESS") return -1;
                else if (a.fields.status.statusCategory.name.toUpperCase() == "TO DO") return 1;
                return 0;
            });
            subtasks.forEach(function(subtask) {
                var status = "";
                if (subtask.fields.status.statusCategory.name.toUpperCase() == "DONE") {
                    done += 1;
                    subtaskHTMLs.push(`<span style='text-decoration: line-through;'>${subtask.key}</span>`);
                    status = `aui-lozenge-success`;
                } else {
                    if (subtask.fields.status.statusCategory.name.toUpperCase() == "TO DO") {
                        status = ``;
                    } else {
                        status = `aui-lozenge-current`;
                    }
                    subtaskHTMLs.push(`<span>${subtask.key}</span>`);
                }
                if (OneDay > (new Date(subtask.fields.statuscategorychangedate).getTime())) {
                    // more than 1 day old
                    status += ` aui-lozenge-subtle`;
                }
                subtaskDataTable += `
                    <div style="margin-bottom: 3px;">
                        <div style="display: inline-block; position: relative; margin: auto; padding: 0; outline: 0px; height: 16px; width: 100%;">
                            <div style="display: inline-block; position: relative; outline: 0px; height: 16px; width: 64px; float: left;">
                                ${subtask.key}
                            </div>
                            <div class="aui-lozenge aui-lozenge-overflow ${status} fusion-widget-tooltip" style="text-align: center;">
                                ${subtask.fields.status.name.toUpperCase()}
                            </div>
                            <div style="display: inline-block; position: relative; outline: 0px; margin: 0; padding-top: 1px; height: 24px; width: 24px; float: right;">
                                <span role="img" aria-label="${subtask.fields.assignee ? subtask.fields.assignee.displayName : ''}" style="background-color: transparent; background-image: url(&quot;${subtask.fields.assignee ? subtask.fields.assignee.avatarUrls['24x24'] : ''}&quot;); background-position: center center; background-repeat: no-repeat; background-size: cover; border-radius: 50%; display: flex; flex: 1 1 100%; height: 100%; width: 100%;"></span>
                            </div>
                        </div>
                        <div style="margin-bottom: 2px;">
                            <span style="display: inline-block; text-overflow: ellipsis; font-size: 12px; white-space: nowrap; overflow: hidden; max-width: 390px;">
                                ${subtask.fields.summary}
                            </span>
                        </div>
                    </div>
                `;
            });
            field.dataset.tooltip = `
                <div style="z-index: 9999; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,'Fira Sans','Droid Sans','Helvetica Neue',sans-serif; min-width: 400px;">
                    <div>
                        <h2 style="width: 100%; background-color: #eeeeee; font-weight: 600; font-size: 14px; display: inline-block; line-height: 24px;">
                            <span style="float: left; margin-left: 5px;">Subtasks</span>
                            <span style="float: right; margin-right: 5px;">${parseFloat((done / subtasks.length) * 100).toFixed(0)}% Done</span>
                        </h2>
                        <div class="meter">
                            <span style="width: ${(done / subtasks.length) * 100}%"></span>
                        </div>
                    </div>
                    <div style="margin-bottom: 3px;">${subtaskDataTable}</div>
                </div>
            `;
            subtaskHTMLs.reverse();
            field.querySelector("span.ghx-extra-field-content").innerHTML = subtaskHTMLs.join(", ");
        }, function(exception) {
            throw exception;
        });
    }

    if (issue.dataset.smexenriched != 'true') {
        if (options.addRank) addRank(issue, index);
        if (options.fixColors) fixColors(issue);
        if (options.fixFlags) fixFlags(issue);
        if (options.fixSubtasks) fixSubtasks(issue);
    }
    issue.dataset.smexenriched = 'true';
}

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

var boards = document.querySelectorAll("#ghx-work, #ghx-plan");
boards.forEach(function(board) {
    var config = {
        subtree: true,
        childList: true
    };
    utils.observeChanges(board, config, function() {
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
        issues.forEach(function(issue, index) {
            enrichIssue(options, issue, index);
        });
    });
});
chrome.runtime.sendMessage({
    showIcon: boards.length > 0
});