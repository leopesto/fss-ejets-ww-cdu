// FSS Embraer E-Jets — WinWing CDU Plugin
// ----------------------------------------
// Streams the captain (left) MCDU display directly to MobiFlight WinWing CDU WebSocket.
//
// Based on the work of:
// https://github.com/dementedmonkey
// https://github.com/tracernz
// https://github.com/hsystems7
//
// Install: drop zzz-leopesto-fss-ejets-ww-cdu into your MSFS Community folder.
// Requires: MobiFlight Connector with WinWing CDU support. No Python needed.

(function () {
    var MF_URL   = "ws://localhost:8320/winwing/cdu-captain";
    var POLL_MS  = 55;
    var RETRY_MS = 5000;

    var CSS_VAR_RE = /var\(--([^)]+)\)/;

    var COLOUR_MAP = {
        "mcdu-white":   "w",
        "mcdu-cyan":    "c",
        "mcdu-green":   "g",
        "mcdu-magenta": "m",
        "mcdu-amber":   "a",
        "mcdu-yellow":  "y",
        "mcdu-red":     "r",
        "mcdu-gray":    "e"
    };

    var SPECIAL_CHARS = {
        "\u25c0": "\u2190",
        "\u25b6": "\u2192",
        "\u2191": "\u2191",
        "\u2193": "\u2193",
        "\u00b0": "\u00b0",
        "\u25a1": "\u2610",
        "\u0394": "\u0394"
    };

    var CDU_COLS = 24;
    var CDU_ROWS = 14;

    var socket   = null;
    var lastSent = "";

    function connect() {
        socket = new WebSocket(MF_URL);

        socket.onopen = function () {
            socket.send(JSON.stringify({ Target: "Font", Data: "AirbusThales" }));
            lastSent = "";
            setTimeout(sendFrame, 1500);
        };

        socket.onerror = function () {};

        socket.onclose = function () {
            socket = null;
            setTimeout(connect, RETRY_MS);
        };
    }

    function buildDisplay() {
        var pages = document.getElementsByClassName("pageActive");
        if (!pages || pages.length < 1) return null;

        // Iterate all pageActive elements and keep the last one with mcdu-display-cell divs.
        // FSS renders right CDU first, left (captain) CDU last — so the last match is always
        // the captain display.
        var activePage = null;
        for (var i = 0; i < pages.length; i++) {
            if (pages[i].querySelectorAll(".mcdu-display-cell").length > 0) {
                activePage = pages[i];
            }
        }
        if (!activePage) return null;

        var cells = activePage.querySelectorAll(".mcdu-display-cell");
        var data  = [];
        for (var k = 0; k < CDU_ROWS * CDU_COLS; k++) data.push([]);

        for (var i = 0; i < cells.length; i++) {
            var div   = cells[i];
            var parts = (div.id || "").split("-");
            if (parts.length !== 3) continue;
            var col = parseInt(parts[1], 10);
            var row = parseInt(parts[2], 10);
            if (isNaN(col) || isNaN(row)) continue;
            if (col >= CDU_COLS || row >= CDU_ROWS) continue;

            var text = div.innerText || div.textContent || "";
            if (!text) continue;

            var char   = SPECIAL_CHARS[text] !== undefined ? SPECIAL_CHARS[text] : text.toUpperCase();
            var style  = div.getAttribute("style") || "";
            var match  = CSS_VAR_RE.exec(style);
            var colour = match ? (COLOUR_MAP[match[1]] || "w") : "w";
            var size   = style.indexOf("FSS-EJET-MCDU-Small") !== -1 ? 1 : 0;

            data[row * CDU_COLS + col] = [char, colour, size];
        }

        return data;
    }

    function sendFrame() {
        if (!socket || socket.readyState !== 1) return;

        var data = buildDisplay();
        if (!data) return;

        var json = JSON.stringify({ Target: "Display", Data: data });
        if (json === lastSent) return;
        lastSent = json;
        socket.send(json);
    }

    // Force initial send after 3s to populate display on first load
    setTimeout(function () { lastSent = ""; sendFrame(); }, 3000);

    setInterval(sendFrame, POLL_MS);
    connect();
})();
