var utils = {
    getJSON: function (url, success, failure) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onload = function () {
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
    pagedJIRA: function (url, field, success, failure) {
        utils.getJSON(url + "maxResults=100&startAt=0", function (data) {
            var startAt = 100;
            var total = data.total;
            var pages = [data[field]];
            while (startAt <= total) {
                pages.push(new Promise(function (resolve, reject) {
                    utils.getJSON(url + "&maxResults=100&startAt=" + startAt, function (data) {
                        resolve(data[field]);
                    }, failure);
                }));
            }
            Promise.all(pages).then(function (results) {
                try {
                    results = results.flat();
                    success(results);
                } catch (e) {
                    if (failure) failure(e);
                }
            });
        }, failure);
    },
    waitForDocument: function (cb) {
        if (document.readyState === 'interactive' || document.readyState === 'complete') {
            cb();
        } else {
            document.addEventListener('DOMContentLoaded', () => {
                cb();
            });
        }
    },
    convertHex: function (hex, opacity) {
        if (hex.startsWith("rgb(")) {
            return hex.replace("rgb", "rgba").replace(")", ',' + opacity + ')');
        } else {
            hex = hex.replace('#', '');
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
            result = 'rgba(' + r + ',' + g + ',' + b + ',' + opacity + ')';
            return result;
        }
    }
}