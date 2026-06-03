/*
 * AE FX Manager - 安装脚本
 * 自动安装到AE脚本文件夹
 */

#target aftereffects

function main() {
    // 获取脚本文件夹路径
    var scriptFolder = Folder.startup.fsName + "/Scripts/ScriptUI Panels";
    
    // 检查是否以管理员权限运行
    var installFolder = new Folder(scriptFolder);
    if (!installFolder.exists) {
        alert("无法找到AE脚本文件夹！\n请手动复制文件到:\n" + scriptFolder);
        return;
    }
    
    // 源文件路径
    var sourceFiles = [
        "AE_FX_Manager.jsx",
        "FXM_PieMenu.jsx",
        "FXM_HotkeyHelper.jsx"
    ];
    
    // 当前脚本所在文件夹
    var currentFolder = new File($.fileName).parent;
    var srcFolder = new Folder(currentFolder.fsName + "/src");
    
    // 复制文件
    var successCount = 0;
    for (var i = 0; i < sourceFiles.length; i++) {
        var sourceFile = new File(srcFolder.fsName + "/" + sourceFiles[i]);
        var targetFile = new File(scriptFolder + "/" + sourceFiles[i]);
        
        if (sourceFile.exists) {
            if (sourceFile.copy(targetFile.fsName)) {
                successCount++;
            }
        }
    }
    
    if (successCount === sourceFiles.length) {
        alert("安装成功！\n\n请重启After Effects，然后在菜单中找到:\n窗口 > " + sourceFiles[0].replace(".jsx", ""));
    } else {
        alert("安装部分成功 (" + successCount + "/" + sourceFiles.length + ")\n\n请手动复制 src 文件夹中的文件到:\n" + scriptFolder);
    }
}

main();
