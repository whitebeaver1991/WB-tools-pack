/*
 * AE FX Manager v1.0
 * After Effects 2025.3 特效管理器
 * 功能：特效预设保存、搜索、白板管理
 * 作者：AI Assistant
 */

#target aftereffects

// ==================== 全局配置 ====================
var FXM_VERSION = "1.0.0";
var FXM_NAME = "AE FX Manager";

// 存储路径配置
var FXM_CONFIG = {
    presetFolder: Folder.userData.fsName + "/AE_FX_Manager/Presets",
    boardFolder: Folder.userData.fsName + "/AE_FX_Manager/Boards",
    configFile: Folder.userData.fsName + "/AE_FX_Manager/config.json",
    iconFolder: Folder.userData.fsName + "/AE_FX_Manager/Icons"
};

// ==================== 工具函数模块 ====================
var Utils = {
    // 确保文件夹存在
    ensureFolder: function(path) {
        var folder = new Folder(path);
        if (!folder.exists) {
            folder.create();
        }
        return folder;
    },
    
    // 读取JSON文件
    readJSON: function(filePath) {
        var file = new File(filePath);
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
    
    // 写入JSON文件
    writeJSON: function(filePath, data) {
        var file = new File(filePath);
        file.open('w');
        file.write(JSON.stringify(data, null, 2));
        file.close();
    },
    
    // 生成唯一ID
    generateId: function() {
        return 'fx_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    },
    
    // 获取图层特效信息
    getLayerEffects: function(layer) {
        var effects = [];
        if (!layer || !layer.effect) return effects;
        
        for (var i = 1; i <= layer.effect.numProperties; i++) {
            var effect = layer.effect.property(i);
            if (effect) {
                effects.push({
                    name: effect.name,
                    matchName: effect.matchName,
                    enabled: effect.enabled
                });
            }
        }
        return effects;
    },
    
    // 应用特效到图层
    applyEffectToLayer: function(layer, effectMatchName) {
        if (!layer || !layer.effect) return false;
        try {
            var effect = layer.effect.addProperty(effectMatchName);
            return effect !== null;
        } catch(e) {
            return false;
        }
    }
};

// ==================== 预设管理器 ====================
var PresetManager = {
    presets: [],
    
    // 初始化
    init: function() {
        Utils.ensureFolder(FXM_CONFIG.presetFolder);
        this.loadPresets();
    },
    
    // 加载所有预设
    loadPresets: function() {
        var folder = new Folder(FXM_CONFIG.presetFolder);
        if (!folder.exists) return;
        
        this.presets = [];
        var files = folder.getFiles("*.json");
        
        for (var i = 0; i < files.length; i++) {
            var preset = Utils.readJSON(files[i].fsName);
            if (preset) this.presets.push(preset);
        }
    },
    
    // 保存图层特效为预设
    saveLayerAsPreset: function(layer, name, description, tags) {
        if (!layer) return null;
        
        var effects = Utils.getLayerEffects(layer);
        if (effects.length === 0) {
            alert("选中的图层没有特效！");
            return null;
        }
        
        var preset = {
            id: Utils.generateId(),
            name: name || "未命名预设",
            description: description || "",
            tags: tags || [],
            created: new Date().toISOString(),
            effects: effects,
            iconPath: ""
        };
        
        // 保存FFX文件
        var ffxPath = FXM_CONFIG.presetFolder + "/" + preset.id + ".ffx";
        this.saveFFX(layer, ffxPath);
        preset.ffxPath = ffxPath;
        
        // 保存JSON配置
        Utils.writeJSON(FXM_CONFIG.presetFolder + "/" + preset.id + ".json", preset);
        
        this.presets.push(preset);
        return preset;
    },
    
    // 保存FFX文件
    saveFFX: function(layer, path) {
        // 使用AE原生方法保存动画预设
        var comp = layer.containingComp;
        var tempComp = app.project.items.addComp("Temp_FXM", 100, 100, 1, 1, 30);
        var tempLayer = tempComp.layers.add(layer.source);
        
        // 复制特效
        for (var i = 1; i <= layer.effect.numProperties; i++) {
            var srcEffect = layer.effect.property(i);
            try {
                var newEffect = tempLayer.effect.addProperty(srcEffect.matchName);
                // 复制关键帧和值
                this.copyEffectProperties(srcEffect, newEffect);
            } catch(e) {}
        }
        
        // 保存为FFX
        tempLayer.savePreset(path);
        
        // 清理
        tempComp.remove();
    },
    
    // 复制特效属性
    copyEffectProperties: function(src, dest) {
        for (var i = 1; i <= src.numProperties; i++) {
            var srcProp = src.property(i);
            var destProp = dest.property(i);
            if (srcProp && destProp && srcProp.propertyValueType !== undefined) {
                try {
                    if (srcProp.numKeys > 0) {
                        // 复制关键帧
                        for (var k = 1; k <= srcProp.numKeys; k++) {
                            destProp.setValueAtTime(srcProp.keyTime(k), srcProp.keyValue(k));
                        }
                    } else {
                        destProp.setValue(srcProp.value);
                    }
                } catch(e) {}
            }
        }
    },
    
    // 应用预设到图层
    applyPreset: function(presetId, targetLayer) {
        var preset = this.getPresetById(presetId);
        if (!preset) return false;
        
        if (preset.ffxPath && new File(preset.ffxPath).exists) {
            try {
                targetLayer.applyPreset(new File(preset.ffxPath));
                return true;
            } catch(e) {
                // 如果FFX失败，尝试逐个添加特效
                return this.applyEffectsManually(preset, targetLayer);
            }
        }
        return this.applyEffectsManually(preset, targetLayer);
    },
    
    // 手动应用特效
    applyEffectsManually: function(preset, targetLayer) {
        var success = false;
        for (var i = 0; i < preset.effects.length; i++) {
            if (Utils.applyEffectToLayer(targetLayer, preset.effects[i].matchName)) {
                success = true;
            }
        }
        return success;
    },
    
    // 搜索预设
    searchPresets: function(keyword) {
        if (!keyword || keyword === "") return this.presets;
        
        var results = [];
        keyword = keyword.toLowerCase();
        
        for (var i = 0; i < this.presets.length; i++) {
            var preset = this.presets[i];
            if (preset.name.toLowerCase().indexOf(keyword) !== -1 ||
                preset.description.toLowerCase().indexOf(keyword) !== -1) {
                results.push(preset);
            } else {
                // 搜索标签
                for (var t = 0; t < preset.tags.length; t++) {
                    if (preset.tags[t].toLowerCase().indexOf(keyword) !== -1) {
                        results.push(preset);
                        break;
                    }
                }
            }
        }
        return results;
    },
    
    // 获取预设
    getPresetById: function(id) {
        for (var i = 0; i < this.presets.length; i++) {
            if (this.presets[i].id === id) return this.presets[i];
        }
        return null;
    },
    
    // 删除预设
    deletePreset: function(id) {
        var preset = this.getPresetById(id);
        if (!preset) return false;
        
        // 删除文件
        var jsonFile = new File(FXM_CONFIG.presetFolder + "/" + id + ".json");
        var ffxFile = new File(FXM_CONFIG.presetFolder + "/" + id + ".ffx");
        if (jsonFile.exists) jsonFile.remove();
        if (ffxFile.exists) ffxFile.remove();
        
        // 从数组移除
        for (var i = 0; i < this.presets.length; i++) {
            if (this.presets[i].id === id) {
                this.presets.splice(i, 1);
                break;
            }
        }
        return true;
    }
};

// ==================== 白板管理器 ====================
var BoardManager = {
    boards: [],
    currentBoard: null,
    
    init: function() {
        Utils.ensureFolder(FXM_CONFIG.boardFolder);
        this.loadBoards();
    },
    
    // 加载所有白板
    loadBoards: function() {
        var folder = new Folder(FXM_CONFIG.boardFolder);
        if (!folder.exists) return;
        
        this.boards = [];
        var files = folder.getFiles("*.json");
        
        for (var i = 0; i < files.length; i++) {
            var board = Utils.readJSON(files[i].fsName);
            if (board) this.boards.push(board);
        }
    },
    
    // 创建新白板
    createBoard: function(name, description) {
        var board = {
            id: Utils.generateId(),
            name: name || "未命名白板",
            description: description || "",
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            items: [], // 白板上的预设按钮
            layout: {
                columns: 4,
                itemSize: 80,
                spacing: 10
            }
        };
        
        this.boards.push(board);
        this.saveBoard(board);
        return board;
    },
    
    // 保存白板
    saveBoard: function(board) {
        board.modified = new Date().toISOString();
        Utils.writeJSON(FXM_CONFIG.boardFolder + "/" + board.id + ".json", board);
    },
    
    // 添加预设到白板
    addPresetToBoard: function(boardId, presetId, position) {
        var board = this.getBoardById(boardId);
        var preset = PresetManager.getPresetById(presetId);
        if (!board || !preset) return false;
        
        var item = {
            id: Utils.generateId(),
            presetId: presetId,
            presetName: preset.name,
            position: position || { x: 0, y: 0 },
            color: this.getRandomColor(),
            icon: ""
        };
        
        board.items.push(item);
        this.saveBoard(board);
        return item;
    },
    
    // 从白板移除预设
    removePresetFromBoard: function(boardId, itemId) {
        var board = this.getBoardById(boardId);
        if (!board) return false;
        
        for (var i = 0; i < board.items.length; i++) {
            if (board.items[i].id === itemId) {
                board.items.splice(i, 1);
                this.saveBoard(board);
                return true;
            }
        }
        return false;
    },
    
    // 获取白板
    getBoardById: function(id) {
        for (var i = 0; i < this.boards.length; i++) {
            if (this.boards[i].id === id) return this.boards[i];
        }
        return null;
    },
    
    // 获取随机颜色（飞书风格）
    getRandomColor: function() {
        var colors = [
            [0.26, 0.62, 1.0],    // 蓝色
            [0.35, 0.79, 0.55],   // 绿色
            [1.0, 0.71, 0.23],    // 橙色
            [0.95, 0.3, 0.3],     // 红色
            [0.74, 0.48, 0.97],   // 紫色
            [0.29, 0.85, 0.89]    // 青色
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 删除白板
    deleteBoard: function(id) {
        var file = new File(FXM_CONFIG.boardFolder + "/" + id + ".json");
        if (file.exists) file.remove();
        
        for (var i = 0; i < this.boards.length; i++) {
            if (this.boards[i].id === id) {
                this.boards.splice(i, 1);
                return true;
            }
        }
        return false;
    }
};

// ==================== UI 管理器 ====================
var UIManager = {
    mainWindow: null,
    currentTab: "presets",
    
    // 创建主窗口
    createMainWindow: function() {
        var win = new Window("palette", FXM_NAME + " v" + FXM_VERSION, undefined, {
            resizeable: true,
            maximizeButton: true
        });
        
        win.preferredSize = [400, 600];
        win.orientation = "column";
        win.alignChildren = ["fill", "fill"];
        
        // 标签页切换
        var tabGroup = win.add("group");
        tabGroup.orientation = "row";
        tabGroup.alignChildren = ["center", "center"];
        
        var presetBtn = tabGroup.add("button", undefined, "预设管理");
        var boardBtn = tabGroup.add("button", undefined, "白板");
        var settingsBtn = tabGroup.add("button", undefined, "设置");
        
        // 内容区域
        var contentPanel = win.add("panel", undefined, "");
        contentPanel.alignChildren = ["fill", "fill"];
        contentPanel.preferredSize = [380, 500];
        
        // 事件绑定
        presetBtn.onClick = function() {
            UIManager.currentTab = "presets";
            UIManager.showPresetsPanel(contentPanel);
        };
        
        boardBtn.onClick = function() {
            UIManager.currentTab = "boards";
            UIManager.showBoardsPanel(contentPanel);
        };
        
        settingsBtn.onClick = function() {
            UIManager.currentTab = "settings";
            UIManager.showSettingsPanel(contentPanel);
        };
        
        this.mainWindow = win;
        this.showPresetsPanel(contentPanel);
        
        return win;
    },
    
    // 显示预设面板
    showPresetsPanel: function(parent) {
        parent.removeAll();
        parent.text = "预设管理";
        
        // 搜索栏
        var searchGroup = parent.add("group");
        searchGroup.orientation = "row";
        searchGroup.alignChildren = ["fill", "center"];
        
        var searchInput = searchGroup.add("edittext", undefined, "");
        searchInput.preferredSize = [250, 25];
        searchInput.helpTip = "搜索预设名称、描述或标签";
        
        var searchBtn = searchGroup.add("button", undefined, "搜索");
        
        // 保存当前选中图层按钮
        var saveBtn = parent.add("button", undefined, "保存选中图层为预设");
        saveBtn.onClick = function() {
            UIManager.showSavePresetDialog();
        };
        
        // 预设列表
        var listPanel = parent.add("panel", undefined, "预设列表");
        listPanel.alignChildren = ["fill", "fill"];
        listPanel.preferredSize = [360, 350];
        
        var presetList = listPanel.add("listbox", undefined, [], {
            multiselect: false
        });
        presetList.preferredSize = [340, 300];
        
        // 刷新列表
        var refreshList = function(keyword) {
            presetList.removeAll();
            var presets = PresetManager.searchPresets(keyword);
            
            for (var i = 0; i < presets.length; i++) {
                var item = presetList.add("item", presets[i].name);
                item.presetId = presets[i].id;
                item.subItems = [presets[i].description || "无描述"];
            }
        };
        
        // 搜索事件
        searchBtn.onClick = function() {
            refreshList(searchInput.text);
        };
        
        searchInput.onChange = function() {
            refreshList(searchInput.text);
        };
        
        // 应用按钮
        var applyBtn = parent.add("button", undefined, "应用到选中图层");
        applyBtn.onClick = function() {
            if (presetList.selection) {
                var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                if (layer) {
                    PresetManager.applyPreset(presetList.selection.presetId, layer);
                } else {
                    alert("请先选中一个图层！");
                }
            }
        };
        
        // 初始加载
        refreshList("");
        
        parent.layout.layout(true);
    },
    
    // 显示白板面板
    showBoardsPanel: function(parent) {
        parent.removeAll();
        parent.text = "白板管理";
        
        // 白板选择
        var boardSelectGroup = parent.add("group");
        boardSelectGroup.orientation = "row";
        boardSelectGroup.alignChildren = ["fill", "center"];
        
        var boardDropdown = boardSelectGroup.add("dropdownlist", undefined, []);
        boardDropdown.preferredSize = [200, 25];
        
        var newBoardBtn = boardSelectGroup.add("button", undefined, "新建白板");
        var deleteBoardBtn = boardSelectGroup.add("button", undefined, "删除");
        
        // 白板内容区域
        var boardContent = parent.add("panel", undefined, "白板内容");
        boardContent.alignChildren = ["fill", "fill"];
        boardContent.preferredSize = [360, 400];
        
        // 刷新白板列表
        var refreshBoards = function() {
            boardDropdown.removeAll();
            for (var i = 0; i < BoardManager.boards.length; i++) {
                var item = boardDropdown.add("item", BoardManager.boards[i].name);
                item.boardId = BoardManager.boards[i].id;
            }
            if (boardDropdown.items.length > 0) {
                boardDropdown.selection = 0;
                UIManager.renderBoardContent(boardContent, boardDropdown.selection.boardId);
            }
        };
        
        // 新建白板
        newBoardBtn.onClick = function() {
            var name = prompt("请输入白板名称:", "新白板");
            if (name) {
                BoardManager.createBoard(name);
                refreshBoards();
            }
        };
        
        // 删除白板
        deleteBoardBtn.onClick = function() {
            if (boardDropdown.selection) {
                if (confirm("确定要删除这个白板吗？")) {
                    BoardManager.deleteBoard(boardDropdown.selection.boardId);
                    refreshBoards();
                }
            }
        };
        
        // 切换白板
        boardDropdown.onChange = function() {
            if (boardDropdown.selection) {
                UIManager.renderBoardContent(boardContent, boardDropdown.selection.boardId);
            }
        };
        
        // 添加预设到白板按钮
        var addToBoardBtn = parent.add("button", undefined, "添加预设到当前白板");
        addToBoardBtn.onClick = function() {
            if (boardDropdown.selection) {
                UIManager.showAddPresetToBoardDialog(boardDropdown.selection.boardId);
            }
        };
        
        refreshBoards();
        parent.layout.layout(true);
    },
    
    // 渲染白板内容
    renderBoardContent: function(parent, boardId) {
        parent.removeAll();
        var board = BoardManager.getBoardById(boardId);
        if (!board) return;
        
        // 创建网格布局
        var gridGroup = parent.add("group");
        gridGroup.orientation = "column";
        gridGroup.alignChildren = ["left", "top"];
        
        var cols = board.layout.columns || 4;
        var currentRow = null;
        
        for (var i = 0; i < board.items.length; i++) {
            if (i % cols === 0) {
                currentRow = gridGroup.add("group");
                currentRow.orientation = "row";
                currentRow.alignChildren = ["left", "top"];
            }
            
            var item = board.items[i];
            var preset = PresetManager.getPresetById(item.presetId);
            
            // 创建预设按钮（飞书风格图标）
            var btnGroup = currentRow.add("group");
            btnGroup.orientation = "column";
            btnGroup.alignChildren = ["center", "center"];
            btnGroup.preferredSize = [board.layout.itemSize || 80, board.layout.itemSize || 80];
            
            // 图标按钮
            var iconBtn = btnGroup.add("button", undefined, preset ? preset.name.substring(0, 2) : "??");
            iconBtn.preferredSize = [60, 60];
            
            // 设置颜色
            if (item.color) {
                iconBtn.graphics.backgroundColor = iconBtn.graphics.newBrush(
                    iconBtn.graphics.BrushType.SOLID_COLOR,
                    item.color
                );
            }
            
            // 名称标签
            var nameLabel = btnGroup.add("statictext", undefined, preset ? preset.name : "未知");
            nameLabel.preferredSize = [70, 20];
            nameLabel.justify = "center";
            
            // 点击应用
            iconBtn.onClick = (function(presetId) {
                return function() {
                    var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                    if (layer) {
                        PresetManager.applyPreset(presetId, layer);
                    } else {
                        alert("请先选中一个图层！");
                    }
                };
            })(item.presetId);
        }
        
        parent.layout.layout(true);
    },
    
    // 显示设置面板
    showSettingsPanel: function(parent) {
        parent.removeAll();
        parent.text = "设置";
        
        var settingsGroup = parent.add("group");
        settingsGroup.orientation = "column";
        settingsGroup.alignChildren = ["fill", "top"];
        
        // 存储路径设置
        var pathGroup = settingsGroup.add("panel", undefined, "存储路径");
        pathGroup.orientation = "column";
        pathGroup.alignChildren = ["fill", "top"];
        
        pathGroup.add("statictext", undefined, "预设文件夹:");
        var presetPath = pathGroup.add("edittext", undefined, FXM_CONFIG.presetFolder);
        presetPath.enabled = false;
        
        pathGroup.add("statictext", undefined, "白板文件夹:");
        var boardPath = pathGroup.add("edittext", undefined, FXM_CONFIG.boardFolder);
        boardPath.enabled = false;
        
        // 快捷键设置
        var hotkeyGroup = settingsGroup.add("panel", undefined, "快捷键设置");
        hotkeyGroup.orientation = "column";
        hotkeyGroup.alignChildren = ["fill", "top"];
        
        hotkeyGroup.add("statictext", undefined, "显示/隐藏面板: Ctrl+Alt+F");
        hotkeyGroup.add("statictext", undefined, "快速搜索: Ctrl+Alt+S");
        
        // 说明
        var helpGroup = settingsGroup.add("panel", undefined, "使用说明");
        helpGroup.orientation = "column";
        helpGroup.alignChildren = ["fill", "top"];
        
        helpGroup.add("statictext", undefined, "1. 选中图层后点击'保存为预设'");
        helpGroup.add("statictext", undefined, "2. 在预设管理中搜索和应用");
        helpGroup.add("statictext", undefined, "3. 在白板中创建快捷按钮");
        helpGroup.add("statictext", undefined, "4. 配合HID Macros可实现硬件快捷键");
        
        parent.layout.layout(true);
    },
    
    // 保存预设对话框
    showSavePresetDialog: function() {
        var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
        if (!layer) {
            alert("请先选中一个图层！");
            return;
        }
        
        var dialog = new Window("dialog", "保存预设");
        dialog.orientation = "column";
        dialog.alignChildren = ["fill", "top"];
        
        dialog.add("statictext", undefined, "预设名称:");
        var nameInput = dialog.add("edittext", undefined, layer.name + "_预设");
        
        dialog.add("statictext", undefined, "描述:");
        var descInput = dialog.add("edittext", undefined, "");
        descInput.preferredSize = [300, 60];
        
        dialog.add("statictext", undefined, "标签 (用逗号分隔):");
        var tagsInput = dialog.add("edittext", undefined, "");
        
        var btnGroup = dialog.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = ["center", "center"];
        
        var okBtn = btnGroup.add("button", undefined, "保存");
        var cancelBtn = btnGroup.add("button", undefined, "取消");
        
        okBtn.onClick = function() {
            var tags = tagsInput.text.split(",").map(function(t) { return t.trim(); });
            PresetManager.saveLayerAsPreset(layer, nameInput.text, descInput.text, tags);
            dialog.close();
            alert("预设已保存！");
        };
        
        cancelBtn.onClick = function() {
            dialog.close();
        };
        
        dialog.show();
    },
    
    // 添加预设到白板对话框
    showAddPresetToBoardDialog: function(boardId) {
        var dialog = new Window("dialog", "添加预设到白板");
        dialog.orientation = "column";
        dialog.alignChildren = ["fill", "top"];
        
        dialog.add("statictext", undefined, "选择预设:");
        var presetList = dialog.add("listbox", undefined, []);
        presetList.preferredSize = [300, 200];
        
        // 加载预设
        for (var i = 0; i < PresetManager.presets.length; i++) {
            var item = presetList.add("item", PresetManager.presets[i].name);
            item.presetId = PresetManager.presets[i].id;
        }
        
        var btnGroup = dialog.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = ["center", "center"];
        
        var okBtn = btnGroup.add("button", undefined, "添加");
        var cancelBtn = btnGroup.add("button", undefined, "取消");
        
        okBtn.onClick = function() {
            if (presetList.selection) {
                BoardManager.addPresetToBoard(boardId, presetList.selection.presetId);
                dialog.close();
                // 刷新显示
                UIManager.showBoardsPanel(UIManager.mainWindow.children[1]);
            }
        };
        
        cancelBtn.onClick = function() {
            dialog.close();
        };
        
        dialog.show();
    }
};

// ==================== 快捷键管理器 ====================
var HotkeyManager = {
    // 注册快捷键（通过脚本菜单）
    registerHotkeys: function() {
        // 创建菜单项
        var menuItem = app.findMenuCommandId("AE FX Manager");
        if (menuItem === 0) {
            // 添加到窗口菜单
            var windowsMenu = app.findMenuCommandId("Window");
            if (windowsMenu) {
                app.executeCommand(windowsMenu);
            }
        }
    },
    
    // 快速搜索功能
    quickSearch: function() {
        var keyword = prompt("搜索预设:", "");
        if (keyword) {
            var results = PresetManager.searchPresets(keyword);
            if (results.length > 0) {
                var items = [];
                for (var i = 0; i < results.length; i++) {
                    items.push((i + 1) + ". " + results[i].name);
                }
                var choice = prompt("找到以下预设:\n" + items.join("\n") + "\n\n输入编号应用:", "1");
                if (choice) {
                    var index = parseInt(choice) - 1;
                    if (index >= 0 && index < results.length) {
                        var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                        if (layer) {
                            PresetManager.applyPreset(results[index].id, layer);
                        }
                    }
                }
            } else {
                alert("未找到匹配的预设");
            }
        }
    }
};

// ==================== 主程序入口 ====================
function main() {
    // 初始化
    Utils.ensureFolder(FXM_CONFIG.presetFolder);
    Utils.ensureFolder(FXM_CONFIG.boardFolder);
    Utils.ensureFolder(FXM_CONFIG.iconFolder);
    
    PresetManager.init();
    BoardManager.init();
    
    // 创建主窗口
    var win = UIManager.createMainWindow();
    
    if (win instanceof Window) {
        win.center();
        win.show();
    }
}

// 运行主程序
main();
