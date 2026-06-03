var steps = [];
var arrows = [];
var groups = [];
var frames = [];
var filePath = '';
var fileDirty = false;
var dragSrcIdx = -1;
var projectFolder = '';
var overviewMode = false;
var editLocked = false;
var csInterface = null;
try { csInterface = new CSInterface(); } catch(e) {}

// ─── i18n ──────────────────────────────────
var LANG_DATA = {
    zh: {
        noSteps: '暂无步骤', addFirst: '点击"+ Step"添加第一步',
        step: '步骤', titlePH: '步骤标题...', descPH: '描述此步骤...',
        presets: '待应用预设:', addPreset: '+ 添加 .ffx 预设',
        applyAll: '全部应用', addScreenshot: '+ 添加截图', removeImg: '移除截图',
        delStep: '删除步骤', newFlow: '新流程', open: '打开', save: '保存',
        addStep: '+ 步骤', import: '截图',
        folder: '文件夹', scan: '扫描 .ffx',
        saveHotkey: '保存快捷键', applyHotkey: '应用快捷键',
        edit: '编辑', overview: '总览',
        settings: '设置', lang: '语言', fontSize: '字号',
        ready: '就绪。设置项目文件夹，扫描 .ffx 即可静默应用。',
        sent: '已发送', saveAs: '另存为', confirmDel: '确定删除步骤',
        saved: '已保存', loaded: '已加载', newCreated: '已创建新流程',
        scanning: '正在扫描...', found: '发现', files: '个 .ffx 文件',
        noFolder: '请先设置项目文件夹', noFfx: '未找到 .ffx 文件',
        addToStep: '添加到第几步', invalidStep: '无效步骤号',
        addOk: '已添加到步骤', applied: '已应用！', failed: '失败：',
        exportOk: '已导出到：',
        arrowMode: '画箭头', exitArrow: '退出',
        arrowFrom: '箭头起点', arrowTo: '箭头终点', arrowDone: '箭头已添加',
        arrowHint: '点击蓝色圆点画箭头，点击已有箭头线可删除',
        recent: '最近流程', recentEmpty: '（暂无最近流程）',
    },
    en: {
        noSteps: 'No steps yet', addFirst: 'Click "+ Step" to start',
        step: 'Step', titlePH: 'Step title...', descPH: 'Describe this step...',
        presets: 'Presets:', addPreset: '+ Add .ffx preset',
        applyAll: 'Apply All', addScreenshot: '+ Screenshot', removeImg: 'Remove image',
        delStep: 'Delete step', newFlow: 'New', open: 'Open', save: 'Save',
        addStep: '+ Step', import: 'Image',
        folder: 'Folder', scan: 'Scan .ffx',
        saveHotkey: 'Save hotkey', applyHotkey: 'Apply hotkey',
        edit: 'Edit', overview: 'Overview',
        settings: 'Settings', lang: 'Language', fontSize: 'Font size',
        ready: 'Ready. Set a project folder, scan .ffx, and apply silently.',
        sent: 'Sent', saveAs: 'Save As', confirmDel: 'Delete step',
        saved: 'Saved', loaded: 'Loaded', newCreated: 'New flow created',
        scanning: 'Scanning...', found: 'Found', files: ' .ffx files',
        noFolder: 'Set a project folder first', noFfx: 'No .ffx files found',
        addToStep: 'Add to step #', invalidStep: 'Invalid step number',
        addOk: 'Added to Step', applied: 'Applied!', failed: 'Failed: ',
        exportOk: 'Exported to: ',
        arrowMode: 'Draw Arrow', exitArrow: 'Exit',
        arrowFrom: 'Arrow from', arrowTo: 'Arrow to', arrowDone: 'Arrow added',
        arrowHint: 'Click blue dot to draw, click arrow line to delete',
        recent: 'Recent', recentEmpty: '(no recent files)',
    }
};
var _lang = 'zh';
function T(k) { var o = LANG_DATA[_lang]; return (o && o[k]) ? o[k] : (LANG_DATA.en[k] || k); }

function applyFontSize(fs) {
    document.documentElement.style.fontSize = fs + 'px';
    var old = document.getElementById('wbFontStyle');
    if (old) old.remove();
    var s = document.createElement('style');
    s.id = 'wbFontStyle';
    s.textContent = '.panel, .panel * { font-size: ' + fs + 'px !important; }';
    document.head.appendChild(s);
}

function loadPrefs() {
    try {
        var s = localStorage.getItem('wb_prefs');
        if (s) { var o = JSON.parse(s);
            _lang = o.lang || 'zh';
            applyFontSize(o.fontSize || 13);
        }
    } catch(e) {}
}
function savePrefs() {
    try {
        localStorage.setItem('wb_prefs', JSON.stringify({
            lang: _lang,
            fontSize: parseInt(document.documentElement.style.fontSize) || 13
        }));
    } catch(e) {}
}

// ─── Session persistence (panel close/reopen) ──────────
function saveSession() {
    try {
        localStorage.setItem('wb_session', JSON.stringify({
            filePath: filePath || '',
            projectFolder: projectFolder || '',
            steps: steps,
            arrows: arrows
        }));
    } catch(e) {}
}

function loadSession() {
    try {
        var s = localStorage.getItem('wb_session');
        if (!s) return;
        var o = JSON.parse(s);
        if (o.steps && o.steps.length) {
            steps = o.steps;
            arrows = o.arrows || [];
            filePath = o.filePath || '';
            projectFolder = o.projectFolder || '';
            fileDirty = false;
            updateProjectFolderUI();
            render();
            if (filePath) setStatus('Restored: ' + filePath);
        }
    } catch(e) {}
}

var _autoSaveTimer = null;
function autoSave() {
    if (_autoSaveTimer) clearTimeout(_autoSaveTimer);
    _autoSaveTimer = setTimeout(saveSession, 500);
}

var cs = null;
try { cs = new CSInterface(); } catch(e) {}
function evalScript(code) {
    return new Promise(function(resolve) {
        if (!cs) { resolve(''); return; }
        cs.evalScript(code, function(r) { resolve(r); });
    });
}

function setStatus(msg, isErr) {
    var el = document.getElementById('statusText');
    if (!el) return;
    el.textContent = msg;
    el.className = isErr ? ' error' : ' success';
    if (!isErr) setTimeout(function() { if (el.textContent === msg) { el.textContent = ''; el.className = ''; } }, 6000);
}

// ─── Project Folder ────────────────────
function updateProjectFolderUI() {
    document.getElementById('projectFolderPath').textContent = projectFolder || '(' + T('folder') + ')';
    document.getElementById('projectFolderPath').title = projectFolder || '';
}

function browseProjectFolder() {
    evalScript('browseFolder()').then(function(r) {
        if (r && r !== 'CANCEL' && r.indexOf('ERR:') !== 0) {
            projectFolder = r.replace(/\\/g, '/');
            updateProjectFolderUI(); markDirty();
            setStatus(T('folder') + ': ' + projectFolder);
        }
    });
}

function scanProjectFolder() {
    if (!projectFolder) { setStatus(T('noFolder'), true); return; }
    setStatus(T('scanning')); document.getElementById('statusBar').textContent = T('scanning');
    evalScript('scanFFX(' + JSON.stringify(projectFolder) + ')').then(function(r) {
        if (!r || r.indexOf('ERR:') === 0) { setStatus(T('noFfx'), true); return; }
        var files = r.split('\n').filter(function(s){return s.trim();});
        setStatus(T('found') + ' ' + files.length + T('files'));
        showScanResults(files);
    });
}

function showScanResults(files) {
    var el = document.getElementById('ffxScanResults');
    if (el) el.remove();
    var c = document.createElement('div'); c.id = 'ffxScanResults';
    c.style.cssText = 'flex-shrink:0;background:#1a1a1a;border-top:1px solid #333;padding:6px 10px;max-height:150px;overflow-y:auto;';
    var t = document.createElement('div');
    t.style.cssText = 'font-size:11px;color:#888;margin-bottom:4px;';
    t.textContent = '.ffx (' + files.length + '):'; c.appendChild(t);
    files.forEach(function(f) {
        var r = document.createElement('div');
        r.style.cssText = 'display:flex;align-items:center;gap:4px;padding:2px 0;';
        var b = document.createElement('button'); b.textContent = '+';
        b.style.cssText = 'padding:1px 6px;background:#2a3a2a;border:1px solid #3a5a3a;color:#8c8;border-radius:2px;cursor:pointer;font-size:11px;';
        b.addEventListener('click', function() {
            var si = prompt(T('addToStep') + '(1-' + steps.length + '):', '1');
            if (!si) return; var idx = parseInt(si)-1;
            if (isNaN(idx)||idx<0||idx>=steps.length) { setStatus(T('invalidStep'),true); return; }
            var n = f.replace(/\.ffx$/i,'').split('\\').pop().split('/').pop();
            addPresetWithPath(idx, n, f);
            setStatus(T('addOk') + ' ' + (idx+1));
        }); r.appendChild(b);
        var l = document.createElement('span');
        l.style.cssText = 'font-size:11px;color:#aaa;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        l.textContent = f.replace(projectFolder+'\\','').replace(projectFolder+'/','');
        l.title = f; r.appendChild(l);
        c.appendChild(r);
    });
    document.getElementById('canvas').parentNode.insertBefore(c, document.getElementById('hotkeyBar'));
}

// ─── Hotkeys ───────────────────────────
function loadHotkeys() {
    try {
        var s = localStorage.getItem('wb_hotkeys');
        if (s) { var o = JSON.parse(s);
            document.getElementById('hkSave').value = o.save || '^+s';
            document.getElementById('hkApply').value = o.apply || '^+o';
        }
    } catch(e) {}
}

function saveHotkeys() {
    try {
        localStorage.setItem('wb_hotkeys', JSON.stringify({
            save: document.getElementById('hkSave').value,
            apply: document.getElementById('hkApply').value
        }));
    } catch(e) {}
}

function execAESave() {
    evalScript('execSave()').then(function(r) {
        setStatus(T('save') + ': ' + (r === 'OK' ? T('sent') : r));
    });
}

function execAEApply() {
    evalScript('execApply()').then(function(r) {
        setStatus(T('applyAll') + ': ' + (r === 'OK' ? T('sent') : r));
    });
}

// ─── Render ────────────────────────────
