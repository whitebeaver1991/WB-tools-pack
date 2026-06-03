$.localize = false;
var flowEncoding = "UTF-8";

// ─── Menu command cache ──────────────────────
var _saveCmdId = -1;
var _applyCmdId = -1;
var _scanDone = false;

function startup() {
    if (_scanDone) return;
    _scanDone = true;
    var names = [
        "Save Animation Preset", "保存动画预设",
        "Apply Animation Preset", "应用动画预设"
    ];
    for (var ni = 0; ni < names.length; ni++) {
        try {
            var id = app.findMenuCommandId(names[ni]);
            if (id > 0) {
                if (ni < 2) _saveCmdId = id;
                else _applyCmdId = id;
            }
        } catch(x) {}
    }
    try {
        for (var mi = 0; mi < app.menuCommands.numMenus; mi++) {
            var m = app.menuCommands.menu(mi);
            for (var si = 0; si < m.numSubmenus; si++) {
                var s = m.submenu(si);
                var t = s.title.toLowerCase();
                if (t.indexOf("save") >= 0 && (t.indexOf("animation") >= 0 || t.indexOf("preset") >= 0)) {
                    if (_saveCmdId <= 0) _saveCmdId = s.commandID;
                }
                if (t.indexOf("apply") >= 0 && (t.indexOf("animation") >= 0 || t.indexOf("preset") >= 0)) {
                    if (_applyCmdId <= 0) _applyCmdId = s.commandID;
                }
            }
        }
    } catch(x) {}
}

function execCmd(id) {
    if (id <= 0) { try { startup(); } catch(x) {} id = _saveCmdId; }
    if (id <= 0) return "ERR:No cmd";
    try { app.executeCommand(id); return "OK"; } catch(e) { return "ERR:" + String(e); }
}

function execSave() { startup(); return execCmd(_saveCmdId); }
function execApply() { startup(); return execCmd(_applyCmdId); }

// ─── Folder picker (native Windows dialog) ───
function browseFolder() {
    try {
        var f = new Folder("~/Desktop");
        var d = f.selectDlg("Select project folder");
        if (!d) return "CANCEL";
        return decodeURI(d.fsName);
    } catch(x) {}
    try {
        var f = Folder.selectDialog("Select project folder");
        if (!f) return "CANCEL";
        return f.fsName;
    } catch(x) {}
    return "CANCEL";
}

function scanFFX(folderPath) {
    try {
        var dir = new Folder(folderPath);
        if (!dir.exists) return "ERR:Folder not found";
        var files = dir.getFiles("*.ffx");
        if (!files || !files.length) return "";
        var result = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i] instanceof File) result.push(files[i].fsName);
        }
        return result.join("\n");
    } catch(e) { return "ERR:" + String(e); }
}

function fileExists(path) {
    try { return (new File(path)).exists ? "1" : "0"; } catch(x) { return "0"; }
}

// ─── Apply ffx ─────────────────────────────
function applyFFX(presetPath) {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return "No active comp";
        var layers = comp.selectedLayers;
        if (layers.length === 0) return "No layer selected";
        var presetFile = new File(presetPath);
        if (!presetFile.exists) return "Preset not found";
        for (var i = 0; i < layers.length; i++) layers[i].applyPreset(presetFile);
        return "OK";
    } catch(e) { return String(e); }
}

// ─── File I/O ─────────────────────────────
function saveFlowDialog(data) {
    var f = File.saveDialog("Save WB FlowBoard", "FlowBoard:*.wbflow");
    if (!f) return "CANCEL";
    f.encoding = flowEncoding; f.open("w"); f.write(data); f.close();
    return f.fsName;
}

function openFlowDialog() {
    var f = File.openDialog("Open WB FlowBoard", "FlowBoard:*.wbflow");
    if (!f) return "CANCEL";
    f.encoding = flowEncoding; f.open("r"); var d = f.read(); f.close();
    return f.fsName + "\n---DATA---\n" + d;
}

function loadFile(path) {
    try {
        var f = new File(path);
        if (!f.exists) return "";
        f.encoding = flowEncoding; f.open("r"); var d = f.read(); f.close();
        return f.fsName + "\n---DATA---\n" + d;
    } catch(e) { return ""; }
}

function writeFile(path, data) {
    try { var f = new File(path); f.encoding = flowEncoding; f.open("w"); f.write(data); f.close(); return "OK"; }
    catch(e) { return String(e); }
}

// Base64 decode and write as binary PNG (decodes base64 → raw bytes → file)
function writeBase64File(path, b64str) {
    try {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var lookup = {}; for (var i = 0; i < chars.length; i++) lookup[chars[i]] = i;
        // Strip any whitespace/newlines
        b64str = b64str.replace(/[\s\r\n]+/g, "");
        var bytes = [];
        var c, c1, c2, c3, c4;
        for (var j = 0; j < b64str.length; j += 4) {
            c1 = lookup[b64str.charAt(j)];
            c2 = lookup[b64str.charAt(j+1)];
            c3 = lookup[b64str.charAt(j+2)];
            c4 = lookup[b64str.charAt(j+3)];
            if (c1 === undefined || c2 === undefined) break;
            bytes.push((c1 << 2) | (c2 >> 4));
            if (c3 !== undefined && c3 !== 64 && b64str.charAt(j+2) !== '=') {
                bytes.push(((c2 & 0xf) << 4) | (c3 >> 2));
                if (c4 !== undefined && c4 !== 64 && b64str.charAt(j+3) !== '=') {
                    bytes.push(((c3 & 3) << 6) | c4);
                }
            }
        }
        var f = new File(path);
        f.encoding = "BINARY";
        f.open("w");
        for (var k = 0; k < bytes.length; k++) {
            f.write(String.fromCharCode(bytes[k]));
        }
        f.close();
        return "OK";
    } catch(e) { return String(e); }
}

function readFile(path) {
    try {
        var f = new File(path);
        if (!f.exists) return "ERR:Not found";
        f.encoding = "BINARY"; f.open("r"); var d = f.read(); f.close();
        return "OK\n" + d;
    } catch(e) { return "ERR:" + String(e); }
}

function copyFile(src, dst) {
    try {
        var sf = new File(src);
        if (!sf.exists) return "ERR:Source not found: " + src;
        // Use native .copy() — reliable for binary files like .ffx
        if (sf.copy(dst)) return "OK";
        return "ERR: copy failed";
    } catch(e) { return "ERR:" + String(e); }
}

function ensureDir(path) {
    try { (new Folder(path)).create(); return "OK"; } catch(e) { return "ERR:" + String(e); }
}

// Batch copy files: takes JSON [[src,dst],...], auto-creates dst dir, returns JSON results
function batchCopyFiles(pairsJson) {
    try {
        var pairs = JSON.parse(pairsJson);
        var results = [];
        var dstDirs = {};
        for (var bi = 0; bi < pairs.length; bi++) {
            var src = pairs[bi][0], dst = pairs[bi][1];
            // Ensure destination directory once per unique dir
            var dd = dst.substring(0, dst.lastIndexOf('/'));
            if (dd.length < 2) dd = dst.substring(0, dst.lastIndexOf('\\'));
            if (!dstDirs[dd]) { (new Folder(dd)).create(); dstDirs[dd] = true; }
            // Copy
            var sf = new File(src);
            if (!sf.exists) { results.push("ERR:" + src + ":not found"); continue; }
            if (sf.copy(dst)) results.push("OK:" + dst);
            else results.push("ERR:" + dst + ":copy failed");
        }
        return results.join("\n");
    } catch(e) { return "ERR:" + String(e); }
}

function getAllEffects() {
    try {
        var lines = [];
        var effects = app.effects;
        if (effects && effects.length) {
            for (var i = 0; i < effects.length; i++) {
                var e = effects[i];
                var name = (e.name || "").replace(/\|/g, "").replace(/\n/g, " ");
                var match = (e.matchName || "").replace(/\|/g, "").replace(/\n/g, " ");
                lines.push(name + "|" + match);
            }
        }
        return lines.join("\n");
    } catch (err) {
        return "";
    }
}

function pickFFXFile() {
    var f = File.openDialog("Select .ffx preset");
    if (!f) return "CANCEL";
    return f.fsName;
}
