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
            maximizeButton: true
        });

        win.preferredSize = [400, 600];
        win.minimumSize = [350, 400];
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

        presetBtn.onClick = function() { UIManager.currentTab = "presets"; UIManager._switchTab("presets"); };
        boardBtn.onClick = function() { UIManager.currentTab = "boards"; UIManager._switchTab("boards"); };
        settingsBtn.onClick = function() { UIManager.currentTab = "settings"; UIManager._switchTab("settings"); };

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
        saveBtn.onClick = function() { UIManager.showSavePresetDialog(); };

        var listPanel = panel.add("panel", undefined, "预设列表");
        listPanel.alignChildren = ["fill", "fill"];
        listPanel.alignment = ["fill", "fill"];

        var presetList = listPanel.add("listbox", undefined, [], { multiselect: false });
        presetList.alignment = ["fill", "fill"];

        var applyBtn = panel.add("button", undefined, "应用到选中图层");
        applyBtn.preferredSize = [-1, 28];
        applyBtn.minimumSize = [160, 28];

        this._presetsPanel = panel;
        this._searchInput = searchInput;
        this._presetList = presetList;

        searchBtn.onClick = function() { UIManager._refreshPresetList(searchInput.text); };
        searchInput.onChange = function() { UIManager._refreshPresetList(searchInput.text); };

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
        panel.alignChildren = ["fill", "start"];
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
            } catch(e) { Logger.error("refreshBoards", e); }
        };

        newBoardBtn.onClick = function() {
            try {
                var name = prompt("请输入白板名称:", "新白板");
                if (name) { BoardManager.createBoard(name); refreshBoardsFn(); }
            } catch(e) { Logger.error("newBoardBtn.onClick", e); }
        };

        deleteBoardBtn.onClick = function() {
            try {
                if (boardDropdown.selection && confirm("确定要删除这个白板吗？")) {
                    BoardManager.deleteBoard(boardDropdown.selection.boardId);
                    refreshBoardsFn();
                }
            } catch(e) { Logger.error("deleteBoardBtn.onClick", e); }
        };

        boardDropdown.onChange = function() {
            try {
                if (boardDropdown.selection) {
                    UIManager._renderBoardContent(boardDropdown.selection.boardId);
                }
            } catch(e) { Logger.error("boardDropdown.onChange", e); }
        };

        addToBoardBtn.onClick = function() {
            try {
                if (boardDropdown.selection) {
                    UIManager.showAddPresetToBoardDialog(boardDropdown.selection.boardId);
                }
            } catch(e) { Logger.error("addToBoardBtn.onClick", e); }
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

            var gridGroup = boardContent.add("group");
            gridGroup.orientation = "column";
            gridGroup.alignChildren = ["fill", "start"];
            gridGroup.alignment = ["fill", "fill"];

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

                var btnGroup = currentRow.add("group");
                btnGroup.orientation = "column";
                btnGroup.alignChildren = ["center", "center"];
                btnGroup.preferredSize = [board.layout.itemSize || 80, board.layout.itemSize || 80];

                var iconBtn = btnGroup.add("button", undefined, preset ? preset.name.substring(0, 2) : "??");
                iconBtn.preferredSize = [60, 60];

                if (item.color) {
                    iconBtn.graphics.backgroundColor = iconBtn.graphics.newBrush(
                        iconBtn.graphics.BrushType.SOLID_COLOR, item.color
                    );
                }

                var nameLabel = btnGroup.add("statictext", undefined, preset ? preset.name : "未知");
                nameLabel.preferredSize = [70, 20];
                nameLabel.justify = "center";

                iconBtn.onClick = (function(pid) {
                    return function() {
                        try {
                            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
                            if (layer) { PresetManager.applyPreset(pid, layer); }
                            else { alert("请先选中一个图层！"); }
                        } catch(e) { Logger.error("iconBtn.onClick", e); }
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
        if (this._refreshBoardsFn) { this._refreshBoardsFn(); }
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
        pieBtn.onClick = function() { HotkeyManager.showPieMenu(); };

        var wheelBtn = hotkeyGroup.add("button", undefined, "测试 Wheel Menu（滚轮菜单）");
        wheelBtn.preferredSize = [-1, 26];
        wheelBtn.onClick = function() { HotkeyManager.showWheelMenu(); };

        var quickMenuBtn = hotkeyGroup.add("button", undefined, "测试 Quick Menu（快速搜索+应用）");
        quickMenuBtn.preferredSize = [-1, 26];
        quickMenuBtn.onClick = function() { HotkeyManager.showQuickMenu(); };

        var createTestBtn = hotkeyGroup.add("button", undefined, "创建20个测试预设（用于测试菜单）");
        createTestBtn.preferredSize = [-1, 26];
        createTestBtn.onClick = function() {
            var count = PresetManager.createTestPresets();
            UIManager._refreshPresetList("");
            alert("已创建 " + count + " 个测试预设！\n现在可以测试 Pie Menu、Wheel Menu 和 Quick Menu 了。");
        };

        var searchBtn = hotkeyGroup.add("button", undefined, "测试旧版搜索预设");
        searchBtn.preferredSize = [-1, 26];
        searchBtn.onClick = function() { HotkeyManager.quickSearch(); };

        var hotkeyConfigBtn = hotkeyGroup.add("button", undefined, "打开快捷键配置文件");
        hotkeyConfigBtn.preferredSize = [-1, 26];
        hotkeyConfigBtn.onClick = function() { HotkeyManager.showConfigUI(); };

        var helpGroup = settingsGroup.add("panel", undefined, "使用说明");
        helpGroup.orientation = "column";
        helpGroup.alignChildren = ["fill", "top"];

        helpGroup.add("statictext", undefined, "1. 选中图层后点击'保存为预设'");
        helpGroup.add("statictext", undefined, "2. 在预设管理中搜索和应用");
        helpGroup.add("statictext", undefined, "3. 在白板中创建快捷按钮");
        helpGroup.add("statictext", undefined, "4. Pie Menu / Wheel Menu / Quick Menu 快速调用预设");
        helpGroup.add("statictext", undefined, "5. 先点创建20个测试预设可体验菜单效果");
        helpGroup.add("statictext", undefined, "6. 配合HID Macros可实现硬件快捷键");
        helpGroup.add("statictext", undefined, "7. 外部调用: afterfx.exe -r <脚本路径> -action <动作>");
        helpGroup.add("statictext", undefined, "8. 错误日志: " + FXM_CONFIG.logFile);

        var logBtn = settingsGroup.add("button", undefined, "打开错误日志文件");
        logBtn.preferredSize = [-1, 26];
        logBtn.onClick = function() {
            try {
                var logFile = new File(FXM_CONFIG.logFile);
                if (logFile.exists) { logFile.execute(); }
                else { alert("日志文件不存在"); }
            } catch(e) { alert("无法打开日志文件: " + e.toString()); }
        };

        this._settingsPanel = panel;
    },

    showSettingsPanel: function() { this._switchTab("settings"); },

    showSavePresetDialog: function() {
        try {
            var layer = app.project.activeItem ? app.project.activeItem.selectedLayers[0] : null;
            if (!layer) { alert("请先选中一个图层！"); return; }

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
                    if (result) alert("预设已保存！");
                } catch(e) {
                    Logger.error("showSavePresetDialog okBtn", e);
                    alert("保存失败，请查看日志:\n" + FXM_CONFIG.logFile);
                }
            };

            cancelBtn.onClick = function() { dialog.close(); };

            dialog.show();
        } catch(e) { Logger.error("showSavePresetDialog", e); }
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
                } catch(e) { Logger.error("showAddPresetToBoardDialog okBtn", e); }
            };

            cancelBtn.onClick = function() { dialog.close(); };

            dialog.show();
        } catch(e) { Logger.error("showAddPresetToBoardDialog", e); }
    }
};
