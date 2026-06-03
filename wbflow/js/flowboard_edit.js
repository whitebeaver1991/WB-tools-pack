// ─── Edit mode render ─────────────────
function renderEditMode(canvas) {
    canvas.style.cssText = '';
    canvas.style.cursor = '';
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    canvas.onmouseup = null;
    canvas.onmouseleave = null;
    canvas._wheelCleanup && canvas._wheelCleanup();

    steps.forEach(function(s, idx) {
        var card = el('div','step-card','',[]);
        card.dataset.index = idx;

        var hdr = el('div','step-header');
        hdr.appendChild(el('span','step-handle','\u2261'));
        hdr.appendChild(el('span','step-num',T('step')+' '+(idx+1)+(s.title?': '+s.title:'')));

        var inp = document.createElement('input');
        inp.className = 'step-title'; inp.type = 'text';
        inp.value = s.title||''; inp.placeholder = T('titlePH');
        inp.style.userSelect = 'text';
        inp.addEventListener('input',function(){s.title=this.value;markDirty();});
        hdr.appendChild(inp);

        hdr.appendChild(el('span','','',[{n:'flex',v:'1'}]));

        var db = document.createElement('button');
        db.className = 'btn-del-step'; db.innerHTML = '&times;'; db.title = T('delStep');
        db.addEventListener('click',function(){if(confirm(T('confirmDel')+' '+(idx+1)+'?')){steps.splice(idx,1);render();markDirty();}});
        hdr.appendChild(db);
        card.appendChild(hdr);

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

        var ta = document.createElement('textarea');
        ta.className = 'step-desc'; ta.value = s.desc||''; ta.placeholder = T('descPH');
        ta.style.userSelect = 'text';
        ta.addEventListener('input',function(){s.desc=this.value;markDirty();});
        card.appendChild(ta);

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
                    var dropIdx = rects.length;
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
