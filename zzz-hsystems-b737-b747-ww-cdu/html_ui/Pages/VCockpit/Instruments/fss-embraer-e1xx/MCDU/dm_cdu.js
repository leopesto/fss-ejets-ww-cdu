// FSS Embraer E-Jets — WinWing CDU Plugin
// ----------------------------------------
// Streams the captain MCDU display to MobiFlight's WinWing CDU WebSocket.
//
// Based on the work of:
// https://github.com/dementedmonkey
// https://github.com/tracernz
// https://github.com/hsystems7
//
// Install: drop the folder zzz-leopesto-fss-ejets-ww-cdu into your MSFS Community folder.
// Requires: MobiFlight Connector with WinWing CDU support.

(function () {
    var PORT     = 5011;
    var URL      = "http://localhost:" + PORT + "/";
    var POLL_MS  = 55;
    var lastSent = "";

    function sendFrame() {
        var pages = document.getElementsByClassName("pageActive");
        if (!pages || pages.length < 1) return;

        // Find the first pageActive element that contains mcdu-display-cell divs
        var html = "";
        for (var i = 0; i < pages.length; i++) {
            var candidate = pages[i].innerHTML;
            if (candidate && candidate.indexOf("mcdu-display-cell") !== -1) {
                html = candidate;
                break;
            }
        }

        if (!html || html === lastSent) return;
        lastSent = html;

        var xhr = new XMLHttpRequest();
        xhr.open("POST", URL, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({
            html_b64: btoa(unescape(encodeURIComponent(html)))
        }));
    }

    // Force initial send after 3s to populate display without waiting for a page change
    setTimeout(function () {
        lastSent = "";
        sendFrame();
    }, 3000);

    setInterval(sendFrame, POLL_MS);
    console.log("[MF CDU] dm_cdu.js loaded — streaming to localhost:" + PORT);
})();
