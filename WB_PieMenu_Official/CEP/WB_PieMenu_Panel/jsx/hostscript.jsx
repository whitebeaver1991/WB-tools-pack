$.local = true;

var localAppData = $.getenv("LOCALAPPDATA");
if (!localAppData) {
    var userDir = Folder.userData.fsName;
    if (userDir.indexOf("Documents") > 0 || userDir.indexOf("Documents") > 0) {
        localAppData = userDir.replace(/\\Roaming/, "").replace(/Roaming/, "").replace(/\\Documents$/, "").replace(/Documents$/, "") + "/Local";
    } else {
        localAppData = userDir;
    }
}

var SETTINGS_DIR = localAppData + "/WB_PieMenu";
var SETTINGS_FILE = SETTINGS_DIR + "/settings.txt";

function ensureSettingsDir() {
    var dir = new Folder(SETTINGS_DIR);
    if (!dir.exists) dir.create();
}

function readSettings() {
    ensureSettingsDir();
    var f = new File(SETTINGS_FILE);
    if (!f.exists) return "";
    f.open("r");
    var data = f.read();
    f.close();
    return data;
}

function writeSettings(data) {
    ensureSettingsDir();
    var f = new File(SETTINGS_FILE);
    f.open("w");
    f.write(data);
    f.close();
    return "OK";
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

function triggerDumpEffects() {
    ensureSettingsDir();
    var data = readSettings();
    var lines = data.split("\n");
    var found = false;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("dump_effects=") === 0) {
            lines[i] = "dump_effects=1";
            found = true; break;
        }
    }
    if (!found) lines.push("dump_effects=1");
    writeSettings(lines.join("\n"));
    return "OK";
}

function readEffectsMap() {
    var mapFile = new File(SETTINGS_DIR + "/effects_map.txt");
    if (!mapFile.exists) return "";
    mapFile.encoding = "UTF-8";
    mapFile.open("r");
    var content = mapFile.read();
    mapFile.close();
    return content;
}

function browseFile() {
    var f = File.openDialog("Select image file", "Images:*.png;*.bmp;*.jpg;*.jpeg;*.gif;*.tif;*.tiff");
    if (f) return f.fsName;
    return "";
}

function browseFilePNG() {
    var f = File.openDialog("选择PNG图片", "PNG:*.png;*.bmp;*.jpg");
    if (f) return f.fsName;
    return "";
}

function saveFlowBoardFile(data) {
    ensureSettingsDir();
    var f = File.saveDialog("Save FlowBoard State", "FlowBoard:*.wbflow");
    if (!f) return "";
    f.encoding = "UTF-8";
    f.open("w");
    f.write(data);
    f.close();
    return f.fsName;
}

function openFlowBoardFile() {
    var f = File.openDialog("Open FlowBoard State", "FlowBoard:*.wbflow");
    if (!f) return "";
    f.encoding = "UTF-8";
    f.open("r");
    var content = f.read();
    f.close();
    return content;
}

function exportSettingsToFile() {
    ensureSettingsDir();
    var data = readSettings();
    var f = File.saveDialog("Export Settings", "TXT:*.txt");
    if (!f) return "";
    f.encoding = "UTF-8";
    f.open("w");
    f.write(data);
    f.close();
    return f.fsName;
}

function importSettingsFromFile() {
    var f = File.openDialog("Import Settings", "TXT:*.txt;JSON:*.json");
    if (!f) return "";
    f.encoding = "UTF-8";
    f.open("r");
    var content = f.read();
    f.close();
    return content;
}

function readAllSettingsText() {
    ensureSettingsDir();
    var f = new File(SETTINGS_FILE);
    if (!f.exists) return "";
    f.open("r");
    var data = f.read();
    f.close();
    return data;
}

function writeAllSettingsText(data) {
    ensureSettingsDir();
    var f = new File(SETTINGS_FILE);
    f.encoding = "UTF-8";
    f.open("w");
    f.write(data);
    f.close();
    return "OK";
}
