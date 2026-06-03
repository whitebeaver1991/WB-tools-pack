function rebuildFbRecent() {
    var sel = document.getElementById('fbRecentSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">(none)</option>';
    for (var i = 0; i < g_fbRecent.length && i < 15; i++) {
        var opt = document.createElement('option');
        opt.value = g_fbRecent[i];
        var parts = g_fbRecent[i].split(/[/\\]/);
        opt.textContent = parts[parts.length - 1];
        sel.appendChild(opt);
    }
}