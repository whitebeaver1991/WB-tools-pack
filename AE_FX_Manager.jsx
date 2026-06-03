/*
 * AE FX Manager v1.1
 * After Effects 2025.3 特效管理器
 * 功能：特效预设保存、搜索、白板管理、Pie Menu、Wheel Menu、Quick Menu
 */

#target aftereffects

// ==================== 全局配置 ====================
var FXM_VERSION = "1.1.0";
var FXM_NAME = "AE FX Manager";

var FXM_CONFIG = {
    presetFolder: Folder.userData.fsName + "/AE_FX_Manager/Presets",
    boardFolder: Folder.userData.fsName + "/AE_FX_Manager/Boards",
    configFile: Folder.userData.fsName + "/AE_FX_Manager/config.json",
    iconFolder: Folder.userData.fsName + "/AE_FX_Manager/Icons",
    logFile: Folder.userData.fsName + "/AE_FX_Manager/error_log.txt"
};

// ==================== 错误日志系统 ====================
var Logger = {
    logFile: null,

    init: function() {
        Utils.ensureFolder(FXM_CONFIG.iconFolder);
        this.logFile = new File(FXM_CONFIG.logFile);
    },

    write: function(message) {
        try {
            if (!this.logFile) this.init();
            var dateStr = new Date().toLocaleString();
            this.logFile.open('a');
            this.logFile.write("[" + dateStr + "] " + message + "\n");
            this.logFile.close();
        } catch(e) {}
    },

    error: function(context, err) {
        var errMsg = err.toString();
        if (err.line) errMsg += " (line: " + err.line + ")";
        if (err.fileName) errMsg += " (file: " + err.fileName + ")";
        this.write("[ERROR] " + context + " -> " + errMsg);
    },

    info: function(message) {
        this.write("[INFO] " + message);
    },

    warn: function(message) {
        this.write("[WARN] " + message);
    }
};

// ==================== 工具函数模块 ====================
var Utils = {
    ensureFolder: function(path) {
        var folder = new Folder(path);
        if (!folder.exists) {
            folder.create();
        }
        return folder;
    },

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

    writeJSON: function(filePath, data) {
        var file = new File(filePath);
        file.open('w');
        file.write(JSON.stringify(data, null, 2));
        file.close();
    },

    generateId: function() {
        return 'fx_' + new Date().getTime() + '_' + Math.floor(Math.random() * 10000);
    },

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

    applyEffectToLayer: function(layer, effectMatchName) {
        if (!layer || !layer.effect) return false;
        try {
            var effect = layer.effect.addProperty(effectMatchName);
            return effect !== null;
        } catch(e) {
            Logger.error("applyEffectToLayer(" + effectMatchName + ")", e);
            return false;
        }
    }
};

// ==================== 预设管理器 ====================
var PresetManager = {
    presets: [],

    init: function() {
        Utils.ensureFolder(FXM_CONFIG.presetFolder);
        this.loadPresets();
        Logger.info("PresetManager initialized, " + this.presets.length + " presets loaded");
    },

    loadPresets: function() {
        var folder = new Folder(FXM_CONFIG.presetFolder);
        if (!folder.exists) return;

        this.presets = [];
        var files = folder.getFiles("*.json");

        for (var i = 0; i < files.length; i++) {
            try {
                var preset = Utils.readJSON(files[i].fsName);
                if (preset) this.presets.push(preset);
            } catch(e) {
                Logger.error("loadPresets file " + files[i].fsName, e);
            }
        }
    },

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

        try {
            var ffxPath = FXM_CONFIG.presetFolder + "/" + preset.id + ".ffx";
            this.saveFFX(layer, ffxPath);
            preset.ffxPath = ffxPath;

            Utils.writeJSON(FXM_CONFIG.presetFolder + "/" + preset.id + ".json", preset);

            this.presets.push(preset);
            Logger.info("Preset saved: " + preset.name);
        } catch(e) {
            Logger.error("saveLayerAsPreset(" + name + ")", e);
            return null;
        }

        return preset;
    },

    saveFFX: function(layer, path) {
        var comp = layer.containingComp;
        var tempComp = app.project.items.addComp("Temp_FXM", 100, 100, 1, 1, 30);
        var tempLayer = tempComp.layers.add(layer.source);

        for (var i = 1; i <= layer.effect.numProperties; i++) {
            var srcEffect = layer.effect.property(i);
            try {
                var newEffect = tempLayer.effect.addProperty(srcEffect.matchName);
                this.copyEffectProperties(srcEffect, newEffect);
            } catch(e) {}
        }

        tempLayer.savePreset(path);
        tempComp.remove();
    },

    copyEffectProperties: function(src, dest) {
        for (var i = 1; i <= src.numProperties; i++) {
            var srcProp = src.property(i);
            var destProp = dest.property(i);
            if (srcProp && destProp && srcProp.propertyValueType !== undefined) {
                try {
                    if (srcProp.numKeys > 0) {
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

    applyPreset: function(presetId, targetLayer) {
        var preset = this.getPresetById(presetId);
        if (!preset) return false;

        try {
            if (preset.ffxPath && new File(preset.ffxPath).exists) {
                try {
                    targetLayer.applyPreset(new File(preset.ffxPath));
                    Logger.info("Preset applied via FFX: " + preset.name);
                    return true;
                } catch(e) {
                    return this.applyEffectsManually(preset, targetLayer);
                }
            }
            return this.applyEffectsManually(preset, targetLayer);
        } catch(e) {
            Logger.error("applyPreset(" + presetId + ")", e);
            return false;
        }
    },

    applyEffectsManually: function(preset, targetLayer) {
        var success = false;
        for (var i = 0; i < preset.effects.length; i++) {
            if (Utils.applyEffectToLayer(targetLayer, preset.effects[i].matchName)) {
                success = true;
            }
        }
        if (success) Logger.info("Preset applied manually: " + preset.name);
        return success;
    },

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

    getPresetById: function(id) {
        for (var i = 0; i < this.presets.length; i++) {
            if (this.presets[i].id === id) return this.presets[i];
        }
        return null;
    },

    deletePreset: function(id) {
        var preset = this.getPresetById(id);
        if (!preset) return false;

        try {
            var jsonFile = new File(FXM_CONFIG.presetFolder + "/" + id + ".json");
            var ffxFile = new File(FXM_CONFIG.presetFolder + "/" + id + ".ffx");
            if (jsonFile.exists) jsonFile.remove();
            if (ffxFile.exists) ffxFile.remove();

            for (var i = 0; i < this.presets.length; i++) {
                if (this.presets[i].id === id) {
                    this.presets.splice(i, 1);
                    break;
                }
            }
            Logger.info("Preset deleted: " + preset.name);
            return true;
        } catch(e) {
            Logger.error("deletePreset(" + id + ")", e);
            return false;
        }
    },

    createTestPresets: function() {
        var testEffectNames = [
            { name: "高斯模糊", matchName: "ADBE Gaussian Blur", tags: "模糊,blur" },
            { name: "径向模糊", matchName: "ADBE Radial Blur", tags: "模糊,blur,径向" },
            { name: "快速模糊", matchName: "ADBE Fast Blur", tags: "模糊,blur,快速" },
            { name: "CC 镜头光晕", matchName: "CC Light Rays", tags: "光晕,光线,light" },
            { name: "投影", matchName: "ADBE Drop Shadow", tags: "阴影,shadow" },
            { name: "发光", matchName: "ADBE Glo", tags: "发光,glow" },
            { name: "颜色平衡", matchName: "ADBE Color Balance", tags: "颜色,color,色彩" },
            { name: "亮度对比度", matchName: "ADBE Brightness & Contrast", tags: "亮度,对比度,brightness" },
            { name: "色相饱和度", matchName: "ADBE Hue/Saturation", tags: "色相,饱和度,hue" },
            { name: "曲线", matchName: "ADBE Curves", tags: "曲线,调色,curves" },
            { name: "色阶", matchName: "ADBE Levels", tags: "色阶,调色,levels" },
            { name: "色调", matchName: "ADBE Tint", tags: "色调,tint" },
            { name: "三色调", matchName: "ADBE Tritone", tags: "三色调,调色,tritone" },
            { name: "填充", matchName: "ADBE Fill", tags: "填充,fill" },
            { name: "渐变", matchName: "ADBE Ramp", tags: "渐变,ramp" },
            { name: "锐化", matchName: "ADBE Sharpen", tags: "锐化,sharpen,清晰" },
            { name: "浮雕", matchName: "ADBE Bevel Alpha", tags: "浮雕,bevel,立体" },
            { name: "杂色", matchName: "ADBE Noise", tags: "杂色,噪点,noise" },
            { name: "分形噪波", matchName: "ADBE Fractal Noise", tags: "分形,噪波,fractal,纹理" },
            { name: "置换图", matchName: "ADBE Displacement Map", tags: "置换,扭曲,displacement" }
        ];

        var now = new Date();
        var dateStr = now.getFullYear() + "-"
            + String(now.getMonth() + 1) + "-"
            + String(now.getDate()) + " "
            + String(now.getHours()) + ":"
            + String(now.getMinutes()) + ":"
            + String(now.getSeconds());

        var count = 0;
        for (var i = 0; i < testEffectNames.length; i++) {
            var te = testEffectNames[i];
            var preset = {
                id: Utils.generateId(),
                name: te.name,
                description: "测试预设 - " + te.name,
                tags: te.tags.split(","),
                created: dateStr,
                effects: [{
                    name: te.name,
                    matchName: te.matchName,
                    enabled: true
                }],
                iconPath: ""
            };

            Utils.writeJSON(FXM_CONFIG.presetFolder + "/" + preset.id + ".json", preset);
            this.presets.push(preset);
            count++;
        }

        Logger.info("Created " + count + " test presets");
        return count;
    }
};

// ==================== 白板管理器 ====================
var BoardManager = {
    boards: [],
    currentBoard: null,

    init: function() {
        Utils.ensureFolder(FXM_CONFIG.boardFolder);
        this.loadBoards();
        Logger.info("BoardManager initialized, " + this.boards.length + " boards loaded");
    },

    loadBoards: function() {
        var folder = new Folder(FXM_CONFIG.boardFolder);
        if (!folder.exists) return;

        this.boards = [];
        var files = folder.getFiles("*.json");

        for (var i = 0; i < files.length; i++) {
            try {
                var board = Utils.readJSON(files[i].fsName);
                if (board) this.boards.push(board);
            } catch(e) {
                Logger.error("loadBoards file " + files[i].fsName, e);
            }
        }
    },

    createBoard: function(name, description) {
        var board = {
            id: Utils.generateId(),
            name: name || "未命名白板",
            description: description || "",
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            items: [],
            layout: {
                columns: 4,
                itemSize: 80,
                spacing: 10
            }
        };

        this.boards.push(board);
        this.saveBoard(board);
        Logger.info("Board created: " + board.name);
        return board;
    },

    saveBoard: function(board) {
        try {
            board.modified = new Date().toISOString();
            Utils.writeJSON(FXM_CONFIG.boardFolder + "/" + board.id + ".json", board);
        } catch(e) {
            Logger.error("saveBoard(" + board.name + ")", e);
        }
    },

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

    getBoardById: function(id) {
        for (var i = 0; i < this.boards.length; i++) {
            if (this.boards[i].id === id) return this.boards[i];
        }
        return null;
    },

    getRandomColor: function() {
        var colors = [
            [0.26, 0.62, 1.0],
            [0.35, 0.79, 0.55],
            [1.0, 0.71, 0.23],
            [0.95, 0.3, 0.3],
            [0.74, 0.48, 0.97],
            [0.29, 0.85, 0.89]
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    deleteBoard: function(id) {
        var file = new File(FXM_CONFIG.boardFolder + "/" + id + ".json");
        if (file.exists) file.remove();

        for (var i = 0; i < this.boards.length; i++) {
            if (this.boards[i].id === id) {
                Logger.info("Board deleted: " + this.boards[i].name);
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

    _presetsPanel: null,
    _boardsPanel: null,
    _settingsPanel: null,

    _presetList: null,
    _searchInput: null,
    _boardDropdown: null,
    _boardContent: null,

    createMainWindow: function() {
        var win = new Window("palette", FXM_NAME + " v" + FXM_VERSION, undefined, {
            resizeable: true,
            maximizeButton: false
        });

        win.preferredSize = [380, 480];
        win.minimumSize = [320, 340];
        win.orientation = "column";
        win.alignChildren = ["fill", "fill"];

        var tabGroup = win.add("group");
        tabGroup.orientation = "row";
        tabGroup.alignChildren = ["center", "center"];
        tabGroup.preferredSize = [-1, 30];

        var presetBtn = tabGroup.add("button", undefined, "预设管理");
        presetBtn.preferredSize = [-1, 26];
        var boardBtn = tabGroup.add("button", undefined, "白板");
        boardBtn.preferredSize = [-1, 26];
        var settingsBtn = tabGroup.add("button", undefined, "设置");
        settingsBtn.preferredSize = [-1, 26];

        var contentPanel = win.add("panel", undefined, "");
        contentPanel.alignChildren = ["fill", "fill"];
        contentPanel.minimumSize = [320, 300];

        this.mainWindow = win;

        try {
            this._buildPresetsPanel(contentPanel);
            this._buildBoardsPanel(contentPanel);
            this._buildSettingsPanel(contentPanel);

            this._presetsPanel.visible = true;
            this._boardsPanel.visible = false;
            this._settingsPanel.visible = false;
        } catch(e) {
            Logger.error("createMainWindow - panel build", e);
            alert("面板初始化失败，请查看日志文件:\n" + FXM_CONFIG.logFile);
        }

        presetBtn.onClick = function() {
            UIManager.currentTab = "presets";
            UIManager._switchTab("presets");
        };

        boardBtn.onClick = function() {
            UIManager.currentTab = "boards";
            UIManager._switchTab("boards");
        };

        settingsBtn.onClick = function() {
            UIManager.currentTab = "settings";
            UIManager._switchTab("settings");
        };

        win.addEventListener("resizing", function() {
            contentPanel.layout.resize();
            win.layout.resize();
        });

        win.addEventListener("resize", function() {
            contentPanel.layout.layout(true);
            win.layout.layout(true);
        });

        this._refreshPresetList("");

        contentPanel.layout.layout(true);

        return win;
    },

    openMainWindow: function() {
        var win = this.createMainWindow();
        if (win) {
            win.center();
            win.show();
        }
    },

    _switchTab: function(tabName) {
        try {
            this._presetsPanel.visible = (tabName === "presets");
            this._boardsPanel.visible = (tabName === "boards");
            this._settingsPanel.visible = (tabName === "settings");

            this.mainWindow.layout.layout(true);
        } catch(e) {
            Logger.error("_switchTab(" + tabName + ")", e);
        }
    },

    _buildPresetsPanel: function(container) {
        var panel = container.add("panel", undefined, "预设管理");
        panel.alignChildren = ["fill", "start"];
        panel.alignment = ["fill", "fill"];

        var searchGroup = panel.add("group");
        searchGroup.orientation = "row";
        searchGroup.alignChildren = ["fill", "center"];

        var searchInput = searchGroup.add("edittext", undefined, "");
        searchInput.alignment = ["fill", "center"];
        searchInput.helpTip = "搜索预设名称、描述或标签";

        var searchBtn = searchGroup.add("button", undefined, "搜索");
        searchBtn.preferredSize = [50, 24];

        var saveBtn = panel.add("button", undefined, "保存选中图层为预设");
        saveBtn.preferredSize = [-1, 28];
        saveBtn.minimumSize = [180, 28];
        saveBtn.onClick = function() {
            UIManager.showSavePresetDialog();
        };

        var listPanel = panel.add("panel", undefined, "预设列表");
        listPanel.alignChildren = ["fill", "fill"];
        listPanel.alignment = ["fill", "fill"];

        var presetList = listPanel.add("listbox", undefined, [], {
            multiselect: false
        });
        presetList.alignment = ["fill", "fill"];

        var applyBtn = panel.add("button", undefined, "应用到选中图层");
        applyBtn.preferredSize = [-1, 28];
        applyBtn.minimumSize = [160, 28];

        this._presetsPanel = panel;
        this._searchInput = searchInput;
        this._presetList = presetList;

        searchBtn.onClick = function() {
            UIManager._refreshPresetList(searchInput.text);
        };

        searchInput.onChange = function() {
            UIManager._refreshPresetList(searchInput.text);
        };

        applyBtn.onClick = function() {
            try {
                if (presetList.selection) {
                    var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                    if (layer) {
                        PresetManager.applyPreset(presetList.selection.presetId, layer);
                    } else {
                        alert("请先选中一个图层！");
                    }
                }
            } catch(e) {
                Logger.error("applyBtn.onClick", e);
                alert("应用预设失败，请查看日志:\n" + FXM_CONFIG.logFile);
            }
        };
    },

    _refreshPresetList: function(keyword) {
        try {
            this._presetList.removeAll();
            var presets = PresetManager.searchPresets(keyword);

            for (var i = 0; i < presets.length; i++) {
                var item = this._presetList.add("item", presets[i].name);
                item.presetId = presets[i].id;
                item.subItems = [presets[i].description || "无描述"];
            }
        } catch(e) {
            Logger.error("_refreshPresetList", e);
        }
    },

    showPresetsPanel: function() {
        this._switchTab("presets");
        this._refreshPresetList(this._searchInput ? this._searchInput.text : "");
    },

    _buildBoardsPanel: function(container) {
        var panel = container.add("panel", undefined, "白板管理");
        panel.alignChildren = ["fill", "top"];
        panel.alignment = ["fill", "fill"];

        var boardSelectGroup = panel.add("group");
        boardSelectGroup.orientation = "row";
        boardSelectGroup.alignChildren = ["fill", "center"];

        var boardDropdown = boardSelectGroup.add("dropdownlist", undefined, []);
        boardDropdown.alignment = ["fill", "center"];

        var newBoardBtn = boardSelectGroup.add("button", undefined, "新建白板");
        newBoardBtn.preferredSize = [70, 24];
        var deleteBoardBtn = boardSelectGroup.add("button", undefined, "删除白板");
        deleteBoardBtn.preferredSize = [70, 24];

        var boardContent = panel.add("panel", undefined, "白板内容");
        boardContent.alignChildren = ["fill", "fill"];
        boardContent.alignment = ["fill", "fill"];

        var addToBoardBtn = panel.add("button", undefined, "添加预设到当前白板");
        addToBoardBtn.preferredSize = [-1, 28];
        addToBoardBtn.minimumSize = [180, 28];

        this._boardsPanel = panel;
        this._boardDropdown = boardDropdown;
        this._boardContent = boardContent;

        var refreshBoardsFn = function() {
            try {
                boardDropdown.removeAll();
                for (var i = 0; i < BoardManager.boards.length; i++) {
                    var item = boardDropdown.add("item", BoardManager.boards[i].name);
                    item.boardId = BoardManager.boards[i].id;
                }
                if (boardDropdown.items.length > 0) {
                    boardDropdown.selection = 0;
                    UIManager._renderBoardContent(boardDropdown.selection.boardId);
                }
            } catch(e) {
                Logger.error("refreshBoards", e);
            }
        };

        newBoardBtn.onClick = function() {
            try {
                var name = prompt("请输入白板名称:", "新白板");
                if (name) {
                    BoardManager.createBoard(name);
                    refreshBoardsFn();
                }
            } catch(e) {
                Logger.error("newBoardBtn.onClick", e);
            }
        };

        deleteBoardBtn.onClick = function() {
            try {
                if (boardDropdown.selection) {
                    if (confirm("确定要删除这个白板吗？")) {
                        BoardManager.deleteBoard(boardDropdown.selection.boardId);
                        refreshBoardsFn();
                    }
                }
            } catch(e) {
                Logger.error("deleteBoardBtn.onClick", e);
            }
        };

        boardDropdown.onChange = function() {
            try {
                if (boardDropdown.selection) {
                    UIManager._renderBoardContent(boardDropdown.selection.boardId);
                }
            } catch(e) {
                Logger.error("boardDropdown.onChange", e);
            }
        };

        addToBoardBtn.onClick = function() {
            try {
                if (boardDropdown.selection) {
                    UIManager.showAddPresetToBoardDialog(boardDropdown.selection.boardId);
                }
            } catch(e) {
                Logger.error("addToBoardBtn.onClick", e);
            }
        };

        this._refreshBoardsFn = refreshBoardsFn;
    },

    _renderBoardContent: function(boardId) {
        try {
            var boardContent = this._boardContent;
            if (!boardContent) return;

            while (boardContent.children.length > 0) {
                boardContent.children[0].remove();
            }

            var board = BoardManager.getBoardById(boardId);
            if (!board) return;

            // 使用 ScrollPanel 替代网格，节省空间
            var scrollPanel = boardContent.add("panel");
            scrollPanel.alignChildren = ["fill", "top"];
            scrollPanel.alignment = ["fill", "fill"];

            var itemSize = 50;
            var cols = Math.max(2, Math.floor((boardContent.size ? boardContent.size[0] - 30 : 280) / (itemSize + 8)));

            var gridGroup = scrollPanel.add("group");
            gridGroup.orientation = "column";
            gridGroup.alignChildren = ["left", "top"];

            var currentRow = null;

            for (var i = 0; i < board.items.length; i++) {
                if (i % cols === 0) {
                    currentRow = gridGroup.add("group");
                    currentRow.orientation = "row";
                    currentRow.alignChildren = ["left", "top"];
                }

                var item = board.items[i];
                var preset = PresetManager.getPresetById(item.presetId);

                var btnGroup = currentRow.add("group");
                btnGroup.orientation = "column";
                btnGroup.alignChildren = ["center", "center"];
                btnGroup.preferredSize = [itemSize + 10, itemSize + 30];

                var iconBtn = btnGroup.add("button", undefined, preset ? preset.name.substring(0, 1) : "?");
                iconBtn.preferredSize = [itemSize, itemSize];

                if (item.color) {
                    try {
                        iconBtn.graphics.backgroundColor = iconBtn.graphics.newBrush(
                            iconBtn.graphics.BrushType.SOLID_COLOR,
                            item.color
                        );
                    } catch(e) {}
                }

                var nameLabel = btnGroup.add("statictext", undefined, preset ? preset.name.substring(0, 6) : "?");
                nameLabel.preferredSize = [itemSize + 10, 16];
                nameLabel.justify = "center";

                iconBtn.onClick = (function(presetId) {
                    return function() {
                        try {
                            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                            if (layer) {
                                PresetManager.applyPreset(presetId, layer);
                            } else {
                                alert("请先选中一个图层！");
                            }
                        } catch(e) {
                            Logger.error("iconBtn.onClick", e);
                        }
                    };
                })(item.presetId);
            }

            boardContent.layout.layout(true);
        } catch(e) {
            Logger.error("_renderBoardContent(" + boardId + ")", e);
        }
    },

    showBoardsPanel: function() {
        this._switchTab("boards");
        if (this._refreshBoardsFn) {
            this._refreshBoardsFn();
        }
    },

    _buildSettingsPanel: function(container) {
        var panel = container.add("panel", undefined, "设置");
        panel.alignChildren = ["fill", "start"];
        panel.alignment = ["fill", "fill"];

        var settingsGroup = panel.add("group");
        settingsGroup.orientation = "column";
        settingsGroup.alignChildren = ["fill", "top"];
        settingsGroup.alignment = ["fill", "fill"];

        var pathGroup = settingsGroup.add("panel", undefined, "存储路径");
        pathGroup.orientation = "column";
        pathGroup.alignChildren = ["fill", "top"];

        pathGroup.add("statictext", undefined, "预设文件夹:");
        var presetPath = pathGroup.add("edittext", undefined, FXM_CONFIG.presetFolder);
        presetPath.enabled = false;

        pathGroup.add("statictext", undefined, "白板文件夹:");
        var boardPath = pathGroup.add("edittext", undefined, FXM_CONFIG.boardFolder);
        boardPath.enabled = false;

        pathGroup.add("statictext", undefined, "日志文件:");
        var logPath = pathGroup.add("edittext", undefined, FXM_CONFIG.logFile);
        logPath.enabled = false;

        var hotkeyGroup = settingsGroup.add("panel", undefined, "快捷键设置");
        hotkeyGroup.orientation = "column";
        hotkeyGroup.alignChildren = ["fill", "top"];

        var hotkeyInfo = hotkeyGroup.add("statictext", undefined, "显示/隐藏面板: Ctrl+Alt+F");
        hotkeyInfo.preferredSize = [-1, 20];

        var pieBtn = hotkeyGroup.add("button", undefined, "测试 Pie Menu（圆形菜单）");
        pieBtn.preferredSize = [-1, 26];
        pieBtn.onClick = function() {
            HotkeyManager.showPieMenu();
        };

        var wheelBtn = hotkeyGroup.add("button", undefined, "测试 Wheel Menu（滚轮菜单）");
        wheelBtn.preferredSize = [-1, 26];
        wheelBtn.onClick = function() {
            HotkeyManager.showWheelMenu();
        };

        var quickMenuBtn = hotkeyGroup.add("button", undefined, "测试 Quick Menu（快速搜索+应用）");
        quickMenuBtn.preferredSize = [-1, 26];
        quickMenuBtn.onClick = function() {
            HotkeyManager.showQuickMenu();
        };

        var createTestBtn = hotkeyGroup.add("button", undefined, "创建20个测试预设（用于测试菜单）");
        createTestBtn.preferredSize = [-1, 26];
        createTestBtn.onClick = function() {
            var count = PresetManager.createTestPresets();
            UIManager._refreshPresetList("");
            alert("已创建 " + count + " 个测试预设！\n现在可以测试 Pie Menu、Wheel Menu 和 Quick Menu 了。");
        };

        var searchBtn = hotkeyGroup.add("button", undefined, "测试旧版搜索预设");
        searchBtn.preferredSize = [-1, 26];
        searchBtn.onClick = function() {
            HotkeyManager.quickSearch();
        };

        var hotkeyConfigBtn = hotkeyGroup.add("button", undefined, "打开快捷键配置文件");
        hotkeyConfigBtn.preferredSize = [-1, 26];
        hotkeyConfigBtn.onClick = function() {
            HotkeyManager.showConfigUI();
        };

        var helpGroup = settingsGroup.add("panel", undefined, "使用说明");
        helpGroup.orientation = "column";
        helpGroup.alignChildren = ["fill", "top"];

        helpGroup.add("statictext", undefined, "1. 选中图层后点击'保存为预设'");
        helpGroup.add("statictext", undefined, "2. 在预设管理中搜索和应用");
        helpGroup.add("statictext", undefined, "3. 在白板中创建快捷按钮");
        helpGroup.add("statictext", undefined, "4. Pie Menu / Wheel Menu / Quick Menu 快速调用预设");
        helpGroup.add("statictext", undefined, "5. 先点\"创建20个测试预设\"可体验菜单效果");
        helpGroup.add("statictext", undefined, "6. 配合HID Macros可实现硬件快捷键");
        helpGroup.add("statictext", undefined, "7. 外部调用: afterfx.exe -r <脚本路径> -action <动作>");
        helpGroup.add("statictext", undefined, "   动作: pie_menu / wheel_menu / quick_menu / search / apply <ID>");
        helpGroup.add("statictext", undefined, "8. 错误日志保存在: " + FXM_CONFIG.logFile);

        var logBtn = settingsGroup.add("button", undefined, "打开错误日志文件");
        logBtn.preferredSize = [-1, 26];
        logBtn.onClick = function() {
            try {
                var logFile = new File(FXM_CONFIG.logFile);
                if (logFile.exists) {
                    logFile.execute();
                } else {
                    alert("日志文件不存在，还没有记录到错误。");
                }
            } catch(e) {
                alert("无法打开日志文件: " + e.toString());
            }
        };

        this._settingsPanel = panel;
    },

    showSettingsPanel: function() {
        this._switchTab("settings");
    },

    showSavePresetDialog: function() {
        try {
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
                try {
                    var rawTags = tagsInput.text.split(",");
                    var tags = [];
                    for (var ti = 0; ti < rawTags.length; ti++) {
                        var t = rawTags[ti].replace(/^\s+|\s+$/g, '');
                        if (t !== "") tags.push(t);
                    }
                    var result = PresetManager.saveLayerAsPreset(layer, nameInput.text, descInput.text, tags);
                    dialog.close();
                    if (result) {
                        alert("预设已保存！");
                    }
                } catch(e) {
                    Logger.error("showSavePresetDialog okBtn", e);
                    alert("保存失败，请查看日志:\n" + FXM_CONFIG.logFile);
                }
            };

            cancelBtn.onClick = function() {
                dialog.close();
            };

            dialog.show();
        } catch(e) {
            Logger.error("showSavePresetDialog", e);
        }
    },

    showAddPresetToBoardDialog: function(boardId) {
        try {
            var dialog = new Window("dialog", "添加预设到白板");
            dialog.orientation = "column";
            dialog.alignChildren = ["fill", "top"];

            dialog.add("statictext", undefined, "选择预设:");
            var presetList = dialog.add("listbox", undefined, []);
            presetList.preferredSize = [300, 200];

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
                try {
                    if (presetList.selection) {
                        BoardManager.addPresetToBoard(boardId, presetList.selection.presetId);
                        dialog.close();
                        UIManager.showBoardsPanel();
                    }
                } catch(e) {
                    Logger.error("showAddPresetToBoardDialog okBtn", e);
                }
            };

            cancelBtn.onClick = function() {
                dialog.close();
            };

            dialog.show();
        } catch(e) {
            Logger.error("showAddPresetToBoardDialog", e);
        }
    }
};

// ==================== Pie Menu 方向菜单 ====================
// 纯 palette + 标准按钮实现，无自定义绘图，稳定兼容所有AE版本
// 一页4个按钮呈十字排列（上右下左），点击或Enter选择
var PieMenu = function(items, callback) {
    this.allItems = items || [];
    this.callback = callback;
    this.currentPage = 0;
    this.totalPages = Math.max(1, Math.ceil(this.allItems.length / 4));
    this.selectedSector = -1;
    this.directionSymbols = ["▲", "▶", "▼", "◀"];
    this.window = null;
};

PieMenu.prototype = {
    _getPageItems: function() {
        var start = this.currentPage * 4;
        var end = Math.min(start + 4, this.allItems.length);
        return this.allItems.slice(start, end);
    },

    show: function() {
        var self = this;
        var items = this._getPageItems();
        if (items.length === 0) {
            alert("没有可用预设");
            return;
        }

        // 使用 palette 窗口 - 非模态，不会卡死AE，可随时点击AE窗口脱离
        self.window = new Window("palette", "Pie Menu");
        var win = self.window;
        win.orientation = "column";
        win.alignChildren = ["center", "center"];
        win.spacing = 3;
        win.margins = 6;
        win.minimumSize = [240, 300];
        win.preferredSize = [250, 320];

        // ---- 隐藏cancel按钮 -> Esc关闭 ----
        var escBtn = win.add("button", undefined, "", {name: "cancel"});
        escBtn.visible = false;
        win.cancelElement = escBtn;
        escBtn.onClick = function() { win.close(); };

        // ---- 页切换行 ----
        var pageRow = win.add("group");
        pageRow.orientation = "row";
        pageRow.alignment = ["center", "top"];
        pageRow.spacing = 6;
        var prevBtn = pageRow.add("button", undefined, "<");
        prevBtn.preferredSize = [26, 20];
        var pageText = pageRow.add("statictext", undefined, "");
        pageText.preferredSize = [46, 20];
        pageText.justify = "center";
        var nextBtn = pageRow.add("button", undefined, ">");
        nextBtn.preferredSize = [26, 20];

        // ---- 4个方向按钮（十字排列）----
        var bw = 110;
        var bh = 46;

        // 第1行：上
        var r1 = win.add("group");
        r1.alignment = ["center", "center"];
        var upBtn = r1.add("button", undefined, "▲");
        upBtn.preferredSize = [bw, bh];

        // 第2行：左 + 页号显示 + 右
        var r2 = win.add("group");
        r2.alignment = ["center", "center"];
        r2.spacing = 3;
        var leftBtn = r2.add("button", undefined, "◀");
        leftBtn.preferredSize = [bw, bh];
        var centerPage = r2.add("panel", undefined, "");
        centerPage.preferredSize = [20, bh];
        var rightBtn = r2.add("button", undefined, "▶");
        rightBtn.preferredSize = [bw, bh];

        // 第3行：下
        var r3 = win.add("group");
        r3.alignment = ["center", "center"];
        var downBtn = r3.add("button", undefined, "▼");
        downBtn.preferredSize = [bw, bh];

        var dirBtns = [upBtn, rightBtn, downBtn, leftBtn];

        // ---- 选中文字 ----
        var selText = win.add("statictext", undefined, "点击或按方向键选择");
        selText.preferredSize = [-1, 18];
        selText.justify = "center";
        selText.alignment = ["center", "center"];

        // ---- 底部取消按钮 ----
        var botRow = win.add("group");
        botRow.alignment = ["center", "bottom"];

        var hintTxt = botRow.add("statictext", undefined, "鼠标/方向键 选择");
        hintTxt.preferredSize = [100, 18];

        var closeBtn = botRow.add("button", undefined, "取消");
        closeBtn.preferredSize = [55, 20];
        closeBtn.onClick = function() { win.close(); };

        // ======== 核心交互逻辑 ========

        function clearHighlight() {
            self.selectedSector = -1;
            selText.text = "点击或按方向键选择";
            for (var i = 0; i < 4; i++) {
                dirBtns[i].helpTip = self.directionSymbols[i];
            }
        }

        function updatePage() {
            var pageItems = self._getPageItems();
            pageText.text = (self.currentPage + 1) + "/" + self.totalPages;
            clearHighlight();
            for (var i = 0; i < 4; i++) {
                if (i < pageItems.length) {
                    var name = pageItems[i].name;
                    if (name.length > 7) name = name.substring(0, 6) + ".";
                    dirBtns[i].text = self.directionSymbols[i] + "  " + name;
                    dirBtns[i].enabled = true;
                } else {
                    dirBtns[i].text = self.directionSymbols[i];
                    dirBtns[i].enabled = false;
                }
            }
        }
        updatePage();

        function confirmSelect(index) {
            var pageItems = self._getPageItems();
            if (index >= 0 && index < pageItems.length && self.callback) {
                self.callback(pageItems[index]);
            }
            win.close();
        }

        // ---- 按钮点击事件 ----
        for (var bi = 0; bi < dirBtns.length; bi++) {
            dirBtns[bi].onClick = makeSelectClick(bi);
        }

        function makeSelectClick(idx) {
            return function() { confirmSelect(idx); };
        }

        // ---- 翻页 ----
        prevBtn.onClick = function() {
            if (self.currentPage > 0) {
                self.currentPage--;
                updatePage();
            }
        };
        nextBtn.onClick = function() {
            if (self.currentPage < self.totalPages - 1) {
                self.currentPage++;
                updatePage();
            }
        };

        // ---- 键盘方向键选择 ----
        win.addEventListener("keydown", function(event) {
            var key = event.keyName;
            var pageItems = self._getPageItems();

            if (key === "Escape") {
                win.close();
                return;
            }

            // 方向键 / WASD → 选择对应扇区
            var sectorMap = {
                "Up": 0, "W": 0, "w": 0,
                "Right": 1, "D": 1, "d": 1,
                "Down": 2, "S": 2, "s": 2,
                "Left": 3, "A": 3, "a": 3,
                "Z": 0, "z": 0, "X": 3, "x": 3
            };

            if (key in sectorMap) {
                var target = sectorMap[key];
                if (target < pageItems.length) {
                    self.selectedSector = target;
                    selText.text = "▶ 已选: " + pageItems[target].name;
                }
                return;
            }

            // Enter / 空格 → 确认
            if (key === "Enter" || key === " ") {
                if (self.selectedSector >= 0 && self.selectedSector < pageItems.length) {
                    confirmSelect(self.selectedSector);
                }
                return;
            }

            // Z/X → 翻页
            if (key === "Z" || key === "z") {
                if (self.currentPage < self.totalPages - 1) {
                    self.currentPage++;
                    updatePage();
                }
                return;
            }
            if (key === "X" || key === "x") {
                if (self.currentPage > 0) {
                    self.currentPage--;
                    updatePage();
                }
                return;
            }
        });

        // ---- 松开 Alt 确认 ----
        win.addEventListener("keyup", function(event) {
            if (event.keyName === "Alt" && self.selectedSector >= 0) {
                var pageItems = self._getPageItems();
                if (self.selectedSector < pageItems.length) {
                    confirmSelect(self.selectedSector);
                }
            }
        });

        // ---- 鼠标滚轮翻页 ----
        win.onMouseWheel = function(event) {
            var direction = 0;
            if (event.deltaX && Math.abs(event.deltaX) > 0) {
                direction = (event.deltaX > 0) ? 1 : -1;
            } else if (event.deltaY && Math.abs(event.deltaY) > 0) {
                direction = (event.deltaY < 0) ? 1 : -1;
            } else if (event.delta && Math.abs(event.delta) > 0) {
                direction = (event.delta < 0) ? 1 : -1;
            }

            if (direction < 0 && self.currentPage > 0) {
                self.currentPage--;
                updatePage();
            } else if (direction > 0 && self.currentPage < self.totalPages - 1) {
                self.currentPage++;
                updatePage();
            }
        };

        win.center();
        win.show();
    },

    close: function() {
        if (this.window) {
            this.window.close();
            this.window = null;
        }
    }
};

// ==================== Wheel Menu 滚轮菜单类 ====================
var WheelMenu = function(items, callback) {
    this.allItems = items || [];
    this.callback = callback;
    this.currentIndex = 0;
    this.slotCount = 9;
    this.totalPages = Math.max(1, Math.ceil(this.allItems.length / this.slotCount));
    this.currentPage = 0;
};

WheelMenu.prototype = {
    _getPageItems: function() {
        var start = this.currentPage * this.slotCount;
        var end = Math.min(start + this.slotCount, this.allItems.length);
        return this.allItems.slice(start, end);
    },

    _getGlobalIndex: function() {
        return this.currentPage * this.slotCount + this.currentIndex;
    },

    show: function() {
        var self = this;

        var dlg = new Window("dialog", "Wheel Menu - 滚轮特效菜单", undefined, {closeButton: false});
        dlg.orientation = "column";
        dlg.alignChildren = ["center", "center"];
        dlg.minimumSize = [420, 360];
        dlg.preferredSize = [460, 400];

        var headerGrp = dlg.add("group");
        headerGrp.orientation = "row";
        headerGrp.alignChildren = ["center", "center"];
        headerGrp.alignment = ["center", "top"];

        var prevPageBtn = headerGrp.add("button", undefined, "<<");
        prevPageBtn.preferredSize = [40, 24];
        var pageText = headerGrp.add("statictext", undefined, "");
        pageText.preferredSize = [80, 24];
        pageText.justify = "center";
        var nextPageBtn = headerGrp.add("button", undefined, ">>");
        nextPageBtn.preferredSize = [40, 24];

        // 使用 Group+Scrollbar 风格的垂直列表
        var listGrp = dlg.add("panel");
        listGrp.orientation = "column";
        listGrp.alignChildren = ["fill", "top"];
        listGrp.alignment = ["fill", "fill"];
        listGrp.minimumSize = [380, 260];

        var allButtons = [];

        var renderList = function() {
            // 清除旧的按钮
            for (var bi = 0; bi < allButtons.length; bi++) {
                try { allButtons[bi].remove(); } catch(e) {}
            }
            allButtons = [];

            var items = self._getPageItems();
            pageText.text = (self.currentPage + 1) + "/" + self.totalPages;

            for (var i = 0; i < items.length; i++) {
                var numStr = (i + 1).toString();
                var displayName = items[i].name;
                if (displayName.length > 30) displayName = displayName.substring(0, 29) + "..";

                var btn = listGrp.add("button", undefined, "[" + numStr + "] " + displayName);
                btn.preferredSize = [-1, 32];
                btn.alignment = ["fill", "top"];
                btn.itemIndex = i;

                // 高亮当前选中项
                if (i === self.currentIndex) {
                    btn.graphics.backgroundColor = btn.graphics.newBrush(
                        btn.graphics.BrushType.SOLID_COLOR, [0.3, 0.6, 1.0]
                    );
                    btn.graphics.foregroundColor = btn.graphics.newBrush(
                        btn.graphics.BrushType.SOLID_COLOR, [1, 1, 1]
                    );
                }

                btn.onClick = (function(item, idx) {
                    return function() {
                        self.currentIndex = idx;
                        // 先高亮新的选中项
                        for (var b = 0; b < allButtons.length; b++) {
                            try {
                                // 重置所有按钮样式
                                allButtons[b].graphics.backgroundColor = allButtons[b].graphics.newBrush(
                                    allButtons[b].graphics.BrushType.SOLID_COLOR, [0.8, 0.8, 0.8]
                                );
                                allButtons[b].graphics.foregroundColor = allButtons[b].graphics.newBrush(
                                    allButtons[b].graphics.BrushType.SOLID_COLOR, [0, 0, 0]
                                );
                            } catch(e) {}
                        }
                        // 高亮选中的
                        try {
                            allButtons[idx].graphics.backgroundColor = allButtons[idx].graphics.newBrush(
                                allButtons[idx].graphics.BrushType.SOLID_COLOR, [0.3, 0.6, 1.0]
                            );
                            allButtons[idx].graphics.foregroundColor = allButtons[idx].graphics.newBrush(
                                allButtons[idx].graphics.BrushType.SOLID_COLOR, [1, 1, 1]
                            );
                        } catch(e) {}
                        if (self.callback) self.callback(item);
                        dlg.close();
                    };
                })(items[i], i);

                allButtons.push(btn);
            }
            dlg.layout.layout(true);
        };

        var updateHighlight = function() {
            for (var b = 0; b < allButtons.length; b++) {
                if (!allButtons[b]) continue;
                try {
                    if (b === self.currentIndex) {
                        allButtons[b].graphics.backgroundColor = allButtons[b].graphics.newBrush(
                            allButtons[b].graphics.BrushType.SOLID_COLOR, [0.3, 0.6, 1.0]
                        );
                        allButtons[b].graphics.foregroundColor = allButtons[b].graphics.newBrush(
                            allButtons[b].graphics.BrushType.SOLID_COLOR, [1, 1, 1]
                        );
                    } else {
                        allButtons[b].graphics.backgroundColor = allButtons[b].graphics.newBrush(
                            allButtons[b].graphics.BrushType.SOLID_COLOR, [0.8, 0.8, 0.8]
                        );
                        allButtons[b].graphics.foregroundColor = allButtons[b].graphics.newBrush(
                            allButtons[b].graphics.BrushType.SOLID_COLOR, [0, 0, 0]
                        );
                    }
                } catch(e) {}
            }
        };

        var selText = dlg.add("statictext", undefined, "");
        selText.preferredSize = [-1, 22];
        selText.justify = "center";
        selText.alignment = ["center", "center"];

        var updateSelectionText = function() {
            var items = self._getPageItems();
            if (items.length > 0 && self.currentIndex < items.length) {
                selText.text = "▶ 已选: " + items[self.currentIndex].name;
            } else {
                selText.text = "";
            }
        };

        prevPageBtn.onClick = function() {
            if (self.currentPage > 0) {
                self.currentPage--;
                self.currentIndex = 0;
                renderList();
                updateSelectionText();
            }
        };

        nextPageBtn.onClick = function() {
            if (self.currentPage < self.totalPages - 1) {
                self.currentPage++;
                self.currentIndex = 0;
                renderList();
                updateSelectionText();
            }
        };

        var hintGrp = dlg.add("group");
        hintGrp.orientation = "row";
        hintGrp.alignChildren = ["center", "center"];
        hintGrp.alignment = ["center", "bottom"];

        hintGrp.add("statictext", undefined, "↑↓上下选择  Enter应用  Z/X翻页  数字1-9直接选择  Esc关闭").alignment = ["center", "center"];

        dlg.addEventListener("keydown", function(event) {
            var key = event.keyName;
            if (key === "Escape") {
                dlg.close();
            } else if ((key === "Z" || key === "z") && self.currentPage < self.totalPages - 1) {
                self.currentPage++;
                self.currentIndex = 0;
                renderList();
                updateSelectionText();
            } else if ((key === "X" || key === "x") && self.currentPage > 0) {
                self.currentPage--;
                self.currentIndex = 0;
                renderList();
                updateSelectionText();
            } else if (key >= "1" && key <= "9") {
                var idx = parseInt(key) - 1;
                var items = self._getPageItems();
                if (idx < items.length) {
                    self.currentIndex = idx;
                    updateHighlight();
                    if (self.callback) self.callback(items[idx]);
                    dlg.close();
                }
            } else if (key === "Enter") {
                var items = self._getPageItems();
                if (items.length > 0 && self.currentIndex < items.length) {
                    if (self.callback) self.callback(items[self.currentIndex]);
                    dlg.close();
                }
            } else if (key === "Up") {
                if (self.currentIndex > 0) {
                    self.currentIndex--;
                    updateHighlight();
                    updateSelectionText();
                }
                event.preventDefault();
            } else if (key === "Down") {
                var items = self._getPageItems();
                if (self.currentIndex < items.length - 1) {
                    self.currentIndex++;
                    updateHighlight();
                    updateSelectionText();
                }
                event.preventDefault();
            }
        });

        renderList();
        updateSelectionText();
        dlg.center();
        dlg.show();
    },

    close: function() {
        if (this.window) {
            this.window.close();
        }
    }
};

// ==================== Quick Menu 快速特效菜单 ====================
var QuickMenu = function(items, callback) {
    this.allItems = items || [];
    this.callback = callback;
    this.window = null;
    this.filteredItems = items.slice();
    this.selectedIndex = 0;
    this.searchText = "";
};

QuickMenu.prototype = {
    show: function() {
        var self = this;
        this.selectedIndex = 0;
        this.searchText = "";
        this.filteredItems = this.allItems.slice();

        var dlg = new Window("dialog", "Quick Menu - 快速搜索特效", undefined, {closeButton: false});
        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "fill"];
        dlg.minimumSize = [320, 300];
        dlg.preferredSize = [380, 400];

        var searchGroup = dlg.add("group");
        searchGroup.orientation = "row";
        searchGroup.alignChildren = ["fill", "center"];
        searchGroup.alignment = ["fill", "top"];

        var searchLabel = searchGroup.add("statictext", undefined, "搜索:");
        searchLabel.preferredSize = [40, 22];

        var searchInput = searchGroup.add("edittext", undefined, "");
        searchInput.alignment = ["fill", "center"];
        searchInput.preferredSize = [-1, 24];

        var countLabel = searchGroup.add("statictext", undefined, "0");
        countLabel.preferredSize = [35, 22];
        countLabel.justify = "center";

        var listPanel = dlg.add("panel", undefined, "");
        listPanel.orientation = "column";
        listPanel.alignChildren = ["fill", "fill"];
        listPanel.alignment = ["fill", "fill"];

        var listbox = listPanel.add("listbox", undefined, [], {multiselect: false});
        listbox.alignment = ["fill", "fill"];

        var footerGroup = dlg.add("group");
        footerGroup.orientation = "row";
        footerGroup.alignChildren = ["center", "center"];
        footerGroup.alignment = ["fill", "bottom"];

        var footerText = footerGroup.add("statictext", undefined, "上/下选择  Enter应用  Esc关闭");
        footerText.justify = "center";
        footerText.alignment = ["center", "center"];

        var refreshList = function() {
            listbox.removeAll();

            var keyword = searchInput.text.toLowerCase().replace(/^\s+|\s+$/g, '');
            if (keyword === "") {
                self.filteredItems = self.allItems.slice();
            } else {
                self.filteredItems = [];
                for (var i = 0; i < self.allItems.length; i++) {
                    if (self.allItems[i].name.toLowerCase().indexOf(keyword) >= 0 ||
                        (self.allItems[i].tags && self.allItems[i].tags.toLowerCase().indexOf(keyword) >= 0)) {
                        self.filteredItems.push(self.allItems[i]);
                    }
                }
            }

            for (var i = 0; i < self.filteredItems.length; i++) {
                var item = listbox.add("item", self.filteredItems[i].name);
                item.presetId = self.filteredItems[i].id;
                if (self.filteredItems[i].description) {
                    item.subItems = [self.filteredItems[i].description];
                }
            }

            countLabel.text = self.filteredItems.length.toString();

            if (self.selectedIndex >= self.filteredItems.length) {
                self.selectedIndex = self.filteredItems.length > 0 ? self.filteredItems.length - 1 : 0;
            }
            if (self.filteredItems.length > 0) {
                listbox.selected = self.selectedIndex;
            }

            dlg.layout.layout(true);
        };

        var applySelected = function() {
            if (listbox.selection && listbox.selection.presetId && self.callback) {
                self.callback({
                    id: listbox.selection.presetId,
                    name: listbox.selection.text
                });
            } else if (self.filteredItems.length > 0 && self.callback) {
                self.callback(self.filteredItems[self.selectedIndex]);
            }
            dlg.close();
        };

        listbox.onChange = function() {
            if (listbox.selection) {
                self.selectedIndex = listbox.selected;
            }
        };

        listbox.onDoubleClick = function() {
            applySelected();
        };

        searchInput.onChange = function() {
            self.selectedIndex = 0;
            refreshList();
        };

        // 关键修复：不手动处理字符输入，让 edittext 原生接管
        // 我们只需要在 keydown 中处理 方向键/Enter/Escape
        // 字符输入由 searchInput.onChange 自动触发 refreshList
        searchInput.addEventListener("keydown", function(event) {
            var key = event.keyName;
            if (key === "Escape") {
                dlg.close();
            } else if (key === "Enter") {
                applySelected();
            } else if (key === "Up") {
                if (self.selectedIndex > 0) {
                    self.selectedIndex--;
                    if (listbox.items.length > 0) {
                        listbox.selected = self.selectedIndex;
                    }
                }
                event.preventDefault();
            } else if (key === "Down") {
                if (self.selectedIndex < self.filteredItems.length - 1) {
                    self.selectedIndex++;
                    if (listbox.items.length > 0) {
                        listbox.selected = self.selectedIndex;
                    }
                }
                event.preventDefault();
            }
        });

        searchInput.active = true;
        refreshList();
        dlg.center();
        dlg.show();
    },

    close: function() {
        if (this.window) {
            this.window.close();
        }
    }
};

// ==================== 快捷键管理器 ====================
var HotkeyManager = {
    configPath: Folder.userData.fsName + "/AE_FX_Manager/hotkey_config.json",

    init: function() {
        this.ensureConfig();
    },

    ensureConfig: function() {
        var folder = new Folder(Folder.userData.fsName + "/AE_FX_Manager");
        if (!folder.exists) folder.create();

        var file = new File(this.configPath);
        if (!file.exists) {
            var defaultConfig = {
                shortcuts: [
                    { key: "Alt+1", action: "show_pie_menu", preset: "" },
                    { key: "Alt+2", action: "show_wheel_menu", preset: "" },
                    { key: "Alt+3", action: "show_quick_menu", preset: "" }
                ],
                hidMacros: {
                    enabled: false,
                    port: 8080
                }
            };
            this.saveConfig(defaultConfig);
        }
    },

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

    saveConfig: function(config) {
        var file = new File(this.configPath);
        file.open('w');
        file.write(JSON.stringify(config, null, 2));
        file.close();
    },

    executeAction: function(action, param) {
        switch(action) {
            case "show_pie_menu":
                this.showPieMenu();
                break;
            case "show_wheel_menu":
                this.showWheelMenu();
                break;
            case "show_quick_menu":
                this.showQuickMenu();
                break;
            case "quick_search":
                this.quickSearch(param);
                break;
            case "apply_preset":
                this.applyPresetById(param);
                break;
            case "apply_board_preset":
                this.applyBoardPreset(param);
                break;
        }
    },

    showPieMenu: function() {
        var presets = PresetManager.presets;
        if (presets.length === 0) {
            if (confirm("没有可用的预设！\n是否创建20个测试预设来体验菜单功能？")) {
                try {
                    PresetManager.createTestPresets();
                } catch (e) {
                    Logger.error("创建测试预设失败: " + e.toString());
                    alert("创建测试预设失败：" + e.toString());
                    return;
                }
                presets = PresetManager.presets;
                if (presets.length === 0) {
                    alert("预设仍然为空，请检查日志");
                    return;
                }
            } else {
                return;
            }
        }

        var items = [];
        for (var i = 0; i < presets.length; i++) {
            items.push({
                id: presets[i].id,
                name: presets[i].name,
                tags: presets[i].tags ? presets[i].tags.join(",") : ""
            });
        }

        var pieMenu = new PieMenu(items, function(item) {
            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
            if (layer) {
                PresetManager.applyPreset(item.id, layer);
            } else {
                alert("请先选中一个图层！");
            }
        });

        pieMenu.show();
    },

    showWheelMenu: function() {
        var presets = PresetManager.presets;
        if (presets.length === 0) {
            if (confirm("没有可用的预设！\n是否创建20个测试预设来体验菜单功能？")) {
                try {
                    PresetManager.createTestPresets();
                } catch (e) {
                    Logger.error("创建测试预设失败: " + e.toString());
                    alert("创建测试预设失败：" + e.toString());
                    return;
                }
                presets = PresetManager.presets;
                if (presets.length === 0) {
                    alert("预设仍然为空，请检查日志");
                    return;
                }
            } else {
                return;
            }
        }

        var items = [];
        for (var i = 0; i < presets.length; i++) {
            items.push({
                id: presets[i].id,
                name: presets[i].name,
                description: presets[i].description || ""
            });
        }

        var wheelMenu = new WheelMenu(items, function(item) {
            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
            if (layer) {
                PresetManager.applyPreset(item.id, layer);
            } else {
                alert("请先选中一个图层！");
            }
        });
        wheelMenu.show();
    },

    quickSearch: function(keyword) {
        try {
            var results;
            if (keyword) {
                results = PresetManager.searchPresets(keyword);
            } else {
                results = PresetManager.presets;
            }

            if (results.length > 0) {
                var items = [];
                for (var i = 0; i < results.length; i++) {
                    items.push({
                        id: results[i].id,
                        name: results[i].name,
                        tags: results[i].tags ? results[i].tags.join(",") : results[i].name
                    });
                }

                var quickMenu = new QuickMenu(items, function(item) {
                    var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                    if (layer) {
                        PresetManager.applyPreset(item.id, layer);
                    } else {
                        alert("请先选中一个图层！");
                    }
                });
                quickMenu.show();
            } else {
                if (PresetManager.presets.length === 0) {
                    if (confirm("没有可用的预设！\n是否创建20个测试预设来体验菜单功能？")) {
                        try {
                            PresetManager.createTestPresets();
                        } catch (e) {
                            Logger.error("创建测试预设失败: " + e.toString());
                            alert("创建测试预设失败：" + e.toString());
                            return;
                        }
                        HotkeyManager.showQuickMenu();
                    }
                } else {
                    alert("未找到匹配的预设");
                }
            }
        } catch(e) {
            Logger.error("quickSearch", e);
        }
    },

    showQuickMenu: function() {
        var presets = PresetManager.presets;
        if (presets.length === 0) {
            if (confirm("没有可用的预设！\n是否创建20个测试预设来体验菜单功能？")) {
                try {
                    PresetManager.createTestPresets();
                } catch (e) {
                    Logger.error("创建测试预设失败: " + e.toString());
                    alert("创建测试预设失败：" + e.toString());
                    return;
                }
                presets = PresetManager.presets;
                if (presets.length === 0) {
                    alert("预设仍然为空，请检查日志");
                    return;
                }
            } else {
                return;
            }
        }

        var items = [];
        for (var i = 0; i < presets.length; i++) {
            items.push({
                id: presets[i].id,
                name: presets[i].name,
                tags: presets[i].tags ? presets[i].tags.join(",") : presets[i].name,
                description: presets[i].description || ""
            });
        }

        var quickMenu = new QuickMenu(items, function(item) {
            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
            if (layer) {
                PresetManager.applyPreset(item.id, layer);
            } else {
                alert("请先选中一个图层！");
            }
        });
        quickMenu.show();
    },

    applyPresetById: function(presetId) {
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

        PresetManager.applyPreset(presetId, layer);
    },

    applyBoardPreset: function(boardIndex) {
        var boards = BoardManager.boards;
        var idx = parseInt(boardIndex);
        if (isNaN(idx) || idx < 0 || idx >= boards.length) {
            alert("白板不存在！");
            return;
        }

        var board = boards[idx];
        if (!board.items || board.items.length === 0) {
            alert("白板为空！");
            return;
        }

        var items = [];
        for (var i = 0; i < board.items.length; i++) {
            var preset = PresetManager.getPresetById(board.items[i].presetId);
            if (preset) {
                items.push({
                    id: preset.id,
                    name: preset.name
                });
            }
        }

        var wheelMenu = new WheelMenu(items, function(item) {
            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
            if (layer) {
                PresetManager.applyPreset(item.id, layer);
            } else {
                alert("请先选中一个图层！");
            }
        });
        wheelMenu.show();
    },

    getPresetColor: function(index) {
        var colors = [
            [0.26, 0.62, 1.0],
            [0.35, 0.79, 0.55],
            [1.0, 0.71, 0.23],
            [0.95, 0.3, 0.3],
            [0.74, 0.48, 0.97],
            [0.29, 0.85, 0.89],
            [1.0, 0.5, 0.8],
            [0.6, 0.8, 0.2]
        ];
        return colors[index % colors.length];
    },

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
                script: this.generateScriptForAction(shortcut.action, shortcut.preset)
            });
        }

        var file = new File(Folder.userData.fsName + "/AE_FX_Manager/hidmacros_config.json");
        file.open('w');
        file.write(JSON.stringify(hidConfig, null, 2));
        file.close();

        return hidConfig;
    },

    generateScriptForAction: function(action, param) {
        var scriptPath = File.decode($.fileName);

        switch(action) {
            case "show_pie_menu":
                return 'afterfx.exe -r "' + scriptPath + '" -action pie_menu';
            case "show_wheel_menu":
                return 'afterfx.exe -r "' + scriptPath + '" -action wheel_menu';
            case "show_quick_menu":
                return 'afterfx.exe -r "' + scriptPath + '" -action quick_menu';
            case "quick_search":
                return 'afterfx.exe -r "' + scriptPath + '" -action search';
            case "apply_preset":
                return 'afterfx.exe -r "' + scriptPath + '" -action apply ' + param;
            default:
                return '';
        }
    },

    showConfigUI: function() {
        var config = this.loadConfig();
        if (!config) return;

        var win = new Window("dialog", "快捷键配置");
        win.preferredSize = [400, 500];
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

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

        var hidPanel = win.add("panel", undefined, "HID Macros配置");
        hidPanel.alignChildren = ["fill", "top"];

        var enableCheck = hidPanel.add("checkbox", undefined, "启用HID Macros支持");
        enableCheck.value = config.hidMacros.enabled;

        var portGroup = hidPanel.add("group");
        portGroup.orientation = "row";
        portGroup.add("statictext", undefined, "端口:");
        var portInput = portGroup.add("edittext", undefined, config.hidMacros.port.toString());
        portInput.preferredSize = [60, 20];

        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = ["center", "center"];

        var saveBtn = btnGroup.add("button", undefined, "保存配置");
        var exportBtn = btnGroup.add("button", undefined, "导出HID配置");
        var closeBtn = btnGroup.add("button", undefined, "关闭");

        saveBtn.onClick = function() {
            config.hidMacros.enabled = enableCheck.value;
            config.hidMacros.port = parseInt(portInput.text) || 8080;
            HotkeyManager.saveConfig(config);
            alert("配置已保存！");
        };

        exportBtn.onClick = function() {
            HotkeyManager.generateHIDMacrosConfig();
            alert("HID Macros配置已导出！");
        };

        closeBtn.onClick = function() {
            win.close();
        };

        win.show();
    }
};

// ==================== 命令行参数处理 ====================
function processCommandLineArgs() {
    try {
        if (!app.scriptArgs) return;
        var args = app.scriptArgs;
        if (args.length === 0) return;

        var action = "";
        var param = "";

        for (var i = 0; i < args.length; i++) {
            if (args[i] === "-action" || args[i] === "-a") {
                if (i + 1 < args.length) action = args[i + 1];
            } else if (args[i] === "-param" || args[i] === "-p") {
                if (i + 1 < args.length) param = args[i + 1];
            }
        }

        if (action !== "") {
            Logger.info("Command line action: " + action + " param: " + param);
            HotkeyManager.executeAction(action, param);
        }
    } catch(e) {
        Logger.error("processCommandLineArgs", e);
    }
}

// ==================== 持久浮动面板（快捷访问工具栏） ====================
// 运行脚本后此面板保持打开，可随时点击按钮唤起三种菜单
var floatingBar = null;

function createFloatingBar() {
    if (floatingBar && floatingBar instanceof Window && !floatingBar.alive) {
        try { floatingBar.close(); } catch(e) {}
        floatingBar = null;
    }
    if (floatingBar) {
        try {
            floatingBar.show();
            return floatingBar;
        } catch(e) {
            floatingBar = null;
        }
    }

    var bar = new Window("palette", FXM_NAME + " v" + FXM_VERSION + " - 快捷工具栏", undefined, {resizeable: false});
    bar.orientation = "row";
    bar.alignChildren = ["center", "center"];
    bar.preferredSize = [460, 48];
    bar.minimumSize = [360, 44];
    bar.spacing = 6;
    bar.margins = [6, 4, 6, 4];

    var hasPresets = (PresetManager.presets.length > 0);

    // 辅助函数：安全调用菜单
    // 用随机字符串绕过 scheduleTask 的脚本去重，每次点击生成新字符串，保证总是执行
    function safeOpenMenu(fullCallStr) {
        try {
            if (typeof app !== "undefined" && app.scheduleTask) {
                // 追加随机注解使字符串唯一，绕过 AE 的字符串去重
                var uid = "_" + (new Date().getTime()) + Math.random().toString(36).substring(2, 6);
                app.scheduleTask("try{" + fullCallStr + "}catch(e){alert('菜单错误: '+e.toString())}/*" + uid + "*/", 50, 0);
            } else {
                eval(fullCallStr);
            }
        } catch(e) {
            alert("操作失败: " + e.toString());
            Logger.error("safeOpenMenu", e);
        }
    }

    var pieBtn = bar.add("button", undefined, "● Pie Menu");
    pieBtn.preferredSize = [-1, 30];
    pieBtn.helpTip = "4向扇形方向菜单，快捷键 Alt+1";
    pieBtn.onClick = function() { safeOpenMenu("HotkeyManager.showPieMenu()"); };

    var wheelBtn = bar.add("button", undefined, "◆ Wheel Menu");
    wheelBtn.preferredSize = [-1, 30];
    wheelBtn.helpTip = "滚轮列表菜单，快捷键 Alt+2";
    wheelBtn.onClick = function() { safeOpenMenu("HotkeyManager.showWheelMenu()"); };

    var quickBtn = bar.add("button", undefined, "◈ Quick Menu");
    quickBtn.preferredSize = [-1, 30];
    quickBtn.helpTip = "快速搜索特效，快捷键 Alt+3";
    quickBtn.onClick = function() { safeOpenMenu("HotkeyManager.showQuickMenu()"); };

    var panelBtn = bar.add("button", undefined, "▣ 管理面板");
    panelBtn.preferredSize = [-1, 30];
    panelBtn.helpTip = "打开完整的预设管理面板";
    panelBtn.onClick = function() { safeOpenMenu("UIManager.openMainWindow()"); };

    if (!hasPresets) {
        var createBtn = bar.add("button", undefined, "⊕ 测试预设");
        createBtn.preferredSize = [-1, 30];
        createBtn.helpTip = "创建20个测试预设用于体验菜单功能";
        createBtn.onClick = function() {
            try {
                var count = PresetManager.createTestPresets();
                hasPresets = true;
                createBtn.visible = false;
                bar.layout.layout(true);
                alert("已创建 " + count + " 个测试预设！\n现在可以体验所有菜单功能了。");
            } catch(e) {
                alert("创建测试预设失败: " + e.toString());
                Logger.error("createBtn.onClick", e);
            }
        };
    }

    // 添加键盘提示
    var hintText = bar.add("statictext", undefined, "Alt+1=Pie  Alt+2=Wheel  Alt+3=Quick  Esc=关闭");
    hintText.preferredSize = [-1, 26];

    floatingBar = bar;

    // 注册快捷键
    try {
        bar.addEventListener("keydown", function(event) {
            var key = event.keyName;
            try {
                if (key === "Escape") {
                    bar.close();
                    floatingBar = null;
                } else if (key === "1" && event.altKey) {
                    safeOpenMenu("HotkeyManager.showPieMenu()");
                } else if (key === "2" && event.altKey) {
                    safeOpenMenu("HotkeyManager.showWheelMenu()");
                } else if (key === "3" && event.altKey) {
                    safeOpenMenu("HotkeyManager.showQuickMenu()");
                }
            } catch(e) {
                Logger.error("keydown handler", e);
            }
        });
    } catch(e) {
        Logger.warn("无法注册键盘事件: " + e.toString());
    }

    bar.center();
    bar.show();
    return bar;
}

// ==================== 主函数 ====================
function main() {
    try {
        Logger.init();
        Logger.info("=== " + FXM_NAME + " v" + FXM_VERSION + " 启动 ===");

        PresetManager.init();
        BoardManager.init();
        HotkeyManager.init();

        processCommandLineArgs();

        // 打开持久浮动面板（类似 FX Console 的悬浮体验）
        createFloatingBar();

        app.onError = function(err) {
            Logger.error("AE Error", err);
        };
    } catch(e) {
        var errStr = e.toString();
        if (e.line) errStr += " (line: " + e.line + ")";
        alert("脚本初始化失败:\n" + errStr);
        Logger.error("main", e);
    }
}

// ==================== 启动 ====================
try {
    if (typeof app === "undefined" || !app) {
        alert("请在 After Effects 中运行此脚本！\n菜单: 文件 > 脚本 > 运行脚本文件...");
        throw new Error("app is not defined");
    }
    var scriptName = File.decode($.fileName).split("/").pop();
    var isCommandLine = (app.scriptArgs && app.scriptArgs.length > 0);

    if (isCommandLine) {
        Logger.init();
        Logger.info("Command line mode: " + app.scriptArgs.toString());
        PresetManager.init();
        BoardManager.init();
        HotkeyManager.init();
        processCommandLineArgs();
    } else {
        main();
    }
} catch(e) {
    alert("脚本启动失败:\n" + e.toString() + "\n\n请确保在 After Effects 中运行此脚本。");
}