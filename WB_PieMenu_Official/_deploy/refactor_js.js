/**
 * WB PieMenu JS 模块化重构脚本
 * 
 * 将单体 index.js (约2787行) 拆分为 4 个模块：
 *   settings.js  — 设置系统（全局变量、数据函数）
 *   pie_ui.js    — Pie/Quick/Wheel/Infinite UI 渲染与交互
 *   flowboard.js — FlowBoard 功能
 *   main.js      — 入口（dbg、LANG、DOMContentLoaded 事件绑定）
 * 
 * CEP 不支持 ES modules，采用全局 script 标签顺序加载。
 * 
 * 加载顺序：
 *   1. settings.js  (无依赖)
 *   2. pie_ui.js    (引用 dbg/LANG — 运行时可用)
 *   3. flowboard.js (引用 dbg — 运行时可用)
 *   4. main.js      (定义 dbg/LANG + DOMContentLoaded)
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const JS_DIR = path.join(__dirname, '..', 'CEP', 'WB_PieMenu_Panel', 'js');
const FILES = ['settings.js', 'pie_ui.js', 'flowboard.js', 'main.js'];

// 验证每个文件的语法正确性
function validateSyntax(filePath) {
    const code = fs.readFileSync(filePath, 'utf8');
    try {
        // 使用 vm.compileFunction 检查语法 — 不求执行，只求无 SyntaxError
        new vm.Script(code, { filename: path.basename(filePath) });
        return { ok: true, lines: code.split('\n').length };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

console.log('=== WB PieMenu JS 模块化重构验证 ===\n');

let allOk = true;

for (const f of FILES) {
    const filePath = path.join(JS_DIR, f);
    if (!fs.existsSync(filePath)) {
        console.log(`[MISSING] ${f} — 文件不存在`);
        allOk = false;
        continue;
    }
    const result = validateSyntax(filePath);
    if (result.ok) {
        console.log(`[OK] ${f} — ${result.lines} 行, 语法正确`);
    } else {
        console.log(`[FAIL] ${f} — ${result.error}`);
        allOk = false;
    }
}

// 检查变量依赖 — 确保关键全局变量在 settings.js 中声明
console.log('\n--- 依赖检查 ---');
const settingsCode = fs.readFileSync(path.join(JS_DIR, 'settings.js'), 'utf8');
const mainCode = fs.readFileSync(path.join(JS_DIR, 'main.js'), 'utf8');

const keyVars = [
    'COLORS', 'MAX', 'PAGES', 'labelMap',
    'curMenu', 'curPage', 'pieCount', 'quickCount',
    'triggerKey', 'triggerMod', 'winAlpha',
    'bgAlpha', 'bgColor', 'glowColor', 'glowIntensity',
    'pageColor', 'imgDist', 'textDist', 'textSize', 'menuScale',
    'numpadEnabled', 'guideEnabled', 'guideColor', 'guideWidth',
    'selectMode', 'infiniteCount', 'g_settingsVersion',
    'g_recentEffects', 'RECENT_MAX', 'g_fbRecent',
    'g_effectsCache', 'g_nameMap', 'g_debug', 'g_logLines',
    'items', 'infEffects', 'infRecentEffects', 'infEditedSlot',
    'infRecording', 'g_infEffectSearch',
    'csInterface', 'g_saveTimer', 'g_effectSearchTargetIdx',
    'g_effectsMapPollTimer', 'isRecording',
    'evalScript', 'parseSettings', 'loadSettings',
    'saveSettings', 'triggerAutoSave', 'collectFromUI',
    'applyInfLayoutToDOM', 'saveRecentEffects'
];

const keyVarsMain = [
    'uiZoom', 'language', 'LANG', 'dbg', 'setLanguage'
];

let depOk = true;
for (const v of keyVars) {
    if (settingsCode.indexOf('var ' + v) === -1 && settingsCode.indexOf('function ' + v) === -1) {
        console.log(`[WARN] settings.js 中未找到声明: ${v}`);
        depOk = false;
    }
}
for (const v of keyVarsMain) {
    if (mainCode.indexOf('var ' + v) === -1 && mainCode.indexOf('function ' + v) === -1) {
        console.log(`[WARN] main.js 中未找到声明: ${v}`);
        depOk = false;
    }
}
if (depOk) console.log('[OK] 所有关键变量声明已覆盖');

// HTML 检查
console.log('\n--- HTML script 标签检查 ---');
const htmlPath = path.join(__dirname, '..', 'CEP', 'WB_PieMenu_Panel', 'index.html');
const htmlCode = fs.readFileSync(htmlPath, 'utf8');
const scriptTags = htmlCode.match(/<script\s+src="js\/[^"]+\.js"><\/script>/g) || [];
const expectedOrder = ['settings.js', 'pie_ui.js', 'flowboard.js', 'main.js'];
if (scriptTags.length !== 4) {
    console.log(`[FAIL] 期望 4 个 script 标签，发现 ${scriptTags.length} 个`);
    allOk = false;
} else {
    let orderOk = true;
    for (let i = 0; i < 4; i++) {
        if (scriptTags[i].indexOf(expectedOrder[i]) === -1) {
            console.log(`[FAIL] 标签顺序错误: 位置 ${i} 期望 ${expectedOrder[i]}`);
            orderOk = false;
            allOk = false;
        }
    }
    if (orderOk) {
        console.log('[OK] HTML script 标签顺序正确:');
        scriptTags.forEach(t => console.log('     ' + t.trim()));
    }
}

// 总行数统计
console.log('\n--- 行数统计 ---');
let totalLines = 0;
for (const f of FILES) {
    const filePath = path.join(JS_DIR, f);
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').length;
    console.log(`  ${f}: ${lines} 行`);
    totalLines += lines;
}
console.log(`  总计: ${totalLines} 行`);
console.log(`  原文件: ~2787 行`);

console.log('\n=== 验证完成 ===');
if (allOk) {
    console.log('结果: 全部通过');
} else {
    console.log('结果: 存在警告/错误');
}
