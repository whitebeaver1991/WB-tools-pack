; wb_tools_hotkeys.ahk (AutoHotkey v2)
; 全局热键: Ctrl+Shift+1 → 启动 pie_menu.hta → 选择特效 → apply_pie_selection.jsx

#SingleInstance Force
Persistent

ScriptDir := A_ScriptDir
HTA_Path := ScriptDir . "\pie_menu.hta"
JSX_Path := ScriptDir . "\apply_pie_selection.jsx"
TempFile := A_Temp . "\wb_pie_selection.json"

FindAfterFX()
{
    result := ""
    try
        Loop Reg "HKEY_LOCAL_MACHINE\SOFTWARE\Adobe\After Effects", "KVR"
        {
            subkey := A_LoopRegName
            try
                InstallPath := RegRead("HKEY_LOCAL_MACHINE\SOFTWARE\Adobe\After Effects\" . subkey, "InstallPath")
            catch
                continue
            if InstallPath {
                exePath := InstallPath . "\Support Files\AfterFX.com"
                if FileExist(exePath) {
                    result := exePath
                    break
                }
                exePath := InstallPath . "\Support Files\AfterFX.exe"
                if FileExist(exePath) {
                    result := exePath
                    break
                }
            }
        }
    if !result
    {
        commonPaths := [
            "C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.com",
            "C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\AfterFX.exe",
            "C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.com",
            "C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\AfterFX.exe",
            "C:\Program Files\Adobe\After Effects 2025\Support Files\AfterFX.com",
            "C:\Program Files\Adobe\After Effects 2025\Support Files\AfterFX.exe"
        ]
        for p in commonPaths
        {
            if FileExist(p) {
                result := p
                break
            }
        }
    }
    return result
}

AE_Path := FindAfterFX()

^+1:: {
    global AE_Path, HTA_Path, JSX_Path, TempFile

    if FileExist(TempFile)
        DeleteFile(TempFile)

    try {
        Run('mshta.exe "' HTA_Path '"')
    } catch {
        TrayTip("wb tools pack", "无法启动 pie menu", 1)
        return
    }

    Loop 60
    {
        Sleep 100
        if !FileExist(TempFile) {
            if !ProcessExist("mshta.exe")
                return
            continue
        }
        Sleep 200
        break
    }

    if !FileExist(TempFile)
        return

    if (AE_Path != "") && FileExist(JSX_Path) {
        try {
            Run('"' AE_Path '" -r "' JSX_Path '"',, "Hide")
        }
        Sleep 1000
    } else {
        TrayTip("wb tools pack", "AE路径或JSX脚本未找到", 2)
    }

    if FileExist(TempFile)
        DeleteFile(TempFile)
}

Esc:: {
    pid := ProcessExist("mshta.exe")
    if pid
        ProcessClose(pid)
}
