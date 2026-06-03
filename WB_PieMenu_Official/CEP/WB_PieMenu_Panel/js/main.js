var uiZoom = [100,100,100,100];
var language = 0;

var LANG = [
    { title:'WB Menu Suite', save:'Save', record:'Record', trigger:'Trigger',
      winAlpha:'Win Opacity', bgAlpha:'Bg Alpha', bgColor:'Bg Color', glowColor:'Glow Color',
      glowIntensity:'Glow Intensity', imgDist:'Icon Dist', textDist:'Text Dist',
      textSize:'Text Size', menuScale:'Menu Scale',
       pieCount:'Pie Sectors', quickCount:'Quick Slots',
       pieMenu:'Pie Menu', cep:'CEP Panel',
       numpad:'Numpad', about:'About',
      numpadHint:'F13-F22 (requires pairing)',
      pie:'Pie', quick:'Quick', wheel:'Wheel',
      sName:'Name', sEffect:'Effect', sImage:'Image', sSize:'Size',
      page:'Page', dblClick:'DblClick=Search', escClose:'Esc=Close',
      saveOk:'Saved!', saveFail:'Save failed',
      browse:'Browse', searchPH:'Search effects...', recordPH:'Record...',
      prevPage:'Prev Page', nextPage:'Next Page', pageColor:'Page Color',
       menu:'Menu', guide:'Guide Line', guideHint:'Line from center to cursor',
       width:'Width', color:'Color', uiZoom:'UI Zoom',
      selectMode:'Select Mode', clickSelect:'Click', holdSelect:'Hold+Release',
      infinite:'Infinite', wheelCount:'Wheel Slots',
      config:'Config', presets:'Presets',
      savePreset:'Save Preset', loadPreset:'Load Preset' },
    { title:'WB 菜单套件', save:'保存', record:'录制', trigger:'快捷键',
      winAlpha:'窗口透明', bgAlpha:'背景透明', bgColor:'背景色', glowColor:'辉光色',
      glowIntensity:'辉光强度', imgDist:'图标距离', textDist:'文字距离',
       textSize:'文字大小', menuScale:'菜单缩放',
         pieCount:'饼图扇区', quickCount:'快捷槽位',
       pieMenu:'Pie菜单', cep:'CEP面板',
        numpad:'数字键盘', about:'关于',
      numpadHint:'F13-F22（需配对）',
      pie:'饼形', quick:'快速', wheel:'滚轮',
      sName:'名称', sEffect:'效果', sImage:'图片', sSize:'大小',
      page:'页', dblClick:'双击=搜索', escClose:'Esc=关闭',
      saveOk:'已保存！', saveFail:'保存失败',
      browse:'浏览', searchPH:'搜索效果...', recordPH:'录制...',
      prevPage:'上一页', nextPage:'下一页', pageColor:'页码颜色',
      menu:'菜单', guide:'指引线', guideHint:'从圆心指向鼠标',
      width:'粗细', color:'颜色', uiZoom:'面板缩放',
      selectMode:'选择模式', clickSelect:'点击', holdSelect:'按住松手',
      infinite:'无限轮盘', wheelCount:'轮盘槽位',
      config:'配置', presets:'预设',
      savePreset:'保存预设', loadPreset:'加载预设' }
];

function dbg(msg) {
    if (!g_debug) return;
    console.log('[WB]', msg);
    var ts = new Date();
    var time = ('0'+ts.getHours()).slice(-2) + ':' + ('0'+ts.getMinutes()).slice(-2) + ':' + ('0'+ts.getSeconds()).slice(-2);
    var line = time + ' ' + msg;
    g_logLines.push(line);
    var el = document.getElementById('debugLog');
    if (el) {
        var t = document.createElement('div');
        t.textContent = line;
        el.appendChild(t);
        el.scrollTop = el.scrollHeight;
        // Auto-expand log body
        var body = document.getElementById('debugLogBody');
        var hdr = document.querySelector('[data-target="debugLogBody"]');
        if (body && body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            if (hdr) hdr.classList.remove('collapsed');
        }
    }
}

function setLanguage() {
    var l = LANG[language] || LANG[0];
    document.querySelectorAll('[data-lang]').forEach(function(el) {
        var key = el.getAttribute('data-lang');
        if (l[key]) {
            if (el.tagName === 'INPUT' && el.type === 'text') el.placeholder = l[key];
            else el.textContent = l[key];
        }
    });
    document.getElementById('triggerInput').placeholder = l.recordPH;
}

document.addEventListener('DOMContentLoaded', function() {
    try {
    loadSettings();
    rebuildPresetSelect();

    document.querySelectorAll('#menuTabs .tab').forEach(function(b) {
        b.addEventListener('click', function() { switchMenu(parseInt(this.dataset.menu)); });
    });

    var s = document.getElementById('winAlphaSlider');
    var slv = document.getElementById('winAlphaValue');
    if (s && slv) s.addEventListener('input', function() { slv.textContent = this.value; winAlpha = parseInt(this.value); triggerAutoSave(); });

    var bc = document.getElementById('bgColorInput');
    if (bc) bc.addEventListener('input', function() {
        document.getElementById('bgColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var ba = document.getElementById('bgAlphaSlider');
    var bav = document.getElementById('bgAlphaValue');
    if (ba && bav) ba.addEventListener('input', function() { bav.textContent = this.value; bgAlpha[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var gc = document.getElementById('glowColorInput');
    if (gc) gc.addEventListener('input', function() {
        document.getElementById('glowColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var pgc = document.getElementById('pageColorInput');
    if (pgc) pgc.addEventListener('input', function() {
        document.getElementById('pageColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var gi = document.getElementById('glowIntensitySlider');
    var giv = document.getElementById('glowIntensityValue');
    if (gi && giv) gi.addEventListener('input', function() { giv.textContent = this.value; glowIntensity[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var id = document.getElementById('imgDistSlider');
    var idv = document.getElementById('imgDistValue');
    if (id && idv) id.addEventListener('input', function() { idv.textContent = this.value; imgDist[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var td = document.getElementById('textDistSlider');
    var tdv = document.getElementById('textDistValue');
    if (td && tdv) td.addEventListener('input', function() { tdv.textContent = this.value; textDist[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var ts = document.getElementById('textSizeSlider');
    var tsv = document.getElementById('textSizeValue');
    if (ts && tsv) ts.addEventListener('input', function() { tsv.textContent = this.value + '%'; textSize[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var pc = document.getElementById('pieCountSelect');
    if (pc) pc.addEventListener('change', function() { pieCount = parseInt(this.value); renderMenu(); saveSettings(); });

    var qc = document.getElementById('quickCountSelect');
    if (qc) qc.addEventListener('change', function() { quickCount = parseInt(this.value); renderMenu(); saveSettings(); });

    var uz = document.getElementById('uiZoomSlider');
    var uzv = document.getElementById('uiZoomValue');
    if (uz && uzv) uz.addEventListener('input', function() {
        uzv.textContent = this.value; uiZoom[curMenu] = parseInt(this.value);
        var zc = document.getElementById('zoomContent');
        if (zc) zc.style.zoom = (uiZoom[curMenu] / 100).toFixed(2);
        triggerAutoSave();
    });

    var ms = document.getElementById('menuScaleSlider');
    var msv = document.getElementById('menuScaleValue');
    if (ms && msv) ms.addEventListener('input', function() { msv.textContent = this.value; menuScale[curMenu] = parseInt(this.value); triggerAutoSave(); });

    var nt = document.getElementById('numpadToggle');
    if (nt) nt.addEventListener('change', function() { numpadEnabled = this.checked; saveSettings(); });
    var wcs = document.getElementById('wheelCountSelect');
    if (wcs) wcs.addEventListener('change', function() { infiniteCount = parseInt(this.value) || 8; saveSettings(); });
    var sm0 = document.getElementById('selectMode0');
    var sm1 = document.getElementById('selectMode1');
    if (sm0) sm0.addEventListener('change', function() { if (this.checked) { selectMode = 0; saveSettings(); } });
    if (sm1) sm1.addEventListener('change', function() { if (this.checked) { selectMode = 1; saveSettings(); } });

    var gt = document.getElementById('guideToggle');
    if (gt) gt.addEventListener('change', function() { guideEnabled = this.checked; saveSettings(); });
    var guildWidthEl = document.getElementById('guideWidthSlider');
    var guildWidthVal = document.getElementById('guideWidthValue');
    if (guildWidthEl && guildWidthVal) guildWidthEl.addEventListener('input', function() { guildWidthVal.textContent = this.value; guideWidth = parseInt(this.value); triggerAutoSave(); });
    var guideColorEl = document.getElementById('guideColorInput');
    if (guideColorEl) guideColorEl.addEventListener('input', function() {
        document.getElementById('guideColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var ecb = document.getElementById('exportCfgBtn');
    if (ecb) ecb.addEventListener('click', function() {
        evalScript('exportSettingsToFile()').then(function(path) {
            if (path) dbg('Config exported: ' + path);
        });
    });
    var icb = document.getElementById('importCfgBtn');
    if (icb) icb.addEventListener('click', function() {
        evalScript('importSettingsFromFile()').then(function(data) {
            if (data && data.length > 10) {
                evalScript('writeSettings("' + data.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n') + '")').then(function() {
                    loadSettings();
                    dbg('Config imported');
                });
            }
        });
    });

    var spb = document.getElementById('savePresetBtn');
    if (spb) spb.addEventListener('click', function() {
        var nameInput = document.getElementById('presetNameInput');
        if (!nameInput || !nameInput.value.trim()) return;
        var name = nameInput.value.trim();
        // save current trigger settings as preset via settings.txt
        var linesToSave = 'trigger_key=' + triggerKey + '\ntrigger_mod=' + triggerMod + '\n';
        evalScript('readSettings()').then(function(data) {
            var existing = data || '';
            // Find or create preset marker
            var marker = 'preset_' + name + '_start';
            var markerEnd = 'preset_' + name + '_end';
            var newBlock = marker + '\n' + linesToSave + markerEnd;
            if (existing.indexOf(marker) >= 0) {
                var re = new RegExp(marker + '[\\s\\S]*?' + markerEnd);
                existing = existing.replace(re, newBlock);
            } else {
                existing += '\n' + newBlock;
            }
            evalScript('writeSettings("' + existing.replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '")');
            // Rebuild preset select
            rebuildPresetSelect();
            saveSettings();
        });
    });

    // FlowBoard Save: save current settings to .wbflow file
    var fbs = document.getElementById('fbSaveBtn');
    if (fbs) fbs.addEventListener('click', function() {
        collectFromUI();
        // Build settings text by reading existing file
        evalScript('readSettings()').then(function(data) {
            var escaped = (data||'').replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n');
            evalScript('saveFlowBoardFile("' + escaped + '")').then(function(path) {
                if (path) {
                    dbg('FlowBoard saved: ' + path);
                    var idx = g_fbRecent.indexOf(path);
                    if (idx >= 0) g_fbRecent.splice(idx, 1);
                    g_fbRecent.unshift(path);
                    if (g_fbRecent.length > 15) g_fbRecent.length = 15;
                    try { localStorage.setItem('wb_fb_recent', JSON.stringify(g_fbRecent)); } catch(e) {}
                    rebuildFbRecent();
                }
            });
        });
    });

    // FlowBoard Load: select .wbflow file and apply it
    var fbl = document.getElementById('fbLoadBtn');
    if (fbl) fbl.addEventListener('click', function() {
        evalScript('openFlowBoardFile()').then(function(content) {
            if (content && content.length > 10) {
                evalScript('writeSettings("' + content.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n') + '")').then(function() {
                    loadSettings();
                    var btn = document.getElementById('scanBtn');
                    if (btn) dbg('FlowBoard state loaded');
                });
            }
        });
    });

    // FlowBoard Apply: read recent file and apply
    var fba = document.getElementById('fbApplyBtn');
    if (fba) fba.addEventListener('click', function() {
        var sel = document.getElementById('fbRecentSelect');
        if (!sel || !sel.value) return;
        var path = sel.value;
        // Extract filename for a simple ExtendScript read
        var parts = path.split(/[/\\]/);
        var fname = parts[parts.length - 1];
        evalScript('openFlowBoardFile()').then(function(content) {
            if (content && content.length > 10) {
                evalScript('writeSettings("' + content.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\n/g,'\\n') + '")').then(function() {
                    loadSettings();
                    dbg('FlowBoard applied: ' + fname);
                });
            }
        });
    });

    // FlowBoard Delete: remove recent entry
    var fbd = document.getElementById('fbDelBtn');
    if (fbd) fbd.addEventListener('click', function() {
        var sel = document.getElementById('fbRecentSelect');
        if (!sel || !sel.value) return;
        var path = sel.value;
        var idx = g_fbRecent.indexOf(path);
        if (idx >= 0) { g_fbRecent.splice(idx, 1); }
        try { localStorage.setItem('wb_fb_recent', JSON.stringify(g_fbRecent)); } catch(e) {}
        rebuildFbRecent();
    });

    // Load FlowBoard recent
    try { var fb = localStorage.getItem('wb_fb_recent'); if (fb) g_fbRecent = JSON.parse(fb); rebuildFbRecent(); } catch(e) {}

    document.getElementById('clearAllSlotsBtn').addEventListener('click', clearAllSlots);
    var csb = document.getElementById('cleanSlotsBtn');
    if (csb) csb.addEventListener('click', cleanCrossMenuData);

    // FlowBoard Generate: create wbflow with N random effects
    var fbg = document.getElementById('fbGenBtn');
    if (fbg) fbg.addEventListener('click', function() {
        var n = prompt('\u751f\u6210\u591a\u5c11\u6b65\u9aa4\uff1f(1-48)', 10);
        if (!n) return;
        var count = parseInt(n);
        if (isNaN(count) || count < 1) { alert('\u6700\u5c111\u6b65'); return; }
        if (count > 48) { alert('\u6700\u591a48\u6b65'); return; }
        // Build effect names from g_nameMap
        var effectList = [];
        for (var mk in g_nameMap) {
            if (g_nameMap.hasOwnProperty(mk)) {
                var dn = g_nameMap[mk];
                if (!dn || dn === mk) dn = mk;
                effectList.push({name: dn, match: mk});
            }
        }
        if (effectList.length === 0) { dbg('no effects loaded yet \u2014 use defaults'); return; }
        // Shuffle and pick N
        for (var si = effectList.length - 1; si > 0; si--) {
            var rj = Math.floor(Math.random() * (si + 1));
            var tmp = effectList[si]; effectList[si] = effectList[rj]; effectList[rj] = tmp;
        }
        var selected = effectList.slice(0, Math.min(count, effectList.length));
        // Build settings lines
        var lines = [
            'settings_version=' + Date.now(),
            'menu_type=3',
            'infinite_sectors=' + Math.min(count, 8),
            'infinite_split_R2=2a',
            'infinite_split_R3=3',
            'infinite_rDead=20',
            'infinite_r1=80',
            'infinite_r2=140'
        ];
        for (var si2 = 0; si2 < selected.length; si2++) {
            var se = selected[si2];
            var sp = 'infinite_0_' + si2 + '_';
            lines.push(sp + 'n=' + se.name);
            lines.push(sp + 'e=' + se.match);
        }
        lines.push('infinite_sector_0_color=3a6a3a');
        var text = lines.join('\n') + '\n';
        evalScript('saveFlowBoardFile(' + JSON.stringify(text) + ')').then(function(path) {
            if (path) {
                dbg('Generated FlowBoard saved: ' + path + ' (' + selected.length + ' steps)');
                var idx = g_fbRecent.indexOf(path);
                if (idx >= 0) g_fbRecent.splice(idx, 1);
                g_fbRecent.unshift(path);
                if (g_fbRecent.length > 15) g_fbRecent.length = 15;
                try { localStorage.setItem('wb_fb_recent', JSON.stringify(g_fbRecent)); } catch(e) {}
                rebuildFbRecent();
                 dbg('Generated: ' + selected.length + ' steps');
            }
        });
    });

    var lpb = document.getElementById('loadPresetBtn');
    if (lpb) lpb.addEventListener('click', function() {
        var ps = document.getElementById('presetSelect');
        if (!ps || !ps.value) return;
        var presetName = ps.value;
        evalScript('readSettings()').then(function(data) {
            var marker = 'preset_' + presetName + '_start';
            var markerEnd = 'preset_' + presetName + '_end';
            var m = data.indexOf(marker);
            if (m >= 0) {
                var end = data.indexOf(markerEnd, m);
                if (end > m) {
                    var block = data.substring(m + marker.length, end).trim();
                    var lines = block.split('\n');
                    lines.forEach(function(l) {
                        var p = l.indexOf('=');
                        if (p > 0) {
                            var k = l.substring(0, p).trim(), v = l.substring(p+1).trim();
                            if (k === 'trigger_key') triggerKey = parseInt(v) || 32;
                            if (k === 'trigger_mod') triggerMod = parseInt(v) || 6;
                        }
                    });
                    updateTriggerDisplay();
                    saveSettings();
                    dbg('Loaded preset: ' + presetName);
                }
            }
        });
    });

    var dpb = document.getElementById('deletePresetBtn');
    if (dpb) dpb.addEventListener('click', function() {
        var ps = document.getElementById('presetSelect');
        if (!ps || !ps.value) return;
        var presetName = ps.value;
        evalScript('readSettings()').then(function(data) {
            var marker = 'preset_' + presetName + '_start';
            var markerEnd = 'preset_' + presetName + '_end';
            var re = new RegExp('\\n?' + marker + '[\\s\\S]*?' + markerEnd + '\\n?');
            var newData = data.replace(re, '');
            evalScript('writeSettings("' + newData.replace(/\\/g,'\\\\').replace(/"/g,'\\"') + '")');
            rebuildPresetSelect();
            saveSettings();
        });
    });

    document.getElementById('triggerBtn').addEventListener('click', function() {
        if (isRecording) return;
        startRecording(document.getElementById('triggerInput'), this, function(k, m) { triggerKey = k; triggerMod = m; });
    });

    // Page key recording (single key only)
    function makePageRecorder(inputId, btnId, setter) {
        var btn = document.getElementById(btnId);
        var input = document.getElementById(inputId);
        if (!btn || !input) return;
        btn.addEventListener('click', function() {
            if (isRecording) return;
            isRecording = true;
            input.value = '...';
            input.className = 'recording';
            btn.textContent = '...';
            function onKeyDown(e) {
                e.preventDefault();
                var key = e.keyCode;
                if (key === 16 || key === 17 || key === 18 || key === 91) return;
                isRecording = false;
                input.className = ''; btn.textContent = 'Record';
                document.removeEventListener('keydown', onKeyDown, true);
                setter(key);
                input.value = formatKeyName(key);
                saveSettings();
            }
            document.addEventListener('keydown', onKeyDown, true);
        });
    }
    makePageRecorder('prevPageInput', 'prevPageBtn', function(k) { prevPageKey = k; });
    makePageRecorder('nextPageInput', 'nextPageBtn', function(k) { nextPageKey = k; });

    document.getElementById('saveBtn').addEventListener('click', saveSettings);

    document.getElementById('langBtn').addEventListener('click', function() {
        language = 1 - language;
        setLanguage();
        triggerAutoSave();
    });

    // Collapse logic
    document.querySelectorAll('.collapsible-header').forEach(function(hdr) {
        hdr.addEventListener('click', function() {
            var id = this.dataset.target;
            var body = document.getElementById(id);
            if (!body) return;
            this.classList.toggle('collapsed');
            body.classList.toggle('collapsed');
        });
    });

    // Settings modal toggle
    var settingsBtn = document.getElementById('settingsBtn');
    var settingsModal = document.getElementById('settingsModal');
    var settingsClose = document.getElementById('settingsCloseBtn');
    if (settingsBtn && settingsModal) {
        function openSettings() {
            settingsModal.style.display = 'flex';
            updateTriggerDisplay();
            updatePageKeyDisplay();
            updateGlobals();
        }
        function closeSettings() { settingsModal.style.display = 'none'; }
        settingsBtn.addEventListener('click', openSettings);
        if (settingsClose) settingsClose.addEventListener('click', closeSettings);
        settingsModal.addEventListener('click', function(e) {
            if (e.target === this) closeSettings();
        });
    }

    // Effect search overlay
    var overlay = document.getElementById('effectSearchOverlay');
    if (overlay) overlay.addEventListener('click', function(e) {
        if (e.target === this) closeEffectSearch();
    });

    var searchInput = document.getElementById('effectSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            if (g_effectsCache) {
                updateEffectResults(this.value);
            } else {
                loadEffectsCache().then(function() {
                    updateEffectResults(searchInput.value);
                });
            }
        });
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') closeEffectSearch();
            if (e.key === 'Enter') {
                var list = document.getElementById('effectSearchResults');
                var first = list ? list.querySelector('.effect-item') : null;
                if (first) first.click();
            }
        });
    }

    // Preload effects cache when panel opens
    loadEffectsCache();

    // Copy debug log button
    document.getElementById('copyLogBtn').addEventListener('click', function() {
        var txt = g_logLines.join('\n');
        // Method 1: copy to clipboard via textarea
        var done = false;
        try {
            var ta = document.createElement('textarea');
            ta.value = txt;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            ta.style.top = '0';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            done = document.execCommand('copy');
            document.body.removeChild(ta);
        } catch(e) {}
        // Method 2: write to desktop file via ExtendScript
        if (!done) {
            try {
                var safe = txt.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
                evalScript('try{var f=new File("~/Desktop/wb_debug.log");f.open("w");f.write("' + safe + '");f.close()}catch(e){}');
                done = true;
            } catch(e) {}
        }
        // Method 3: download as file (CEF fallback)
        if (!done) {
            try {
                var blob = new Blob([txt], {type: 'text/plain'});
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'wb_debug_' + Date.now() + '.log';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                done = true;
            } catch(e2) {}
        }
        if (!done) {
            // Last resort: tell user to use DevTools
            dbg('OPEN DEVTOOLS: Right-click panel \u2192 Inspect \u2192 Console tab \u2192 type: copy(g_logLines.join("\\n"))');
        } else {
            // Brief visual flash
            var btn = document.getElementById('copyLogBtn');
            if (btn) {
                var orig = btn.textContent;
                btn.textContent = '\u2714 Copied';
                btn.style.color = '#5c5';
                setTimeout(function() { btn.textContent = orig; btn.style.color = ''; }, 1200);
            }
        }
    });

    // Scan Effects button: try AEGP dump first, fallback to ExtendScript
    document.getElementById('scanBtn').addEventListener('click', function() {
        var btn = this;
        btn.textContent = 'Scanning...';
        btn.disabled = true;
        dbg('scan: triggering AEGP effect dump...');
        evalScript('triggerDumpEffects()').then(function() {
            startEffectsMapPoll();
        });
    });

    // Auto-trigger AEGP dump on init to get real display names
    dbg('init: triggering AEGP effect dump...');
    evalScript('triggerDumpEffects()');
    startEffectsMapPoll();

    // ── Infinite Wheel event listeners ──
    window._infPreview = false;
    window._infHoverSlot = -1;
    window._infHoverSector = -1;
    window._infSectorColors = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'];
    var imsInit = document.getElementById('infMenuScale');
    if (imsInit) { imsInit.value = menuScale[curMenu]; document.getElementById('infMenuScaleV').textContent = menuScale[curMenu] + '%'; }

    var infSel = document.getElementById('infSectors');
    if (infSel) infSel.addEventListener('change', function() { renderInfinitePreview(); saveSettings(); });
    var infSplitR2El = document.getElementById('infSplitR2');
    if (infSplitR2El) infSplitR2El.addEventListener('change', function() { renderInfinitePreview(); saveSettings(); });
    var infSplitR3El = document.getElementById('infSplitR3');
    if (infSplitR3El) infSplitR3El.addEventListener('change', function() { renderInfinitePreview(); saveSettings(); });

    ['infRDz','infR1','infR2'].forEach(function(id) {
        var el = document.getElementById(id);
        var vEl = document.getElementById(id + 'V');
        if (el && vEl) el.addEventListener('input', function() { vEl.textContent = this.value; renderInfinitePreview(); saveSettings(); });
    });

    var sectorSel = document.getElementById('infSectorSelect');
    if (sectorSel) sectorSel.addEventListener('change', function() { renderSectorSlots(parseInt(this.value)); });

    var ims = document.getElementById('infMenuScale');
    if (ims) {
        ims.addEventListener('input', function() {
            document.getElementById('infMenuScaleV').textContent = this.value + '%';
        });
        ims.addEventListener('change', function() {
            document.getElementById('infMenuScaleV').textContent = this.value + '%';
            menuScale[curMenu] = parseInt(this.value) || 100;
            saveSettings();
        });
    }
document.getElementById('infModalClose').addEventListener('click', function() {
        document.getElementById('infEditModal').style.display = 'none';
    });
    document.getElementById('infEditModal').addEventListener('click', function(e) {
        if (e.target === this) this.style.display = 'none';
    });
    document.addEventListener('keydown', function(e) {
        if (infRecording) return;
        if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
            var m = document.getElementById('infEditModal');
            if (m && m.style.display === 'flex') { m.style.display = 'none'; e.preventDefault(); }
        }
    });
    document.getElementById('infModalSave').addEventListener('click', function() {
        if (infEditedSlot < 0) return;
        if (!window._infSlotData) window._infSlotData = [];
        var elName = document.getElementById('infEditName');
        var elIcon = document.getElementById('infEditIcon');
        // Validate title length: max 8 CJK chars or 16 ASCII chars
        if (elName.value) {
            var len = 0;
            for (var ci = 0; ci < elName.value.length; ci++) {
                len += elName.value.charCodeAt(ci) > 255 ? 2 : 1;
            }
            if (len > 16) {
                alert('\u6807\u9898\u8fc7\u957f\u3002\u6700\u591a8\u4e2a\u4e2d\u6587\u5b57\u7b26\u621616\u4e2a\u82f1\u6587\u5b57\u7b26\u3002');
                return;
            }
        }
        // Validate icon
        if (elIcon.value && elIcon.value.indexOf('.') > 0) {
            var ext = elIcon.value.split('.').pop().toLowerCase();
            if (['png','jpg','jpeg','gif','bmp','svg'].indexOf(ext) < 0) {
                alert('\u56fe\u6807\u8def\u5f84\u5fc5\u987b\u4ee5 png/jpg/gif/bmp/svg \u7ed3\u5c3e\u3002');
                return;
            }
        }
        window._infSlotData[infEditedSlot] = {
            name: elName.value,
            effect: document.getElementById('infEditEffect').value,
            key: document.getElementById('infEditKey').value,
            icon: elIcon.value,
            font: parseInt(document.getElementById('infEditFont').value) || 100,
            iconSz: parseInt(document.getElementById('infEditIconSz').value) || 80,
            action: parseInt(document.getElementById('infEditAction').value) || 0
        };
        document.getElementById('infEditModal').style.display = 'none';
        renderInfinitePreview();
        saveSettings();
    });

    // Live value display for modal sliders
    ['infEditFont','infEditIconSz'].forEach(function(id) {
        var el = document.getElementById(id);
        var vEl = document.getElementById(id + 'V');
        if (el && vEl) el.addEventListener('input', function() { vEl.textContent = this.value + '%'; });
    });

    // Effect search for infinite modal
    document.getElementById('infEditEffect').addEventListener('focus', function() {
        if (infEditedSlot < 0) return;
        g_infEffectSearch = true;
        g_effectSearchTargetIdx = infEditedSlot;
        var input = document.getElementById('effectSearchInput');
        var overlay = document.getElementById('effectSearchOverlay');
        input.value = this.dataset.display || this.value || '';
        overlay.style.display = 'flex';
        setTimeout(function() { input.focus(); input.select(); }, 50);
        loadEffectsCache().then(function() { updateEffectResults(input.value); });
    });

    // Icon preview in edit modal
    document.getElementById('infEditIcon').addEventListener('input', function() {
        var prev = document.getElementById('infIconPrev');
        if (this.value) {
            prev.innerHTML = '<img src="' + this.value + '" style="max-width:32px;max-height:32px;">';
        } else {
            prev.textContent = '?';
        }
    });

    // Shortcut recording in edit modal
    document.getElementById('infKeyRec').addEventListener('click', function() {
        infRecording = true;
        this.textContent = '\u6309\u6309\u952e...';
    });
    document.getElementById('infKeyClear').addEventListener('click', function() {
        document.getElementById('infEditKey').value = '';
        infRecording = false;
        document.getElementById('infKeyRec').textContent = '\u5f55\u5236';
    });
    // Global keydown for modal recording
    document.addEventListener('keydown', function(e) {
        if (infRecording) {
            e.preventDefault();
            var k = e.key;
            if (k.length === 1) k = k.toUpperCase();
            else if (k === 'Space') k = 'Space';
            else if (k === 'Enter') k = 'Enter';
            else if (k === 'Escape') { infRecording = false; document.getElementById('infKeyRec').textContent = '\u5f55\u5236'; return; }
            document.getElementById('infEditKey').value = k;
            infRecording = false;
            document.getElementById('infKeyRec').textContent = '\u5f55\u5236';
        }
    });

    } catch(e) {
        var d = document.getElementById('status');
        if (d) d.innerHTML = '<span style="color:#f55;">JS ERR: ' + e.message + '</span>';
    }
});