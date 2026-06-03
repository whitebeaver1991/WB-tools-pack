var cs = null;
try { cs = new CSInterface(); } catch(e) {}

var captured = null;

function el(id) { return document.getElementById(id); }
function log(msg, cls) {
    var box = el('logBox');
    var d = document.createElement('div');
    d.className = cls || '';
    d.textContent = msg;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
}
function setStatus(s, busy) {
    var sb = el('statusBar');
    sb.innerHTML = busy ? '<span class="busy">'+s+'</span>' : s;
}

function evalScript(code) {
    return new Promise(function(resolve) {
        if (!cs) { log('CSInterface not available', 'err'); resolve(''); return; }
        cs.evalScript(code, function(r) { resolve(r || ''); });
    });
}

el('btnGen').addEventListener('click', async function() {
    setStatus('Generating test comp...', true);
    var r = await evalScript('generateTestComp()');
    log('Generate: ' + r, r.indexOf('OK')>=0 ? 'ok' : 'err');
    setStatus(r.indexOf('OK')>=0 ? 'Test comp created' : 'Failed');
});

el('btnCapture').addEventListener('click', async function() {
    setStatus('Capturing comp...', true);
    var r = await evalScript('captureComp()');
    if (!r || r === '' || r.indexOf('ERR')===0) {
        log('Capture: ' + r, 'err');
        setStatus('Capture failed');
        return;
    }
    try {
        captured = JSON.parse(r);
        log('Captured: ' + captured.layers.length + ' layers, ' + captured.effects + ' effects', 'ok');
        el('btnPreview').disabled = false;
        el('btnRebuild').disabled = false;
        setStatus('Captured ' + captured.layers.length + ' layers, ' + captured.keyframes + ' keyframes');
    } catch(e) {
        log('JSON parse error: ' + e.message, 'err');
        setStatus('Parse failed');
    }
});

el('btnPreview').addEventListener('click', function() {
    if (!captured) return;
    log('─── JSON Preview (first 1000 chars) ───', 'info');
    var s = JSON.stringify(captured, null, 2);
    log(s.substring(0, 1000) + (s.length>1000 ? '\n... (truncated)' : ''), 'info');
});

el('btnRebuild').addEventListener('click', async function() {
    if (!captured) return;
    var confirmed = confirm('Create new comp with ' + captured.layers.length + ' layers?');
    if (!confirmed) return;
    setStatus('Rebuilding...', true);
    var json = JSON.stringify(captured);
    var r = await evalScript('rebuildComp(\'' + json.replace(/\\/g,'\\\\').replace(/'/g,'\\\'') + '\')');
    log('Rebuild: ' + r, r.indexOf('OK')>=0 ? 'ok' : 'err');
    setStatus(r.indexOf('OK')>=0 ? 'Clone created!' : 'Rebuild failed');
});

el('btnClear').addEventListener('click', function() {
    captured = null;
    el('btnPreview').disabled = true;
    el('btnRebuild').disabled = true;
    log('Cleared captured data', 'info');
    setStatus('Cleared');
});

log('WB CopyCat loaded. Click "Generate Test Comp" to start.', 'info');
