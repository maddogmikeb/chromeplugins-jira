'use strict'

function enrichServiceDesk(options, document, expandedQueues) {
    if (!Array.isArray(expandedQueues)) expandedQueues = [];
    var sep = options.seperator;

    function fixQueues(headerQueues) {
        function onclick(e) {
            var el = e.srcElement;
            while (!el.dataset.enriched) el = el.parentElement;
            if (el.dataset.enriched == "hide") {
                document.querySelectorAll("div[class*='enrichedQueuesHide'][data-key='" + el.dataset.key + "']").forEach(function(q) {
                    q.classList.add("enrichedQueuesShow");
                    q.classList.remove("enrichedQueuesHide");
                })
                el.dataset.enriched = "show";
                expandedQueues.push(el.dataset.key);
            } else {
                document.querySelectorAll("div[class*='enrichedQueuesShow'][data-key='" + el.dataset.key + "']").forEach(function(q) {
                    q.classList.add("enrichedQueuesHide");
                    q.classList.remove("enrichedQueuesShow");
                })
                el.dataset.enriched = "hide";
                expandedQueues.remByVal(el.dataset.key);
            }
            try {
                chrome.runtime.sendMessage({
                    expandedQueues: expandedQueues
                });
            } catch (e) {
                console.error(["Jira Enricher: Sending message to expand queues", e]);
            }
            e.preventDefault();
        }

        for (var key in headerQueues) {
            var queues = headerQueues[key];
            if (!queues || !Array.isArray(queues)) continue;
            var total = 0;

            var h = queues[0].cloneNode();
            var a = utils.createElementFromHTML(document, queues[0].innerHTML);

            queues.forEach(function(que) {
                que.querySelectorAll("div").forEach(function(t) {
                    if (t.innerText.includes(key + sep)) {
                        t.innerText = t.innerText.replace(key + sep, "• ");
                    }
                });
                que.dataset.key = key;
                que.classList.add(expandedQueues.includes(key) ? "enrichedQueuesShow" : "enrichedQueuesHide");
                try {
                    total += parseInt(que.querySelector("span").innerText);
                } catch (e) {
                    console.error(["Jira Enricher: Unable to get count for " + key, e]);
                }
            });

            a.dataset.key = key;
            a.dataset.enriched = expandedQueues.includes(key) ? "show" : "hide";
            a.style = "cursor: auto;";
            a.querySelectorAll("div").forEach(function(t) {
                if (t.innerText.includes(key + sep)) {
                    t.innerText = key;
                }
            });
            try {
                a.querySelector("span").innerText = total;
            } catch (e) {
                console.error(["Jira Enricher: Unable to get total field for " + key, e]);
            }
            try {
                var arrow = utils.createElementFromHTML(document, `
                    <div style="position: absolute; right: 0;">
                        <span>
                            <svg width="24" height="24" viewBox="0 0 24 24" focusable="false" role="presentation">
                                <path d="M8.292 10.293a1.009 1.009 0 0 0 0 1.419l2.939 2.965c.218.215.5.322.779.322s.556-.107.769-.322l2.93-2.955a1.01 1.01 0 0 0 0-1.419.987.987 0 0 0-1.406 0l-2.298 2.317-2.307-2.327a.99.99 0 0 0-1.406 0z" fill="currentColor" fill-rule="evenodd"></path>
                            </svg>
                        </span>
                    </div>
                `);
                a.appendChild(arrow);
                a.addEventListener("click", onclick, false);
                h.appendChild(a);
                queues[0].parentNode.insertBefore(h, queues[0]);
            } catch (e) {
                console.error(["Jira Enricher: Unable create new header for " + key, e]);
            }
        }
    }

    function fixServiceDeskQueues(document) {
        utils.waitForElement(document, "div[data-rbd-droppable-id='sd-queues-custom']").then(function(queue) {
            utils.waitForElements(queue, "div[role='presentation']").then(function(queues) {
                var headerQueues = [];
                queues.forEach(function(que, index) {
                    if (que.innerText.includes(sep)) {
                        var key = que.innerText.substring(0, que.innerText.indexOf(sep));
                        if (!headerQueues[key]) headerQueues[key] = [];
                        headerQueues[key].push(que);
                    }
                });
                if (Object.keys(headerQueues).length > 0) {
                    fixQueues(headerQueues);
                }
            });
        });
    }

    try {
        fixServiceDeskQueues(document);
    } catch (e) {
        console.error(["Jira Enricher: Failed to fix service desk queues.", e])
    }
}