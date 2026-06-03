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

    renderEditMode(canvas);
}
