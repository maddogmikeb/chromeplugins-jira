'use strict'

function enrichServiceDeskQueues(options, document, expandedQueues) {
    if (!Array.isArray(expandedQueues)) expandedQueues = [];
    console.log(`expandedQueues: ${expandedQueues.join(",")}`);
    var sep = options.seperator;

    function fixQueues(headerQueues) {
        function onclick(e) {
            var el = e.srcElement;
            while (!el.dataset.enriched) {
                el = el.parentElement;
            }
            if (el.dataset.enriched == "hide") {
                document.querySelectorAll(`div[class='enrichedQueuesHide'][data-key='${el.dataset.key}']`).forEach(function(q) {
                    q.className = "enrichedQueuesShow";
                })
                el.dataset.enriched = "show";
                expandedQueues.push(el.dataset.key);
            } else {
                document.querySelectorAll(`div[class='enrichedQueuesShow'][data-key='${el.dataset.key}']`).forEach(function(q) {
                    q.className = "enrichedQueuesHide";
                })
                el.dataset.enriched = "hide";
                expandedQueues.remByVal(el.dataset.key);
            }
            chrome.runtime.sendMessage({
                expandedQueues: expandedQueues
            });
            e.preventDefault();
        }

        for (var key in headerQueues) {
            var queues = headerQueues[key];
            if (!queues || !Array.isArray(queues)) continue;
            var total = 0;
            queues.forEach(function(que, index) {
                que.querySelectorAll("div").forEach(function(t) {
                    if (t.innerText.includes(key + sep)) {
                        t.innerText = t.innerText.replace(key + sep, "◦ ");
                    }
                });
                que.dataset.key = key;
                que.className = expandedQueues.includes(key) ? "enrichedQueuesShow" : "enrichedQueuesHide";
                try {
                    total += parseInt(que.querySelector("span").innerText);
                } catch (e) {
                    console.error(`Unable to get count for ${key}`);
                    total += 0;
                }
            });
            var a = utils.createElementFromHTML(document, `<div draggable="false" data-testid="NavigationItem" data-key="${key}" class="css-16x8mro" data-enriched="${expandedQueues.includes(key) ? "show" : "hide"}" style="cursor: auto;"></div>`);
            a.innerHTML = `
                <div class="css-t44v0r">
                    <div class="css-1olrtn">${key}</div>
                </div>
                <div class="css-9gcqfy">
                    <span class="sc-elJkPf fteBTo">${total}</span>
                </div>
                <div class="css-1twqiqm" style="position: absolute; right: 0;">
                    <span class="Icon__IconWrapper-dyhwwi-0 bcqBjl">
                        <svg width="24" height="24" viewBox="0 0 24 24" focusable="false" role="presentation"><path d="M8.292 10.293a1.009 1.009 0 0 0 0 1.419l2.939 2.965c.218.215.5.322.779.322s.556-.107.769-.322l2.93-2.955a1.01 1.01 0 0 0 0-1.419.987.987 0 0 0-1.406 0l-2.298 2.317-2.307-2.327a.99.99 0 0 0-1.406 0z" fill="currentColor" fill-rule="evenodd"></path></svg>
                    </span>
                </div>`;
            a.addEventListener("click", onclick, false);
            var h = utils.createElementFromHTML(document, `<div role="presentation" class="css-7xjigh"></div>`);
            h.appendChild(a);
            queues[0].parentNode.insertBefore(h, queues[0]);
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
        console.error("Jira Enricher: Failed to fix service desk queues.")
    }
}