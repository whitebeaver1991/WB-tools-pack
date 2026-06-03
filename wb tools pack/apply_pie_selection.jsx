// apply_pie_selection.jsx
// 由 wb_tools_hotkeys.ahk 触发，读取 pie_menu.hta 写入的临时文件并应用特效

$.level = 1;

var TEMP_FILE = Folder.temp.fsName + "/wb_pie_selection.json";
var result = { success: false, name: "", error: "" };

try {
    var file = new File(TEMP_FILE);
    if (!file.exists) {
        result.error = "临时文件不存在";
    } else {
        file.open('r');
        var content = file.read();
        file.close();

        try {
            var data = eval('(' + content + ')');
        } catch (e) {
            result.error = "JSON解析失败: " + e.toString();
        }

        if (data && data.match) {
            var comp = app.project.activeItem;
            if (comp && (comp instanceof CompItem)) {
                var layer = comp.selectedLayers[0];
                if (layer) {
                    try {
                        var effect = layer.effect.addProperty(data.match);
                        if (effect) {
                            result.success = true;
                            result.name = data.name || data.match;
                        } else {
                            result.error = "特效添加失败";
                        }
                    } catch (e) {
                        result.error = "添加特效出错: " + e.toString();
                    }
                } else {
                    result.error = "请先选中一个图层";
                }
            } else {
                result.error = "请先打开一个合成";
            }
        } else {
            result.error = "临时文件数据无效";
        }

        try { file.remove(); } catch (e) {}
    }
} catch (e) {
    result.error = e.toString();
}

if (!result.success && result.error) {
    alert("Pie Menu Error:\n" + result.error);
}
