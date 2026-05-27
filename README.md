# WB Menu Suite — Pie Menu

Version 0.0.1

vibe coding作者: whitebeaver
本项目完全免费，由Trae与Deepseek V4.0 Flash版本生成，完全AI，绝无人工要素

---

## 什么是 Git

Git 是一个版本管理工具，记录你对代码做的每一次修改。就像游戏的存档功能——你可以随时回到任意一个旧版本。

## 刚才做了什么

1. `git init` — 在当前文件夹创建了一个本地仓库（.git 文件夹）
2. `git add -A` — 标记所有文件为「待提交」
3. `git commit` — 正式保存，生成了第一个版本记录（commit）

## 修改后如何提交新版本

每次你新增功能或修 bug 后，打开终端，cd 到仓库目录，然后执行：

```bash
cd WB_PieMenu_Official
git add -A
git commit -m "版本描述（用英文，如：Add text size slider, fix color bug）"
```

这样就会生成一个新的 commit 记录，不会丢失任何旧版本。

## 如何查看历史

```bash
git log --oneline
```

## 如何恢复到旧版本

```bash
git log --oneline        # 查看历史，找到要恢复的 commit id
git checkout <commit_id> # 临时回到那个版本
git checkout master      # 回到最新版
```

---

## 如何部署（重要）

每次修改后，要把改动部署到 AE 里，需要复制以下文件：

### 1. AEX 插件（C++ 代码修改后必须复制）
```
源文件: WB_PieMenu_Official\BuildOutput\AEGP\WB_PieMenu.aex
目标路径: C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\Plug-ins\WB_PieMenu.aex
```

> 注意：复制前必须先关闭 AE（AfterFX.exe），否则文件被占用无法覆盖

### 2. CEP 面板（修改了 HTML/JS/CSS 后必须复制）
需要复制以下 3 个文件：

```
源文件                              目标路径
─────────────────────────────────────────────────────────
index.html          →  %APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel\index.html
js\index.js         →  %APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel\js\index.js
css\style.css       →  %APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel\css\style.css
```

> `%APPDATA%` 通常等于 `C:\Users\你的用户名\AppData\Roaming`

### 3. C++ 代码修改后需要重新编译

如果你修改了 `WB_PieMenu.cpp` 等 .cpp 文件，需要先编译生成新的 .aex：

```bash
# 用 Visual Studio 编译（msbuild），自动输出到 BuildOutput\AEGP\
cd WB_PieMenu_Official\Win
.\build_official.ps1
```

或者直接在 VS 里打开 `WB_PieMenu.sln`，选 Release x64，生成。

---

## 下次开发新功能的流程

```
1. 修改代码（C++ 或 CEP 面板）
2. 编译（只改了 HTML/JS/CSS 可跳过）
3. 复制 .aex 和/或 CEP 文件到 AE 目录
4. 启动 AE 测试
5. 测试通过 → git add -A → git commit -m "xxx"
```

## 注意事项

- `.gitignore` 已经配置好，编译产物（.obj、.lib、.pdb 等）不会进入 Git 版本控制
- 建议每次提交只包含一个完整功能的改动，commit message 写清楚改了什么
- 如果想关联 GitHub 远程仓库，跑 `git remote add origin <仓库URL>` + `git push -u origin master`
