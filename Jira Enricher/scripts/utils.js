'use strict'

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

var utils = {
    createElementFromHTML: function(elem, htmlString) {
        var div = elem.createElement ? elem.createElement('div') : elem.ownerDocument.createElement('div');
        div.innerHTML = htmlString.trim();
        return div.firstChild;
    },
    removeAllChildren: function(node) {
        var child = node.lastElementChild;
        while (child) {
            try {
                node.removeChild(child);
                child = node.lastElementChild;
            } catch (e) {
                child = null;
            }
        }
    },
    getJSON: function(url, success, failure) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function() {
            try {
                if (request.status >= 200 && request.status < 400) {
                    var data = JSON.parse(this.response);
                    if (success) success(data);
                } else {
                    if (failure) failure(request.statusText);
                }
            } catch (e) {
                if (failure) failure(e);
            }
        }
        request.send();
    },
    pagedJIRA: function(url, field, success, failure) {
        utils.getJSON(url + "maxResults=100&startAt=0", function(data) {
            try {
                var startAt = 100;
                var total = data.total;
                var pages = [data[field]];
                while (startAt <= total) {
                    pages.push(new Promise(function(resolve, reject) {
                        utils.getJSON(url + "&maxResults=100&startAt=" + startAt, function(data) {
                            resolve(data[field]);
                        }, failure);
                    }));
                }
                Promise.all(pages).then(function(results) {
                    try {
                        results = results.flat();
                        success(results);
                    } catch (e) {
                        if (failure) failure(e);
                    }
                });
            } catch (e) {
                if (failure) failure(e);
            }
        }, failure);
    },
    observeChanges: function(node, config, execute) {
        var observer = new MutationObserver(function() {
            observer.disconnect();
            execute();
            observer.observe(node, config);
        });
        execute();
        observer.observe(node, config);
    },
    convertHex: function(hex, opacity) {
        if (hex.startsWith("rgb(")) {
            return hex.replace("rgb", "rgba").replace(")", ',' + opacity + ')');
        } else {
            hex = hex.replace('#', '');
            var r = parseInt(hex.substring(0, 2), 16);
            var g = parseInt(hex.substring(2, 4), 16);
            var b = parseInt(hex.substring(4, 6), 16);
            return 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
        }
    }
}