# WB Tools 项目规则

## 版本号
- **当前版本**: v0.1.2
- **PieMenu AEGP**: v1.02 (PiPL 258 = 0x102)
- **FlowBoard**: v0.1.0 (无独立版本号)
- **WB Effect Dumper**: v3.0.1 (PiPL 196609)

## HTML/JS 重构安全规则
- 重构 HTML 前，先 grep 所有 id（`id="(\w+)"`）并与 JS 中 `getElementById` 的引用列表对比，确保每个 id 都被覆盖
- 使用"先加后删"策略替代大段 SearchReplace：先在目标位置写好新代码，再删除旧代码
- 改完后 grep 每个全局变量名，确认 JS/HTML 两端引用数对称（如 `uiZoom` 在 JS 中应出现 5-8 次，HTML 中至少 1 次）
- CEP 面板改完 HTML/JS 后必须通过肉眼检查一次所有控件，确保无遗漏
- **删除 HTML 大段时，务必检查前后标签括号对称性**：删除一段含有开始/结束标签的代码后，往往会在删除位置留下孤立的 `</div>` 或缺少对应的 `<div>`，导致整个页面的布局错乱。删除后手动检查前后 5 行的标签嵌套对齐。
- **删除 JS 函数时，grep 确认所有调用点也一并删除**：移除 `renderInfinitePreview()` 这类函数时，必须同时删除所有对该函数的引用（包括事件监听器、回调函数内的调用），否则运行时抛出 `ReferenceError`，可能导致整个 CEP 面板白屏。
- **修改 CEP JS 后，部署前必须用 `node --check` 做语法验证**：`node --check "CEP/WB_PieMenu_Panel/js/main.js"` 会检查括号闭合、语法错误等。所有 4 个 JS 文件（settings.js / pie_ui.js / flowboard.js / main.js）都必须通过检查。**未通过验证不得部署。**
- **修改 wbflow JS 后同样执行**：`node --check "wbflow/js/flowboard_core.js"` 等。
- **中英文翻译切换的检查，除非用户单独要求，否则留到用户要求 git commit / push 时再做**，不要在功能开发中途分散精力。

## 编译命令
### Pie Menu AEGP
```
& "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe" "WB_PieMenu_Official\Win\WB_PieMenu.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q
```
静态链接 CRT（/MT），生成的 .aex 无 VC++ 运行时依赖。
**必须在 Launch-VsDevShell 环境中运行**（`& "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64`）。
PiPL 版本号在 `.r` 和 `.rc` 中都要同步更新：
- `.r` 文件：`Version { 257 }`
- `.rc` 文件：`1, 3,`（低字在前）

### WB Effect Dumper AEGP
```
cd "WB_EffectDumper_v2\Win"
& "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64 -HostArch amd64
MSBuild.exe "WB_EffectDumper.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q
```
**必须先在 VS DevShell 环境下运行**，否则 cl.exe / MSBuild.exe 不在 PATH。
PiPL 版本号直接在 `WB_EffectDumper_PiPL.rc` 中修改低字：
- `0, 3,` = 196608 (v3.0.0)
- `1, 3,` = 196609 (v3.0.1)

## 部署路径
### Pie Menu
- `.aex` → AE 安装目录 `Support Files\Plug-ins\WB_PieMenu\`
- CEP `index.html` / `js\index.js` / `css\style.css` → `%APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel\`

### FlowBoard
- CEP `index.html` / `js\index.js` / `css\style.css` / `jsx\hostscript.jsx` → `%APPDATA%\Adobe\CEP\extensions\wbflow\`

## 部署强制规则（重要）
- **每次修改源文件后，必须立即同步到 `_deploy\v0.1.0\` 对应目录**，不得遗漏。用户测试时加载的是 `_deploy` 目录的版本，不是源文件。
- 即使只改了 1 行代码（如变量声明、HTML 标签），也必须重新部署。忘记部署 = 等于没改。
- 同步命令示例：
  ```powershell
  $s="WB_PieMenu_Official"; $d="_deploy\v0.1.0\WB_PieMenu"
  Copy-Item "$s\...\index.html" "$d\...\" -Force
  Copy-Item "$s\...\js\index.js" "$d\...\js\" -Force
  Copy-Item "$s\BuildOutput\AEGP\WB_PieMenu.aex" "$d\AEGP\" -Force
  ```
- 构建版本（vbuild.x / PieMenu_vbuild.x）存放在 `_deploy\` 根目录，仅作"给用户覆盖测试"的临时输出。**正式发布时**才同步到 `_deploy\v0.1.0\`。

## 版本号约定
- 0.0.x：小改进，用户无感升级（CSS 调整、小 UI 优化、Bug 修复）
- 0.x.0：引入新能力（设置导出、无限轮盘、双面板联动）
- **v0.1.1 新增**：PieMenu 内置 Raw Input 外接小键盘 Enter 拦截（g_numpadEnterAction）
  - g_numpadEnabled 默认 true
  - RawWndProc 中自动比对 device path 或自动配对
  - numpad_enter_action=1→Quick/2→Wheel/3→Pie/4→Infinite
  - ShowMenu() 内强制 g_selectMode=0（点击模式）
  - 新增 AE 菜单命令 "List Numpad Devices" 用于枚举所有键盘设备
- **v0.1.2 新增**：Quick Menu 小键盘网格布局 + 自定义背景图
  - Quick Menu 新增 g_quickStyle: 0=旧版竖排列表，1=numpad网格(3x4)
  - 网格布局: 7/8/9,4/5/6,1/2/3,0(宽)/. — 共11个格位
  - 每格显示 PNG 图标 + 文本标签
  - 外接小键盘数字键直接映射网格位置（7→格0, 8→格1...）
  - 小键盘 +/- 翻页
  - Pie/Infinite/Quick/Wheel 均支持自定义背景图（*_bg_path 设置）
  - 背景图拉伸至菜单窗口大小，环/盘作为前景叠加

## Git 操作
- 非用户要求不得自动 commit / tag / push
- commit 前需用户明确说"实施"
- tag 格式：`v{major}.{minor}.{patch}`

### 仓库结构（v0.1.1 起）
- **父仓库**: `AE_FX_Manager/`（本目录）
  - 包含 `.gitignore`、`.trae/rules/`、`_deploy/`、README
  - WB_PieMenu_Official/ 和 wbflow/ 各自有独立 .git（初始化时 git init 会误注册为 submodule）
  - **首次 clone 后需 `git rm --cached WB_PieMenu_Official wbflow` 解除 submodule 绑定**
- **PieMenu 子仓库**: `WB_PieMenu_Official/.git`
- **FlowBoard 子仓库**: `wbflow/.git`
- 发布版本（v0.1.0、v0.1.1）只在父仓库打 tag；子仓库保持各自的独立 tag

## 模块结构（重构后）
### C++ 源文件（WB_PieMenu_Official/）
```
WB_PieMenu.h              — 共享头文件（extern 全局变量声明、函数声明）
WB_PieMenu.cpp            — 仅 AEGP 入口点 + 钩子
core/settings.cpp         — 设置读写（GetSettingsPath, SetVal, LoadSettings, WriteSection）
core/shared.cpp           — 全局变量定义 + WndProc + ShowMenu + WBEFF + 共享绘制
pie/pie.cpp               — DrawPie 仅
quick/quick.cpp           — DrawQuick, HitTestQuick
wheel/wheel.cpp           — DrawWheel, HitTestWheel
infinite/infinite.cpp     — DrawInfinite, HitTestInfinite, RingSector/HSL
guide_line.cpp            — DrawGuideLine
```
所有 .cpp 文件 `#include "WB_PieMenu.h"`，通过头文件共享 extern 全局变量。
修改某个菜单类型时只改对应模块文件，不影响其他菜单。

### PieMenu RawWndProc 重要逻辑（shared.cpp）
```
WM_INPUT 接收:
  1. auto-enable: 检测到 VK_NUMPAD0-9 时自动设 g_numpadEnabled=true
  2. auto-detect: 首次按 numpad 数字键时记录 g_numpadHandle 和 device path
  3. device path 持久匹配: 如果设置文件中配置了 numpad_device_path，按路径比较
  4. numpad Enter 拦截: VK_RETURN 且 dev 匹配 → 发送 KEYUP 消费掉该键 → ShowMenu()
     - ShowMenu 内通过 g_numpadTriggered 标记强制覆盖 g_menuType 和 g_selectMode
  5. numpad 0-9 转发: 发送 KEYUP 原键 + KEYDOWN F13-F21（现有行为）
```

### PieMenu 设置参数
```
numpad_enabled=1            (默认 true)
numpad_enter_action=1       (1=Quick, 2=Wheel, 3=Pie, 4=Infinite, 0=关)
numpad_device_path=\\?\HID#... (持久设备路径，可选)
numpad_handle=0x...         (运行时自动配置，不需要手动改)
numpad_name=                (保留字段)
quick_style=0               (0=竖排列表, 1=numpad网格)
pie_bg_path=                (Pie菜单背景图路径)
quick_bg_path=              (Quick菜单背景图路径)
wheel_bg_path=              (Wheel菜单背景图路径)
infinite_bg_path=           (Infinite菜单背景图路径)
```

### JS 源文件（CEP/WB_PieMenu_Panel/js/）
加载顺序 = 依赖顺序：
```
settings.js  (第1) — 全局变量、CSInterface、saveSettings/loadSettings/parseSettings
pie_ui.js    (第2) — renderMenu、renderInfinitePreview、槽编辑、FlowBoard 最近
flowboard.js (第3) — FlowBoard 最近列表重建
main.js      (第4) — DOMContentLoaded、事件绑定、语言、键盘
```
index.html 中以固定顺序加载这 4 个 script 标签。
旧版 index.js 保留但不使用，如需回滚可恢复单文件引用。

### JS 源文件（wbflow/js/）
加载顺序：
```
flowboard_core.js   (第1) — 全局变量、LANG_DATA/i18n、CSInterface、工具函数
flowboard_render.js (第2) — render/renderOverview、generateFlowFromEffects、save/open、addStep
flowboard_main.js   (第3) — DOMContentLoaded、所有事件绑定
```
旧版 index.js 保留为 `index.js.bak`。
