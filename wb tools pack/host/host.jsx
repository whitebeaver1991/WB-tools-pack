$.level = 1;

// ==================== 全局配置 ====================
var FXM_VERSION = "1.1.0";
var FXM_NAME = "wb tools pack";

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
        if (!folder.exists) folder.create();
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
            Logger.error("applyEffectToLayer", e);
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
                Logger.error("loadPresets", e);
            }
        }
    },
    getPresets: function() {
        return this.presets;
    },
    getPresetById: function(presetId) {
        for (var i = 0; i < this.presets.length; i++) {
            if (this.presets[i].id === presetId) return this.presets[i];
        }
        return null;
    },
    searchPresets: function(keyword) {
        if (!keyword || keyword === "") return this.presets;
        var kw = keyword.toLowerCase();
        var results = [];
        for (var i = 0; i < this.presets.length; i++) {
            var p = this.presets[i];
            if (p.name.toLowerCase().indexOf(kw) >= 0) {
                results.push(p);
            } else if (p.description && p.description.toLowerCase().indexOf(kw) >= 0) {
                results.push(p);
            } else if (p.tags) {
                for (var t = 0; t < p.tags.length; t++) {
                    if (p.tags[t].toLowerCase().indexOf(kw) >= 0) {
                        results.push(p);
                        break;
                    }
                }
            }
        }
        return results;
    },
    saveLayerAsPreset: function(layerName, name, description, tags) {
        try {
            var comp = app.project.activeItem;
            if (!comp) return JSON.stringify({error: "请先打开一个合成"});
            var layer = comp.selectedLayers[0];
            if (!layer) return JSON.stringify({error: "请先选中一个图层"});

            var effects = Utils.getLayerEffects(layer);
            if (effects.length === 0) return JSON.stringify({error: "选中的图层没有特效"});

            var preset = {
                id: Utils.generateId(),
                name: name || layer.name + "_预设",
                description: description || "",
                tags: tags || [],
                created: new Date().toISOString(),
                effects: effects,
                iconPath: ""
            };

            var ffxPath = FXM_CONFIG.presetFolder + "/" + preset.id + ".ffx";
            this.saveFFX(layer, ffxPath);
            preset.ffxPath = ffxPath;

            Utils.writeJSON(FXM_CONFIG.presetFolder + "/" + preset.id + ".json", preset);
            this.presets.push(preset);
            Logger.info("Preset saved: " + preset.name);

            return JSON.stringify({success: true, preset: preset});
        } catch(e) {
            Logger.error("saveLayerAsPreset", e);
            return JSON.stringify({error: e.toString()});
        }
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
    applyPreset: function(presetId) {
        var preset = this.getPresetById(presetId);
        if (!preset) return JSON.stringify({error: "预设不存在"});

        try {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) return JSON.stringify({error: "请先打开一个合成"});
            var layer = comp.selectedLayers[0];
            if (!layer) return JSON.stringify({error: "请先选中一个图层"});

            if (preset.ffxPath && new File(preset.ffxPath).exists) {
                try {
                    layer.applyPreset(new File(preset.ffxPath));
                    Logger.info("Preset applied via FFX: " + preset.name);
                    return JSON.stringify({success: true, name: preset.name});
                } catch(e) {
                    return this.applyEffectsManually(preset, layer);
                }
            }
            return this.applyEffectsManually(preset, layer);
        } catch(e) {
            Logger.error("applyPreset", e);
            return JSON.stringify({error: e.toString()});
        }
    },
    applyEffectsManually: function(preset, targetLayer) {
        var success = false;
        for (var i = 0; i < preset.effects.length; i++) {
            if (Utils.applyEffectToLayer(targetLayer, preset.effects[i].matchName)) {
                success = true;
            }
        }
        var result = {success: success, name: preset.name};
        if (success) Logger.info("Preset applied: " + preset.name);
        return JSON.stringify(result);
    },
    deletePreset: function(presetId) {
        for (var i = 0; i < this.presets.length; i++) {
            if (this.presets[i].id === presetId) {
                try {
                    var jsonFile = new File(FXM_CONFIG.presetFolder + "/" + presetId + ".json");
                    if (jsonFile.exists) jsonFile.remove();
                    var ffxFile = new File(this.presets[i].ffxPath);
                    if (ffxFile.exists) ffxFile.remove();
                } catch(e) {}
                this.presets.splice(i, 1);
                return JSON.stringify({success: true});
            }
        }
        return JSON.stringify({error: "预设不存在"});
    },
    createTestPresets: function() {
        var testNames = [
            "Glow 辉光", "Blur 模糊", "Shadow 阴影", "Bevel 浮雕",
            "Wave 波浪", "Sparkle 闪烁", "Distort 扭曲", "Edge 边缘",
            "Chromatic Aberration 色差", "Vignette 暗角", "Film Grain 胶片颗粒", "Pixelate 像素化"
        ];
        var count = 0;
        for (var i = 0; i < testNames.length; i++) {
            if (this.getPresetByName(testNames[i])) continue;
            var preset = {
                id: Utils.generateId(),
                name: testNames[i],
                description: "测试预设 - " + testNames[i],
                tags: ["测试", testNames[i].toLowerCase().split(" ")[0]],
                created: new Date().toISOString(),
                effects: [{name: testNames[i], matchName: "ADBE " + testNames[i], enabled: true}],
                ffxPath: "",
                iconPath: ""
            };
            Utils.writeJSON(FXM_CONFIG.presetFolder + "/" + preset.id + ".json", preset);
            this.presets.push(preset);
            count++;
        }
        Logger.info("Created " + count + " test presets");
        return count;
    },
    getPresetByName: function(name) {
        for (var i = 0; i < this.presets.length; i++) {
            if (this.presets[i].name === name) return this.presets[i];
        }
        return null;
    }
};

// ==================== 白板管理器 ====================
var BoardManager = {
    boards: [],
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
                Logger.error("loadBoards", e);
            }
        }
    },
    getBoards: function() {
        return this.boards;
    },
    getBoardById: function(boardId) {
        for (var i = 0; i < this.boards.length; i++) {
            if (this.boards[i].id === boardId) return this.boards[i];
        }
        return null;
    },
    createBoard: function(name) {
        var board = {
            id: Utils.generateId(),
            name: name || "新白板",
            created: new Date().toISOString(),
            items: []
        };
        Utils.writeJSON(FXM_CONFIG.boardFolder + "/" + board.id + ".json", board);
        this.boards.push(board);
        return JSON.stringify({success: true, board: board});
    },
    deleteBoard: function(boardId) {
        for (var i = 0; i < this.boards.length; i++) {
            if (this.boards[i].id === boardId) {
                try {
                    var file = new File(FXM_CONFIG.boardFolder + "/" + boardId + ".json");
                    if (file.exists) file.remove();
                } catch(e) {}
                this.boards.splice(i, 1);
                return JSON.stringify({success: true});
            }
        }
        return JSON.stringify({error: "白板不存在"});
    },
    addPresetToBoard: function(boardId, presetId, color) {
        var board = this.getBoardById(boardId);
        if (!board) return JSON.stringify({error: "白板不存在"});
        var preset = PresetManager.getPresetById(presetId);
        if (!preset) return JSON.stringify({error: "预设不存在"});

        for (var i = 0; i < board.items.length; i++) {
            if (board.items[i].presetId === presetId) return JSON.stringify({error: "预设已在该白板中"});
        }

        var item = {
            presetId: presetId,
            added: new Date().toISOString(),
            color: color || null
        };
        board.items.push(item);
        this._saveBoard(board);
        return JSON.stringify({success: true, board: board});
    },
    removePresetFromBoard: function(boardId, presetId) {
        var board = this.getBoardById(boardId);
        if (!board) return JSON.stringify({error: "白板不存在"});
        for (var i = 0; i < board.items.length; i++) {
            if (board.items[i].presetId === presetId) {
                board.items.splice(i, 1);
                this._saveBoard(board);
                return JSON.stringify({success: true, board: board});
            }
        }
        return JSON.stringify({error: "预设不在该白板中"});
    },
    reorderBoardItem: function(boardId, oldIndex, newIndex) {
        var board = this.getBoardById(boardId);
        if (!board) return JSON.stringify({error: "白板不存在"});
        if (oldIndex < 0 || oldIndex >= board.items.length || newIndex < 0 || newIndex >= board.items.length) {
            return JSON.stringify({error: "索引越界"});
        }
        var item = board.items.splice(oldIndex, 1)[0];
        board.items.splice(newIndex, 0, item);
        this._saveBoard(board);
        return JSON.stringify({success: true, board: board});
    },
    _saveBoard: function(board) {
        Utils.writeJSON(FXM_CONFIG.boardFolder + "/" + board.id + ".json", board);
    }
};

// ==================== CEP 调度器 ====================
// 前端通过 csInterface.evalScript() 调用的所有函数都通过这里路由
function cepDispatch(cmd, param) {
    try {
        switch (cmd) {
            // 预设操作
            case "getPresets":
                return JSON.stringify(PresetManager.getPresets());
            case "getPresetById":
                return JSON.stringify(PresetManager.getPresetById(param));
            case "searchPresets":
                return JSON.stringify(PresetManager.searchPresets(param || ""));
            case "saveLayerAsPreset":
                var parts = param.split("|||");
                return PresetManager.saveLayerAsPreset(
                    parts[0] || "",
                    parts[1] || "未命名预设",
                    parts[2] || "",
                    parts[3] ? parts[3].split(",") : []
                );
            case "applyPreset":
                return PresetManager.applyPreset(param);
            case "deletePreset":
                return PresetManager.deletePreset(param);
            case "createTestPresets":
                return JSON.stringify({count: PresetManager.createTestPresets()});

            // 白板操作
            case "getBoards":
                return JSON.stringify(BoardManager.getBoards());
            case "createBoard":
                return BoardManager.createBoard(param || "新白板");
            case "deleteBoard":
                return BoardManager.deleteBoard(param);
            case "addPresetToBoard":
                var bp = param.split("|||");
                return BoardManager.addPresetToBoard(bp[0], bp[1], bp[2] || null);
            case "removePresetFromBoard":
                var rp = param.split("|||");
                return BoardManager.removePresetFromBoard(rp[0], rp[1]);
            case "reorderBoardItem":
                var rip = param.split("|||");
                return BoardManager.reorderBoardItem(rip[0], parseInt(rip[1]), parseInt(rip[2]));

            // 图层/合成信息
            case "getSelectedLayerInfo":
                return getSelectedLayerInfo();
            case "hasSelection":
                return JSON.stringify({hasSelection: checkSelection()});

            // 配置信息
            case "getConfig":
                return JSON.stringify(FXM_CONFIG);
            case "getVersion":
                return JSON.stringify({version: FXM_VERSION, name: FXM_NAME});

            // 日志
            case "getLog":
                return getLogContent();

            default:
                return JSON.stringify({error: "未知命令: " + cmd});
        }
    } catch(e) {
        Logger.error("cepDispatch(" + cmd + ")", e);
        return JSON.stringify({error: e.toString()});
    }
}

function checkSelection() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return false;
        return comp.selectedLayers.length > 0;
    } catch(e) { return false; }
}

function getSelectedLayerInfo() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) return JSON.stringify({error: "请先打开一个合成"});

        var layers = [];
        for (var i = 0; i < comp.selectedLayers.length; i++) {
            layers.push({
                name: comp.selectedLayers[i].name,
                index: comp.selectedLayers[i].index,
                effectCount: comp.selectedLayers[i].effect ? comp.selectedLayers[i].effect.numProperties : 0
            });
        }

        return JSON.stringify({
            compName: comp.name,
            layerCount: comp.selectedLayers.length,
            layers: layers,
            hasEffects: layers.length > 0 && layers[0].effectCount > 0
        });
    } catch(e) {
        return JSON.stringify({error: e.toString()});
    }
}

function getLogContent() {
    try {
        var file = new File(FXM_CONFIG.logFile);
        if (!file.exists) return JSON.stringify({content: ""});
        file.open('r');
        var content = file.read();
        file.close();
        return JSON.stringify({content: content});
    } catch(e) {
        return JSON.stringify({error: e.toString()});
    }
}

// ==================== 初始化 ====================
try {
    Logger.init();
    PresetManager.init();
    BoardManager.init();
    Logger.info("=== " + FXM_NAME + " CEP Extension v" + FXM_VERSION + " 启动 ===");
} catch(e) {
    Logger.error("host initialization", e);
}
