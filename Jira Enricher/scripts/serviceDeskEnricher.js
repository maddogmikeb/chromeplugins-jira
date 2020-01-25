function enrichServiceDeskQueues(options, document) {
    var sep = options.seperator;

    function fixQueues(headerQueues) {
        for (var key in headerQueues) {
            var queues = headerQueues[key];
            var total = 0;
            queues.forEach(function(que, index) {
                var count = que.querySelector("span").innerText;
                total += parseInt(count);
                var qKey = que.querySelector("div").innerText;
                qKey = qKey.substring(qKey.indexOf(sep) + 3);
                var href = que.querySelector("a").getAttribute("href");
                que.innerHTML = `<div style="width: 100%; display: inline-block;"><a style="float:left;" href="${href}"><li>${qKey}</li></a><span style="float:right; padding-right: 18px;">${count}</span></div>`;
                que.className = "";
            });
            var h = utils.createElementFromHTML(document, `<div role="presentation" class="css-7xjigh"><div draggable="false" data-testid="NavigationItem" href="#" class="css-16x8mro" style="cursor: auto;"><div class="css-t44v0r"><div class="css-1olrtn">${key}</div></div><div class="css-9gcqfy"><span class="sc-elJkPf fteBTo">${total}</span></div></div></div>`);
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

    fixServiceDeskQueues(document);
}