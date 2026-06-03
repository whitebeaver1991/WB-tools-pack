---
name: "ae-cep-panel"
description: "Develops CEP (Common Extensibility Platform) panels for Adobe AE/PR with HTML/JS/CSS, CSInterface bridge, and ExtendScript host. Invoke when user wants to build or modify an AE settings panel."
---

# AE CEP Panel Development Guide

Based on real development experience from WB FlowBoard and WB PieMenu Panel v0.0.1.

## Architecture

A CEP panel is essentially a **mini web page** embedded in Adobe apps.
It runs in Chromium Embedded Framework (CEF), with limited memory (~200MB).

### File Structure

```
panel-folder/
├── index.html           # Main panel UI
├── CSInterface.js        # Adobe's JS bridge library (copy from SDK)
├── CSXS/
│   └── manifest.xml      # Panel registration — tells AE the panel exists
├── js/
│   └── index.js          # All panel logic
├── css/
│   └── style.css         # Dark theme styling
└── jsx/
    └── hostscript.jsx    # ExtendScript — runs in AE's script engine
```

### manifest.xml Essentials

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ExtensionManifest Version="6.0" ExtensionBundleId="com.yourname.panelname">
  <ExtensionList>
    <Extension Id="com.yourname.panelname" Version="0.0.1" />
  </ExtensionList>
  <ExecutionEnvironment>
    <HostList>
      <!-- Can target multiple hosts -->
      <Host Name="AEFT" Version="22.0" />   <!-- After Effects -->
      <Host Name="PPRO" Version="22.0" />   <!-- Premiere Pro -->
    </HostList>
    <LocaleList>
      <Locale Code="All" />
    </LocaleList>
    <RequiredRuntimeList>
      <RequiredRuntime Name="CSXS" Version="11.0" />
    </RequiredRuntimeList>
  </ExecutionEnvironment>
  <DispatchInfoList>
    <Extension Id="com.yourname.panelname">
      <DispatchInfo >
        <Resources>
          <MainPath>./index.html</MainPath>
          <ScriptPath>./jsx/hostscript.jsx</ScriptPath>
        </Resources>
        <Lifecycle>
          <AutoVisible>true</AutoVisible>
        </Lifecycle>
        <UI>
          <Type>Panel</Type>
          <Menu>Your Panel Name</Menu>
          <Geometry>
            <Size>
              <Width>300</Width>
              <Height>400</Height>
            </Size>
          </Geometry>
        </UI>
      </DispatchInfo>
    </Extension>
  </DispatchInfoList>
</ExtensionManifest>
```

## CSInterface Bridge — JS ↔ AE Communication

### From JS to AE (call ExtendScript)

```javascript
var csInterface = new CSInterface();

// Call ExtendScript function, get result via callback
csInterface.evalScript('getAllEffects()', function(result) {
    // result is a string returned by ExtendScript
});

// Or use Promise wrapper
function evalScript(code) {
    return new Promise(function(resolve) {
        if (csInterface) csInterface.evalScript(code, function(r) { resolve(r); });
        else resolve('');
    });
}
```

### From ExtendScript back to JS

```javascript
// In hostscript.jsx — just return value from function
function getAllEffects() {
    var result = "";
    // ... build result string ...
    return result;
}
```

## Settings Persistence Strategy

### Option 1: C++ reads text file (for plugin settings)
```
JS saves → ExtendScript writes file → C++ reads file on next ShowMenu()
```

### Option 2: ExtendScript-only (no C++ involved)
Use `app.settings` or write to disk via `Folder.userData`.

### File format (simple key=value)
```
trigger_key=32
win_alpha=60
bg_alpha=60
```

## UI Zoom Best Practice (BUG WE HAD)

```html
<!-- DON'T: zoom the whole panel — slider track breaks -->
<div class="panel" style="zoom: 1.5">
  <input type="range">  <!-- Slider thumb doesn't follow mouse! -->
</div>

<!-- DO: wrap content in a zoom container, keep header/status/toolbar outside -->
<div class="panel">
  <div class="top-bar">...</div>        <!-- NOT zoomed -->
  <div id="zoomContent">                <!-- zoomed -->
    <input type="range">
  </div>
</div>
```

```javascript
var zc = document.getElementById('zoomContent');
zc.style.zoom = (uiZoom / 100).toFixed(2);
```

**CSS zoom scales the element but NOT its mouse event coordinates.**
Sliders outside zoomContent track correctly.

## Collapsible Sections Pattern

### HTML
```html
<div class="collapsible">
  <div class="collapsible-header" data-target="sectionBody">
    <span class="collapse-icon">&#9660;</span>
    <span data-lang="sectionTitle">Section Title</span>
  </div>
  <div id="sectionBody" class="collapsible-body">
    ... controls ...
  </div>
</div>
```

### CSS
```css
.collapsible-header { cursor: pointer; }
.collapsible-header .collapse-icon {
    transition: transform 0.15s;
}
.collapsible-header.collapsed .collapse-icon {
    transform: rotate(-90deg);
}
.collapsible-body.collapsed { display: none; }
```

### JS
```javascript
document.querySelectorAll('.collapsible-header').forEach(function(hdr) {
    hdr.addEventListener('click', function() {
        var body = document.getElementById(this.dataset.target);
        if (!body) return;
        this.classList.toggle('collapsed');
        body.classList.toggle('collapsed');
    });
});
```

## Localization Pattern

```javascript
var LANG = [
    { title:'Title EN', save:'Save', /* ... */ },
    { title:'标题 ZH', save:'保存', /* ... */ }
];
var language = 0;  // 0=EN, 1=ZH

function setLanguage() {
    var l = LANG[language] || LANG[0];
    document.querySelectorAll('[data-lang]').forEach(function(el) {
        var key = el.getAttribute('data-lang');
        if (l[key]) el.textContent = l[key];
    });
}
```

## Effect Search (Autocomplete) Pattern

```javascript
// Cache all effects on first focus
input.addEventListener('focus', function() {
    if (g_effectsCache) return;
    evalScript('getAllEffects()').then(function(raw) {
        // Parse "Name|MatchName" format
        g_effectsCache = raw.split('\n').filter(l => l.includes('|')).map(l => {
            var p = l.indexOf('|');
            return { name: l.substring(0, p), match: l.substring(p + 1) };
        });
    });
});

// Filter on input
input.addEventListener('input', function() {
    var results = g_effectsCache.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.match.toLowerCase().includes(query)
    );
    renderDropdown(results);
});
```

## Deployment

### Install Path
```
%APPDATA%\Adobe\CEP\extensions\YourPanelName\
```
(`%APPDATA%` = `C:\Users\用户名\AppData\Roaming`)

### Files to copy
```
index.html
js/index.js
css/style.css
CSInterface.js
CSXS/manifest.xml
jsx/hostscript.jsx
```

### Debug Panel (CEF Debug)
CEP panels support Chrome DevTools:
1. Open `C:\Users\<user>\AppData\Roaming\Adobe\CEP\extensions\.debug`
2. Content: `{"enabled": true}`
3. Right-click panel → "Inspect" opens DevTools

## Common Pitfalls

### CEP Memory Limit
CEP has ~200MB memory cap. If your app does heavy DOM manipulation or caches large data, it can crash silently.

### manifest.xml Must Be Perfect
Wrong XML → panel doesn't show in AE's Window menu.
Most common error: wrong `ExtensionBundleId` or `Host Name`.

### ExtendScript is Synchronous
Don't call heavy ExtendScript operations too frequently.
Use debouncing: `setTimeout(triggerAutoSave, 250)`.

### Color Input Value
`<input type="color">` returns `#RRGGBB` (HTML hex).
When saving to C++ config, save as `RRGGBB` without `#`.
