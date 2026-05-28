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
