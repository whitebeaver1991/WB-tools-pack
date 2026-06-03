/*
 * AE FX Manager - Pie Menu 模块（包装器）
 * 所有功能已合并到 AE_FX_Manager.jsx
 * 此文件保留仅为兼容旧版引用
 */

#target aftereffects

(function() {
    var scriptFolder = (function() {
        var f = new File($.fileName);
        return f.path;
    })();

    var mainScript = scriptFolder + "/AE_FX_Manager.jsx";
    var mainFile = new File(mainScript);

    if (!mainFile.exists) {
        alert("错误：找不到 AE_FX_Manager.jsx\n请确保该文件与 FXM_PieMenu.jsx 在同一目录。");
        return;
    }

    try {
        $.evalFile(mainFile);
    } catch(e) {
        alert("加载主脚本失败: " + e.toString());
    }
})();
