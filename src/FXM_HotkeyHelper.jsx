/*
 * AE FX Manager - 快捷键辅助模块
 * 用于配合HID Macros等外部工具
 */

#target aftereffects

// 快捷键辅助类
var HotkeyHelper = {
    // 配置文件路径
    configPath: Folder.userData.fsName + "/AE_FX_Manager/hotkey_config.json",
    
    // 初始化
    init: function() {
        this.ensureConfig();
    },
    
    // 确保配置存在
    ensureConfig: function() {
        var folder = new Folder(Folder.userData.fsName + "/AE_FX_Manager");
        if (!folder.exists) folder.create();
        
        var file = new File(this.configPath);
        if (!file.exists) {
            var defaultConfig = {
                shortcuts: [
                    { key: "F1", action: "show_pie_menu", preset: "" },
                    { key: "F2", action: "show_wheel_menu", preset: "" },
                    { key: "F3", action: "quick_search", preset: "" },
                    { key: "F4", action: "apply_preset", preset: "" }
                ],
                hidMacros: {
                    enabled: false,
                    port: 8080
                }
            };
            this.saveConfig(defaultConfig);
        }
    },
    
    // 加载配置
    loadConfig: function() {
        var file = new File(this.configPath);
        if (!file.exists) return null;
        
        file.open('r');
        var content = file.read();
        file.close();
        
        try {
            return eval('(' + content + ')');
        } catch(e) {
            return null;
        }
    },
    
    // 保存配置
    saveConfig: function(config) {
        var file = new File(this.configPath);
        file.open('w');
        file.write(JSON.stringify(config, null, 2));
        file.close();
    },
    
    // 执行动作
    executeAction: function(action, param) {
        switch(action) {
            case "show_pie_menu":
                this.showPieMenu();
                break;
            case "show_wheel_menu":
                this.showWheelMenu();
                break;
            case "quick_search":
                this.quickSearch();
                break;
            case "apply_preset":
                this.applyPreset(param);
                break;
            case "apply_board_preset":
                this.applyBoardPreset(param);
                break;
        }
    },
    
    // 显示饼图菜单
    showPieMenu: function() {
        // 加载预设列表
        var presets = this.loadPresetsForMenu();
        if (presets.length === 0) {
            alert("没有可用的预设！");
            return;
        }
        
        // 创建菜单项（最多8个）
        var items = [];
        var count = Math.min(presets.length, 8);
        for (var i = 0; i < count; i++) {
            items.push({
                id: presets[i].id,
                name: presets[i].name,
                color: this.getPresetColor(i)
            });
        }
        
        // 显示饼图菜单
        var pieMenu = new PieMenu(items, function(item) {
            HotkeyHelper.applyPreset(item.id);
        });
        
        // 获取鼠标位置
        var mousePos = this.getMousePosition();
        pieMenu.show(mousePos.x, mousePos.y);
    },
    
    // 显示滚轮菜单
    showWheelMenu: function() {
        var presets = this.loadPresetsForMenu();
        if (presets.length === 0) {
            alert("没有可用的预设！");
            return;
        }
        
        var items = [];
        for (var i = 0; i < presets.length; i++) {
            items.push({
                id: presets[i].id,
                name: presets[i].name
            });
        }
        
        var wheelMenu = new WheelMenu(items, function(item) {
            HotkeyHelper.applyPreset(item.id);
        });
        wheelMenu.show();
    },
    
    // 快速搜索
    quickSearch: function() {
        var keyword = prompt("搜索预设:", "");
        if (!keyword) return;
        
        var presets = this.searchPresets(keyword);
        if (presets.length === 0) {
            alert("未找到匹配的预设");
            return;
        }
        
        // 显示结果列表
        var items = [];
        for (var i = 0; i < presets.length; i++) {
            items.push({
                id: presets[i].id,
                name: presets[i].name
            });
        }
        
        var wheelMenu = new WheelMenu(items, function(item) {
            HotkeyHelper.applyPreset(item.id);
        });
        wheelMenu.show();
    },
    
    // 应用预设
    applyPreset: function(presetId) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("请先打开一个合成！");
            return;
        }
        
        var layer = comp.selectedLayers[0];
        if (!layer) {
            alert("请先选中一个图层！");
            return;
        }
        
        // 加载主模块应用预设
        var preset = this.getPresetById(presetId);
        if (!preset) {
            alert("预设不存在！");
            return;
        }
        
        app.beginUndoGroup("应用预设");
        
        try {
            if (preset.ffxPath && new File(preset.ffxPath).exists) {
                layer.applyPreset(new File(preset.ffxPath));
            } else {
                // 手动应用特效
                for (var i = 0; i < preset.effects.length; i++) {
                    try {
                        layer.effect.addProperty(preset.effects[i].matchName);
                    } catch(e) {}
                }
            }
        } catch(e) {
            alert("应用预设失败: " + e.toString());
        }
        
        app.endUndoGroup();
    },
    
    // 应用白板预设（通过编号）
    applyBoardPreset: function(boardIndex) {
        var boards = this.loadBoards();
        if (boardIndex < 0 || boardIndex >= boards.length) {
            alert("白板不存在！");
            return;
        }
        
        var board = boards[boardIndex];
        if (!board.items || board.items.length === 0) {
            alert("白板为空！");
            return;
        }
        
        // 显示白板预设选择
        var items = [];
        for (var i = 0; i < board.items.length; i++) {
            var preset = this.getPresetById(board.items[i].presetId);
            if (preset) {
                items.push({
                    id: preset.id,
                    name: preset.name
                });
            }
        }
        
        var wheelMenu = new WheelMenu(items, function(item) {
            HotkeyHelper.applyPreset(item.id);
        });
        wheelMenu.show();
    },
    
    // 加载预设列表
    loadPresetsForMenu: function() {
        var folder = new Folder(Folder.userData.fsName + "/AE_FX_Manager/Presets");
        if (!folder.exists) return [];
        
        var presets = [];
        var files = folder.getFiles("*.json");
        
        for (var i = 0; i < files.length; i++) {
            var file = new File(files[i].fsName);
            file.open('r');
            var content = file.read();
            file.close();
            
            try {
                var preset = eval('(' + content + ')');
                presets.push(preset);
            } catch(e) {}
        }
        
        return presets;
    },
    
    // 搜索预设
    searchPresets: function(keyword) {
        var presets = this.loadPresetsForMenu();
        if (!keyword) return presets;
        
        var results = [];
        keyword = keyword.toLowerCase();
        
        for (var i = 0; i < presets.length; i++) {
            if (presets[i].name.toLowerCase().indexOf(keyword) !== -1 ||
                (presets[i].description && presets[i].description.toLowerCase().indexOf(keyword) !== -1)) {
                results.push(presets[i]);
            }
        }
        
        return results;
    },
    
    // 获取预设
    getPresetById: function(id) {
        var presets = this.loadPresetsForMenu();
        for (var i = 0; i < presets.length; i++) {
            if (presets[i].id === id) return presets[i];
        }
        return null;
    },
    
    // 加载白板
    loadBoards: function() {
        var folder = new Folder(Folder.userData.fsName + "/AE_FX_Manager/Boards");
        if (!folder.exists) return [];
        
        var boards = [];
        var files = folder.getFiles("*.json");
        
        for (var i = 0; i < files.length; i++) {
            var file = new File(files[i].fsName);
            file.open('r');
            var content = file.read();
            file.close();
            
            try {
                var board = eval('(' + content + ')');
                boards.push(board);
            } catch(e) {}
        }
        
        return boards;
    },
    
    // 获取预设颜色
    getPresetColor: function(index) {
        var colors = [
            [0.26, 0.62, 1.0],    // 蓝色
            [0.35, 0.79, 0.55],   // 绿色
            [1.0, 0.71, 0.23],    // 橙色
            [0.95, 0.3, 0.3],     // 红色
            [0.74, 0.48, 0.97],   // 紫色
            [0.29, 0.85, 0.89],   // 青色
            [1.0, 0.5, 0.8],      // 粉色
            [0.6, 0.8, 0.2]       // 黄绿
        ];
        return colors[index % colors.length];
    },
    
    // 获取鼠标位置（简化版）
    getMousePosition: function() {
        // 返回屏幕中心位置
        return {
            x: 800,
            y: 500
        };
    },
    
    // 生成HID Macros配置文件
    generateHIDMacrosConfig: function() {
        var config = this.loadConfig();
        if (!config) return;
        
        var hidConfig = {
            application: "AfterFX.exe",
            shortcuts: []
        };
        
        for (var i = 0; i < config.shortcuts.length; i++) {
            var shortcut = config.shortcuts[i];
            hidConfig.shortcuts.push({
                key: shortcut.key,
                script: this.generateScriptForAction(shortcut.action, shortcut.param)
            });
        }
        
        // 保存配置
        var file = new File(Folder.userData.fsName + "/AE_FX_Manager/hidmacros_config.json");
        file.open('w');
        file.write(JSON.stringify(hidConfig, null, 2));
        file.close();
        
        return hidConfig;
    },
    
    // 生成脚本命令
    generateScriptForAction: function(action, param) {
        var scriptPath = Folder.userData.fsName + "/AE_FX_Manager/src/FXM_HotkeyHelper.jsx";
        
        switch(action) {
            case "show_pie_menu":
                return 'afterfx.exe -r "' + scriptPath + '" -action pie_menu';
            case "show_wheel_menu":
                return 'afterfx.exe -r "' + scriptPath + '" -action wheel_menu';
            case "quick_search":
                return 'afterfx.exe -r "' + scriptPath + '" -action search';
            case "apply_preset":
                return 'afterfx.exe -r "' + scriptPath + '" -action apply ' + param;
            default:
                return '';
        }
    }
};

// 命令行参数处理
function processArguments() {
    var args = [];
    for (var i = 0; i < app.scriptArgs.length; i++) {
        args.push(app.scriptArgs.getValue(i));
    }
    
    if (args.length > 0) {
        var action = args[0];
        var param = args.length > 1 ? args[1] : "";
        
        HotkeyHelper.init();
        HotkeyHelper.executeAction(action, param);
    }
}

// 主入口
function main() {
    HotkeyHelper.init();
    
    // 检查是否有命令行参数
    if (typeof app.scriptArgs !== 'undefined' && app.scriptArgs.length > 0) {
        processArguments();
    } else {
        // 显示快捷键配置界面
        HotkeyHelper.showConfigUI();
    }
}

// 显示配置界面
HotkeyHelper.showConfigUI = function() {
    var win = new Window("dialog", "快捷键配置");
    win.preferredSize = [400, 500];
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    
    var config = this.loadConfig();
    
    // 快捷键列表
    var listPanel = win.add("panel", undefined, "快捷键绑定");
    listPanel.alignChildren = ["fill", "top"];
    
    for (var i = 0; i < config.shortcuts.length; i++) {
        var group = listPanel.add("group");
        group.orientation = "row";
        group.alignChildren = ["left", "center"];
        
        group.add("statictext", undefined, config.shortcuts[i].key + ":");
        var actionText = group.add("statictext", undefined, config.shortcuts[i].action);
        actionText.preferredSize = [150, 20];
    }
    
    // HID Macros配置
    var hidPanel = win.add("panel", undefined, "HID Macros配置");
    hidPanel.alignChildren = ["fill", "top"];
    
    var enableCheck = hidPanel.add("checkbox", undefined, "启用HID Macros支持");
    enableCheck.value = config.hidMacros.enabled;
    
    var portGroup = hidPanel.add("group");
    portGroup.orientation = "row";
    portGroup.add("statictext", undefined, "端口:");
    var portInput = portGroup.add("edittext", undefined, config.hidMacros.port.toString());
    portInput.preferredSize = [60, 20];
    
    // 按钮
    var btnGroup = win.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignChildren = ["center", "center"];
    
    var saveBtn = btnGroup.add("button", undefined, "保存配置");
    var exportBtn = btnGroup.add("button", undefined, "导出HID配置");
    var closeBtn = btnGroup.add("button", undefined, "关闭");
    
    saveBtn.onClick = function() {
        config.hidMacros.enabled = enableCheck.value;
        config.hidMacros.port = parseInt(portInput.text);
        HotkeyHelper.saveConfig(config);
        alert("配置已保存！");
    };
    
    exportBtn.onClick = function() {
        HotkeyHelper.generateHIDMacrosConfig();
        alert("HID Macros配置已导出到:\n" + Folder.userData.fsName + "/AE_FX_Manager/hidmacros_config.json");
    };
    
    closeBtn.onClick = function() {
        win.close();
    };
    
    win.center();
    win.show();
};

// 运行
main();
