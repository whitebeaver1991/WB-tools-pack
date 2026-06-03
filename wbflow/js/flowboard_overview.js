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
    zc.style.cssText = 'position:absolute;bottom:8px;right:8px;z-index:10;display:flex;gap:4px;align-items:center;';
    var zOut = el('button','','-',[{n:'background',v:'#2a2a2a'},{n:'border',v:'1px solid #444'},{n:'color',v:'#ccc'},{n:'border-radius',v:'3px'},{n:'cursor',v:'pointer'},{n:'font-size',v:'14px'},{n:'width',v:'24px'},{n:'height',v:'22px'},{n:'line-height',v:'14px'}]);
    var zLbl = el('span','','100%',[{n:'color',v:'#888'},{n:'font-size',v:'11px'},{n:'padding',v:'2px 6px'},{n:'min-width',v:'36px'},{n:'text-align',v:'center'}]);
    var zIn = el('button','','+',[{n:'background',v:'#2a2a2a'},{n:'border',v:'1px solid #444'},{n:'color',v:'#ccc'},{n:'border-radius',v:'3px'},{n:'cursor',v:'pointer'},{n:'font-size',v:'14px'},{n:'width',v:'24px'},{n:'height',v:'22px'},{n:'line-height',v:'14px'}]);
    zc.appendChild(zOut); zc.appendChild(zLbl); zc.appendChild(zIn);

    // Gear icon → zoom speed popup
    var gearBtn = document.createElement('button');
    gearBtn.textContent = '⚙';
    gearBtn.style.cssText = 'width:24px;height:22px;background:#2a2a2a;border:1px solid #444;color:#888;border-radius:3px;cursor:pointer;font-size:12px;line-height:14px;padding:0;';
    gearBtn.title = 'Zoom sensitivity';
    zc.appendChild(gearBtn);

    var zoomSpeed = 0.001;

    // Gear popup
    var gearPopup = document.createElement('div');
    gearPopup.style.cssText = 'display:none;position:absolute;bottom:34px;right:0;background:#1a1a1a;border:1px solid #444;border-radius:6px;padding:10px 14px;z-index:20;min-width:160px;';
    gearPopup.innerHTML =
        '<div style="color:#aaa;font-size:11px;margin-bottom:6px;">Zoom Speed</div>' +
        '<input id="ov-zoom-speed" type="range" min="1" max="10" value="5" style="width:100%;">' +
        '<div style="display:flex;justify-content:space-between;color:#666;font-size:10px;margin-top:2px;"><span>Slow</span><span id="ov-zoom-val">5</span><span>Fast</span></div>';
    gearPopup.addEventListener('click', function(ev2){ ev2.stopPropagation(); });
    zc.appendChild(gearPopup);

    var gearOpen = false;
    gearBtn.addEventListener('click', function(e){
        e.stopPropagation();
        gearOpen = !gearOpen;
        gearPopup.style.display = gearOpen ? 'block' : 'none';
        if (gearOpen) {
            var inp = document.getElementById('ov-zoom-speed');
            if (inp) { inp.value = Math.round(zoomSpeed * 5000); document.getElementById('ov-zoom-val').textContent = inp.value; }
        }
    });
    // Close popup on click outside
    document.addEventListener('click', function(){ gearOpen = false; gearPopup.style.display = 'none'; });
    // Update zoom speed from slider
    gearPopup.querySelector('input').addEventListener('input', function(){
        zoomSpeed = parseInt(this.value) / 5000;
        document.getElementById('ov-zoom-val').textContent = this.value;
    });

    canvas.appendChild(zc);

    var arrowBtn = document.createElement('button');
    arrowBtn.textContent = T('arrowMode');
    arrowBtn.id = 'ov-arrow-btn';
    arrowBtn.style.cssText = 'position:absolute;bottom:8px;left:8px;z-index:10;padding:4px 10px;background:#2a2a3a;border:1px solid #3a3a5a;color:#88c;border-radius:3px;cursor:pointer;font-size:11px;';
    canvas.appendChild(arrowBtn);

    var drawFrameBtn = document.createElement('button');
    drawFrameBtn.textContent = 'Draw Frame';
    drawFrameBtn.style.cssText = 'position:absolute;bottom:8px;left:95px;z-index:10;padding:4px 10px;background:#2a2a2a;border:1px solid #444;color:#999;border-radius:3px;cursor:pointer;font-size:11px;';
    canvas.appendChild(drawFrameBtn);

    var frameBtn = document.createElement('button');
    frameBtn.textContent = 'Frame';
    frameBtn.style.cssText = 'position:absolute;bottom:8px;left:170px;z-index:10;padding:4px 10px;background:#2a2a3a;border:1px solid #3a3a5a;color:#88c;border-radius:3px;cursor:pointer;font-size:11px;';
    frameBtn.title = 'Create a frame around selected cards (Ctrl+G)';
    canvas.appendChild(frameBtn);

    // ─── Arrow anchor system ──────────────
    var ANCHOR_SIDES = ['r','b','l','t'];
    var ANCHOR_OFFSET = 14; // px gap from card edge for anchor dots & arrow endpoints
    var ARROW_SVG = null;
    var ARROW_DRAW = null;
    var selectedCards = new Set();
    var drawFrameMode = false;

    // Compute anchor screen positions (card or frame), with offset from edges
    function getAnchors(el) {
        var r = el.getBoundingClientRect();
        var o = ANCHOR_OFFSET;
        return {
            r: { x: r.right + o, y: r.top + r.height/2 },
            l: { x: r.left - o,  y: r.top + r.height/2 },
            t: { x: r.left + r.width/2, y: r.top - o },
            b: { x: r.left + r.width/2, y: r.bottom + o }
        };
    }

    function showAnchors(show) {
        viewport.querySelectorAll('.ov-anchor').forEach(function(a){a.remove();});
        if (!show || !arrowModeActive) return;
        var dotSize = Math.max(8, Math.min(14, 12 / zoom));
        function addAnchorsFor(el, type, idx) {
            var vr = viewport.getBoundingClientRect();
            var anchors = getAnchors(el);
            ANCHOR_SIDES.forEach(function(side){
                var a = document.createElement('div');
                a.className = 'ov-anchor';
                a.dataset.type = type;
                a.dataset.idx = idx;
                a.dataset.side = side;
                a.style.cssText = 'position:absolute;width:'+dotSize+'px;height:'+dotSize+'px;background:#5a9bf5;border:2px solid #fff;border-radius:50%;z-index:5;cursor:crosshair;transform:translate(-50%,-50%);transition:transform 0.15s,background 0.15s;';
                var ap = anchors[side];
                a.style.left = ((ap.x - vr.left) / zoom) + 'px';
                a.style.top = ((ap.y - vr.top) / zoom) + 'px';
                a.addEventListener('mouseenter',function(){this.style.transform='translate(-50%,-50%) scale(1.4)';this.style.background='#7ab8ff';});
                a.addEventListener('mouseleave',function(){this.style.transform='translate(-50%,-50%)';this.style.background='#5a9bf5';});
                viewport.appendChild(a);
            });
        }
        cards.forEach(function(c,i){ addAnchorsFor(c, 'card', i); });
        viewport.querySelectorAll('.ov-frame').forEach(function(fr){
            var gi = parseInt(fr.dataset.gi);
            if (!isNaN(gi)) addAnchorsFor(fr, 'frame', gi);
        });
    }

    function arrowBtnClick() {
        arrowModeActive = !arrowModeActive;
        if (drawFrameMode) { drawFrameMode = false; drawFrameBtn.textContent = 'Draw Frame'; drawFrameBtn.style.background='#2a2a2a'; drawFrameBtn.style.borderColor='#444'; drawFrameBtn.style.color='#999'; selectedCards.clear(); cards.forEach(function(ca){ca.style.outline='';ca.style.borderColor='#383838';}); }
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

    // ─── Draw Frame mode ───
    function updateDrawFrameButton() {
        drawFrameMode = !drawFrameMode;
        drawFrameBtn.textContent = drawFrameMode ? 'Done' : 'Draw Frame';
        drawFrameBtn.style.background = drawFrameMode ? '#3a3a2a' : '#2a2a2a';
        drawFrameBtn.style.borderColor = drawFrameMode ? '#5a5a3a' : '#444';
        drawFrameBtn.style.color = drawFrameMode ? '#cc8' : '#999';
        if (drawFrameMode) {
            canvas.style.cursor = 'crosshair';
            arrowModeActive = false; updateArrowButton(); showAnchors(false);
            if (ARROW_SVG) { ARROW_SVG.remove(); ARROW_SVG = null; }
            setStatus('Drag on empty area to draw a frame. ESC to exit.');
        } else {
            canvas.style.cursor = 'grab';
            setStatus('');
        }
    }
    drawFrameBtn.addEventListener('click', function(){ updateDrawFrameButton(); });
    frameBtn.addEventListener('click', function(e){
        if (selectedCards.size > 0) {
            createVisualFrame();
        } else if (!drawFrameMode) {
            updateDrawFrameButton();
            setStatus('Select cards (click or box-select), then click Frame again. Or hold Shift+click Frame for empty frame.');
        } else {
            if (e.shiftKey) {
                // Create empty frame at center of viewport
                var vr = viewport.getBoundingClientRect();
                var cx = (vr.width / 2 - 150) / zoom;
                var cy = (vr.height / 2 - 100) / zoom;
                frames.push({
                    fx: Math.round(cx), fy: Math.round(cy),
                    fw: 300, fh: 200,
                    label: '', bg: 'rgba(60,90,160,0.18)', border: 'rgba(100,150,255,0.6)', labelColor: '#aac'
                });
                if (drawFrameMode) { drawFrameMode = false; updateDrawFrameButton(); }
                setStatus('Empty frame created. Drag to position, handles to resize.');
                drawFrames(); initFrameEdit(); markDirty();
            } else {
                setStatus('Select cards first, or Shift+click Frame for empty frame.');
            }
        }
    });

    function createVisualFrame() {
        if (selectedCards.size < 1) { setStatus('Select at least 1 card', true); return; }
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        selectedCards.forEach(function(si){
            var s = steps[si];
            if (!s) return;
            var cx = s.vx || 0, cy = s.vy || 0;
            if (cx < minX) minX = cx;
            if (cy < minY) minY = cy;
            if (cx + CARD_W > maxX) maxX = cx + CARD_W;
            if (cy + 200 > maxY) maxY = cy + 200;
        });
        if (minX === Infinity) return;
        var colors = [
            'rgba(60,90,160,0.18)',
            'rgba(160,60,90,0.18)',
            'rgba(60,160,90,0.18)',
            'rgba(160,130,60,0.18)'
        ];
        var borders = [
            'rgba(100,150,255,0.6)',
            'rgba(255,100,150,0.6)',
            'rgba(100,255,150,0.6)',
            'rgba(255,200,100,0.6)'
        ];
        var ci = frames.length % colors.length;
        frames.push({
            fx: minX - 20, fy: minY - 40,
            fw: maxX - minX + 40, fh: maxY - minY + 56,
            label: '', bg: colors[ci], border: borders[ci], labelColor: '#aac'
        });
        setStatus('Visual frame created. Drag to move, handles to resize, hover X to delete.');
        drawFrames(); initFrameEdit();
        markDirty();
    }

    function createGroupFromSelection() {
        if (selectedCards.size < 2) { setStatus('Select at least 2 cards', true); return; }
        // Check if all selected are already in one group → ungroup
        var existingGroup = null;
        selectedCards.forEach(function(si){
            var g = getGroupOfStep(si);
            if (g) {
                if (existingGroup === null) existingGroup = g;
                else if (existingGroup !== g) existingGroup = 'multiple';
            }
        });
        if (existingGroup && existingGroup !== 'multiple') {
            // All in same group → ungroup
            for (var gi = 0; gi < groups.length; gi++) {
                if (groups[gi] === existingGroup) {
                    groups.splice(gi, 1);
                    break;
                }
            }
            selectedCards.clear();
            cards.forEach(function(ca){ca.style.outline='';ca.style.borderColor='#383838';});
            setStatus('Group unlinked');
        } else {
            // Create new group (logical only, no visual frame)
            var indices = [];
            selectedCards.forEach(function(si){indices.push(si);});
            groups.push({stepIndices:indices});
            setStatus('Group created ('+indices.length+' steps). Cards now move together. Ctrl+G to toggle.');
        }
        markDirty();
    }

    // Ctrl+G: toggle group
    var escHandler = function(e) {
        if (e.key === 'Escape' && drawFrameMode) { drawFrameMode = false; updateDrawFrameButton(); }
    };
    var ctrlGHandler = function(e) {
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            if (selectedCards.size > 0) { createGroupFromSelection(); }
        }
    };
    document.addEventListener('keydown', escHandler);
    document.addEventListener('keydown', ctrlGHandler);
    function updateSelectLabel() {
        if (selectedCards.size > 0) setStatus(selectedCards.size + ' selected. Click-drag to move. Ctrl+G to group.');
        else setStatus('');
    }

    function getArrowElement(target) {
        if (typeof target === 'number' || typeof target === 'string') return cards[parseInt(target)];
        if (target.type === 'card') return cards[target.idx];
        if (target.type === 'frame') {
            var frs = viewport.querySelectorAll('.ov-frame');
            for (var fi = 0; fi < frs.length; fi++) {
                if (parseInt(frs[fi].dataset.gi) === target.idx) return frs[fi];
            }
        }
        return null;
    }

    // ─── Redraw stored arrows (SVG from canvas level) ──
    function redrawArrows() {
        while (svgLayer.firstChild) svgLayer.removeChild(svgLayer.firstChild);
        if (ARROW_SVG) svgLayer.appendChild(ARROW_SVG);
        arrows.forEach(function(a, ai) {
            var c1 = getArrowElement(a.from);
            var c2 = getArrowElement(a.to);
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

    // Auto-layout positions: continue from last placed card
    var autoX = 0, autoY = 0;
    for (var si = steps.length - 1; si >= 0; si--) {
        if (steps[si].vx !== undefined && !isNaN(steps[si].vx)) {
            autoX = steps[si].vx + CARD_W + 24;
            autoY = steps[si].vy;
            if (autoX > 1200) { autoX = 0; autoY += 260; }
            break;
        }
    }
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
        var cardBg = s.bg || '#222';
        card.style.cssText = 'position:absolute;left:0;top:0;width:'+CARD_W+'px;background:'+cardBg+';border:1px solid #383838;border-radius:8px;padding:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:transform 0.2s ease, opacity 0.2s ease, box-shadow 0.15s ease;';
        card.style.transform = 'translate(' + pos.x + 'px, ' + pos.y + 'px)';
        card.dataset.index = idx;

        // Color swatch (top-left corner outside card, like a badge)
        var swatch = document.createElement('div');
        swatch.className = 'ov-card-swatch';
        swatch.style.cssText = 'position:absolute;top:-8px;left:-8px;width:16px;height:16px;border-radius:50%;border:2px solid #555;background:'+(s.bg||'#222')+';cursor:pointer;z-index:5;box-shadow:0 1px 4px rgba(0,0,0,0.4);';
        card.appendChild(swatch);

        var popColors = ['#334','#433','#343','#344','#443','#434','#235','#325','#342','#432','#234','#324','#424','#242','#422','#442','#553','#535','#355'];
        swatch.addEventListener('click', function(e){
            e.stopPropagation();
            var existing = document.getElementById('ov-color-picker');
            if (existing) existing.remove();
            var pk = document.createElement('div');
            pk.id = 'ov-color-picker';
            pk.style.cssText = 'position:fixed;left:'+(e.clientX-80)+'px;top:'+(e.clientY+6)+'px;background:#1a1a1a;border:1px solid #444;border-radius:8px;padding:8px;z-index:999;display:flex;flex-wrap:wrap;gap:4px;width:172px;box-shadow:0 4px 16px rgba(0,0,0,0.6);';
            popColors.forEach(function(co){
                var dot = document.createElement('div');
                dot.style.cssText = 'width:22px;height:22px;border-radius:50%;border:2px solid #555;background:'+co+';cursor:pointer;';
                if (co === (s.bg||'#222')) dot.style.borderColor = '#7ab8ff';
                dot.addEventListener('click', function(ev2){
                    ev2.stopPropagation();
                    s.bg = co;
                    card.style.background = co;
                    swatch.style.background = co;
                    pk.remove();
                    markDirty();
                });
                pk.appendChild(dot);
            });
            // Custom color button
            var custBtn = document.createElement('div');
            custBtn.textContent = '+';
            custBtn.style.cssText = 'width:22px;height:22px;border-radius:50%;border:1px dashed #666;background:transparent;color:#888;font-size:14px;line-height:20px;text-align:center;cursor:pointer;';
            custBtn.title = 'Custom color';
            custBtn.addEventListener('click', function(ev2){
                ev2.stopPropagation();
                var inp = document.createElement('input');
                inp.type = 'color';
                inp.value = s.bg ? (s.bg.length > 7 ? '#888888' : s.bg) : '#222222';
                inp.addEventListener('input', function(){
                    var hex = this.value;
                    s.bg = hex;
                    card.style.background = hex;
                    swatch.style.background = hex;
                    markDirty();
                });
                inp.addEventListener('blur', function(){ pk.remove(); });
                inp.click();
            });
            pk.appendChild(custBtn);
            // Reset to default
            var resetBtn = document.createElement('div');
            resetBtn.textContent = '↺';
            resetBtn.title = 'Reset to default color';
            resetBtn.style.cssText = 'width:22px;height:22px;border-radius:50%;border:1px dashed #555;background:transparent;color:#999;font-size:15px;line-height:21px;text-align:center;cursor:pointer;';
            if (!s.bg) resetBtn.style.borderColor = '#7ab8ff';
            resetBtn.addEventListener('click', function(ev2){
                ev2.stopPropagation();
                delete s.bg;
                card.style.background = '#222';
                swatch.style.background = '#222';
                swatch.style.borderColor = '#555';
                pk.remove();
                markDirty();
            });
            pk.appendChild(resetBtn);
            document.body.appendChild(pk);
        });

        // Close color picker on outside click (added once)
        if (!window._ovColCloseAdded) { window._ovColCloseAdded = true;
            document.addEventListener('click', function(ev){
                var pk = document.getElementById('ov-color-picker');
                if (pk && !pk.contains(ev.target) && !ev.target.closest('.ov-card-swatch')) pk.remove();
            });
        }

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

    // ─── Tooltip system ──────────────
    var tooltipEl = null;
    function showTooltip(e, stepIdx) {
        var s = steps[stepIdx];
        if (!s) return;
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'ov-tooltip';
            tooltipEl.style.cssText = 'position:fixed;z-index:9999;background:#1a1a1a;border:1px solid #444;border-radius:6px;padding:10px 14px;font-size:12px;color:#ccc;max-width:380px;box-shadow:0 4px 20px rgba(0,0,0,0.6);pointer-events:none;line-height:1.5;';
            document.body.appendChild(tooltipEl);
        }
        var html = '<div style="font-weight:600;color:#eee;font-size:13px;margin-bottom:4px;">' + escHtml(s.title || (T("step") + " " + (stepIdx+1))) + '</div>';
        if (s.desc) html += '<div style="color:#999;margin-bottom:4px;">' + escHtml(s.desc) + '</div>';
        if (s.presets && s.presets.length) {
            html += '<div style="color:#6a6;font-size:11px;margin-top:2px;">' + T("presets") + ': ' + s.presets.map(function(p){return escHtml(p.name);}).join(', ') + '</div>';
        }
        html += '<div style="color:#666;font-size:10px;margin-top:4px;">' + T("step") + ' ' + (stepIdx+1) + ' / ' + steps.length + '</div>';
        tooltipEl.innerHTML = html;
        var cr = e.target.getBoundingClientRect();
        var tx = cr.right + 12, ty = cr.top;
        var maxW = 380;
        if (tx + maxW > window.innerWidth) tx = cr.left - maxW - 12;
        if (ty + 200 > window.innerHeight) ty = window.innerHeight - 210;
        if (tx < 4) tx = 4; if (ty < 4) ty = 4;
        tooltipEl.style.left = tx + 'px';
        tooltipEl.style.top = ty + 'px';
        tooltipEl.style.display = 'block';
    }
    function hideTooltip() { if (tooltipEl) tooltipEl.style.display = 'none'; }
    function escHtml(str) { if (!str) return ''; return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

        card.addEventListener('mouseenter',function(e){this.style.outline='1px solid #88ccff';showTooltip(e,parseInt(this.dataset.index));});
        card.addEventListener('mouseleave',function(){hideTooltip();if(!selectedCards.has(parseInt(this.dataset.index))){this.style.outline='';this.style.borderColor='';}});
        cards.push(card);
        viewport.appendChild(card);
    });

        // ─── Group helpers ──────────────
    function getGroupOfStep(idx) {
        for (var gi = 0; gi < groups.length; gi++) {
            if (groups[gi].stepIndices.indexOf(idx) >= 0) return groups[gi];
        }
        return null;
    }
    function getGroupBounds(g) {
        // Use custom bounds if set, otherwise auto from cards
        if (g.fx !== undefined && g.fw !== undefined) {
            return { x: g.fx, y: g.fy, w: g.fw, h: g.fh };
        }
        var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        g.stepIndices.forEach(function(si){
            var s = steps[si];
            if (!s) return;
            var cx = s.vx || 0;
            var cy = s.vy || 0;
            if (cx < minX) minX = cx;
            if (cy < minY) minY = cy;
            if (cx + CARD_W > maxX) maxX = cx + CARD_W;
            if (cy + 200 > maxY) maxY = cy + 200;
        });
        return minX === Infinity ? null : { x: minX - 16, y: minY - 36, w: maxX - minX + 32, h: maxY - minY + 48 };
    }

    // Find all card indices along the arrow path from `fromIdx` to `toIdx` (BFS in undirected graph)
    function findArrowPath(fromIdx, toIdx) {
        // Build adjacency list from arrows (undirected)
        var adj = {};
        arrows.forEach(function(a){
            var fi = (typeof a.from === 'object' ? a.from.idx : parseInt(a.from));
            var ti = (typeof a.to === 'object' ? a.to.idx : parseInt(a.to));
            if (isNaN(fi) || isNaN(ti)) return;
            if (!adj[fi]) adj[fi] = [];
            if (!adj[ti]) adj[ti] = [];
            if (adj[fi].indexOf(ti) < 0) adj[fi].push(ti);
            if (adj[ti].indexOf(fi) < 0) adj[ti].push(fi);
        });
        if (!adj[fromIdx] || !adj[toIdx]) return [];
        // BFS
        var visited = {}, queue = [[fromIdx]];
        visited[fromIdx] = true;
        while (queue.length) {
            var path = queue.shift();
            var node = path[path.length - 1];
            if (node === toIdx) return path;
            (adj[node] || []).forEach(function(nei){
                if (!visited[nei]) {
                    visited[nei] = true;
                    queue.push(path.concat([nei]));
                }
            });
        }
        return [];
    }

    // ─── Frame interaction state ──────
    var frameDragState = null; // { gi, mode:'move'|'resize', edge, startX, startY, origBounds }

    // ─── Draw frame boxes for groups (with move/resize/delete) ───
    function drawFrames() {
        viewport.querySelectorAll('.ov-frame').forEach(function(el){el.remove();});
        frames.forEach(function(g, gi){
            if (g.fx === undefined || g.fw === undefined) return;
            var b = getGroupBounds(g);
            if (!b) return;
            var f = document.createElement('div');
            f.className = 'ov-frame';
            f.dataset.gi = gi;
            f.style.cssText = 'position:absolute;left:'+b.x+'px;top:'+b.y+'px;width:'+b.w+'px;height:'+b.h+'px;background:'+(g.bg||'rgba(60,90,160,0.18)')+';border:2px dashed '+(g.border||'rgba(100,150,255,0.6)')+';border-radius:10px;z-index:0;';

            // Label
            var lbl = document.createElement('div');
            lbl.style.cssText = 'position:absolute;top:-20px;left:10px;font-size:11px;color:'+(g.labelColor||'#88c')+';font-weight:600;white-space:nowrap;pointer-events:none;';
            lbl.textContent = g.label || (T('step')+' Frame '+(gi+1));
            f.appendChild(lbl);

            // Delete button (red circle X) — hidden by default, shown on hover
            var delBtn = document.createElement('div');
            delBtn.className = 'ov-frame-del';
            delBtn.innerHTML = '&times;';
            delBtn.title = 'Delete frame';
            delBtn.style.cssText = 'position:absolute;top:-10px;right:-10px;width:20px;height:20px;border-radius:50%;background:#c33;color:#fff;font-size:13px;font-weight:700;line-height:20px;text-align:center;cursor:pointer;z-index:5;display:none;box-shadow:0 1px 4px rgba(0,0,0,0.5);';
            delBtn.addEventListener('click', function(e){
                e.stopPropagation();
                if (confirm('Delete this frame?')) {
                    frames.splice(gi, 1);
                    drawFrames();
                    initFrameEdit();
                    markDirty();
                }
            });
            f.appendChild(delBtn);

            // Show delete button on hover
            f.addEventListener('mouseenter', function(){ delBtn.style.display = 'block'; });
            f.addEventListener('mouseleave', function(){ delBtn.style.display = 'none'; });

            // Move handle (entire frame body acts as drag handle)
            f.addEventListener('mousedown', function(e){
                if (e.target !== delBtn && delBtn.style.display !== 'block') {
                    // Start move
                    frameDragState = {
                        gi: gi, mode: 'move',
                        startX: e.clientX, startY: e.clientY,
                        origBounds: { x: b.x, y: b.y, w: b.w, h: b.h }
                    };
                    e.preventDefault();
                }
            });

            // Resize handles (8 points: 4 corners + 4 edges)
            var edges = [
                { name:'nw', x:-4, y:-4, w:8, h:8, cursor:'nwse-resize', edge:'nw' },
                { name:'n',  x:'50%', y:-4, w:8, h:8, cursor:'ns-resize', edge:'n' },
                { name:'ne', x:'calc(100% - 4px)', y:-4, w:8, h:8, cursor:'nesw-resize', edge:'ne' },
                { name:'e',  x:'calc(100% - 4px)', y:'50%', w:8, h:8, cursor:'ew-resize', edge:'e' },
                { name:'se', x:'calc(100% - 4px)', y:'calc(100% - 4px)', w:8, h:8, cursor:'nwse-resize', edge:'se' },
                { name:'s',  x:'50%', y:'calc(100% - 4px)', w:8, h:8, cursor:'ns-resize', edge:'s' },
                { name:'sw', x:-4, y:'calc(100% - 4px)', w:8, h:8, cursor:'nesw-resize', edge:'sw' },
                { name:'w',  x:-4, y:'50%', w:8, h:8, cursor:'ew-resize', edge:'w' }
            ];
            edges.forEach(function(ed){
                var h = document.createElement('div');
                h.className = 'ov-frame-handle ov-frame-handle-' + ed.name;
                h.style.cssText = 'position:absolute;left:'+ed.x+';top:'+ed.y+';width:'+ed.w+'px;height:'+ed.h+'px;background:#7ab8ff;border:1px solid #fff;border-radius:2px;cursor:'+ed.cursor+';z-index:3;';
                h.addEventListener('mousedown', function(e){
                    e.stopPropagation();
                    frameDragState = {
                        gi: gi, mode: 'resize', edge: ed.edge,
                        startX: e.clientX, startY: e.clientY,
                        origBounds: { x: b.x, y: b.y, w: b.w, h: b.h }
                    };
                    e.preventDefault();
                });
                f.appendChild(h);
            });

            viewport.insertBefore(f, viewport.firstChild);
        });
    }

    // ─── Frame drag handler (move & resize) on document ──────────
    function initFrameDrag() {
        // Cleanup old listener
        if (window._frameDragCleanup) window._frameDragCleanup();
        var onMove = function(e){
            if (!frameDragState) return;
            var s = frameDragState, ob = s.origBounds;
            var dx = (e.clientX - s.startX) / zoom;
            var dy = (e.clientY - s.startY) / zoom;
            var g = frames[s.gi];
            if (!g) return;

            if (s.mode === 'move') {
                g.fx = Math.round(ob.x + dx);
                g.fy = Math.round(ob.y + dy);
                g.fw = ob.w;
                g.fh = ob.h;
            } else if (s.mode === 'resize') {
                var ed = s.edge;
                var nx = ob.x, ny = ob.y, nw = ob.w, nh = ob.h;
                if (ed.indexOf('e') >= 0) nw = Math.max(60, ob.w + dx);
                if (ed.indexOf('w') >= 0) { nx = ob.x + dx; nw = Math.max(60, ob.w - dx); }
                if (ed.indexOf('s') >= 0) nh = Math.max(40, ob.h + dy);
                if (ed.indexOf('n') >= 0) { ny = ob.y + dy; nh = Math.max(40, ob.h - dy); }
                g.fx = Math.round(nx);
                g.fy = Math.round(ny);
                g.fw = Math.round(nw);
                g.fh = Math.round(nh);
            }
            drawFrames();
            markDirty();
        };
        var onUp = function(e){
            if (frameDragState) {
                frameDragState = null;
                markDirty();
            }
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        window._frameDragCleanup = function(){
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
    }

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
        var vr=viewport.getBoundingClientRect(); contentW=Math.max(vr.width,600); contentH=Math.max(vr.height,400); clampPan(); applyTransform(); redrawArrows(); drawFrames(); initFrameDrag();
    });

    function onZoom(){clampPan();applyTransform();updateZoomLabel();redrawArrows();drawFrames();if(arrowModeActive)showAnchors(true);}
    zOut.addEventListener('click',function(){zoom=Math.max(0.3,zoom-0.1);onZoom();});
    zIn.addEventListener('click',function(){zoom=Math.min(3,zoom+0.1);onZoom();});
    var wheelHandler = function(e){
        e.preventDefault();
        var cr=canvas.getBoundingClientRect();
        var sx=e.clientX-cr.left, sy=e.clientY-cr.top;
        var cw=cr.width, ch=cr.height;
        var oldZ=zoom;
        zoom=Math.max(0.3,Math.min(3,zoom-e.deltaY*zoomSpeed));
        panX = sx - cw/2 - (sx - cw/2 - panX) * zoom / oldZ;
        panY = sy - ch/2 - (sy - ch/2 - panY) * zoom / oldZ;
        onZoom();
    };
    canvas.addEventListener('wheel', wheelHandler, {passive:false});
    canvas._wheelCleanup = function(){ canvas.removeEventListener('wheel', wheelHandler); };

    // FIX 1: Window resize → redraw arrows so SVG coordinates stay in sync
    var resizeHandler = function(){ redrawArrows(); showAnchors(arrowModeActive); };
    window.addEventListener('resize', resizeHandler);
    var prevCleanup = canvas._wheelCleanup;
    canvas._wheelCleanup = function(){ canvas.removeEventListener('wheel', wheelHandler); prevCleanup(); window.removeEventListener('resize', resizeHandler); document.removeEventListener('keydown', escHandler); document.removeEventListener('keydown', ctrlGHandler); };

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
                var atype = anchor.dataset.type || 'card';
                var aidx = parseInt(anchor.dataset.idx);
                var side = anchor.dataset.side;
                ARROW_DRAW = { fromType: atype, fromIdx: aidx, fromSide: side };
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

        // Walk up from target; if any intermediate element is interactive, skip card selection
        if (onCard) {
            var el = t;
            while (el && el !== onCard) {
                if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.tagName === 'IMG' || (el.classList && el.classList.contains('ov-card-swatch'))) {
                    return;
                }
                el = el.parentNode;
            }
        }

        // Left-click on card: select/deselect, Ctrl=multi, Shift=arrow-path
        if(onCard && !arrowModeActive && !drawFrameMode){
            var ci=parseInt(onCard.dataset.index);
            if (e.ctrlKey) {
                // Ctrl+click: toggle multi-select
                if (selectedCards.has(ci)) {
                    selectedCards.delete(ci);
                    onCard.style.outline=''; onCard.style.borderColor='#383838';
                } else {
                    selectedCards.add(ci);
                    onCard.style.outline='2px solid #7ab8ff'; onCard.style.borderColor='#7ab8ff';
                }
                updateSelectLabel();
                return;
            }
            if (e.shiftKey && selectedCards.size > 0) {
                // Shift+click: select all cards along arrow path between last selected and this
                var lastIdx = null;
                selectedCards.forEach(function(si){ lastIdx = si; });
                var pathCards = findArrowPath(lastIdx, ci);
                if (pathCards && pathCards.length > 0) {
                    pathCards.forEach(function(pi){
                        selectedCards.add(pi);
                        if (cards[pi]) { cards[pi].style.outline='2px solid #7ab8ff'; cards[pi].style.borderColor='#7ab8ff'; }
                    });
                }
                updateSelectLabel();
                return;
            }
            if(selectedCards.has(ci)){
                // Already selected → group drag all selected cards + group members
                  if (selectedCards.size > 0) {
                          var selSet = new Set(); selectedCards.forEach(function(si){selSet.add(si);});
                          var added = true;
                          while (added) {
                              added = false;
                              selSet.forEach(function(si){
                                  var g = getGroupOfStep(si);
                                  if (g) g.stepIndices.forEach(function(gsi){
                                      if (!selSet.has(gsi)) { selSet.add(gsi); added = true; }
                                  });
                              });
                          }
                          var selCopy = []; selSet.forEach(function(si){selCopy.push(si);});
                        var lx=screenToLocalX(e.clientX);
                        var ly=screenToLocalY(e.clientY);
                        var groupOffsets = {};
                        selCopy.forEach(function(si){
                            var sc = cards[si]; if(!sc)return;
                            sc.style.zIndex='100';sc.style.pointerEvents='none';
                            sc.style.opacity='0.85';sc.style.transition='none';
                            var sx = steps[si].vx || 0;
                            var sy = steps[si].vy || 0;
                            groupOffsets[si] = { dx: lx - CARD_W/2 - sx, dy: ly - 20 - sy };
                        });
                        var dragUp = function(ev2){
                            document.removeEventListener('mouseup', dragUp);
                            document.removeEventListener('mousemove', dragMove);
                            if (!dragState) return;
                            var ds = dragState; dragState = null;
                            selCopy.forEach(function(si){
                                var sc = cards[si]; if(!sc)return;
                                sc.style.transition='none';sc.style.zIndex='';
                                sc.style.pointerEvents='';sc.style.opacity='';
                                sc.style.outline='2px solid #7ab8ff';sc.style.borderColor='#7ab8ff';
                            });
                            updateViewportSize();
                            contentW = Math.max(viewport.offsetWidth, 600);
                            contentH = Math.max(viewport.offsetHeight, 400);
                            clampPan(); applyTransform(); redrawArrows(); drawFrames(); markDirty();
                            panState=null;canvas.style.cursor='';
                        };
                        var dragMove = function(ev2){
                            var lx2=screenToLocalX(ev2.clientX);
                            var ly2=screenToLocalY(ev2.clientY);
                            selCopy.forEach(function(si){
                                var sc = cards[si]; if(!sc)return;
                                var off = groupOffsets[si];
                                var nx = lx2 - CARD_W/2 - off.dx;
                                var ny = ly2 - 20 - off.dy;
                                sc.style.transform='translate('+nx+'px,'+ny+'px)';
                                steps[si].vx = Math.round(nx);
                                steps[si].vy = Math.round(ny);
                            });
                        };
                        dragState={idx:ci,card:onCard};
                        document.addEventListener('mouseup', dragUp);
                        document.addEventListener('mousemove', dragMove);
                        return;
                    }
                } else {
                    // Click on unselected card → clear other selections, select this card, then drag it
                    selectedCards.forEach(function(si){
                        if (cards[si]) { cards[si].style.outline=''; cards[si].style.borderColor='#383838'; }
                    });
                    selectedCards.clear();
                    selectedCards.add(ci);
                    onCard.style.outline='2px solid #7ab8ff';onCard.style.borderColor='#7ab8ff';
                    updateSelectLabel();
                    // Start single-card drag immediately
                    var lx=screenToLocalX(e.clientX);
                    var ly=screenToLocalY(e.clientY);
                    onCard.style.zIndex='100';onCard.style.pointerEvents='none';
                    onCard.style.opacity='0.85';onCard.style.transition='none';
                    onCard.style.transform='translate('+(lx-CARD_W/2)+'px,'+(ly-20)+'px)';
                    var dragUp2 = function(ev2){
                        document.removeEventListener('mouseup', dragUp2);
                        document.removeEventListener('mousemove', dragMove2);
                        if (!dragState) return;
                        dragState = null;
                        onCard.style.transition='none';onCard.style.zIndex='';
                        onCard.style.pointerEvents='';onCard.style.opacity='';
                        onCard.style.outline='2px solid #7ab8ff';onCard.style.borderColor='#7ab8ff';
                        steps[ci].vx = Math.round(screenToLocalX(ev2.clientX) - CARD_W/2);
                        steps[ci].vy = Math.round(screenToLocalY(ev2.clientY) - 20);
                        updateViewportSize();
                        contentW = Math.max(viewport.offsetWidth, 600);
                        contentH = Math.max(viewport.offsetHeight, 400);
                        clampPan(); applyTransform(); redrawArrows(); drawFrames(); markDirty();
                        panState=null;
                    };
                    var dragMove2 = function(ev2){
                        var lx2=screenToLocalX(ev2.clientX);
                        var ly2=screenToLocalY(ev2.clientY);
                        steps[ci].vx = Math.round(lx2 - CARD_W/2);
                        steps[ci].vy = Math.round(ly2 - 20);
                        onCard.style.transform='translate('+(lx2-CARD_W/2)+'px,'+(ly2-20)+'px)';
                    };
                    dragState={idx:ci,card:onCard};
                    document.addEventListener('mouseup', dragUp2);
                    document.addEventListener('mousemove', dragMove2);
                }
                updateSelectLabel();
                return;
            } // end of 'clicked on card' block

        // Draw Frame mode: drag empty area to draw a frame box
        if (drawFrameMode && !onCard) {
            var dfSX = e.clientX, dfSY = e.clientY;
            var dfRect = document.createElement('div');
            dfRect.style.cssText = 'position:fixed;border:2px dashed #7ab8ff;background:rgba(60,90,160,0.15);z-index:999;pointer-events:none;display:none;';
            document.body.appendChild(dfRect);
            var dfMove = function(ev2){
                var x = Math.min(dfSX, ev2.clientX);
                var y = Math.min(dfSY, ev2.clientY);
                var w = Math.abs(ev2.clientX - dfSX);
                var h = Math.abs(ev2.clientY - dfSY);
                if (w > 8 && h > 8) { dfRect.style.display='block'; dfRect.style.left=x+'px'; dfRect.style.top=y+'px'; dfRect.style.width=w+'px'; dfRect.style.height=h+'px'; }
            };
            var dfUp = function(ev2){
                document.removeEventListener('mousemove', dfMove);
                document.removeEventListener('mouseup', dfUp);
                if (dfRect.parentNode) dfRect.parentNode.removeChild(dfRect);
                var x1=Math.min(dfSX,ev2.clientX), y1=Math.min(dfSY,ev2.clientY);
                var w=Math.abs(ev2.clientX-dfSX), h=Math.abs(ev2.clientY-dfSY);
                if (w>=30 && h>=20) {
                    var ir=inner.getBoundingClientRect();
                    var slx=(x1-ir.left)/zoom, sly=(y1-ir.top)/zoom;
                    var colors=['rgba(60,90,160,0.18)','rgba(160,60,90,0.18)','rgba(60,160,90,0.18)','rgba(160,130,60,0.18)'];
                    var borders=['rgba(100,150,255,0.6)','rgba(255,100,150,0.6)','rgba(100,255,150,0.6)','rgba(255,200,100,0.6)'];
                    frames.push({ fx:Math.round(slx), fy:Math.round(sly), fw:Math.round(w/zoom), fh:Math.round(h/zoom), label:'', bg:colors[frames.length%4], border:borders[frames.length%4], labelColor:'#aac' });
                    drawFrames(); initFrameEdit(); markDirty();
                    setStatus('Frame created.');
                }
            };
            document.addEventListener('mousemove', dfMove);
            document.addEventListener('mouseup', dfUp);
            return;
        }

        // Click empty space (default): rubber-band box-select
        if (!arrowModeActive && !drawFrameMode && !onCard) {
            var selStartX = e.clientX, selStartY = e.clientY;
            var selRect = document.createElement('div');
            selRect.id = 'ov-sel-rect';
            selRect.style.cssText = 'position:fixed;border:1px solid #7ab8ff;background:rgba(90,155,245,0.1);z-index:999;pointer-events:none;display:none;';
            document.body.appendChild(selRect);

                var selMove = function(ev2){
                    var x = Math.min(selStartX, ev2.clientX);
                    var y = Math.min(selStartY, ev2.clientY);
                    var w = Math.abs(ev2.clientX - selStartX);
                    var h = Math.abs(ev2.clientY - selStartY);
                    if (w > 4 || h > 4) {
                        selRect.style.display = 'block';
                        selRect.style.left = x + 'px';
                        selRect.style.top = y + 'px';
                        selRect.style.width = w + 'px';
                        selRect.style.height = h + 'px';
                    }
                };
                var selUp = function(ev2){
                    document.removeEventListener('mousemove', selMove);
                    document.removeEventListener('mouseup', selUp);
                    if (selRect.parentNode) selRect.parentNode.removeChild(selRect);
                    selRect.remove();

                    var x1 = Math.min(selStartX, ev2.clientX);
                    var y1 = Math.min(selStartY, ev2.clientY);
                    var x2 = Math.max(selStartX, ev2.clientX);
                    var y2 = Math.max(selStartY, ev2.clientY);
                    var w = x2 - x1, h = y2 - y1;

                    if (w < 5 && h < 5) {
                        // Just a click, not a drag → clear selection
                        selectedCards.clear();
                        cards.forEach(function(ca){ca.style.outline='';ca.style.borderColor='#383838';});
                        updateSelectLabel();
                        return;
                    }

                    // Select all cards within the rectangle
                    cards.forEach(function(ca, idx){
                        var r = ca.getBoundingClientRect();
                        // Check if card overlaps with selection rect
                        if (r.left < x2 && r.right > x1 && r.top < y2 && r.bottom > y1) {
                            selectedCards.add(idx);
                            ca.style.outline = '2px solid #7ab8ff';
                            ca.style.borderColor = '#7ab8ff';
                        } else {
                            selectedCards.delete(idx);
                            ca.style.outline = '';
                            ca.style.borderColor = '#383838';
                        }
                    });
                    updateSelectLabel();
                };
                document.addEventListener('mousemove', selMove);
                document.addEventListener('mouseup', selUp);
                return;
            }

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
                onCard.style.transform='translate('+(lx-CARD_W/2)+'px,'+(ly-20)+'px)';

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

                    // Move grouped steps together
                    var grp = getGroupOfStep(ds.idx);
                    if (grp) {
                        var dx2 = fx - (steps[ds.idx].vx || 0);
                        var dy2 = fy - (steps[ds.idx].vy || 0);
                        // Actually the offset is already in fx/fy, we need relative to saved position
                        var origVx = steps[ds.idx].vx - dx2;
                        var origVy = steps[ds.idx].vy - dy2;
                        // Recalculate properly
                        grp.stepIndices.forEach(function(si){
                            if (si === ds.idx) return;
                            var oCard = cards[si];
                            if (!oCard) return;
                            // The card's current transform already has the new position
                            // Just need to update steps[si].vx/vy
                            var match = oCard.style.transform.match(/translate\(([\d.-]+)px,\s*([\d.-]+)px\)/);
                            if (match) {
                                steps[si].vx = Math.round(parseFloat(match[1]));
                                steps[si].vy = Math.round(parseFloat(match[2]));
                            }
                        });
                    }

                    updateViewportSize();
                    contentW = Math.max(viewport.offsetWidth, 600);
                    contentH = Math.max(viewport.offsetHeight, 400);
                    clampPan(); applyTransform();
                    redrawArrows(); drawFrames();
                    markDirty();
                    panState=null;canvas.style.cursor='';
                };
                var dragMove = function(ev2){
                    var lx2=screenToLocalX(ev2.clientX);
                    var ly2=screenToLocalY(ev2.clientY);
                    onCard.style.transform='translate('+(lx2-CARD_W/2)+'px,'+(ly2-20)+'px)';
                    // Move grouped cards together
                    var grp = getGroupOfStep(ci);
                    if (grp && dragState && dragState.startOffsets) {
                        grp.stepIndices.forEach(function(si){
                            if (si === ci) return;
                            var sc = cards[si]; if (!sc) return;
                            var off = dragState.startOffsets[si];
                            if (off) {
                                sc.style.transition='none';
                                sc.style.transform='translate('+(lx2-CARD_W/2 - off.dx)+'px,'+(ly2-20 - off.dy)+'px)';
                            }
                        });
                    }
                };
                // Store group offsets for group drag (non-select mode)
                var grp = getGroupOfStep(ci);
                var startOffsets = {};
                if (grp) {
                    var lx0 = screenToLocalX(e.clientX);
                    var ly0 = screenToLocalY(e.clientY);
                    grp.stepIndices.forEach(function(si){
                        if (si === ci) return;
                        var sx = steps[si].vx || 0;
                        var sy = steps[si].vy || 0;
                        startOffsets[si] = { dx: lx0 - CARD_W/2 - sx, dy: ly0 - 20 - sy };
                    });
                }
                dragState={idx:ci,card:onCard,startOffsets:startOffsets};
                document.addEventListener('mouseup', dragUp);
                document.addEventListener('mousemove', dragMove);
            },300);
            panState={startX:e.clientX,startY:e.clientY,pX:panX,pY:panY,mode:'click'};
        } else if (!drawFrameMode) {panState={startX:e.clientX,startY:e.clientY,pX:panX,pY:panY,mode:'pan'};canvas.style.cursor='grabbing';}
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
                var srcEl = getArrowElement({ type: ARROW_DRAW.fromType || 'card', idx: ARROW_DRAW.fromIdx });
                if (srcEl) {
                    var ac = getAnchors(srcEl);
                    var ap = ac[ARROW_DRAW.fromSide];
                    ARROW_DRAW.startScreenX = ap.x;
                    ARROW_DRAW.startScreenY = ap.y;
                    x1 = ap.x; y1 = ap.y;
                }
            }
            var lx = screenToLocalX(e.clientX);
            var ly = screenToLocalY(e.clientY);
            var x2 = e.clientX, y2 = e.clientY;

            var nearestDist = 999, nearestAnchor = -1, nearestSide = '', nearestType = 'card';
            viewport.querySelectorAll('.ov-anchor').forEach(function(an){
                if (an.dataset.type == ARROW_DRAW.fromType && parseInt(an.dataset.idx) == ARROW_DRAW.fromIdx && an.dataset.side == ARROW_DRAW.fromSide) return;
                var ar = an.getBoundingClientRect();
                var ax = ar.left + ar.width/2, ay = ar.top + ar.height/2;
                var d = Math.sqrt((ax-e.clientX)*(ax-e.clientX)+(ay-e.clientY)*(ay-e.clientY));
                if (d < nearestDist) { nearestDist = d; nearestAnchor = parseInt(an.dataset.idx); nearestSide = an.dataset.side; nearestType = an.dataset.type || 'card'; }
            });
            ARROW_DRAW._nearAnchor = (nearestDist < 25) ? { type: nearestType || 'card', idx: nearestAnchor, side: nearestSide } : null;

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
                var fromObj = { type: ARROW_DRAW.fromType || 'card', idx: ARROW_DRAW.fromIdx };
                var toObj = { type: ARROW_DRAW._nearAnchor.type || 'card', idx: ARROW_DRAW._nearAnchor.idx };
                arrows.push({
                    from: fromObj,
                    fromSide: ARROW_DRAW.fromSide,
                    to: toObj,
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

    applyTransform();updateZoomLabel();updateUIStrings();}
    // END renderOverview
