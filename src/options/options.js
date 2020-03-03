document.addEventListener('DOMContentLoaded', function() {
    var addRank = document.querySelector("#addRank");
    var fixColors = document.querySelector("#fixColors");
    var fixFlags = document.querySelector("#fixFlags");
    var fixSubtasks = document.querySelector("#fixSubtasks");
    var fixServiceDeskQueues = document.querySelector("#fixServiceDeskQueues");
    var seperator = document.querySelector("#seperator");

    function save() {
        chrome.storage.sync.set({
            "options": {
                addRank: addRank.checked,
                fixColors: fixColors.checked,
                fixFlags: fixFlags.checked,
                fixSubtasks: fixSubtasks.checked,
                fixServiceDeskQueues: fixServiceDeskQueues.checked,
                seperator: seperator.value,
            }
        });
    }

    chrome.storage.sync.get("options", function(storage) {
        var options = (!chrome.runtime.lastError ? (storage.options ? storage.options : defaultOptions) : defaultOptions);
        addRank.checked = options.addRank;
        fixColors.checked = options.fixColors;
        fixFlags.checked = options.fixFlags;
        fixSubtasks.checked = options.fixSubtasks;
        fixServiceDeskQueues.checked = options.fixServiceDeskQueues;
        seperator.value = options.seperator;
    });

    addRank.addEventListener('change', save, false);
    fixColors.addEventListener('change', save, false);
    fixFlags.addEventListener('change', save, false);
    fixSubtasks.addEventListener('change', save, false);
    fixServiceDeskQueues.addEventListener('change', save, false);
    seperator.addEventListener('blur', save, false);
});