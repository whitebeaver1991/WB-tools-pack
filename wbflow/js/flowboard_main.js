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
