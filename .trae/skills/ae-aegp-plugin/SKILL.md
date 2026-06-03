---
name: "ae-aegp-plugin"
description: "Develops Windows C++ AEGP/AfterFX plugins with layered window, pie menu, mouse tracking, and color/settings handling. Invoke when user wants to create a new AE plugin or modify pie-menu-style overlay logic."
---

# AE AEGP Plugin Development Guide

Based on real development experience from WB PieMenu Suite v0.0.1.
This skill captures the hard-earned lessons to avoid the same bugs next time.

## Architecture Overview

An AE AEGP plugin is a **DLL renamed to .aex** that lives in AE's Plug-ins folder.
It uses the After Effects SDK + raw Win32 API for UI rendering.

## Starting From Scratch — The Safe Path (CRITICAL)

### DO NOT write AEGP from zero. Start from Adobe's official template.

The project started as a from-scratch AEGP (which crashed constantly).
It was rebuilt using **Adobe's official Easy_Cheese template** — this is the ONLY stable way.

### How to bootstrap a new AEGP plugin

```
1. Copy the official Easy_Cheese folder from AE SDK:
   SDK/Examples/AEGP/Easy_Cheese/  →  your project folder/

2. Rename everything:
   - Easy_Cheese.cpp → YourName.cpp
   - Easy_Cheese.h → YourName.h
   - All "Easy_Cheese" strings in PiPL.r, .cpp, .h → your plugin name

3. The Easy_Cheese template gives you a WORKING baseline:
   - PiPL resource (tells AE "I'm an AEGP")
   - EntryPointFunc with suite acquisition
   - Menu command registration
   - Build pipeline

4. NEVER delete the PiPL resource. Without it, AE won't load your plugin.
```

### Why Easy_Cheese template works (and from-scratch doesn't)

| Component | Easy_Cheese | From scratch |
|-----------|-------------|--------------|
| PiPL resource | `.r` → PiPLTool → `.rc` → linked | Easy to get wrong |
| Suite acquisition | `AEGP_SuiteHandler` wrapper | Manual acquire/release with `goto cleanup` |
| Entry point | `AEGP_PluginInitFuncPrototype` | Must match exactly or AE ignores DLL |
| DllMain | Not needed | Adding DllMain can break AE's loader |
| Error handling | `ERR()` macro | Easy to leak suites |
| Build | MSBuild + vcxproj | Custom scripts fragile |

### Key files to copy from template

```
Easy_Cheese/
├── Easy_Cheese.cpp        → rename to YourPlugin.cpp
├── Easy_Cheese.h          → rename to YourPlugin.h
├── Easy_Cheese_Strings.cpp → suite name strings (CRITICAL — wrong names = crash)
├── Easy_Cheese_Strings.h
├── PiPL.r                 → PiPL resource source
├── PiPL.bin               → pre-built binary fallback
├── Resource.rc            → includes PiPL
├── build_easy_cheese.ps1  → build script (adapt to MSBuild)
└── PiPL.rc                → generated PiPL resource
```

### Suite name strings — the silent crash culprit

```cpp
// In Easy_Cheese_Strings.cpp — each string MUST match the SDK exactly
// Wrong string → AE crashes on load with no error message
const char *kAEGPCommandSuite = "Command Suite";
const char *kAEGPRegisterSuite = "Register Suite";
```

These are defined in `AE_GeneralPlug.h` / `AEGP_SuiteHandler.h`.
Always copy from the SDK, never type by hand.

### EntryPoint function signature (MUST match PiPL)

```cpp
// PiPL.r says: CodeWin64X86 {"EntryPointFunc"}
// So the function MUST be named EntryPointFunc

extern "C" DllExport A_Err EntryPointFunc(
    struct SPBasicSuite *pica_basicP,
    A_long major_versionL,
    A_long minor_versionL,
    AEGP_PluginID aegp_plugin_id,
    AEGP_GlobalRefcon *global_refconP)
{
    // ... your code here ...
}
```

### PiPL resource — what it looks like

```c
// PiPL.r — the "identity card" AE reads to understand your plugin
resource 'PiPL' (16000) {
    {
        Kind { AEGP },              // Type: AEGP (not PF_Effect)
        Name { "YourPluginName" },  // Shown in AE
        Category { "General" },
        Version { 196608 },         // 3.0.0
        CodeWin64X86 {"EntryPointFunc"},  // Function AE calls
    }
};
```

### Minimal build command (after setting up MSBuild project)

```powershell
# In Visual Studio Developer PowerShell:
msbuild YourPlugin.vcxproj /p:Configuration=Release /p:Platform=x64 /t:Build
```

## Key Files (WB_PieMenu_Official structure)

```
ProjectRoot/
├── WB_PieMenu.cpp              # Main entry: WindowProc, drawing, hit testing, settings
├── WB_PieMenu.h                # Suites, function declarations
├── WB_PieMenu_Strings.cpp      # Suite name strings (critical for AE to load)
├── WB_PieMenu_Strings.h
├── WB_PieMenu_PiPL.r           # PiPL resource (tells AE what the plugin does)
├── Win/
│   ├── WB_PieMenu.sln          # Visual Studio solution
│   ├── WB_PieMenu.vcxproj      # Project config (critical: /utf-8, /WX flags)
│   └── build_official.ps1      # Build script
├── CEP/
│   └── WB_PieMenu_Panel/
│       ├── index.html          # CEP panel HTML
│       ├── css/style.css       # CEP panel styles (sticky top-bar, collapsibles, field-select)
│       ├── js/index.js         # CEP panel JS (settings UI, effect search, recording, save/load)
│       └── jsx/hostscript.jsx  # ExtendScript bridge (readSettings/writeSettings/getAllEffects/browseFile)
├── BuildOutput/AEGP/           # Output .aex lands here
├── WB_EffectDumper_v2/         # Standalone diagnostic tool (AEGP effect dump)
└── ...
```

## Architecture: AEGP + CEP Panel Communication

The WB PieMenu uses a **two-process architecture**:

```
┌─────────────────┐         settings.txt         ┌──────────────────────┐
│  AEGP Plugin     │ ◄──── (polling via IdleHook) ────►  CEP Panel (JS)  │
│  (C++, Win32)    │                              │  (HTML/JS in CEF)    │
│                  │                              │                      │
│  - Shows overlay │                              │  - Settings UI       │
│  - Draws menu    │                              │  - Effect search     │
│  - Hotkey listen │                              │  - Scan effects      │
│  - Applies eff.  │                              │  - Save/Load config  │
└─────────────────┘                              └──────────────────────┘
```

**Communication flow:**
1. CEP panel reads/writes `%LOCALAPPDATA%\WB_PieMenu\settings.txt` via `evalScript('writeSettings()')` / `evalScript('readSettings()')`
2. AEGP's `IdleHook` runs every AE idle frame, re-reads the file, applies changes
3. This means AEGP picks up new settings within ~100ms without any IPC complexity

### IdleHook Trigger Re-read Pattern

```cpp
static A_Err IdleHook(AEGP_GlobalRefcon, AEGP_IdleRefcon, A_long*)
{
    // Re-read settings file for trigger/hotkey changes
    FILE *f = NULL; fopen_s(&f, path, "r");
    if (f) {
        // Read trigger_disabled, trigger_key, trigger_mod, prev_page_key, next_page_key
        // If trigger_disabled==1 → UnregisterHotKey
        // If new key/mod → RegisterHotKey
    }
}
```

This enables **runtime hotkey change** without restarting AE:
- JS calls `writeSettings()` with new values
- Next idle frame → AEGP reads them → `UnregisterHotKey` + `RegisterHotKey`

### Entry Point Pattern

```cpp
// AEGP_EntryPoint — AE calls this on startup/init
DllExport A_Err EntryPoint(char *name, long version, long reserved) {
    if (name) strncpy_s(name, ...);  // tell AE our name
    return A_Err_NONE;
}

// PiPL resource tells AE: "I'm a AEGP, not an effect"
```

## Critical Pitfalls & Fixes

### 1. COLORREF Byte Order (BUG WE HAD)

```cpp
// WRONG — sscanf "RRGGBB" into int, use directly as COLORREF
// COLORREF is 0x00BBGGRR, but HTML color is #RRGGBB
unsigned int c;
sscanf_s(val, "%x", &c);
g_color = (int)(c & 0xFFFFFF);  // BUG: R and B swapped!

// CORRECT — swap R and B
unsigned int c;
sscanf_s(val, "%x", &c);
int r = (c >> 16) & 0xFF, g = (c >> 8) & 0xFF, b = c & 0xFF;
g_color = RGB(r, g, b) & 0xFFFFFF;
```

**ALWAYS parse HTML hex colors with R/B swap for COLORREF.**

### 2. Window Transparency — Two Layers, Two Controls

```cpp
// Layer 1: Whole-window transparency via Layered Window
SetLayeredWindowAttributes(hwnd, RGB(0,0,0), (BYTE)winAlpha, LWA_ALPHA | LWA_COLORKEY);

// Layer 2: Background fill only — draw to temp DC then AlphaBlend
HDC sdc = CreateCompatibleDC(dc);
// ... draw sectors on sdc ...
BLENDFUNCTION sbf = {AC_SRC_OVER, 0, (BYTE)bgAlpha, 0};
AlphaBlend(dc, 0, 0, w, h, sdc, 0, 0, w, h, sbf);
// Then draw text/images directly on dc (fully opaque)
```

**Never mix the two opacities. Win alpha ≈ window glass. Bg alpha ≈ sector fill only.**

### 3. Layered Window Color Key (Black = Transparent)

```cpp
SetLayeredWindowAttributes(hwnd, RGB(0,0,0), alpha, LWA_ALPHA | LWA_COLORKEY);
// Means: pure black pixels (0,0,0) are fully transparent regardless of alpha
// Center hole of pie = drawn as black = invisible through colorkey
```

### 4. Image Transparency (PNG with alpha channel)

```cpp
// Use Windows Imaging Component (WIC) to decode PNG
IWICBitmapDecoder *decoder = NULL;
factory->CreateDecoderFromFilename(path, NULL, ..., &decoder);
// Get frame, convert to 32bpp BGRA, create HBITMAP with alpha
// Then draw via AlphaBlend with AC_SRC_ALPHA
```

### 5. File Encoding — C4819 Warning

The vcxproj **MUST** have `/utf-8` flag:

```xml
<ClCompile>
  <AdditionalOptions>/utf-8 %(AdditionalOptions)</AdditionalOptions>
</ClCompile>
```

Without it, comments with Chinese/Unicode chars cause `C4819` warning,
and if `/WX` (TreatWarningAsError) is on — **build fails**.

### 6. Settings Parsing — Key=Value Text File

Store as `%LOCALAPPDATA%\YourApp\settings.txt`:
```
trigger_key=32
trigger_mod=6
win_alpha=60
bg_alpha=60
bg_color=2a2a2a
glow_color=3cb93c
```

### 7. Hit Testing for Pie Sectors

```cpp
double a = atan2(dy, dx);
double halfStep = M_PI / itemCount;
double shifted = a + M_PI / 2.0 + halfStep;  // rotate so 12-o'clock = sector 0
int idx = ((int)(shifted / (2.0 * M_PI / itemCount))) % itemCount;
```

### 8. CEP Panel: NEVER call renderMenu() from selectEffect()

**BUG:** When `selectEffect` closes the effect search overlay (via `closeEffectSearch()`) and then calls `renderMenu()` to rebuild DOM, CEF's event chain sometimes swallows the DOM update — slot stays blank.

**FIX:** Directly mutate the slot's textContent instead:

```javascript
function selectEffect(displayName, matchName) {
    items[curMenu][curPage][idx].effect = matchName;
    items[curMenu][curPage][idx].effectDisplay = displayName;
    closeEffectSearch();
    var el = document.getElementById('itemEffect_' + idx);
    if (el) {
        el.textContent = displayName;      // Direct DOM, no renderMenu
        el.classList.remove('empty');
    }
    saveSettings();   // Direct save, no debounce
}
```

**Same principle applies to clear buttons** — update textContent in-place, never rebuild the whole list for a single slot change.

### 9. CEP Panel: ScrollJump on innerHTML = ''

`container.innerHTML = ''` resets scroll to top. Browsers auto-correct scroll when content height drops to zero.

**FIX:** Save/restore with persistent retry loop:

```javascript
function renderMenu() {
    var zc = document.getElementById('zoomContent');
    var savedScroll = zc ? zc.scrollTop : 0;

    container.innerHTML = '';
    // ... rebuild content ...

    if (zc) {
        zc.scrollTop = savedScroll;
        var tries = 0;
        (function restore() {
            if (zc.scrollTop === savedScroll) return;        // done
            if (++tries > 15) return;                        // 1.2s timeout
            zc.scrollTop = savedScroll;
            setTimeout(restore, 80);
        })();
    }
}
```

### 10. CEP Panel: Direct saveSettings() for Explicit Actions

**BUG:** `triggerAutoSave()` uses 250ms debounce. Editing multiple slots quickly causes lost data (each edit resets the timer, only last one fires).

**FIX:** Explicit user actions (selectEffect, clear) call `saveSettings()` directly. Debounce only for text input (name, image path).

```javascript
// Explicit actions — immediate save
selectEffect(...) → saveSettings()
clearBtn          → saveSettings()
pie dropdown      → renderMenu(); saveSettings()

// Text input — debounce is OK
nameInput.addEventListener('input', triggerAutoSave)
```

### 11. CEP Panel: Display Name Mapping

**BUG:** ExtendScript's `e.name` is often empty for third-party plugins. Search results show matchName only.

**FIX:** Three-layer approach (best effort):

Layer 1 — Static `g_nameMap` from CSV dump:
```javascript
g_nameMap = {
    'ADBE CurvesCustom': 'Curves',
    'ADBE Box Blur2': 'Fast Box Blur',
    'ColorSelective': 'RE:Match Color',
};
```

Layer 2 — AEGP `DumpEffectNames()` via IdleHook (retrieves real names via `AEGP_GetEffectName`):
```
JS writes dump_effects=1 → IdleHook → writes effects_map.txt → CEP loads into g_nameMap
```

Layer 3 — `matchToDisplay()` fallback for unknown effects:
```javascript
function matchToDisplay(match) {
    return match.replace(/([a-z])([A-Z0-9])/g, '$1 $2')
                .replace(/([0-9])([A-Z])/g, '$1 $2')
                .replace(/_/g, ' ')
                .replace(/\s+/g, ' ').trim();
}
// Example: "BCC6LensBlur" → "BCC6 Lens Blur"
```

Scan button flow:
1. Write `dump_effects=1` to settings.txt
2. AEGP IdleHook reads flag, enumerates via `AEGP_GetNextInstalledEffect`, writes `effects_map.txt`
3. CEP polls `effects_map.txt`, parses `display_name|match_name` lines, merges into `g_nameMap`
4. If AEGP dump doesn't arrive within 20s, fall back to `getAllEffects()` (ExtendScript)

### 12. CEP Panel: Hotkey Recording Disables Trigger

**BUG:** Clicking Record for Ctrl+Shift+Space triggers the pie menu immediately, making recording impossible.

**FIX:** Write `trigger_disabled=1` to settings file before starting recording. AEGP's IdleHook reads it and calls `UnregisterHotKey()`.

```cpp
// In IdleHook, when we see trigger_disabled=1:
if (triggerDisabled || (triggerChanged && (newKey == 0 || newMod == 0))) {
    if (g_rawWnd) UnregisterHotKey(g_rawWnd, 0);
    g_triggerKey = 0; g_triggerMod = 0;
}
```

```javascript
// In startRecording():
evalScript('readSettings()').then(function(data) {
    // Remove trigger lines, add trigger_disabled=1
    writeSettings(lines_without_trigger + 'trigger_disabled=1');
});
// saveSettings() at end overwrites file, removing trigger_disabled → AEGP re-registers
```

### 13. Page Navigation Keys Customizable

Store as settings:
```
prev_page_key=90   // default Z
next_page_key=88   // default X
```

WM_KEYDOWN uses variables instead of hardcoded `'Z'`/`'X'`:
```cpp
if (w == g_prevPageKey || (w >= 'a' && w <= 'z' && w == g_prevPageKey + 32))
    GotoPage(g_curPage - 1);
if (w == g_nextPageKey || (w >= 'a' && w <= 'z' && w == g_nextPageKey + 32))
    GotoPage(g_curPage + 1);
```

### 14. Page Indicator Color

Store as settings:
```
page_color=78787d
```

Three Draw functions (Pie/Quick/Wheel) all use `g_pageColor` instead of hardcoded `RGB(120,120,125)`.

### 15. CEP Panel: position:sticky for Top Bar

To keep title bar + save button visible while scrolling through settings:

```css
.top-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    background: #1e1e1e;
}
```

### 16. CEP Panel: Collapsible Sections

For about/hotkeys/debug sections that should be collapsed by default:

```html
<div class="collapsible-header collapsed" data-target="sectionBody">
<div id="sectionBody" class="collapsible-body collapsed">
```

CSS handles display toggle:
```css
.collapsible-body.collapsed { display: none; }
.collapsible-header.collapsed .collapse-icon { transform: rotate(-90deg); }
```

JS toggle handler:
```javascript
hdr.addEventListener('click', function() {
    this.classList.toggle('collapsed');
    body.classList.toggle('collapsed');
});
```

## Compilation & Deployment

### 17. PiPL.rc — NEVER hand-write, always use PiPLTool

**CRITICAL:** The PiPL resource uses binary format. Hand-writing the `.rc` file will cause AE to crash on startup if even one byte is wrong.

```c
// PiPL.rc binary format — length field plus string must match exactly
// Example: "WB_EffectDumper" = 15 chars, length in hex = 0x0F
// The binary format encodes:
//   - kind (AEGP)
//   - name (length byte + string)
//   - category, version, entry point
// Mismatch between length field and actual string length = AE crash
```

**Correct workflow:**
```
.r (Rez source) → cl /EP → preprocessed .rr → PiPLTool → .rrc → cl /EP → .rc → MSBuild
```

Use `build_all.cmd` (which launches VS Dev Command Prompt) instead of hand-running MSBuild:
```cmd
call "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\VsDevCmd.bat"
cl /I "%SDK_ROOT%\Examples\Headers" /EP "%PiPL%.r" > "%tmp%.rr"
"%SDK_ROOT%\Examples\Resources\PiPLtool.exe" "%tmp%.rr" "%tmp%.rrc"
cl /D MSWindows /EP "%tmp%.rrc" > "%PiPL%.rc"
msbuild ... /t:Build
```

### 18. AEGP Effect Name vs ExtendScript Effect Name

`app.effects[i].name` (ExtendScript) often returns empty for third-party plugins (BCC, Video Copilot, etc.).

`AEGP_GetEffectName()` (via `EffectSuite4`) returns the REAL display name that appears in AE's Effect menu.

```cpp
AEGP_SuiteHandler s(sP);
AEGP_InstalledEffectKey ik = 0;
s.EffectSuite4()->AEGP_GetNextInstalledEffect(0, &ik);
while (ik) {
    char display[AEGP_MAX_EFFECT_NAME_SIZE] = {0};
    char match[AEGP_MAX_EFFECT_MATCH_NAME_SIZE] = {0};
    s.EffectSuite4()->AEGP_GetEffectName(ik, display);
    s.EffectSuite4()->AEGP_GetEffectMatchName(ik, match);
    // display = "BCC+Beauty Studio" (real name)
    // match = "BCC_BEAUTYSTUDIO" (match name)
}
```

### 19. Safe AEGP Effect Enumeration via IdleHook

**NEVER** call `AEGP_GetNextInstalledEffect` inside an IdleHook that runs unconditionally — it can crash AE during timeline operations.

**Safe pattern:** Use a settings file flag (`dump_effects=1`) to trigger enumeration ONCE:

```
JS writes dump_effects=1 → settings.txt
                         ↓
IdleHook reads flag → DumpEffectNames() → writes effects_map.txt → writes dump_effects=0
                         ↓
CEP polls effects_map.txt → merges into g_nameMap
```

Key safety rules:
- Only enumerate when the flag is set (NOT on every idle frame)
- Write `dump_effects=0` back to the file after completion to prevent retrigger
- JS has a fallback to `getAllEffects()` if the .aex doesn't support AEGP dump
- Keep the enumeration function fast (just read names + write file, no UI)

### Build
```powershell
# Use MSBuild (in VS Developer Prompt)
msbuild Win\WB_PieMenu.vcxproj /p:Configuration=Release /p:Platform=x64 /t:Build

# Or use build script
.\Win\build_official.ps1
```

### Deploy .aex
```
Source: BuildOutput\AEGP\WB_PieMenu.aex
Target: C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\Plug-ins\WB_PieMenu.aex
```

**Must close AE first** (AfterFX.exe holds file lock).

## VS Project Settings (vcpkg not needed, all Win32 APIs)

| Setting | Value |
|---------|-------|
| Platform | x64 |
| Configuration | Release |
| Runtime Library | MultiThreaded (/MT) |
| Character Set | Not Set (use char/sscanf_s) |
| TreatWarningAsError | true (add /utf-8 to AdditionalOptions) |
| SubSystem | Windows |
| Additional Dependencies | user32.lib, gdi32.lib, msimg32.lib, windowscodecs.lib |
