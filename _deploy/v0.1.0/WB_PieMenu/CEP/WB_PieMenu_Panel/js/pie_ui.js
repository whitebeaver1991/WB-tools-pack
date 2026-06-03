function renderMenu() {
    dbg('renderMenu start: curMenu=' + curMenu + ' curPage=' + curPage + ' pieCount=' + pieCount + ' quickCount=' + quickCount);
    var zc = document.getElementById('zoomContent');
    var savedScroll = zc ? zc.scrollTop : 0;
    var container = document.getElementById('itemsContainer');
    if (!container) { dbg('  ABORT: no itemsContainer'); return; }
    var wrap = document.getElementById('infinitePreviewWrap');

    if (curMenu === 3) {
        applyInfLayoutToDOM();
        container.style.display = 'none';
        if (wrap) {
            wrap.style.display = 'block';
            buildInfColorGrid();
            renderInfinitePreview();
        }
        if (zc) zc.scrollTop = savedScroll;
        return;
    }
    container.style.display = '';
    if (wrap) wrap.style.display = 'none';
    var count = (curMenu === 0) ? pieCount : (curMenu === 1) ? quickCount : 8;
    dbg('  rendering ' + count + ' slots');
    container.innerHTML = '';

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
        (function(slotIdx, slotMenu, slotPage) {
            var hkDiv = document.createElement('div');
            hkDiv.className = 'field-row';
            var hkLabel = document.createElement('label');
            hkLabel.textContent = 'Hotkey';
            hkDiv.appendChild(hkLabel);
            var hkBtn = document.createElement('button');
            hkBtn.className = 'btn-tiny-record';
            var keyCode = items[slotMenu][slotPage][slotIdx].slotKey || 0;
            var modCode = items[slotMenu][slotPage][slotIdx].slotMod || 0;
            hkBtn.textContent = keyCode ? getKeyName(keyCode, modCode) : 'Rec';
            hkBtn.addEventListener('click', function(m, p, i, btnEl) {
                return function() {
                    var orig = btnEl.textContent;
                    btnEl.textContent = '...';
                    startSlotRecording(btnEl, function(k, mod) {
                        items[m][p][i].slotKey = k;
                        items[m][p][i].slotMod = mod;
                        btnEl.textContent = k ? getKeyName(k, mod) : 'Rec';
                        saveSettings();
                    });
                };
            }(slotMenu, slotPage, slotIdx, hkBtn));
            hkDiv.appendChild(hkBtn);
            card.appendChild(hkDiv);
        })(i, curMenu, curPage);
        addImageField(card, i);
        addSizeSlider(card, i);

        container.appendChild(card);
    }
    if (zc) {
        zc.scrollTop = savedScroll;
        var tries = 0;
        (function restore() {
            if (zc.scrollTop === savedScroll) return;
            if (++tries > 15) return;
            zc.scrollTop = savedScroll;
            setTimeout(restore, 80);
        })();
    }
}

function rebuildPresetSelect() {
    evalScript('readSettings()').then(function(data) {
        var ps = document.getElementById('presetSelect');
        if (!ps) return;
        ps.innerHTML = '<option value="">(none)</option>';
        if (!data) return;
        var re = /preset_([^_]+)_start/g;
        var match;
        var seen = {};
        while ((match = re.exec(data)) !== null) {
            var name = match[1];
            if (!seen[name]) {
                seen[name] = true;
                var opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                ps.appendChild(opt);
            }
        }
    });
}

function cleanCrossMenuData() {
    for (var m = 0; m < 3; m++) {
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < MAX; i++) {
                items[m][p][i] = {name:'',effect:'',effectDisplay:'',image:'',imageHover:'',size:80,slotKey:0,slotMod:0,slotAction:0};
            }
        }
    }
    renderMenu();
    saveSettings();
    dbg('Cross-menu data cleaned');
}

function clearAllSlots() {
    if (!confirm('\u786e\u5b9a\u6e05\u9664\u6240\u6709\u6982\u4f4d\u6570\u636e\uff1f\u8fd9\u5c06\u91cd\u7f6e Pie/Quick/Wheel/Infinite \u6240\u6709\u83dc\u5355\u7684\u914d\u7f6e\u3002')) return;
    for (var m = 0; m < 4; m++) {
        for (var p = 0; p < PAGES; p++) {
            for (var i = 0; i < MAX; i++) {
                items[m][p][i] = {name:'',effect:'',effectDisplay:'',image:'',imageHover:'',size:80,slotKey:0,slotMod:0,slotAction:0};
            }
        }
    }
    window._infSlotData = [];
    window._infSectorColors = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'];
    renderMenu();
    if (curMenu === 3) renderInfinitePreview();
    saveSettings();
    dbg('All slots cleared');
}

function renderInfinitePreview() {
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var splitR2 = (document.getElementById('infSplitR2') || {}).value || '2a';
    var splitR3 = ((document.getElementById('infSplitR3') || {}).value) || '3';
    var r2Slots = (splitR2 === 'nosplit') ? 1 : 2;
    var r3Slots = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var perSector = 1 + r2Slots + r3Slots;
    var totalSlots = n * perSector;
    if (!window._infSlotData) window._infSlotData = [];
    while (window._infSlotData.length < totalSlots) window._infSlotData.push({});
    var sel = document.getElementById('infSectorSelect');
    if (sel) {
        var curVal = parseInt(sel.value);
        sel.innerHTML = '';
        for (var ss = 0; ss < n; ss++) {
            var opt = document.createElement('option');
            opt.value = ss; opt.textContent = (ss + 1) + '/' + n;
            sel.appendChild(opt);
        }
        sel.value = curVal < n ? curVal : 0;
    }
    renderSectorSlots(sel ? parseInt(sel.value) : 0);
}

function renderSectorSlots(sectorIdx) {
    var list = document.getElementById('infSlotList');
    if (!list) return;
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var splitR2 = (document.getElementById('infSplitR2') || {}).value || '2a';
    var splitR3 = ((document.getElementById('infSplitR3') || {}).value) || '3';
    var r2Slots = (splitR2 === 'nosplit') ? 1 : 2;
    var r3Slots = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var perSector = 1 + r2Slots + r3Slots;
    var baseIdx = sectorIdx * perSector;
    list.innerHTML = '';
    function mkBox2(slot) {
        var sd = (window._infSlotData || [])[slot] || {};
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3px 2px;border:1px solid #555;border-radius:3px;cursor:pointer;font-size:9px;min-width:56px;gap:1px;background:' + (sd.name ? 'rgba(255,255,255,0.07)' : 'transparent') + ';';
        if (slot === window._infHoverSlot) div.style.borderColor = '#fff';
        var num = document.createElement('span');
        num.style.cssText = 'font-weight:bold;color:#888;font-size:8px;';
        num.textContent = slot + 1;
        div.appendChild(num);
        var nm = document.createElement('span');
        nm.style.cssText = 'color:' + (sd.name ? '#ddd' : '#666') + ';font-size:10px;overflow:hidden;text-overflow:ellipsis;max-width:50px;white-space:nowrap;';
        nm.textContent = sd.name || ('\u2699');
        div.appendChild(nm);
        if (sd.effect || sd.key) {
            var inf = document.createElement('span');
            inf.style.cssText = 'font-size:7px;color:#888;';
            inf.textContent = (sd.effect ? '*' : '') + (sd.key ? ' ' + sd.key : '');
            div.appendChild(inf);
        }
        div.addEventListener('click', function(e) { e.stopPropagation(); openInfiniteEdit(slot); });
        return div;
    }
    // R3 row
    var r3cnt = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var r3row = document.createElement('div');
    r3row.style.cssText = 'display:flex;gap:3px;';
    var r3start = baseIdx + 1 + r2Slots;
    for (var i = r3cnt - 1; i >= 0; i--) {
        var s = r3start + i;
        var b = mkBox2(s);
        b.style.flex = '1';
        r3row.appendChild(b);
    }
    list.appendChild(r3row);
    // R2 row
    var r2row = document.createElement('div');
    r2row.style.cssText = 'display:flex;gap:3px;';
    if (splitR2 === 'nosplit') {
        var b2 = mkBox2(baseIdx + 1);
        b2.style.flex = '1';
        r2row.appendChild(b2);
    } else {
        for (var i2 = 1; i2 >= 0; i2--) {
            var s2 = baseIdx + 1 + i2;
            var b2 = mkBox2(s2);
            b2.style.flex = '1';
            r2row.appendChild(b2);
        }
    }
    list.appendChild(r2row);
    // R1 — full width
    var r1b = mkBox2(baseIdx);
    list.appendChild(r1b);
    // Draw mini ring
    drawMiniRing(sectorIdx);
}

function drawMiniRing(activeSectorIdx) {
    var c = document.getElementById('infMiniRing');
    if (!c) return;
    var ctx = c.getContext('2d');
    var w = 80, h = 80, cx = 40, cy = 40, rOut = 36, rIn = 22;
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var sectorColors = window._infSectorColors || [];
    for (var i = 0; i < 8; i++) { if (!sectorColors[i]) sectorColors[i] = '#3a6a3a'; }
    ctx.clearRect(0, 0, w, h);
    var slice = 2 * Math.PI / n;
    for (var s = 0; s < n; s++) {
        var a0 = -Math.PI/2 + s * slice;
        var a1 = a0 + slice;
        var base = sectorColors[s % 8];
        var brightness = (s === activeSectorIdx) ? 1.0 : 0.35;
        var r = Math.round(parseInt(base.substring(1,3),16) * brightness);
        var g = Math.round(parseInt(base.substring(3,5),16) * brightness);
        var b = Math.round(parseInt(base.substring(5,7),16) * brightness);
        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (s === activeSectorIdx ? '0.9' : '0.2') + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, rIn, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e1e1e';
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeSectorIdx + 1, cx, cy);
}

function openInfiniteEdit(slotIdx) {
    if (!window._infSlotData) window._infSlotData = [];
    var sd = window._infSlotData[slotIdx] || {};
    infEditedSlot = slotIdx;
    document.getElementById("infModalTitle").textContent = "编辑槽位 " + (slotIdx + 1);
    document.getElementById("infEditName").value = sd.name || "";
    document.getElementById("infEditEffect").value = sd.effect || "";
    document.getElementById("infEditKey").value = sd.key || "";
    document.getElementById("infEditIcon").value = sd.icon || "";
    document.getElementById("infEditFont").value = sd.font || 100;
    document.getElementById("infEditFontV").textContent = (sd.font || 100) + "%";
    document.getElementById("infEditIconSz").value = sd.iconSz || 80;
    document.getElementById("infEditIconSzV").textContent = (sd.iconSz || 80) + "%";
    document.getElementById("infEditAction").value = sd.action || 0;
    document.getElementById("infIconPrev").textContent = sd.icon ? "!" : "?";
    document.getElementById("infEditModal").style.display = "flex";
}

function drawSector(ctx, cx, cy, r0, r1, a0, a1, fill) {
    ctx.beginPath(); ctx.arc(cx, cy, r1, a0, a1); ctx.arc(cx, cy, r0, a1, a0, true); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = '#333'; ctx.lineWidth = 0.5; ctx.stroke();
}

function hexToHSL(hex) {
    var r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    var mx = Math.max(r,g,b), mn = Math.min(r,g,b), h = 0, s = 0, l = (mx+mn)/2;
    if (mx !== mn) { var d = mx-mn; s = l > 0.5 ? d/(2-mx-mn) : d/(mx+mn);
        if (mx===r) h = ((g-b)/d + (g<b?6:0))/6; else if (mx===g) h = ((b-r)/d + 2)/6; else h = ((r-g)/d + 4)/6; }
    return {h:h*360, s:s*100, l:l*100};
}

function adjustColor(hex, sMul, lMul) {
    var hsl = hexToHSL(hex);
    hsl.s = Math.min(100, Math.max(0, hsl.s * sMul));
    hsl.l = Math.min(80, Math.max(3, hsl.l * lMul));
    return 'hsl(' + hsl.h + ',' + hsl.s + '%,' + hsl.l + '%)';
}

function infHitTest(mx, my) {
    var dx = mx - 200, dy = my - 200;
    var dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 6) return null;

    // Get current settings (must match renderInfinitePreview exactly)
    var n = parseInt((document.getElementById('infSectors') || {}).value) || 8;
    var rd = parseInt((document.getElementById('infRDz') || {}).value) || 20;
    var r1 = parseInt((document.getElementById('infR1') || {}).value) || 80;
    var r2 = parseInt((document.getElementById('infR2') || {}).value) || 140;
    var r3 = 190;
    if (rd >= r1 - 4) rd = Math.max(6, r1 - 4);
    if (r1 >= r2 - 4) r1 = Math.max(30, r2 - 4);
    if (r2 >= r3 - 4) r2 = Math.max(60, r3 - 4);
    var splitR2 = (document.getElementById('infSplitR2') || {}).value || '2a';
    var splitR3 = ((document.getElementById('infSplitR3') || {}).value) || '3';

    var slice = 2 * Math.PI / n;
    var angle = Math.atan2(dy, dx);
    var a = angle + Math.PI / 2;
    if (a < 0) a += 2 * Math.PI;
    // Clamp to [0, 2π) to avoid floating point at exactly 2π
    if (a >= 2 * Math.PI) a = 0;

    var s = Math.floor(a / slice);
    if (s < 0) s = 0;
    if (s >= n) s = n - 1;

    var ring = -1, sub = 0;
    if (dist < rd) return null;
    if (dist <= r1 + 0.5) { ring = 0; sub = 0; }
    else if (dist <= r2 + 0.5) {
        ring = 1;
        var la = a - s * slice;
        if (la < 0) la = 0; else if (la > slice) la = slice;
        if (splitR2 === '2a') {
            sub = Math.floor((la / slice) * 2);
            if (sub < 0) sub = 0; else if (sub > 1) sub = 1;
        } else {
            sub = dist < (r1 + r2) / 2 ? 0 : 1;
        }
    }
    else {
        ring = 2;
        var la2 = a - s * slice;
        if (la2 < 0) la2 = 0; else if (la2 > slice) la2 = slice;
        sub = Math.floor((la2 / slice) * splitR3);
        if (sub < 0) sub = 0; else if (sub >= splitR3) sub = splitR3 - 1;
    }

    // Look up matching hit area to get slot index
    var r2Slots = (splitR2 === 'nosplit') ? 1 : 2;
    var r3Slots = (splitR3 === 'nosplit') ? 1 : parseInt(splitR3);
    var perSector = 1 + r2Slots + r3Slots;
    var offset;
    if (ring === 0) offset = 0;
    else if (ring === 1) offset = 1 + sub;
    else offset = 3 + sub;
    var slotIdx = s * perSector + offset;
    return {slot: slotIdx, sector: s};
}

function buildInfColorGrid() {
    var grid = document.getElementById('infColorGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var colors = window._infSectorColors || [];
    for (var s = 0; s < 8; s++) {
        if (!colors[s]) colors[s] = ['#3a6a3a','#6a5a3a','#3a5a7a','#6a3a5a','#5a5a3a','#3a6a5a','#5a3a6a','#6a4a3a'][s];
        var div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:10px;color:#888;';
        var lbl = document.createElement('span');
        lbl.textContent = 'S' + (s+1);
        var inp = document.createElement('input');
        inp.type = 'color';
        inp.style.cssText = 'width:28px;height:18px;padding:0;border:1px solid #555;border-radius:2px;background:none;cursor:pointer;';
        inp.value = colors[s];
        inp.addEventListener('input', function(idx) { return function() {
            window._infSectorColors[idx] = this.value;
            renderInfinitePreview();
        }; }(s));
        div.appendChild(lbl); div.appendChild(inp); grid.appendChild(div);
    }
    window._infSectorColors = colors;
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
    var row = document.createElement('div');
    row.className = 'field-row';
    var l = LANG[language] || LANG[0];
    var lbl = document.createElement('label');
    lbl.textContent = l.sEffect;
    row.appendChild(lbl);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex:1;gap:3px;';
    var display = document.createElement('div');
    display.className = 'effect-display';
    display.id = 'itemEffect_' + idx;
    var txt = items[curMenu][curPage][idx].effectDisplay || items[curMenu][curPage][idx].effect || '';
    display.textContent = txt;
    if (!display.textContent) display.classList.add('empty');
    display.dataset.idx = idx;
    display.addEventListener('click', function() {
        openEffectSearch(parseInt(this.dataset.idx));
    });
    wrap.appendChild(display);
    var clearBtn = document.createElement('button');
    clearBtn.textContent = '\u2715';
    clearBtn.title = 'Clear effect';
    clearBtn.style.cssText = 'background:#3a3a3a;border:1px solid #555;border-radius:3px;color:#888;cursor:pointer;padding:0 6px;font-size:10px;line-height:22px;';
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        var i = parseInt(display.dataset.idx);
        items[curMenu][curPage][i].effect = '';
        items[curMenu][curPage][i].effectDisplay = '';
        display.textContent = '';
        display.classList.add('empty');
        saveSettings();
    });
    wrap.appendChild(clearBtn);
    dbg('addEffectField idx=' + idx + ' text="' + txt + '" id=itemEffect_' + idx);
    row.appendChild(wrap);
    card.appendChild(row);
}

function matchToDisplay(match) {
    var s = match;
    s = s.replace(/_/g, ' ');
    s = s.replace(/([a-z])([A-Z0-9])/g, '$1 $2');
    s = s.replace(/([0-9])([A-Z])/g, '$1 $2');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
}

function processEffectsMap(content) {
    if (!content || content.length < 5) return 0;
    var added = 0;
    content.split('\n').forEach(function(line) {
        var p = line.indexOf('|');
        if (p < 0) return;
        var name = line.substring(0, p), match = line.substring(p + 1);
        if (!match) return;
        if (!g_nameMap[match]) {
            g_nameMap[match] = name || matchToDisplay(match);
            added++;
        }
    });
    if (added > 0) {
        dbg('effects map loaded: ' + added + ' new entries');
        g_effectsCache = null;
        loadEffectsCache();
    }
    return added;
}

function startEffectsMapPoll() {
    if (g_effectsMapPollTimer) { clearInterval(g_effectsMapPollTimer); g_effectsMapPollTimer = null; }
    var attempts = 0;
    g_effectsMapPollTimer = setInterval(function() {
        attempts++;
        evalScript('readEffectsMap()').then(function(content) {
            if (content && content.length > 5) {
                clearInterval(g_effectsMapPollTimer);
                g_effectsMapPollTimer = null;
                var added = processEffectsMap(content);
                var btn = document.getElementById('scanBtn');
                if (btn) {
                    btn.textContent = '\u2714 ' + added + ' new';
                    btn.style.color = '#5c5';
                    btn.disabled = false;
                    setTimeout(function() { btn.textContent = 'Scan Effects'; btn.style.color = ''; }, 2000);
                }
            } else if (attempts > 100) {
                clearInterval(g_effectsMapPollTimer);
                g_effectsMapPollTimer = null;
                dbg('effects map poll timed out, falling back to ExtendScript');
                evalScript('getAllEffects()').then(function(raw) {
                    var added = 0;
                    raw.split('\n').forEach(function(line) {
                        var p = line.indexOf('|');
                        if (p < 0) return;
                        var name = line.substring(0, p), match = line.substring(p + 1);
                        if (!match) return;
                        if (!g_nameMap[match]) {
                            g_nameMap[match] = name || matchToDisplay(match);
                            added++;
                        }
                    });
                    if (added > 0) {
                        g_effectsCache = null;
                        loadEffectsCache();
                    }
                    var btn = document.getElementById('scanBtn');
                    if (btn) {
                        btn.textContent = '\u2714 ' + added + ' new';
                        btn.style.color = '#5c5';
                        btn.disabled = false;
                        setTimeout(function() { btn.textContent = 'Scan Effects'; btn.style.color = ''; }, 2000);
                    }
                });
            }
        });
    }, 200);
}

function loadEffectsCache() {
    if (g_effectsCache) { dbg('cache already loaded: ' + g_effectsCache.length + ' effects'); return Promise.resolve(g_effectsCache); }
    dbg('loading effects cache from name map (' + Object.keys(g_nameMap).length + ' entries)...');
    g_effectsCache = [];
    for (var match in g_nameMap) {
        if (g_nameMap.hasOwnProperty(match)) {
            var name = g_nameMap[match];
            if (!name || name === match) name = matchToDisplay(match);
            g_effectsCache.push({ name: name, match: match });
        }
    }
    g_effectsCache.sort(function(a, b) { return a.name.localeCompare(b.name); });
    dbg('cache loaded: ' + g_effectsCache.length + ' unique effects');
    var sample = g_effectsCache.filter(function(e) { return e.name.toLowerCase().indexOf('re:') >= 0 || e.match.toLowerCase().indexOf('re:') >= 0; });
    dbg('effects matching "re:" = ' + sample.length + ' samples: ' + sample.slice(0,3).map(function(e){return e.name+'|'+e.match;}).join(', '));
    return Promise.resolve(g_effectsCache);
}

function updateEffectResults(query) {
    var container = document.getElementById('effectSearchResults');
    var countEl = document.getElementById('effectSearchCount');
    if (!query || query.length < 1) {
        if (g_recentEffects.length > 0) {
            container.innerHTML = '<div style="padding:8px 12px;color:#888;font-size:11px;font-weight:600;">Recent</div>';
            for (var ri = 0; ri < g_recentEffects.length && ri < 10; ri++) {
                var re = g_recentEffects[ri];
                var item = document.createElement('div');
                item.className = 'effect-item';
                var nameSpan = document.createElement('span');
                nameSpan.className = 'effect-name';
                nameSpan.textContent = re.name;
                var matchSpan = document.createElement('span');
                matchSpan.className = 'effect-match';
                matchSpan.textContent = re.match;
                item.appendChild(nameSpan);
                item.appendChild(matchSpan);
                (function(displayName, matchName) {
                    item.addEventListener('mousedown', function(e) {
                        e.preventDefault();
                        selectEffect(displayName, matchName);
                    });
                })(re.name, re.match);
                container.appendChild(item);
            }
        } else {
            container.innerHTML = '<div style="padding:12px;color:#666;font-size:12px;text-align:center;">' +
                (LANG[language] ? LANG[language].searchPH : 'Search effects...') + '</div>';
        }
        if (countEl) countEl.textContent = '';
        return;
    }
    if (!g_effectsCache || !g_effectsCache.length) {
        dbg('search: cache not ready yet');
        container.innerHTML = '<div style="padding:12px;color:#666;font-size:12px;text-align:center;">Loading...</div>';
        return;
    }
    var q = query.toLowerCase();
    var results = g_effectsCache.filter(function(e) {
        return e.name.toLowerCase().indexOf(q) >= 0 || e.match.toLowerCase().indexOf(q) >= 0;
    });
    dbg('search "' + query + '" \u2192 ' + results.length + ' results');
    if (results.length > 0) dbg('first 3: ' + results.slice(0,3).map(function(e){return e.name+'|'+e.match;}).join(', '));
    if (countEl) countEl.textContent = results.length + ' results' + (results.length > 500 ? ' (showing all)' : '');
    if (results.length === 0) {
        container.innerHTML = '<div style="padding:12px;color:#888;font-size:12px;text-align:center;">No results</div>';
        return;
    }
    container.innerHTML = '';
    var count = results.length;
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
        (function(displayName, matchName) {
            item.addEventListener('mousedown', function(e) {
                e.preventDefault();
                selectEffect(displayName, matchName);
            });
        })(results[i].name, results[i].match);
        container.appendChild(item);
    }
}

function openEffectSearch(idx) {
    g_effectSearchTargetIdx = idx;
    dbg('openEffectSearch idx=' + idx + ' curMenu=' + curMenu + ' curPage=' + curPage);
    dbg('  items data before open: effect="' + items[curMenu][curPage][idx].effect + '" effectDisplay="' + items[curMenu][curPage][idx].effectDisplay + '"');
    var input = document.getElementById('effectSearchInput');
    var overlay = document.getElementById('effectSearchOverlay');
    input.value = items[curMenu][curPage][idx].effectDisplay || '';
    overlay.style.display = 'flex';
    setTimeout(function() { input.focus(); input.select(); }, 50);
    loadEffectsCache().then(function() {
        updateEffectResults(input.value);
    });
}

function closeEffectSearch() {
    document.getElementById('effectSearchOverlay').style.display = 'none';
    g_effectSearchTargetIdx = -1;
    g_infEffectSearch = false;
}

function selectEffect(displayName, matchName) {
    var idx = g_effectSearchTargetIdx;
    dbg('selectEffect idx=' + idx + ' displayName="' + displayName + '" matchName="' + matchName + '"');
    if (idx < 0) { dbg('  ABORT: no target idx'); return; }
    if (g_infEffectSearch) {
        var el = document.getElementById('infEditEffect');
        if (el) { el.value = matchName; el.dataset.display = displayName; }
        closeEffectSearch();
        saveSettings();
        return;
    }
    items[curMenu][curPage][idx].effect = matchName;
    items[curMenu][curPage][idx].effectDisplay = displayName;
    dbg('  items[' + curMenu + '][' + curPage + '][' + idx + '] set');
    // Track recent effect
    var idx2 = g_recentEffects.findIndex(function(r) { return r.match === matchName; });
    if (idx2 >= 0) g_recentEffects.splice(idx2, 1);
    g_recentEffects.unshift({name: displayName, match: matchName});
    if (g_recentEffects.length > RECENT_MAX) g_recentEffects.length = RECENT_MAX;
    saveRecentEffects();
    closeEffectSearch();
    // Direct DOM update — no renderMenu, no setTimeout
    var el = document.getElementById('itemEffect_' + idx);
    if (el) {
        el.textContent = displayName;
        el.classList.remove('empty');
        dbg('  dom updated: text="' + displayName + '"');
    }
    saveSettings();
}

function saveScrollPos() {
    var zc = document.getElementById('zoomContent');
    return zc ? zc.scrollTop : 0;
}

function restoreScrollPos(pos) {
    var zc = document.getElementById('zoomContent');
    if (zc) { zc.scrollTop = pos; }
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

function formatKeyName(key) {
    return {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc', 90:'Z', 88:'X'}[key] || (key >= 65 && key <= 90 ? String.fromCharCode(key) : 'VK_' + key);
}

function updatePageKeyDisplay() {
    var pi = document.getElementById('prevPageInput');
    if (pi) pi.value = formatKeyName(prevPageKey);
    var ni = document.getElementById('nextPageInput');
    if (ni) ni.value = formatKeyName(nextPageKey);
}

function getKeyName(key, mod) {
    var mods = [];
    if (mod & 1) mods.push('Alt');
    if (mod & 2) mods.push('Ctrl');
    if (mod & 4) mods.push('Shift');
    if (mod & 8) mods.push('Win');
    var keyName = {32:'Space', 9:'Tab', 13:'Enter', 27:'Esc'}[key] || ('VK_' + key);
    return (mods.length ? mods.join('+') + '+' : '') + keyName;
}

function startSlotRecording(btnEl, callback) {
    var savedHandler = window.__slotKeyHandler;
    if (savedHandler) {
        document.removeEventListener('keydown', savedHandler);
        window.__slotKeyHandler = null;
    }
    btnEl.textContent = '...';
    btnEl.style.color = '#ff0';
    var handler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        var k = e.keyCode || e.which;
        var m = 0;
        if (e.altKey) m |= 1;
        if (e.ctrlKey) m |= 2;
        if (e.shiftKey) m |= 4;
        if (e.metaKey) m |= 8;
        if (k === 27) { btnEl.textContent = 'Rec'; btnEl.style.color = ''; }
        else { btnEl.textContent = getKeyName(k, m); btnEl.style.color = ''; callback(k, m); }
        document.removeEventListener('keydown', handler);
        window.__slotKeyHandler = null;
        return false;
    };
    window.__slotKeyHandler = handler;
    document.addEventListener('keydown', handler);
    setTimeout(function() {
        if (window.__slotKeyHandler === handler) {
            document.removeEventListener('keydown', handler);
            window.__slotKeyHandler = null;
            btnEl.textContent = 'Rec'; btnEl.style.color = '';
        }
    }, 5000);
}

function startRecording(inputEl, btnEl, callback) {
    isRecording = true;
    inputEl.value = '...';
    inputEl.className = 'recording';
    btnEl.textContent = '...';
    // Disable trigger hotkey to prevent interference during recording
    evalScript('readSettings()').then(function(data) {
        if (data) {
            var lines = [];
            data.split('\n').forEach(function(l) {
                if (l.indexOf('trigger_disabled=') < 0 && l.indexOf('trigger_key=') < 0 && l.indexOf('trigger_mod=') < 0)
                    lines.push(l);
            });
            lines.push('trigger_disabled=1');
            lines.push('trigger_key=0');
            lines.push('trigger_mod=0');
            evalScript('writeSettings(' + JSON.stringify(lines.join('\n')) + ')');
        }
    });
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
        saveSettings();
    }
    document.addEventListener('keydown', onKeyDown, true);
}

function switchMenu(m) {
    collectFromUI();
    curMenu = m; curPage = 0;
    updateAll();
    if (m === 0 || m === 3) { saveSettings(); }
}

function switchPage(p) {
    collectFromUI();
    curPage = p;
    renderMenu();
    updateMenuHeader();
    updatePageTabs();
}

function updateAll() {
    updateTabs();
    updateMenuHeader();
    updatePageTabs();
    renderMenu();
    updateTriggerDisplay();
    updatePageKeyDisplay();
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
    var l = LANG[language] || LANG[0];
    var label = (l[['pie','quick','wheel','infinite'][curMenu]] || labelMap[curMenu]) + ' ' + (l.menu || 'Menu');
    var pageLabel = l.page + ' ' + (curPage + 1) + '/' + PAGES;
    h.innerHTML = '<strong>' + label + '</strong> &nbsp; <span class="hint">' + pageLabel + '</span>';
    var ml = document.getElementById('currentMenuLabel');
    if (ml) ml.textContent = ['Pie','Quick','Wheel','Infinite'][curMenu] || 'Pie';
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
    if (ba) ba.value = bgAlpha[curMenu];
    var bav = document.getElementById('bgAlphaValue');
    if (bav) bav.textContent = bgAlpha[curMenu];
    var bc = document.getElementById('bgColorInput');
    if (bc) bc.value = '#' + bgColor[curMenu];
    var bct = document.getElementById('bgColorText');
    if (bct) bct.textContent = '#' + bgColor[curMenu].toUpperCase();
    var gc = document.getElementById('glowColorInput');
    if (gc) gc.value = '#' + glowColor[curMenu];
    var gct = document.getElementById('glowColorText');
    if (gct) gct.textContent = '#' + glowColor[curMenu].toUpperCase();
    var pgc = document.getElementById('pageColorInput');
    if (pgc) pgc.value = '#' + pageColor[curMenu];
    var pgct = document.getElementById('pageColorText');
    if (pgct) pgct.textContent = '#' + pageColor[curMenu].toUpperCase();
    var gi = document.getElementById('glowIntensitySlider');
    if (gi) gi.value = glowIntensity[curMenu];
    var giv = document.getElementById('glowIntensityValue');
    if (giv) giv.textContent = glowIntensity[curMenu];
    var id = document.getElementById('imgDistSlider');
    if (id) id.value = imgDist[curMenu];
    var idv = document.getElementById('imgDistValue');
    if (idv) idv.textContent = imgDist[curMenu];
    var td = document.getElementById('textDistSlider');
    if (td) td.value = textDist[curMenu];
    var tdv = document.getElementById('textDistValue');
    if (tdv) tdv.textContent = textDist[curMenu];
    var ts = document.getElementById('textSizeSlider');
    if (ts) ts.value = textSize[curMenu];
    var tsv = document.getElementById('textSizeValue');
    if (tsv) tsv.textContent = textSize[curMenu] + '%';
    var uz = document.getElementById('uiZoomSlider');
    if (uz) uz.value = uiZoom[curMenu];
    var uzv = document.getElementById('uiZoomValue');
    if (uzv) uzv.textContent = uiZoom[curMenu];
    var zc = document.getElementById('zoomContent');
    if (zc) zc.style.zoom = (uiZoom[curMenu] / 100).toFixed(2);
    var ms = document.getElementById('menuScaleSlider');
    if (ms) ms.value = menuScale[curMenu];
    var msv = document.getElementById('menuScaleValue');
    if (msv) msv.textContent = menuScale[curMenu] + '%';
    var pc = document.getElementById('pieCountSelect');
    if (pc) pieCount = parseInt(pc.value) || 4;
    var qc = document.getElementById('quickCountSelect');
    if (qc) quickCount = parseInt(qc.value) || 6;
    var nt = document.getElementById('numpadToggle');
    if (nt) nt.checked = numpadEnabled;
    var wcs = document.getElementById('wheelCountSelect');
    if (wcs) wcs.value = infiniteCount;
    var sm0 = document.getElementById('selectMode0');
    var sm1 = document.getElementById('selectMode1');
    if (sm0 && sm1) { sm0.checked = (selectMode === 0); sm1.checked = (selectMode === 1); }
    var gt = document.getElementById('guideToggle');
    if (gt) gt.checked = guideEnabled;
    var gw = document.getElementById('guideWidthSlider');
    if (gw) gw.value = guideWidth;
    var gwv = document.getElementById('guideWidthValue');
    if (gwv) gwv.textContent = guideWidth;
    var gdc = document.getElementById('guideColorInput');
    if (gdc) gdc.value = '#' + guideColor;
    var gdct = document.getElementById('guideColorText');
    if (gdct) gdct.textContent = '#' + guideColor.toUpperCase();
    var pc = document.getElementById('pieCountSelect');
    if (pc) pc.value = '' + pieCount;
    var qc = document.getElementById('quickCountSelect');
    if (qc) qc.value = '' + quickCount;
  }