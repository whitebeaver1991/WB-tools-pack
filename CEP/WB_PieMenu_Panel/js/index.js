var COLORS = ['#dc5050','#50c864','#5050dc','#dcc83c','#b43cb4','#3cc8c8','#f08c28','#a0a0a0','#c8c8c8'];
var MAX = 9, PAGES = 3;
var labelMap = ['Pie','Quick','Wheel'];

var curMenu = 0, curPage = 0;
var pieCount = 4, quickCount = 6;
var triggerKey = 32, triggerMod = 6, winAlpha = 60;
var bgAlpha = 60, bgColor = '2a2a2a', glowColor = '3cb93c', glowIntensity = 100;
var imgDist = 45, textDist = 85, textSize = 100, uiZoom = 100, menuScale = 100;
var numpadEnabled = false, language = 0;
var g_effectsCache = null;

var LANG = [
    { title:'WB Menu Suite', save:'Save', record:'Record', trigger:'Trigger',
      winAlpha:'Win Opacity', bgAlpha:'Bg Alpha', bgColor:'Bg Color', glowColor:'Glow Color',
      glowIntensity:'Glow Intensity', imgDist:'Icon Dist', textDist:'Text Dist',
      textSize:'Text Size', menuScale:'Menu Scale',
       pieCount:'Pie Sectors', quickCount:'Quick Slots',
       pieMenu:'Pie Menu', cep:'CEP Panel',
       numpad:'Numpad',
       about:'About',
      numpadHint:'F13-F22 (requires pairing)',
      pie:'Pie', quick:'Quick', wheel:'Wheel',
      sName:'Name', sEffect:'Effect', sImage:'Image', sSize:'Size',
      page:'Page', dblClick:'DblClick=Search', escClose:'Esc=Close',
      saveOk:'Saved!', saveFail:'Save failed',
      browse:'Browse', searchPH:'Search effects...', recordPH:'Record...' },
    { title:'WB 菜单套件', save:'保存', record:'录制', trigger:'快捷键',
      winAlpha:'窗口透明', bgAlpha:'背景透明', bgColor:'背景色', glowColor:'辉光色',
      glowIntensity:'辉光强度', imgDist:'图标距离', textDist:'文字距离',
       textSize:'文字大小', menuScale:'菜单缩放',
         pieCount:'饼图扇区', quickCount:'快捷槽位',
       pieMenu:'Pie菜单', cep:'CEP面板',
        numpad:'数字键盘',
         about:'关于',
      numpadHint:'F13-F22（需配对）',
      pie:'饼形', quick:'快速', wheel:'滚轮',
      sName:'名称', sEffect:'效果', sImage:'图片', sSize:'大小',
      page:'页', dblClick:'双击=搜索', escClose:'Esc=关闭',
      saveOk:'已保存！', saveFail:'保存失败',
      browse:'浏览', searchPH:'搜索效果...', recordPH:'录制...' }
];

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

var items = [];
for (var m = 0; m < 3; m++) {
    items[m] = [];
    for (var p = 0; p < PAGES; p++) {
        items[m][p] = [];
        for (var i = 0; i < MAX; i++)
            items[m][p][i] = { name: '', effect: '', image: '', size: 80 };
    }
}

var csInterface = null;
try { csInterface = new CSInterface(); } catch(e) {}

function evalScript(code) {
    return new Promise(function(resolve) {
        if (csInterface) csInterface.evalScript(code, function(r) { resolve(r); });
        else resolve('');
    });
}

function parseSettings(data) {
    var parsed = {};
    var lines = data.split('\n');
    lines.forEach(function(line) {
        var idx = line.indexOf('=');
        if (idx > 0) parsed[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    });
    if (parsed['trigger_key']) triggerKey = parseInt(parsed['trigger_key']) || 32;
    if (parsed['trigger_mod']) triggerMod = parseInt(parsed['trigger_mod']) || 6;
    if (parsed['win_alpha']) winAlpha = parseInt(parsed['win_alpha']) || 60;
    if (parsed['bg_alpha']) bgAlpha = parseInt(parsed['bg_alpha']) || 60;
    if (parsed['bg_color']) bgColor = parsed['bg_color'];
    if (parsed['glow_color']) glowColor = parsed['glow_color'];
    if (parsed['glow_intensity']) glowIntensity = parseInt(parsed['glow_intensity']) || 100;
    if (parsed['img_dist']) imgDist = parseInt(parsed['img_dist']) || 45;
    if (parsed['text_dist']) textDist = parseInt(parsed['text_dist']) || 85;
    if (parsed['text_size']) textSize = parseInt(parsed['text_size']) || 100;
    if (parsed['ui_zoom']) uiZoom = parseInt(parsed['ui_zoom']) || 100;
    if (parsed['menu_scale']) menuScale = parseInt(parsed['menu_scale']) || 100;
    if (parsed['language']) language = parseInt(parsed['language']) || 0;
    if (parsed['numpad_enabled']) numpadEnabled = parsed['numpad_enabled'] === '1';
    if (parsed['menu_type']) curMenu = parseInt(parsed['menu_type']) || 0;
    if (parsed['pie_count']) pieCount = Math.min(Math.max(parseInt(parsed['pie_count'])||4,2),8);
    if (parsed['quick_count']) quickCount = Math.min(Math.max(parseInt(parsed['quick_count'])||6,1),9);
    if (parsed['item_count']) pieCount = Math.min(Math.max(parseInt(parsed['item_count'])||4,2),8);

    for (var i = 0; i < MAX; i++) {
        if (parsed['n' + i] && !parsed['pie_0_' + i + '_n']) items[0][0][i].name = parsed['n' + i];
        if (parsed['n' + i + '_effect'] && !parsed['pie_0_' + i + '_e']) items[0][0][i].effect = parsed['n' + i + '_effect'];
        if (parsed['n' + i + '_image'] && !parsed['pie_0_' + i + '_img']) items[0][0][i].image = parsed['n' + i + '_image'];
        if (parsed['n' + i + '_image_hover'] && !parsed['pie_0_' + i + '_imgh']) items[0][0][i].imageHover = parsed['n' + i + '_image_hover'];
    }

    for (var m = 0; m < 3; m++) {
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < MAX; i++) {
                var pref = labelMap[m].toLowerCase() + '_' + p + '_' + i;
                if (parsed[pref + '_n']) items[m][p][i].name = parsed[pref + '_n'];
                if (parsed[pref + '_e']) items[m][p][i].effect = parsed[pref + '_e'];
                if (parsed[pref + '_en']) items[m][p][i].effectDisplay = parsed[pref + '_en'];
                if (parsed[pref + '_img']) items[m][p][i].image = parsed[pref + '_img'];
                if (parsed[pref + '_sz']) items[m][p][i].size = parseInt(parsed[pref + '_sz']) || 80;
            }
        }
    }
}

function loadSettings() {
    evalScript('readSettings()').then(function(data) {
        if (data) parseSettings(data);
        updateAll();
    });
}

function saveSettings() {
    collectFromUI();
    var lines = ['trigger_key=' + triggerKey, 'trigger_mod=' + triggerMod,
                 'win_alpha=' + winAlpha, 'bg_alpha=' + bgAlpha, 'bg_color=' + bgColor,
                 'glow_color=' + glowColor, 'glow_intensity=' + glowIntensity,
                 'img_dist=' + imgDist, 'text_dist=' + textDist, 'text_size=' + textSize,
                  'ui_zoom=' + uiZoom, 'menu_scale=' + menuScale, 'language=' + language,
                 'numpad_enabled=' + (numpadEnabled?'1':'0'),
                 'menu_type=' + curMenu, 'pie_count=' + pieCount, 'quick_count=' + quickCount];
    for (var m = 0; m < 3; m++) {
        var count = (m === 0) ? pieCount : (m === 1) ? quickCount : 8;
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < count; i++) {
                var pref = labelMap[m].toLowerCase() + '_' + p + '_' + i;
                if (items[m][p][i].name) lines.push(pref + '_n=' + items[m][p][i].name);
                if (items[m][p][i].effect) lines.push(pref + '_e=' + items[m][p][i].effect);
                if (items[m][p][i].effectDisplay) lines.push(pref + '_en=' + items[m][p][i].effectDisplay);
                if (items[m][p][i].image) lines.push(pref + '_img=' + items[m][p][i].image);
                if (items[m][p][i].size && items[m][p][i].size !== 80) lines.push(pref + '_sz=' + items[m][p][i].size);
            }
        }
    }
    var l = LANG[language] || LANG[0];
    evalScript('writeSettings(' + JSON.stringify(lines.join('\n')) + ')').then(function(r) {
        var s = document.getElementById('status');
        if (r === 'OK') { s.className = 'success'; s.textContent = l.saveOk; setTimeout(function(){s.textContent='';},3000); }
        else { s.className = 'error'; s.textContent = l.saveFail; }
    });
}

function triggerAutoSave() {
    if (g_saveTimer) clearTimeout(g_saveTimer);
    g_saveTimer = setTimeout(saveSettings, 250);
}

function collectFromUI() {
    var s = document.getElementById('winAlphaSlider');
    if (s) winAlpha = parseInt(s.value) || 60;
    var slv = document.getElementById('winAlphaValue');
    if (slv) slv.textContent = winAlpha;
    var ba = document.getElementById('bgAlphaSlider');
    if (ba) bgAlpha = parseInt(ba.value) || 60;
    var bav = document.getElementById('bgAlphaValue');
    if (bav) bav.textContent = bgAlpha;
    var nt = document.getElementById('numpadToggle');
    if (nt) numpadEnabled = nt.checked;
    var bc = document.getElementById('bgColorInput');
    if (bc) bgColor = bc.value.replace('#', '').toLowerCase();
    var bct = document.getElementById('bgColorText');
    if (bct) bct.textContent = '#' + bgColor.toUpperCase();
    var gc = document.getElementById('glowColorInput');
    if (gc) glowColor = gc.value.replace('#', '').toLowerCase();
    var gct = document.getElementById('glowColorText');
    if (gct) gct.textContent = '#' + glowColor.toUpperCase();
    var gi = document.getElementById('glowIntensitySlider');
    if (gi) glowIntensity = parseInt(gi.value) || 100;
    var giv = document.getElementById('glowIntensityValue');
    if (giv) giv.textContent = glowIntensity;
    var id = document.getElementById('imgDistSlider');
    if (id) imgDist = parseInt(id.value) || 45;
    var idv = document.getElementById('imgDistValue');
    if (idv) idv.textContent = imgDist;
    var td = document.getElementById('textDistSlider');
    if (td) textDist = parseInt(td.value) || 85;
    var tdv = document.getElementById('textDistValue');
    if (tdv) tdv.textContent = textDist;
    var ts = document.getElementById('textSizeSlider');
    if (ts) textSize = parseInt(ts.value) || 100;
    var tsv = document.getElementById('textSizeValue');
    if (tsv) tsv.textContent = textSize + '%';
    var uz = document.getElementById('uiZoomSlider');
    if (uz) uiZoom = parseInt(uz.value) || 100;
    var uzv = document.getElementById('uiZoomValue');
    if (uzv) uzv.textContent = uiZoom;
    var ms = document.getElementById('menuScaleSlider');
    if (ms) menuScale = parseInt(ms.value) || 100;
    var msv = document.getElementById('menuScaleValue');
    if (msv) msv.textContent = menuScale;
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;
    for (var i = 0; i < count; i++) {
        var el = document.getElementById('itemName_' + i);
        if (el) items[curMenu][curPage][i].name = el.value;
        el = document.getElementById('itemEffect_' + i);
        if (el) {
            items[curMenu][curPage][i].effectDisplay = el.value;
        }
        el = document.getElementById('itemImage_' + i);
        if (el) items[curMenu][curPage][i].image = el.value;
        el = document.getElementById('itemSize_' + i);
        if (el) items[curMenu][curPage][i].size = parseInt(el.value) || 80;
    }
}

function switchMenu(m) {
    collectFromUI();
    curMenu = m; curPage = 0;
    updateAll();
}

function switchPage(p) {
    collectFromUI();
    curPage = p;
    renderMenu();
    updatePageTabs();
}

function updateAll() {
    updateTabs();
    updateMenuHeader();
    updatePageTabs();
    renderMenu();
    updateTriggerDisplay();
    updateGlobals();
    setLanguage();
}

function updateTabs() {
    var btns = document.querySelectorAll('#menuTabs .tab');
    btns.forEach(function(b) { b.classList.toggle('active', parseInt(b.dataset.menu) === curMenu); });
}

function updateMenuHeader() {
    var h = document.getElementById('menuHeader');
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;
    var label = labelMap[curMenu] + ' Menu';
    var l = LANG[language] || LANG[0];
    var pageLabel = l.page + ' ' + (curPage + 1) + '/' + PAGES;
    h.innerHTML = '<strong>' + label + '</strong> &nbsp; <span class="hint">' + pageLabel + '</span>';
}

function updatePageTabs() {
    // remove old page tabs
    var old = document.querySelectorAll('.page-tab');
    old.forEach(function(el) { el.remove(); });
    var header = document.getElementById('menuHeader');
    for (var p = 0; p < PAGES; p++) {
        var btn = document.createElement('button');
        btn.className = 'page-tab' + (p === curPage ? ' active' : '');
        btn.textContent = p + 1;
        btn.dataset.page = p;
        btn.addEventListener('click', function() { switchPage(parseInt(this.dataset.page)); });
        header.appendChild(btn);
    }
}

function updateGlobals() {
    var s = document.getElementById('winAlphaSlider');
    if (s) s.value = winAlpha;
    var slv = document.getElementById('winAlphaValue');
    if (slv) slv.textContent = winAlpha;
    var ba = document.getElementById('bgAlphaSlider');
    if (ba) ba.value = bgAlpha;
    var bav = document.getElementById('bgAlphaValue');
    if (bav) bav.textContent = bgAlpha;
    var bc = document.getElementById('bgColorInput');
    if (bc) bc.value = '#' + bgColor;
    var bct = document.getElementById('bgColorText');
    if (bct) bct.textContent = '#' + bgColor.toUpperCase();
    var gc = document.getElementById('glowColorInput');
    if (gc) gc.value = '#' + glowColor;
    var gct = document.getElementById('glowColorText');
    if (gct) gct.textContent = '#' + glowColor.toUpperCase();
    var gi = document.getElementById('glowIntensitySlider');
    if (gi) gi.value = glowIntensity;
    var giv = document.getElementById('glowIntensityValue');
    if (giv) giv.textContent = glowIntensity;
    var id = document.getElementById('imgDistSlider');
    if (id) id.value = imgDist;
    var idv = document.getElementById('imgDistValue');
    if (idv) idv.textContent = imgDist;
    var td = document.getElementById('textDistSlider');
    if (td) td.value = textDist;
    var tdv = document.getElementById('textDistValue');
    if (tdv) tdv.textContent = textDist;
    var ts = document.getElementById('textSizeSlider');
    if (ts) ts.value = textSize;
    var tsv = document.getElementById('textSizeValue');
    if (tsv) tsv.textContent = textSize + '%';
    var uz = document.getElementById('uiZoomSlider');
    if (uz) uz.value = uiZoom;
    var uzv = document.getElementById('uiZoomValue');
    if (uzv) uzv.textContent = uiZoom;
    var zc = document.getElementById('zoomContent');
    if (zc) zc.style.zoom = (uiZoom / 100).toFixed(2);
    var ms = document.getElementById('menuScaleSlider');
    if (ms) ms.value = menuScale;
    var msv = document.getElementById('menuScaleValue');
    if (msv) msv.textContent = menuScale + '%';
    var pc = document.getElementById('pieCountSlider');
    if (pc) pieCount = parseInt(pc.value) || 4;
    var pcv = document.getElementById('pieCountValue');
    if (pcv) pcv.textContent = pieCount;
    var qc = document.getElementById('quickCountSlider');
    if (qc) quickCount = parseInt(qc.value) || 6;
    var qcv = document.getElementById('quickCountValue');
    if (qcv) qcv.textContent = quickCount;
    var nt = document.getElementById('numpadToggle');
     if (nt) nt.checked = numpadEnabled;
     var pc = document.getElementById('pieCountSlider');
     if (pc) pc.value = pieCount;
     var pcv = document.getElementById('pieCountValue');
     if (pcv) pcv.textContent = pieCount;
     var qc = document.getElementById('quickCountSlider');
     if (qc) qc.value = quickCount;
     var qcv = document.getElementById('quickCountValue');
     if (qcv) qcv.textContent = quickCount;
   }

function renderMenu() {
    var container = document.getElementById('itemsContainer');
    container.innerHTML = '';
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;

    for (var i = 0; i < count; i++) {
        var card = document.createElement('div');
        card.className = 'item-card';
        card.style.borderLeftColor = COLORS[i % COLORS.length];

        var label = document.createElement('div');
        label.className = 'item-label';
        var dot = document.createElement('span');
        dot.className = 'color-dot';
        dot.style.background = COLORS[i % COLORS.length];
        label.appendChild(dot);

        if (curMenu === 2) {
            var dirs = ['Top','Bottom','Left','Right'];
            var dir = dirs[Math.floor(i / 2)];
            var sub = (i % 2 === 0) ? '1' : '2';
            label.appendChild(document.createTextNode(dir + ' ' + sub));
        } else {
            label.appendChild(document.createTextNode('Slot ' + (i + 1)));
        }
        card.appendChild(label);

        var l = LANG[language] || LANG[0];
        addField(card, l.sName, 'itemName_' + i, items[curMenu][curPage][i].name);
        addEffectField(card, i);
        addImageField(card, i);
        addSizeSlider(card, i);

        container.appendChild(card);
    }
}

function addField(card, labelText, id, value, placeholder) {
    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    lbl.textContent = labelText;
    row.appendChild(lbl);
    var input = document.createElement('input');
    input.type = 'text'; input.id = id; input.value = value || '';
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener('input', triggerAutoSave);
    row.appendChild(input);
    card.appendChild(row);
}

function addImageField(card, idx) {
    var l = LANG[language] || LANG[0];
    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    lbl.textContent = l.sImage;
    row.appendChild(lbl);
    var input = document.createElement('input');
    input.type = 'text'; input.id = 'itemImage_' + idx;
    input.value = items[curMenu][curPage][idx].image || '';
    input.placeholder = 'PNG/BMP path';
    input.style.flex = '1';
    input.addEventListener('input', triggerAutoSave);
    row.appendChild(input);
    var btn = document.createElement('button');
    btn.textContent = l.browse;
    btn.className = 'btn-browse';
    btn.addEventListener('click', function() {
        evalScript('browseFile()').then(function(path) {
          if (path) { input.value = path; triggerAutoSave(); }
        });
      });
    row.appendChild(btn);
    card.appendChild(row);
}

function addEffectField(card, idx) {
    var wrapper = document.createElement('div');
    wrapper.className = 'effect-wrapper';
    wrapper.style.position = 'relative';

    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    var l = LANG[language] || LANG[0];
    lbl.textContent = l.sEffect;
    row.appendChild(lbl);
    var input = document.createElement('input');
    input.type = 'text'; input.id = 'itemEffect_' + idx;
    input.autocomplete = 'off';
    input.value = items[curMenu][curPage][idx].effectDisplay || items[curMenu][curPage][idx].effect || '';
    input.style.flex = '1';
    row.appendChild(input);

    var dropdown = document.createElement('div');
    dropdown.className = 'effect-dropdown';
    wrapper.appendChild(row);
    wrapper.appendChild(dropdown);
    card.appendChild(wrapper);

    var timer = null;

    input.addEventListener('input', function() {
        if (timer) clearTimeout(timer);
        items[curMenu][curPage][idx].effectDisplay = this.value;
        timer = setTimeout(function() { searchAndShow(input, dropdown, input.value); }, 100);
        triggerAutoSave();
    });

    input.addEventListener('blur', function() { setTimeout(function() { dropdown.style.display = 'none'; }, 200); });
    input.addEventListener('focus', function() {
        if (g_effectsCache) return;
        evalScript('getAllEffects()').then(function(raw) {
            var map = {}; g_effectsCache = [];
            raw.split('\n').forEach(function(line) {
                var p = line.indexOf('|');
                if (p < 0) return;
                var name = line.substring(0, p), match = line.substring(p + 1);
                if (!map[match]) { map[match] = true; g_effectsCache.push({ name: name, match: match }); }
            });
        });
        if (input.value) searchAndShow(input, dropdown, input.value);
    });
}

function searchAndShow(input, dropdown, query) {
    if (query.length < 1) { dropdown.style.display = 'none'; return; }
    if (!g_effectsCache || !g_effectsCache.length) return;
    var results = g_effectsCache.filter(function(e) {
        return e.name.toLowerCase().indexOf(query.toLowerCase()) >= 0 ||
               e.match.toLowerCase().indexOf(query.toLowerCase()) >= 0;
    });
    if (results.length === 0) { dropdown.style.display = 'none'; return; }
    dropdown.innerHTML = '';
    dropdown.style.display = 'block';
    var count = Math.min(results.length, 50);
    for (var i = 0; i < count; i++) {
        var item = document.createElement('div');
        item.className = 'effect-item';
        var nameSpan = document.createElement('span');
        nameSpan.className = 'effect-name';
        nameSpan.textContent = results[i].name;
        var matchSpan = document.createElement('span');
        matchSpan.className = 'effect-match';
        matchSpan.textContent = results[i].match;
        item.appendChild(nameSpan);
        item.appendChild(matchSpan);
        item.addEventListener('mousedown', function(e) {
            e.preventDefault();
            var displayName = this.querySelector('.effect-name').textContent;
            var matchName = this.querySelector('.effect-match').textContent;
            input.value = displayName;
            var idx = parseInt(input.id.replace('itemEffect_', ''));
            items[curMenu][curPage][idx].effect = matchName;
            items[curMenu][curPage][idx].effectDisplay = displayName;
            dropdown.style.display = 'none';
            triggerAutoSave();
            setTimeout(function() { input.value = displayName; }, 0);
        });
        dropdown.appendChild(item);
    }
}

function addSizeSlider(card, idx) {
    var l = LANG[language] || LANG[0];
    var row = document.createElement('div');
    row.className = 'field-row';
    var lbl = document.createElement('label');
    lbl.textContent = l.sSize;
    row.appendChild(lbl);
    var val = items[curMenu][curPage][idx].size || 80;
    var slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 50; slider.max = 200; slider.value = val;
    slider.id = 'itemSize_' + idx;
    slider.style.width = '80px';
    var display = document.createElement('span');
    display.className = 'slider-value';
    display.style.minWidth = '32px';
    display.style.textAlign = 'center';
    display.textContent = val + '%';
    slider.addEventListener('input', function() {
        display.textContent = this.value + '%';
        triggerAutoSave();
    });
    row.appendChild(slider);
    row.appendChild(display);
    card.appendChild(row);
}

function updateTriggerDisplay() {
    var input = document.getElementById('triggerInput');
    if (!input) return;
    if (triggerKey) {
        var mods = [];
        if (triggerMod & 1) mods.push('Alt');
        if (triggerMod & 2) mods.push('Ctrl');
        if (triggerMod & 4) mods.push('Shift');
        if (triggerMod & 8) mods.push('Win');
        var keyName = {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc'}[triggerKey] || ('VK_' + triggerKey);
        input.value = mods.join('+') + (mods.length ? '+' : '') + keyName;
    }
}

function formatKeys(key, mod) {
    var mods = [];
    if (mod & 1) mods.push('Alt');
    if (mod & 2) mods.push('Ctrl');
    if (mod & 4) mods.push('Shift');
    if (mod & 8) mods.push('Win');
    var keyName = {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc'}[key] || String.fromCharCode(key).toUpperCase();
    return mods.join('+') + (mods.length ? '+' : '') + keyName;
}

var isRecording = false;
function startRecording(inputEl, btnEl, callback) {
    isRecording = true;
    inputEl.value = '...';
    inputEl.className = 'recording';
    btnEl.textContent = '...';
    function onKeyDown(e) {
        e.preventDefault();
        var key = e.keyCode, mod = 0;
        if (e.altKey) mod |= 1; if (e.ctrlKey) mod |= 2;
        if (e.shiftKey) mod |= 4; if (e.metaKey) mod |= 8;
        if (key === 16 || key === 17 || key === 18 || key === 91) return;
        isRecording = false;
        inputEl.className = ''; btnEl.className = 'btn-record';
        var l = LANG[language] || LANG[0];
        btnEl.textContent = l.record;
        document.removeEventListener('keydown', onKeyDown, true);
        callback(key, mod);
        inputEl.value = formatKeys(key, mod);
    }
    document.addEventListener('keydown', onKeyDown, true);
}

document.addEventListener('DOMContentLoaded', function() {
    loadSettings();

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
    if (ba && bav) ba.addEventListener('input', function() { bav.textContent = this.value; bgAlpha = parseInt(this.value); triggerAutoSave(); });

    var gc = document.getElementById('glowColorInput');
    if (gc) gc.addEventListener('input', function() {
        document.getElementById('glowColorText').textContent = this.value.toUpperCase();
        triggerAutoSave();
    });

    var gi = document.getElementById('glowIntensitySlider');
    var giv = document.getElementById('glowIntensityValue');
    if (gi && giv) gi.addEventListener('input', function() { giv.textContent = this.value; glowIntensity = parseInt(this.value); triggerAutoSave(); });

    var id = document.getElementById('imgDistSlider');
    var idv = document.getElementById('imgDistValue');
    if (id && idv) id.addEventListener('input', function() { idv.textContent = this.value; imgDist = parseInt(this.value); triggerAutoSave(); });

    var td = document.getElementById('textDistSlider');
    var tdv = document.getElementById('textDistValue');
    if (td && tdv) td.addEventListener('input', function() { tdv.textContent = this.value; textDist = parseInt(this.value); triggerAutoSave(); });

    var ts = document.getElementById('textSizeSlider');
    var tsv = document.getElementById('textSizeValue');
    if (ts && tsv) ts.addEventListener('input', function() { tsv.textContent = this.value + '%'; textSize = parseInt(this.value); triggerAutoSave(); });

    var pc = document.getElementById('pieCountSlider');
    var pcv = document.getElementById('pieCountValue');
    if (pc && pcv) pc.addEventListener('input', function() { pcv.textContent = this.value; pieCount = parseInt(this.value); triggerAutoSave(); });

    var qc = document.getElementById('quickCountSlider');
    var qcv = document.getElementById('quickCountValue');
    if (qc && qcv) qc.addEventListener('input', function() { qcv.textContent = this.value; quickCount = parseInt(this.value); triggerAutoSave(); });

    var uz = document.getElementById('uiZoomSlider');
    var uzv = document.getElementById('uiZoomValue');
    if (uz && uzv) uz.addEventListener('input', function() {
        uzv.textContent = this.value; uiZoom = parseInt(this.value);
        var zc = document.getElementById('zoomContent');
        if (zc) zc.style.zoom = (uiZoom / 100).toFixed(2);
        triggerAutoSave();
    });

    var ms = document.getElementById('menuScaleSlider');
    var msv = document.getElementById('menuScaleValue');
    if (ms && msv) ms.addEventListener('input', function() { msv.textContent = this.value; menuScale = parseInt(this.value); triggerAutoSave(); });

    var nt = document.getElementById('numpadToggle');
    if (nt) nt.addEventListener('change', function() { numpadEnabled = this.checked; triggerAutoSave(); });

    document.getElementById('triggerBtn').addEventListener('click', function() {
        if (isRecording) return;
        startRecording(document.getElementById('triggerInput'), this, function(k, m) { triggerKey = k; triggerMod = m; });
    });

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
});
