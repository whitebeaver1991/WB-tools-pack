// ─── Global helpers ─────────────────
function normalizeArrow(a) {
    return {
        from: (typeof a.from === 'number' ? {type:'card', idx:a.from} : a.from),
        fromSide: a.fromSide || 'r',
        to: (typeof a.to === 'number' ? {type:'card', idx:a.to} : a.to),
        toSide: a.toSide || 'l'
    };
}

// Auto-repair preset paths: detect paths pointing to corrupted _ffx/ copies
// and try to restore original paths
function repairPaths() {
    var repaired = 0;
    steps.forEach(function(s){
        (s.presets||[]).forEach(function(p){
            if (!p.path) return;
            // If path points to a _ffx/ directory, it was corrupted by old copyFile bug
            if (p.path.indexOf('_ffx/') >= 0 || p.path.indexOf('_ffx\\') >= 0) {
                // Try origPath first
                if (p.origPath && p.origPath !== p.path && p.origPath.indexOf('_ffx/') < 0 && p.origPath.indexOf('_ffx\\') < 0) {
                    p.path = p.origPath;
                    repaired++;
                    return;
                }
                // Try using exportPath if it exists and points to valid file
                if (p.exportPath && p.exportPath.indexOf('_ffx/') < 0 && p.exportPath.indexOf('_ffx\\') < 0) {
                    p.path = p.exportPath;
                    repaired++;
                    return;
                }
                // Reconstruct: look in project folder for the same filename
                var name = p.path.split('\\').pop().split('/').pop();
                if (name && projectFolder) {
                    p.path = projectFolder.replace(/\/$/,'') + '/' + name;
                    repaired++;
                    return;
                }
                // Last resort: just strip the _ffx/ directory prefix
                var idx = p.path.indexOf('_ffx/');
                if (idx < 0) idx = p.path.indexOf('_ffx\\');
                if (idx >= 0) {
                    p.path = p.path.substring(0, idx) + p.path.substring(idx + 5);
                    repaired++;
                    return;
                }
            }
        });
    });
    if (repaired > 0) {
        setStatus('Repaired ' + repaired + ' preset path(s). Please verify presets still work.', false);
        markDirty();
    }
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
    var pathToUse = (typeof p === 'string') ? p : p.path;
    // If p.path is a corrupted _ffx/ copy, use exportPath or origPath
    if (typeof p !== 'string') {
        if (pathToUse && (pathToUse.indexOf('_ffx/') >= 0 || pathToUse.indexOf('_ffx\\') >= 0)) {
            pathToUse = p.exportPath || p.origPath || pathToUse;
        }
    }
    evalScript('applyFFX('+JSON.stringify(pathToUse)+')').then(function(r){
        if (r !== 'OK') setStatus(T('failed') + ' ' + r + ' [' + pathToUse + ']', true);
        else setStatus(T('applied'));
    });
}
function applyAllPresets(idx) {
    var pr = steps[idx].presets;
    if (!pr||!pr.length){setStatus(T('presets')+' empty',true);return;}
    var c=Promise.resolve();
    pr.forEach(function(p,i){
        c=c.then(function(){return new Promise(function(r){
            var pathToUse = p.path;
            if (pathToUse && (pathToUse.indexOf('_ffx/') >= 0 || pathToUse.indexOf('_ffx\\') >= 0)) {
                pathToUse = p.exportPath || p.origPath || pathToUse;
            }
            if(pathToUse) evalScript('applyFFX('+JSON.stringify(pathToUse)+')').then(function(x){
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
    var data = JSON.stringify({version:1,steps:steps,arrows:arrows,groups:groups,frames:frames,projectFolder:projectFolder},null,2);
    evalScript('saveFlowDialog('+JSON.stringify(data)+')').then(function(r){
        if(!r||r==='CANCEL')return;
        filePath=r; fileDirty=false;
        saveSession();
        doSave(r);
    });
}

function doSave(path) {
    var data = JSON.stringify({version:1,steps:steps,arrows:arrows,groups:groups,frames:frames,projectFolder:projectFolder},null,2);
    makePortable(path, data);
}

function makePortable(wbflowPath, rawJson) {
    var obj;
    try { obj = JSON.parse(rawJson); } catch(e) { fallbackSave(wbflowPath,rawJson); return; }
    var base = wbflowPath.replace(/\.wbflow$/i,'');
    var ffxDir = base + '_ffx/';
    var promises = [];

    // Copy .ffx files — p.path always stays original; copied path goes to p.exportPath
    var copyPlan = []; // [{src, dst, si, pi}]
    if (obj.steps) obj.steps.forEach(function(s,i){
        if (s.presets) s.presets.forEach(function(p,j){
            if (p.path && p.path.match(/\.ffx$/i)) {
                if (p.path.indexOf('_ffx/') >= 0 || p.path.indexOf('_ffx\\') >= 0) return;
                var name = p.path.split('\\').pop().split('/').pop();
                copyPlan.push({src:p.path, dst:ffxDir + name, si:i, pi:j});
                p.origPath = p.path;
                delete p.exportPath;
            }
        });
    });
    if (copyPlan.length > 0) {
        var pairs = copyPlan.map(function(c){ return [c.src, c.dst]; });
        promises.push(evalScript('ensureDir('+JSON.stringify(ffxDir)+')'));
        promises.push(evalScript('batchCopyFiles('+JSON.stringify(JSON.stringify(pairs))+')').then(function(res){
            var lines = (res || '').split('\n');
            lines.forEach(function(line, li){
                if (line.indexOf('OK:') === 0 && li < copyPlan.length) {
                    obj.steps[copyPlan[li].si].presets[copyPlan[li].pi].exportPath = copyPlan[li].dst;
                }
            });
        }));
    }

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
                try { var obj = JSON.parse(pp[1]); steps = obj.steps || []; arrows = (obj.arrows || []).map(normalizeArrow); groups = obj.groups || []; frames = obj.frames || []; projectFolder = obj.projectFolder || ''; fileDirty = false; repairPaths(); updateProjectFolderUI(); render(); saveSession(); setStatus(T('loaded') + ': ' + filePath); } catch(e) { setStatus('Parse: ' + e.message, true); }
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
            arrows=(obj.arrows||[]).map(normalizeArrow);
            groups=obj.groups||[];
            frames=obj.frames||[];
            projectFolder=obj.projectFolder||'';
            fileDirty=false; repairPaths(); updateProjectFolderUI(); render();
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
