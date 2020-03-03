'use strict'

function enrichIssue(options, issue, index) {
    function addRank(issue, index) {
        issue.querySelectorAll("section.ghx-stat-fields, div.ghx-plan-main-fields").forEach(function(fieldContainer) {
            if (!fieldContainer.querySelector("div.ghx-stat-0") && !issue.classList.contains("ghx-done")) {
                fieldContainer.prepend(utils.createElementFromHTML(issue, `
                    <div class="ghx-row ghx-stat-0" style="margin-right: 3px; padding-top: 2px; display: inline-block; text-decoration: overline">
                        <span data-tooltip="Visual Rank Only" original-title="" title="Visual Rank Only">
                            <b>${(index + 1)}</b>
                        </span>
                    </div>
                `));
            }
        });
    }

    function fixColors(issue) {
        var bar = issue.querySelector("div.ghx-grabber");
        if (bar && bar.style && bar.style.backgroundColor != "#eeeeee" && bar.style.backgroundColor != "rgb(238, 238, 238)") {
            issue.style.backgroundColor = utils.convertHex(bar.style.backgroundColor, 0.2);
            issue.querySelectorAll(".ghx-items-container").forEach(function(flag) {
                flag.style.backgroundColor = `transparent`;
            });
        }
    }

    function fixFlags(issue) {
        issue.querySelectorAll("span.ghx-flag-priority").forEach(function(flag) {
            utils.removeAllChildren(flag);
            flag.innerHTML = `<span class="aui-icon aui-icon-small" data-tooltip="Loading flagged reason..." original-title=""></span>`;

            var icon = flag.querySelector("span");
            icon.dataset.tooltip = `No reason for flagged mentioned.`;

            utils.pagedJIRA(`${baseUrl}/rest/api/2/issue/${issue.dataset.issueKey}/comment?`, "comments").then(function(comments) {
                comments.forEach(function(comment) {
                    if (comment.body.startsWith('(flag) Flag added')) {
                        var com = comment.body.replace('(flag) Flag added', '').trim();
                        icon.dataset.tooltip = com;
                        icon.title = com;
                        return;
                    }
                });
            }).catch(function(err) {
                console.error([`Jira Enricher: Getting paged jira comments`, err]);
            });
        });
    }

    function fixSubtasks(issue) {
        function getSubTasks(field, key) {
            utils.pagedJIRA(`${baseUrl}/rest/api/2/search?jql=issuetype in subTaskIssueTypes() and parent=${key}&fields=key,status,statuscategorychangedate,assignee,summary,issuetype&`, "issues").then(function(subtasks) {
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
                                    <div style="display: inline-block; position: relative; outline: 0px; height: 16px; width: 74px; float: left;">
                                        <img src="${subtask.fields.issuetype.iconUrl}" tooltip="${subtask.fields.issuetype.name}" / >
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
            }).catch(function(err) {
                console.error([`Jira Enricher: Getting sub task data`, err]);
            });
        }

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

    var baseUrl = "https://" + window.location.hostname;
    var OneDay = new Date().getTime() - (1 * 24 * 60 * 60 * 1000);

    if (issue.dataset.smexenriched != 'true') {
        if (options.addRank) {
            try {
                addRank(issue, index);
            } catch (e) {
                console.error([`Jira Enricher: Failed to add rank.`, e])
            }
        }
        if (options.fixColors) {
            try {
                fixColors(issue);
            } catch (e) {
                console.error([`Jira Enricher: Failed to fix colours.`, e])
            }
        }
        if (options.fixFlags) {
            try {
                fixFlags(issue);
            } catch (e) {
                console.error("Jira Enricher: Failed to fix flags.")
            }
        }
        if (options.fixSubtasks) {
            try {
                fixSubtasks(issue);
            } catch (e) {
                console.error([`Jira Enricher: Failed to fix sub tasks.`, e])
            }
        }
    }
    issue.dataset.smexenriched = 'true';
}