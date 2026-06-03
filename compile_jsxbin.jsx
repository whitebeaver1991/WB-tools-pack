/*
 * AE FX Manager - JSXBIN编译脚本
 * 将JSX脚本编译为JSXBIN格式（加密保护）
 */

#target aftereffects

function compileToJSXBIN(sourceFile, targetFile) {
    try {
        // 读取源文件
        var file = new File(sourceFile);
        file.open('r');
        var scriptContent = file.read();
        file.close();
        
        // 使用ExtendScript的编译功能
        // 注意：这需要使用ExtendScript Toolkit或特定的编译工具
        
        // 方法1：使用doScript编译（如果支持）
        var compiled = app.doScript(scriptContent, ScriptLanguage.JAVASCRIPT, [], UndoMode.ENTIRE_SCRIPT);
        
        // 保存编译后的文件
        var target = new File(targetFile);
        target.open('w');
        target.write(compiled);
        target.close();
        
        return true;
    } catch(e) {
        alert("编译失败: " + e.toString());
        return false;
    }
}

// 批量编译
function batchCompile() {
    var currentFolder = new File($.fileName).parent;
    var srcFolder = new Folder(currentFolder.fsName + "/src");
    var binFolder = new Folder(currentFolder.fsName + "/jsxbin");
    
    // 创建输出文件夹
    if (!binFolder.exists) {
        binFolder.create();
    }
    
    var files = srcFolder.getFiles("*.jsx");
    var successCount = 0;
    
    for (var i = 0; i < files.length; i++) {
        var sourceFile = files[i].fsName;
        var targetFile = binFolder.fsName + "/" + files[i].name.replace(".jsx", ".jsxbin");
        
        if (compileToJSXBIN(sourceFile, targetFile)) {
            successCount++;
        }
    }
    
    alert("编译完成！成功: " + successCount + "/" + files.length);
}

// 使用命令行工具编译的说明
function showCompileInstructions() {
    var message = "JSXBIN编译说明\n\n" +
        "由于After Effects内置的JSXBIN编译功能有限，建议使用以下方法:\n\n" +
        "方法1 - ExtendScript Toolkit:\n" +
        "1. 打开ExtendScript Toolkit\n" +
        "2. 打开要编译的JSX文件\n" +
        "3. 选择 文件 > 导出为二进制\n" +
        "4. 保存为.jsxbin格式\n\n" +
        "方法2 - 命令行工具:\n" +
        "使用Adobe提供的estkcmd工具:\n" +
        "estkcmd -conceal source.jsx target.jsxbin\n\n" +
        "方法3 - 在线工具:\n" +
        "使用在线JSXBIN编译器（不推荐用于生产环境）";
    
    alert(message);
}

// 主函数
function main() {
    var win = new Window("dialog", "JSXBIN编译器");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.preferredSize = [400, 300];
    
    win.add("statictext", undefined, "AE FX Manager JSXBIN编译工具");
    win.add("statictext", undefined, "");
    
    var infoText = win.add("statictext", undefined, 
        "此工具用于将JSX脚本编译为加密的JSXBIN格式。\n\n" +
        "注意：由于AE 2025.3的安全限制，\n" +
        "建议使用ExtendScript Toolkit进行编译。", 
        {multiline: true}
    );
    infoText.preferredSize = [380, 100];
    
    var btnGroup = win.add("group");
    btnGroup.orientation = "row";
    btnGroup.alignChildren = ["center", "center"];
    
    var instructionBtn = btnGroup.add("button", undefined, "查看编译说明");
    var compileBtn = btnGroup.add("button", undefined, "尝试编译");
    var closeBtn = btnGroup.add("button", undefined, "关闭");
    
    instructionBtn.onClick = function() {
        showCompileInstructions();
    };
    
    compileBtn.onClick = function() {
        batchCompile();
    };
    
    closeBtn.onClick = function() {
        win.close();
    };
    
    win.center();
    win.show();
}

main();
