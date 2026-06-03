# WB FlowBoard

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

每次你修改代码后，打开终端，cd 到仓库目录，然后执行：

```bash
cd wbflow
git add -A
git commit -m "版本描述（用英文，如：Add new feature, fix bug）"
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

## 如何部署

WB FlowBoard 是纯 CEP 面板（没有 C++ 插件），所以只需要复制 HTML/JS/CSS 文件。

### CEP 面板（3 个文件）

```
源文件                              目标路径
─────────────────────────────────────────────────────────
wbflow\index.html       →  %APPDATA%\Adobe\CEP\extensions\wbflow\index.html
wbflow\js\index.js      →  %APPDATA%\Adobe\CEP\extensions\wbflow\js\index.js
wbflow\css\style.css    →  %APPDATA%\Adobe\CEP\extensions\wbflow\css\style.css
```

> `%APPDATA%` 通常等于 `C:\Users\你的用户名\AppData\Roaming`

---

## 下次开发新功能的流程

```
1. 修改代码（wbflow 目录下的 HTML/JS/CSS）
2. 复制 wbflow\ 目录下对应的文件到 %APPDATA%\Adobe\CEP\extensions\wbflow\
3. 启动 AE 测试
4. 测试通过 → git add -A → git commit -m "xxx"
```

## 注意事项

- 复制前不需要关闭 AE（CEP 面板支持热更新），但最好刷新一下面板
- 建议每次提交只包含一个完整功能的改动
- 如果想关联 GitHub 远程仓库，跑 `git remote add origin <仓库URL>` + `git push -u origin master`
