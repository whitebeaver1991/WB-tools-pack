var steps = [];
var arrows = [];
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
function render() {
    var canvas = document.getElementById('canvas');
    canvas.innerHTML = '';

    if (!steps.length) {
        var h = document.createElement('div');
        h.className = 'canvas-empty';
        h.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#555;font-size:14px;';
        h.innerHTML = '<p>' + T('noSteps') + '</p><p class="sub" style="font-size:12px;color:#444;">' + T('addFirst') + '</p>';
        canvas.appendChild(h);
        updateFileName(); updateUIStrings(); return;
    }

    if (overviewMode) {
        renderOverview(canvas);
        updateFileName(); updateUIStrings(); return;
    }

    canvas.style.cursor = '';
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseleave = null;

    steps.forEach(function(s, idx) {
        var card = el('div','step-card','',[]);
        card.dataset.index = idx;

        var hdr = el('div','step-header');
        hdr.appendChild(el('span','step-handle','\u2261'));
        hdr.appendChild(el('span','step-num',T('step')+' '+(idx+1)+(s.title?': '+s.title:'')));

        var inp = document.createElement('input');
        inp.className = 'step-title'; inp.type = 'text';
        inp.value = s.title||''; inp.placeholder = T('titlePH');
        inp.addEventListener('input',function(){s.title=this.value;markDirty();});
        hdr.appendChild(inp);

        hdr.appendChild(el('span','','',[{n:'flex',v:'1'}]));

        var db = document.createElement('button');
        db.className = 'btn-del-step'; db.innerHTML = '&times;'; db.title = T('delStep');
        db.addEventListener('click',function(){if(confirm(T('confirmDel')+' '+(idx+1)+'?')){steps.splice(idx,1);render();markDirty();}});
        hdr.appendChild(db);
        card.appendChild(hdr);

        // Screenshot
        if (s.image) {
            var iw = el('div','step-img-wrap');
            var im = document.createElement('img'); im.src = s.image;
            im.addEventListener('error',function(){this.style.display='none';});
            iw.appendChild(im);
            var ov = el('div','img-overlay',T('addScreenshot'));
            iw.appendChild(ov);
            iw.addEventListener('click',function(){importImage(idx);});
            card.appendChild(iw);
            var rb = cr('button','btn-add-preset',T('removeImg'));
            rb.style.marginBottom='6px';
            rb.addEventListener('click',function(){s.image='';render();markDirty();});
            card.appendChild(rb);
        } else {
            var ab = cr('button','btn-add-preset',T('addScreenshot'));
            ab.style.marginBottom='8px'; ab.style.display='block';
            ab.addEventListener('click',function(){importImage(idx);});
            card.appendChild(ab);
        }

        // Desc
        var ta = document.createElement('textarea');
        ta.className = 'step-desc'; ta.value = s.desc||''; ta.placeholder = T('descPH');
        ta.addEventListener('input',function(){s.desc=this.value;markDirty();});
        card.appendChild(ta);

        // Presets
        var ps = el('div','preset-section');
        ps.appendChild(el('label','',T('presets')));

        var lst = el('div','preset-list');
        (s.presets||[]).forEach(function(p,pi){
            var b = cr('button','preset-btn','');
            b.innerHTML = '<span>'+p.name+'</span><span class="del-preset" data-si="'+idx+'" data-pi="'+pi+'">&times;</span>';
            b.addEventListener('click',function(e){
                if (e.target.classList.contains('del-preset')) {
                    steps[idx].presets.splice(parseInt(e.target.dataset.pi),1);
                    render(); markDirty(); return;
                }
                if (p.path) applyPreset(p.path);
                else setStatus('No path',true);
            });
            lst.appendChild(b);
        });
        ps.appendChild(lst);

        var adb = cr('button','btn-add-preset',T('addPreset'));
        adb.addEventListener('click',function(){addPreset(idx);});
        ps.appendChild(adb);

        var aab = cr('button','btn-add-preset',T('applyAll'));
        aab.style.borderColor='#5a5a7a'; aab.style.color='#88c';
        aab.addEventListener('click',function(){applyAllPresets(idx);});
        ps.appendChild(aab);

        card.appendChild(ps);

        // ── Custom drag via ≡ handle ──
        (function(cardEl, idx){
            var handle = cardEl.querySelector('.step-handle');
            handle.style.cursor = 'grab';
            handle._dragActive = false;
            handle.addEventListener('mousedown', function(ev) {
                ev.preventDefault();
                handle._dragActive = true;
                var startY = ev.clientY;
                var canvas = document.getElementById('canvas');
                var cards = document.querySelectorAll('.step-card');
                var rects = [];
                for (var ci = 0; ci < cards.length; ci++) {
                    rects.push({ el: cards[ci], rect: cards[ci].getBoundingClientRect() });
                }
                var ghost = document.createElement('div');
                ghost.style.cssText = 'position:absolute;left:14px;right:14px;height:3px;background:#5a9bf5;border-radius:2px;z-index:99;pointer-events:none;opacity:0;';
                canvas.appendChild(ghost);

                function onMove(ev2) {
                    var dy = Math.abs(ev2.clientY - startY);
                    if (dy < 5) { ghost.style.opacity = '0'; return; }
                    ghost.style.opacity = '1';
                    var dropIdx = rects.length; // default: insert after last
                    for (var ci2 = 0; ci2 < rects.length; ci2++) {
                        if (ev2.clientY < rects[ci2].rect.top + rects[ci2].rect.height / 2) {
                            dropIdx = ci2;
                            break;
                        }
                    }
                    if (dropIdx >= rects.length) {
                        ghost.style.top = (rects[rects.length-1].rect.bottom - canvas.getBoundingClientRect().top) + 'px';
                    } else {
                        ghost.style.top = (rects[dropIdx].rect.top - canvas.getBoundingClientRect().top) + 'px';
                    }
                }
                function onUp(ev2) {
                    ghost.remove();
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    handle._dragActive = false;
                    var dy = Math.abs(ev2.clientY - startY);
                    if (dy < 5) return;
                    var dropIdx = rects.length;
                    for (var ci3 = 0; ci3 < rects.length; ci3++) {
                        if (ev2.clientY < rects[ci3].rect.top + rects[ci3].rect.height / 2) {
                            dropIdx = ci3;
                            break;
                        }
                    }
                    if (dropIdx !== idx && dropIdx >= 0) {
                        var it = steps.splice(idx, 1)[0];
                        var target = (dropIdx > idx) ? dropIdx - 1 : dropIdx;
                        if (target < 0) target = 0;
                        if (target > steps.length) target = steps.length;
                        steps.splice(target, 0, it);
                        render(); markDirty();
                    }
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });
        })(card, idx);

        canvas.appendChild(card);
    });
    updateFileName(); updateUIStrings();
    if (!overviewMode) applyEditLock();
}

function renderOverview(canvas) {
    canvas.innerHTML = '';
    canvas.style.cssText = 'padding:0;overflow:hidden;cursor:default;position:relative;background:#161616;';

    var zoom = 1.0;
    var panX = 0, panY = 0;
    var contentW = 0, contentH = 0;
    var arrowModeActive = false;
    var CARD_W = 220;

    var inner = document.createElement('div');
    inner.id = 'ov-inner';
    inner.style.cssText = 'position:absolute;top:50%;left:50%;transform-origin:center center;';
    canvas.appendChild(inner);

    var svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.id = 'ov-svg-layer';
    svgLayer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;z-index:2;';
    // Transparent rect to catch events on empty SVG area → route to canvas
    var svgBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    svgBg.setAttribute('width', '100%'); svgBg.setAttribute('height', '100%');
    svgBg.setAttribute('fill', 'transparent');
    svgBg.style.pointerEvents = 'none';
    svgLayer.appendChild(svgBg);
    canvas.insertBefore(svgLayer, inner);

    var zc = document.createElement('div');
    zc.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:10;display:flex;gap:4px;';
    var zOut = el('button','','-',[{n:'background',v:'#2a2a2a'},{n:'border',v:'1px solid #444'},{n:'color',v:'#ccc'},{n:'border-radius',v:'3px'},{n:'cursor',v:'pointer'},{n:'font-size',v:'14px'},{n:'width',v:'24px'},{n:'height',v:'22px'},{n:'line-height',v:'14px'}]);
    var zLbl = el('span','','100%',[{n:'color',v:'#888'},{n:'font-size',v:'11px'},{n:'padding',v:'2px 6px'},{n:'min-width',v:'36px'},{n:'text-align',v:'center'}]);
    var zIn = el('button','','+',[{n:'background',v:'#2a2a2a'},{n:'border',v:'1px solid #444'},{n:'color',v:'#ccc'},{n:'border-radius',v:'3px'},{n:'cursor',v:'pointer'},{n:'font-size',v:'14px'},{n:'width',v:'24px'},{n:'height',v:'22px'},{n:'line-height',v:'14px'}]);
    zc.appendChild(zOut); zc.appendChild(zLbl); zc.appendChild(zIn);
    canvas.appendChild(zc);

    var arrowBtn = document.createElement('button');
    arrowBtn.textContent = T('arrowMode');
    arrowBtn.id = 'ov-arrow-btn';
    arrowBtn.style.cssText = 'position:absolute;bottom:8px;left:8px;z-index:10;padding:4px 10px;background:#2a2a3a;border:1px solid #3a3a5a;color:#88c;border-radius:3px;cursor:pointer;font-size:11px;';
    canvas.appendChild(arrowBtn);

    // ─── Arrow anchor system ──────────────
    var ANCHOR_SIDES = ['r','b','l','t'];
    var ARROW_SVG = null;
    var ARROW_DRAW = null;

    // Compute card anchor screen positions
    function getAnchors(card) {
        var r = card.getBoundingClientRect();
        return {
            r: { x: r.right, y: r.top + r.height/2 },
            l: { x: r.left,  y: r.top + r.height/2 },
            t: { x: r.left + r.width/2, y: r.top },
            b: { x: r.left + r.width/2, y: r.bottom }
        };
    }

    function showAnchors(show) {
        viewport.querySelectorAll('.ov-anchor').forEach(function(a){a.remove();});
        if (!show || !arrowModeActive) return;
        cards.forEach(function(c,i){
            var r = c.getBoundingClientRect();
            var vr = viewport.getBoundingClientRect();
            var anchors = getAnchors(c);
            ANCHOR_SIDES.forEach(function(side){
                var a = document.createElement('div');
                a.className = 'ov-anchor';
                a.dataset.cardIdx = i;
                a.dataset.side = side;
                a.style.cssText = 'position:absolute;width:10px;height:10px;background:#5a9bf5;border:2px solid #fff;border-radius:50%;z-index:5;cursor:crosshair;transform:translate(-50%,-50%);transition:transform 0.15s,background 0.15s;';
                var ap = anchors[side];
                a.style.left = ((ap.x - vr.left) / zoom) + 'px';
                a.style.top = ((ap.y - vr.top) / zoom) + 'px';
                a.addEventListener('mouseenter',function(){this.style.transform='translate(-50%,-50%) scale(1.4)';this.style.background='#7ab8ff';});
                a.addEventListener('mouseleave',function(){this.style.transform='translate(-50%,-50%)';this.style.background='#5a9bf5';});
                viewport.appendChild(a);
            });
        });
    }

    function arrowBtnClick() {
        arrowModeActive = !arrowModeActive;
        if (ARROW_SVG) { ARROW_SVG.remove(); ARROW_SVG = null; }
        updateArrowButton();
        showAnchors(arrowModeActive);
        setStatus(arrowModeActive ? T('arrowMode') + ': ' + T('arrowHint') : '');
        if (!arrowModeActive) redrawArrows();
    }

    arrowBtn.addEventListener('click', arrowBtnClick);

    function updateArrowButton() {
        arrowBtn.textContent = arrowModeActive ? T('exitArrow') : T('arrowMode');
        arrowBtn.style.background = arrowModeActive ? '#3a2a2a' : '#2a2a3a';
        arrowBtn.style.borderColor = arrowModeActive ? '#5a3a3a' : '#3a3a5a';
        arrowBtn.style.color = arrowModeActive ? '#c88' : '#88c';
        canvas.style.cursor = arrowModeActive ? 'crosshair' : 'grab';
        viewport.querySelectorAll('.overview-card').forEach(function(c){c.style.outline='';});
    }

    // ─── Redraw stored arrows (SVG from canvas level) ──
    function redrawArrows() {
        while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);
        if (ARROW_SVG) svgLayer.appendChild(ARROW_SVG);
        arrows.forEach(function(a, ai) {
            if (a.from >= cards.length || a.to >= cards.length) return;
            var c1 = cards[a.from], c2 = cards[a.to];
            if (!c1 || !c2) return;
            var ac1 = getAnchors(c1);
            var ac2 = getAnchors(c2);
            var cl = svgLayer.getBoundingClientRect();
            var p1 = ac1[a.fromSide || 'r'];
            var p2 = ac2[a.toSide || 'l'];
            var x1 = p1.x - cl.left, y1 = p1.y - cl.top;
            var x2 = p2.x - cl.left, y2 = p2.y - cl.top;
            var dx = Math.abs(x2 - x1);
            var cx = (x1 + x2) / 2;
            var d = 'M' + x1 + ',' + y1 + ' C' + cx + ',' + y1 + ' ' + cx + ',' + y2 + ' ' + x2 + ',' + y2;
            var path = document.createElementNS('http://www.w3.org/2000/svg','path');
            path.setAttribute('d',d); path.setAttribute('stroke','#5a9bf5');
            path.setAttribute('stroke-width','3'); path.setAttribute('fill','none');
            path.style.pointerEvents = 'all';
            path.classList.add('ov-arrow-path');
            path.style.cursor = 'pointer';
            path.dataset.aidx = ai;
            svgLayer.appendChild(path);
            var poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');
            var angle = Math.atan2(y2-y1,x2-x1)*180/Math.PI;
            poly.setAttribute('points','0,-5 9,0 0,5'); poly.setAttribute('fill','#5a9bf5');
            poly.setAttribute('transform','translate('+x2+','+y2+') rotate('+angle+')');
            svgLayer.appendChild(poly);
        });
    }

    function updateZoomLabel() { zLbl.textContent = Math.round(zoom * 100) + '%'; }
    function applyTransform() { inner.style.transform = 'translate(calc(-50% + ' + panX + 'px), calc(-50% + ' + panY + 'px)) scale(' + zoom + ')'; }
    function clampPan() { var m = Math.max(contentW, contentH || 400) * 2; panX = Math.max(-m, Math.min(m, panX || 0)); panY = Math.max(-m, Math.min(m, panY || 0)); }

    var viewport = document.createElement('div');
    viewport.id = 'ov-viewport';
    viewport.style.cssText = 'position:relative;overflow:visible;';
    inner.appendChild(viewport);

    // Auto-layout positions (only for cards without custom vx/vy)
    var autoX = 0, autoY = 0;
    function nextAutoPos() {
        var p = { x: autoX, y: autoY };
        autoX += CARD_W + 24;
        if (autoX > 1200) { autoX = 0; autoY += 260; }
        return p;
    }

    var cards = [];
    steps.forEach(function(s, idx) {
        var hasPos = (s.vx !== undefined && s.vy !== undefined && !isNaN(s.vx));
        var pos = hasPos ? { x: s.vx, y: s.vy } : nextAutoPos();
        if (!hasPos) { s.vx = pos.x; s.vy = pos.y; }

        var card = document.createElement('div');
        card.className = 'overview-card';
        card.style.cssText = 'position:absolute;left:0;top:0;width:'+CARD_W+'px;background:#222;border:1px solid #383838;border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:transform 0.2s ease, opacity 0.2s ease, box-shadow 0.15s ease;';
        card.style.transform = 'translate(' + pos.x + 'px, ' + pos.y + 'px)';
        card.dataset.index = idx;

        card.appendChild(el('div','',(s.title||T('step')+' '+(idx+1)),[{n:'font-size',v:'13px'},{n:'font-weight',v:'600'},{n:'color',v:'#ddd'},{n:'margin-bottom',v:'4px'},{n:'overflow',v:'hidden'},{n:'text-overflow',v:'ellipsis'},{n:'white-space',v:'nowrap'}]));
        if (s.desc) card.appendChild(el('div','',s.desc,[{n:'font-size',v:'11px'},{n:'color',v:'#777'},{n:'margin-bottom',v:'6px'},{n:'overflow',v:'hidden'},{n:'text-overflow',v:'ellipsis'},{n:'white-space',v:'nowrap'}]));
        if (s.image) {
            var im = document.createElement('img'); im.src = s.image;
            im.style.cssText = 'width:100%;height:80px;object-fit:cover;border-radius:4px;margin-bottom:6px;background:#111;cursor:pointer;';
            im.addEventListener('click',function(e){e.stopPropagation();
                var ov = document.createElement('div'); ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:pointer;';
                var bi = document.createElement('img'); bi.src = s.image; bi.style.cssText='max-width:90%;max-height:90%;border-radius:8px;box-shadow:0 4px 30px rgba(0,0,0,0.5);';
                ov.appendChild(bi); ov.addEventListener('click',function(){ov.remove();}); document.body.appendChild(ov);
            });
            card.appendChild(im);
        }
        if (s.presets && s.presets.length) {
            card.appendChild(el('div','',s.presets.map(function(p){return p.name;}).join(', '),[{n:'font-size',v:'10px'},{n:'color',v:'#6a6'},{n:'overflow',v:'hidden'},{n:'text-overflow',v:'ellipsis'},{n:'white-space',v:'nowrap'}]));
            var ab = document.createElement('button'); ab.textContent = T('applyAll');
            ab.style.cssText = 'width:100%;padding:4px 8px;margin-top:6px;background:#2a3a5a;border:1px solid #3a5a7a;color:#88c;border-radius:4px;cursor:pointer;';
            ab.addEventListener('click',function(e){e.stopPropagation();applyAllPresets(idx);});
            card.appendChild(ab);
        }
        cards.push(card);
        viewport.appendChild(card);
    });

    // Compute viewport size
    function updateViewportSize() {
        var maxX = 800, maxY = 400;
        cards.forEach(function(c,i){
            var p = steps[i];
            if (p.vx + CARD_W + 100 > maxX) maxX = p.vx + CARD_W + 100;
            if (p.vy + 300 > maxY) maxY = p.vy + 300;
        });
        viewport.style.width = maxX + 'px';
        viewport.style.height = maxY + 'px';
    }
    updateViewportSize();

    requestAnimationFrame(function() {
        var vr=viewport.getBoundingClientRect(); contentW=Math.max(vr.width,600); contentH=Math.max(vr.height,400); clampPan(); applyTransform(); redrawArrows();
    });

    function onZoom(){clampPan();applyTransform();updateZoomLabel();redrawArrows();if(arrowModeActive)showAnchors(true);}
    zOut.addEventListener('click',function(){zoom=Math.max(0.3,zoom-0.1);onZoom();});
    zIn.addEventListener('click',function(){zoom=Math.min(3,zoom+0.1);onZoom();});
    canvas.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.max(0.3,Math.min(3,zoom-e.deltaY*0.002));onZoom();},{passive:false});

    var panState=null, longPressTimer=null, dragState=null;

    function screenToLocalX(clientX) { var ir=inner.getBoundingClientRect(); return (clientX - ir.left) / zoom; }
    function screenToLocalY(clientY) { var ir=inner.getBoundingClientRect(); return (clientY - ir.top) / zoom; }

    canvas.onmousedown=function(e){
        if(dragState)return;

        // Arrow path click (SVG path)
        if (e.target.classList && e.target.classList.contains('ov-arrow-path') && arrowModeActive) {
            var aidx = parseInt(e.target.dataset.aidx);
            if (!isNaN(aidx) && aidx >= 0 && aidx < arrows.length) {
                arrows.splice(aidx, 1);
                markDirty();
                redrawArrows();
                setStatus('Arrow deleted');
                return;
            }
        }

        if(e.button===1){panState={startX:e.clientX,startY:e.clientY,pX:panX,pY:panY};canvas.style.cursor='grabbing';return;}

        // Arrow mode: anchor click
        if(arrowModeActive){
            var anchor = e.target.closest ? e.target.closest('.ov-anchor') : null;
            if (anchor) {
                var ci = parseInt(anchor.dataset.cardIdx);
                var side = anchor.dataset.side;
                ARROW_DRAW = { fromIdx: ci, fromSide: side };
                var cl = svgLayer.getBoundingClientRect();
                ARROW_SVG = document.createElementNS('http://www.w3.org/2000/svg','path');
                ARROW_SVG.setAttribute('stroke','#7ab8ff');
                ARROW_SVG.setAttribute('stroke-width','2');
                ARROW_SVG.setAttribute('fill','none');
                ARROW_SVG.setAttribute('stroke-dasharray','5,3');
                svgLayer.appendChild(ARROW_SVG);
                setStatus('Drag to another anchor point...');
                return;
            }
            return;
        }

        var t=e.target,onCard=t.closest?t.closest('.overview-card'):null;
        if(onCard){
            var ci=parseInt(onCard.dataset.index);
            longPressTimer=setTimeout(function(){
                longPressTimer=null;
                var lx=screenToLocalX(e.clientX);
                var ly=screenToLocalY(e.clientY);
                onCard.style.zIndex='100';
                onCard.style.pointerEvents='none';
                onCard.style.opacity='0.85';
                onCard.style.transition='none';
                onCard.style.transform='translate('+(lx-CARD_W/2)+'px,'+(ly-20)+'px) rotate(1deg)';

                var dragUp = function(ev2){
                    document.removeEventListener('mouseup', dragUp);
                    document.removeEventListener('mousemove', dragMove);
                    if (!dragState) return;
                    var ds = dragState; dragState = null;

                    // Lock transition off, change transform, then restore
                    ds.card.style.transition='none';
                    ds.card.style.transform='translate('+(screenToLocalX(ev2.clientX)-CARD_W/2)+'px,'+(screenToLocalY(ev2.clientY)-20)+'px)';
                    void ds.card.offsetHeight;
                    ds.card.style.transition='transform 0.2s ease, opacity 0.2s ease, box-shadow 0.15s ease';
                    ds.card.style.zIndex='';
                    ds.card.style.pointerEvents='';
                    ds.card.style.opacity='';

                    var fx = screenToLocalX(ev2.clientX) - CARD_W/2;
                    var fy = screenToLocalY(ev2.clientY) - 20;
                    steps[ds.idx].vx = Math.round(fx);
                    steps[ds.idx].vy = Math.round(fy);

                    updateViewportSize();
                    contentW = Math.max(viewport.offsetWidth, 600);
                    contentH = Math.max(viewport.offsetHeight, 400);
                    clampPan(); applyTransform();
                    redrawArrows();
                    markDirty();
                    panState=null;canvas.style.cursor='';
                };
                var dragMove = function(ev2){
                    var lx2=screenToLocalX(ev2.clientX);
                    var ly2=screenToLocalY(ev2.clientY);
                    onCard.style.transform='translate('+(lx2-CARD_W/2)+'px,'+(ly2-20)+'px) rotate(1deg)';
                };
                dragState={idx:ci,card:onCard};
                document.addEventListener('mouseup', dragUp);
                document.addEventListener('mousemove', dragMove);
            },300);
            panState={startX:e.clientX,startY:e.clientY,pX:panX,pY:panY,mode:'click'};
        } else {panState={startX:e.clientX,startY:e.clientY,pX:panX,pY:panY,mode:'pan'};canvas.style.cursor='grabbing';}
    };

    canvas.onmousemove=function(e){
        if(dragState){
            // Handled by document mousemove
            return;
        }

        // Arrow drawing: update temp line
        if (ARROW_DRAW && ARROW_SVG) {
            var cl = svgLayer.getBoundingClientRect();
            var x1 = ARROW_DRAW.startScreenX !== undefined ? ARROW_DRAW.startScreenX : 0;
            var y1 = ARROW_DRAW.startScreenY !== undefined ? ARROW_DRAW.startScreenY : 0;
            if (ARROW_DRAW.startScreenX === undefined) {
                var srcCard = cards[ARROW_DRAW.fromIdx];
                if (srcCard) {
                    var ac = getAnchors(srcCard);
                    var ap = ac[ARROW_DRAW.fromSide];
                    ARROW_DRAW.startScreenX = ap.x;
                    ARROW_DRAW.startScreenY = ap.y;
                    x1 = ap.x; y1 = ap.y;
                }
            }
            var lx = screenToLocalX(e.clientX);
            var ly = screenToLocalY(e.clientY);
            var x2 = e.clientX, y2 = e.clientY;

            var nearestDist = 999, nearestAnchor = -1, nearestSide = '';
            viewport.querySelectorAll('.ov-anchor').forEach(function(an){
                if (an.dataset.cardIdx == ARROW_DRAW.fromIdx && an.dataset.side == ARROW_DRAW.fromSide) return;
                var ar = an.getBoundingClientRect();
                var ax = ar.left + ar.width/2, ay = ar.top + ar.height/2;
                var d = Math.sqrt((ax-e.clientX)*(ax-e.clientX)+(ay-e.clientY)*(ay-e.clientY));
                if (d < nearestDist) { nearestDist = d; nearestAnchor = parseInt(an.dataset.cardIdx); nearestSide = an.dataset.side; }
            });
            ARROW_DRAW._nearAnchor = (nearestDist < 25) ? { idx: nearestAnchor, side: nearestSide } : null;

            var cx = (x1 + x2) / 2;
            var d = 'M' + (x1-cl.left) + ',' + (y1-cl.top) + ' C' + (cx-cl.left) + ',' + (y1-cl.top) + ' ' + (cx-cl.left) + ',' + (y2-cl.top) + ' ' + (x2-cl.left) + ',' + (y2-cl.top);
            ARROW_SVG.setAttribute('d', d);
            ARROW_SVG.setAttribute('stroke', ARROW_DRAW._nearAnchor ? '#5aff5a' : '#7ab8ff');
            return;
        }

        if(panState){
            var dx=e.clientX-panState.startX,dy=e.clientY-panState.startY;
            if(Math.abs(dx)>5||Math.abs(dy)>5){
                panState.mode='pan';canvas.style.cursor='grabbing';panX=panState.pX+dx;panY=panState.pY+dy;clampPan();applyTransform();redrawArrows();
                if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
            }
        }
    };

    canvas.onmouseup=function(e){
        if(e.button===1&&panState){canvas.style.cursor='';panState=null;return;}
        if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}

        if (ARROW_DRAW) {
            if (ARROW_DRAW._nearAnchor) {
                arrows.push({
                    from: ARROW_DRAW.fromIdx,
                    fromSide: ARROW_DRAW.fromSide,
                    to: ARROW_DRAW._nearAnchor.idx,
                    toSide: ARROW_DRAW._nearAnchor.side
                });
                markDirty();
                setStatus(T('arrowDone'));
            } else {
                setStatus('Arrow cancelled');
            }
            if (ARROW_SVG) { ARROW_SVG.remove(); ARROW_SVG = null; }
            ARROW_DRAW = null;
            redrawArrows();
            showAnchors(true);
            return;
        }

        if(dragState){
            // Handled by document mouseup listener (dragUp)
            return;
        }
        if(panState){canvas.style.cursor='';panState=null;}
    };

    canvas.onmouseleave=function(){
        if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
        if (ARROW_DRAW) {
            if (ARROW_SVG) { ARROW_SVG.remove(); ARROW_SVG = null; }
            ARROW_DRAW = null; redrawArrows(); showAnchors(true);
        }
        if(dragState){
            // Handled by document mouseup listener
            return;
        }
        if(panState){canvas.style.cursor='';panState=null;}
    };

    applyTransform();updateZoomLabel();updateUIStrings();
}

function el(tag,cls,text,styles) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    if (styles) styles.forEach(function(s){e.style[s.n]=s.v;});
    return e;
}
function cr(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;}

function updateUIStrings() {
    document.getElementById('btnNew').textContent = T('newFlow');
    document.getElementById('btnOpen').textContent = T('open');
    document.getElementById('btnSave').textContent = T('save');
    document.getElementById('btnAddStep').textContent = T('addStep');
    document.getElementById('btnImportImg').textContent = T('import');
    document.getElementById('btnBrowseFolder').textContent = T('folder');
    document.getElementById('btnScanFFX').textContent = T('scan');
    document.getElementById('btnSendSave').textContent = T('saveHotkey');
    document.getElementById('btnSendApply').textContent = T('applyHotkey');
    document.getElementById('btnToggleView').textContent = overviewMode ? T('edit') : T('overview');
    var btnRecent = document.getElementById('btnRecent');
    if (btnRecent) btnRecent.textContent = '\u25BC ' + T('recent');
}

// ─── Image ─────────────────────────────
function importImage(idx) {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/png,image/jpeg,image/bmp';
    inp.addEventListener('change',function(){
        if(!inp.files||!inp.files[0])return;
        var r=new FileReader();r.onload=function(e){steps[idx].image=e.target.result;render();markDirty();};
        r.readAsDataURL(inp.files[0]);
    });
    inp.click();
}

// ─── Presets ───────────────────────────
function addPreset(idx) {
    var n = prompt(T('addPreset')+':',(steps[idx].presets||[]).length+1);
    if (!n) return;
    evalScript('pickFFXFile()').then(function(r) {
        if (!r || r === 'CANCEL') return;
        addPresetWithPath(idx, n, r);
    });
}
function addPresetWithPath(idx,name,path) {
    if (!steps[idx].presets) steps[idx].presets=[];
    steps[idx].presets.push({name:name,path:path,effects:[]});
    render(); markDirty();
    setStatus(T('addOk')+' '+(idx+1)+': '+name);
}

function applyPreset(p) {
    evalScript('applyFFX('+JSON.stringify(p)+')').then(function(r){
        setStatus(r==='OK'?T('applied'):T('failed')+r, r!=='OK');
    });
}
function applyAllPresets(idx) {
    var pr = steps[idx].presets;
    if (!pr||!pr.length){setStatus(T('presets')+' empty',true);return;}
    var c=Promise.resolve();
    pr.forEach(function(p,i){
        c=c.then(function(){return new Promise(function(r){
            if(p.path) evalScript('applyFFX('+JSON.stringify(p.path)+')').then(function(x){
                if(x!=='OK') setStatus(T('failed')+(i+1)+': '+x,true); r();
            }); else r();
        });});
    });
    c.then(function(){setStatus(T('applied'));});
}

// ─── Steps ─────────────────────────────
function addStep() {
    steps.push({title:'',image:'',desc:'',presets:[],vx:0,vy:0});
    render(); markDirty();
    document.getElementById('canvas').scrollTop=document.getElementById('canvas').scrollHeight;
}

// ─── Generate ──────────────────────────
var FALLBACK_EFFECTS = [
  {name:'Curves',match:'ADBE Curves Custom'},{name:'Glow',match:'ADBE Glow2'},
  {name:'Drop Shadow',match:'ADBE Drop Shadow'},{name:'Levels',match:'ADBE Levels'},
  {name:'Hue/Saturation',match:'ADBE Hue Saturation'},{name:'Gaussian Blur',match:'ADBE Gaussian Blur'},
  {name:'Directional Blur',match:'ADBE Directional Blur'},{name:'Radial Blur',match:'ADBE Radial Blur'},
  {name:'Fractal Noise',match:'ADBE Fractal Noise'},{name:'Lumetri Color',match:'ADBE Lumetri Color'},
  {name:'Colorama',match:'ADBE Colorama'},{name:'Tritone',match:'ADBE Tritone'},
  {name:'CC Glass',match:'ADBE CC Glass'},{name:'CC Light Burst 2.5',match:'ADBE CC Light Burst 2.5'},
  {name:'CC Page Turn',match:'ADBE CC Page Turn'},{name:'CC Particle World',match:'ADBE CC Particle World'},
  {name:'CC Lens',match:'ADBE CC Lens'},{name:'CC Radial Blur',match:'ADBE CC Radial Blur'},
  {name:'CC Mr. Mercury',match:'ADBE CC Mr. Mercury'},{name:'CC Snowfall',match:'ADBE CC Snowfall'},
  {name:'CC Rainfall',match:'ADBE CC Rainfall'},{name:'S_Glow',match:'Sapphire Glow'},
  {name:'S_Shake',match:'Sapphire Shake'},{name:'S_WarpBubble',match:'Sapphire WarpBubble'},
  {name:'S_LensFlare',match:'Sapphire LensFlare'},{name:'S_Rays',match:'Sapphire Rays'},
  {name:'S_Glint',match:'Sapphire Glint'},{name:'S_HeatDisplacement',match:'Sapphire HeatDisplacement'},
  {name:'S_KnollLight',match:'Sapphire KnollLight'},{name:'Twixtor',match:'RE:Vision RE:Flex'},
  {name:'Magic Bullet Looks',match:'Looks'},{name:'Deep Glow',match:'PEDG2'},
  {name:'Displacer Pro',match:'PEDX'},{name:'loopFlow',match:'irrealix loopFlow'},
  {name:'Optical Flares',match:'VIDEOCOPILOT Optical Flares'},
  {name:'Saber',match:'VIDEOCOPILOT Saber'},{name:'Twitch',match:'VIDEOCOPILOT Twitch'},
].concat();
function generateFlowFromEffects() {
    var n = prompt('生成多少步骤？(1-100)', 10);
    if (!n) return;
    var count = parseInt(n);
    if (isNaN(count) || count < 1) { alert('最少1步'); return; }
    if (count > 100) { alert('最多100步'); return; }
    setStatus('正在从 AE 获取效果列表...');
    evalScript('getAllEffects()').then(function(raw) {
        if (!raw) { setStatus('获取效果失败', true); return; }
        var lines = raw.split('\n');
        var effectList = [];
        for (var li = 0; li < lines.length; li++) {
            var parts = lines[li].split('|');
            if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
                effectList.push({name: parts[0].trim(), match: parts[1].trim()});
            }
        }
        if (effectList.length === 0) { effectList = FALLBACK_EFFECTS; }
        // Shuffle
        for (var si = effectList.length - 1; si > 0; si--) {
            var rj = Math.floor(Math.random() * (si + 1));
            var tmp = effectList[si]; effectList[si] = effectList[rj]; effectList[rj] = tmp;
        }
        var selected = effectList.slice(0, Math.min(count, effectList.length));
        // Create steps
        steps = [];
        arrows = [];
        var CARD_W = 220, GAP = 24, ROW_H = 260, PER_ROW = 5;
        for (var si2 = 0; si2 < selected.length; si2++) {
            var se = selected[si2];
            var col = si2 % PER_ROW;
            var row = Math.floor(si2 / PER_ROW);
            var vx = col * (CARD_W + GAP);
            var vy = row * ROW_H;
            steps.push({
                title: se.name,
                image: '',
                desc: '效果: ' + se.name + '\nMatchName: ' + se.match,
                presets: [{name: se.name, path: '', effects: [{matchName: se.match}]}],
                vx: vx,
                vy: vy
            });
        }
        // Create arrows connecting step 0→1→2→...
        for (var ai = 0; ai < steps.length - 1; ai++) {
            arrows.push({from: ai, fromSide: 'r', to: ai + 1, toSide: 'l'});
        }
        filePath = '';
        markDirty();
        overviewMode = true;
        render();
        setStatus('已生成 ' + selected.length + ' 步流程');
    });
}

// ─── File I/O ──────────────────────────
function markDirty(){fileDirty=true;updateFileName();autoSave();}
function updateFileName(){
    document.getElementById('fileName').textContent=(filePath?filePath.split('\\').pop().split('/').pop():'Untitled')+(fileDirty?' *':'');
}

function saveFlow(){if(!filePath){saveFlowAs();return;}doSave(filePath);}

function saveFlowAs() {
    var data = JSON.stringify({version:1,steps:steps,arrows:arrows,projectFolder:projectFolder},null,2);
    evalScript('saveFlowDialog('+JSON.stringify(data)+')').then(function(r){
        if(!r||r==='CANCEL')return;
        filePath=r; fileDirty=false;
        saveSession();
        doExportAssets(r,data);
    });
}

function doSave(path) {
    var data = JSON.stringify({version:1,steps:steps,arrows:arrows,projectFolder:projectFolder},null,2);
    makePortable(path, data);
}

function makePortable(wbflowPath, rawJson) {
    var obj;
    try { obj = JSON.parse(rawJson); } catch(e) { fallbackSave(wbflowPath,rawJson); return; }
    var base = wbflowPath.replace(/\.wbflow$/i,'');
    var ffxDir = base + '_ffx/';
    var ssDir = base + '_screenshot/';
    var promises = [];

    // Copy .ffx files
    if (obj.steps) obj.steps.forEach(function(s,i){
        if (s.presets) s.presets.forEach(function(p,j){
            if (p.path && p.path.match(/\.ffx$/i)) {
                var src = p.path;
                var name = src.split('\\').pop().split('/').pop();
                var dst = ffxDir + name;
                (function(pi,srcP,nameP,idxP){
                    promises.push(evalScript('ensureDir('+JSON.stringify(ffxDir)+')'));
                    promises.push(evalScript('copyFile('+JSON.stringify(srcP)+','+JSON.stringify(dst)+')').then(function(r){
                        if (r==='OK') obj.steps[idxP].presets[pi].path = dst;
                    }));
                })(j, src, name, i);
            }
        });
    });

    // Copy screenshot data: convert base64 to file
    if (obj.steps) obj.steps.forEach(function(s,i){
        if (s.image && s.image.indexOf('data:')===0) {
            (function(idxP){
                promises.push(evalScript('ensureDir('+JSON.stringify(ssDir)+')'));
                var imgPath = ssDir + 'step_' + (i+1) + '.png';
                // Write base64 as binary via ExtendScript
                var b64 = s.image.split(',')[1];
                promises.push(evalScript('writeFile('+JSON.stringify(imgPath)+','+JSON.stringify(b64)+')')); // placeholder
            })(i);
        }
    });

    // We can't easily write base64 images via ExtendScript. 
    // For simplicity: save the .wbflow with updated paths, images stay as data URIs
    Promise.all(promises).then(function(){
        var newData = JSON.stringify(obj, null, 2);
        evalScript('writeFile('+JSON.stringify(wbflowPath)+','+JSON.stringify(newData)+')').then(function(r){
            if(r==='OK'){filePath=wbflowPath;fileDirty=false;saveSession();updateFileName();setStatus(T('exportOk')+wbflowPath);}
            else setStatus(T('failed')+r,true);
        });
    });
}

function fallbackSave(path, data) {
    evalScript('writeFile('+JSON.stringify(path)+','+JSON.stringify(data)+')').then(function(r){
        if(r==='OK'){filePath=path;fileDirty=false;saveSession();updateFileName();setStatus(T('saved'));}
        else setStatus(T('failed')+r,true);
    });
}

var RECENT_KEY = 'wbflow_recent';
var RECENT_MAX = 15;

function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch(e) { return []; }
}

function saveRecent(path) {
    var list = getRecent();
    list = list.filter(function(p) { return p !== path; });
    list.unshift(path);
    if (list.length > RECENT_MAX) list.length = RECENT_MAX;
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    updateRecentMenu();
}

function updateRecentMenu() {
    var menu = document.getElementById('recentMenu');
    if (!menu) return;
    var list = getRecent();
    if (list.length === 0) {
        menu.innerHTML = '<div class="recent-empty">' + T('recentEmpty') + '</div>';
        return;
    }
    menu.innerHTML = '';
    list.forEach(function(p) {
        var el = document.createElement('div');
        el.className = 'recent-item';
        el.title = p;
        var name = p.split('\\').pop().split('/').pop() || p;
        el.textContent = name;
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('recentMenu').classList.remove('show');
            if (fileDirty && !confirm('Unsaved. Continue?')) return;
            evalScript('loadFile(' + JSON.stringify(p) + ')').then(function(r) {
                if (!r) { setStatus('Error loading file', true); return; }
                var pp = r.split('\n---DATA---\n', 2);
                if (pp.length < 2) { setStatus('Invalid format', true); return; }
                filePath = pp[0];
                try { var obj = JSON.parse(pp[1]); steps = obj.steps || []; arrows = obj.arrows || []; projectFolder = obj.projectFolder || ''; fileDirty = false; updateProjectFolderUI(); render(); saveSession(); setStatus(T('loaded') + ': ' + filePath); } catch(e) { setStatus('Parse: ' + e.message, true); }
            });
        });
        menu.appendChild(el);
    });
}

function openFlow() {
    if (fileDirty && !confirm('Unsaved. Continue?')) return;
    evalScript('openFlowDialog()').then(function(r){
        if(!r||r==='CANCEL')return;
        var p=r.split('\n---DATA---\n',2);
        if(p.length<2){setStatus('Invalid format',true);return;}
        filePath=p[0];
        try{
            var obj=JSON.parse(p[1]);
            steps=obj.steps||[];
            arrows=obj.arrows||[];
            projectFolder=obj.projectFolder||'';
            fileDirty=false; updateProjectFolderUI(); render();
            saveSession();
            saveRecent(filePath);
            setStatus(T('loaded')+': '+filePath);
        }catch(e){setStatus('Parse: '+e.message,true);}
    });
}

function newFlow() {
    if(fileDirty&&!confirm('Unsaved. New?'))return;
    steps=[];arrows=[];filePath='';fileDirty=false;projectFolder='';
    updateProjectFolderUI();render();saveSession();setStatus(T('newCreated'));
}

// ─── Settings panel ────────────────────
function toggleSettings() {
    var p = document.getElementById('settingsPanel');
    if (p.style.display==='block') { p.style.display='none'; return; }
    p.style.display='block';
    document.getElementById('selLang').value = _lang;
}

function applySettings() {
    _lang = document.getElementById('selLang').value;
    var fs = parseInt(document.getElementById('sldFont').value);
    applyFontSize(fs);
    savePrefs();
    document.getElementById('settingsPanel').style.display='none';
    updateUIStrings(); render();
}

// ─── Edit lock ─────────────────────────
function applyEditLock() {
    var cards = document.querySelectorAll('.step-card');
    cards.forEach(function(c){
        var els = c.querySelectorAll('input, textarea, button');
        els.forEach(function(el){ el.disabled = editLocked; });
    });
    var btn = document.getElementById('btnLock');
    if (btn) {
        btn.textContent = editLocked ? '🔒' : '🔓';
        btn.style.color = editLocked ? '#5a9bf5' : '#888';
        btn.title = editLocked ? '编辑模式已锁定（点击解锁）' : '编辑模式已解锁（点击锁定）';
    }
}

function toggleEditLock() {
    editLocked = !editLocked;
    try { localStorage.setItem('wb_editLock', editLocked ? '1' : '0'); } catch(e) {}
    applyEditLock();
    setStatus(editLocked ? '编辑模式已锁定' : '编辑模式已解锁');
}

// ─── Init ──────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    loadPrefs(); document.getElementById('sldFont').value = parseInt(document.documentElement.style.fontSize) || 13; document.getElementById('lblFontVal').textContent = document.getElementById('sldFont').value + 'px'; loadHotkeys();

    loadSession();
    updateProjectFolderUI(); updateUIStrings();
    if (!steps.length) { render(); setStatus(T('ready')); }

    document.getElementById('btnNew').addEventListener('click', newFlow);
    document.getElementById('btnOpen').addEventListener('click', openFlow);
    var btnRecent = document.getElementById('btnRecent');
    var recentMenu = document.getElementById('recentMenu');
    if (btnRecent && recentMenu) {
        btnRecent.addEventListener('click', function(e) {
            e.stopPropagation();
            updateRecentMenu();
            recentMenu.classList.toggle('show');
        });
        document.addEventListener('click', function() { recentMenu.classList.remove('show'); });
    }
    updateRecentMenu();
    document.getElementById('btnSave').addEventListener('click', saveFlow);
    document.getElementById('btnAddStep').addEventListener('click', addStep);
    document.getElementById('btnImportImg').addEventListener('click', function(){
        if(steps.length===0)addStep(); importImage(steps.length-1);
    });
    document.getElementById('btnBrowseFolder').addEventListener('click', browseProjectFolder);
    document.getElementById('btnScanFFX').addEventListener('click', scanProjectFolder);
    document.getElementById('btnSendSave').addEventListener('click', function(){execAESave();saveHotkeys();});
    document.getElementById('btnSendApply').addEventListener('click', function(){execAEApply();saveHotkeys();});
    document.getElementById('hkSave').addEventListener('change', saveHotkeys);
    document.getElementById('hkApply').addEventListener('change', saveHotkeys);
    document.getElementById('btnToggleView').addEventListener('click', function(){
        overviewMode=!overviewMode; render();
    });
    document.getElementById('btnSettings').addEventListener('click', toggleSettings);
    document.getElementById('btnGenerate').addEventListener('click', generateFlowFromEffects);
    document.getElementById('btnApplySettings').addEventListener('click', applySettings);

    var sld = document.getElementById('sldFont');
    sld.addEventListener('input', function(){
        document.getElementById('lblFontVal').textContent = this.value + 'px';
    });

    // Load edit lock state
    try { editLocked = localStorage.getItem('wb_editLock') === '1'; } catch(e) {}
    document.getElementById('btnLock').addEventListener('click', toggleEditLock);
    if (!overviewMode) applyEditLock();

    // Collapse hotkeys & about
    document.querySelectorAll('.collapsible-hk-header, .collapsible-about-header').forEach(function(hdr) {
        hdr.addEventListener('click', function() {
            var id = this.dataset.target;
            var body = document.getElementById(id);
            if (!body) return;
            this.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });
    });
});
