# AE FX Manager v1.0

After Effects 2025.3 特效管理器 - 专业的特效预设管理和白板系统

## 功能特性

### 1. 特效预设管理
- **保存预设**: 将图层上的所有特效保存为可复用的预设
- **混合存储**: JSON文件存储配置信息，FFX文件存储实际特效数据
- **智能搜索**: 支持按名称、描述、标签搜索预设
- **快速应用**: 一键将预设应用到选中图层

### 2. 白板系统（飞书风格）
- **可视化布局**: 类似飞书多维表格的卡片式图标布局
- **自定义颜色**: 每个预设按钮可设置不同颜色
- **工程间共享**: 白板配置可跨工程使用
- **快速调用**: 点击图标直接应用预设

### 3. 快捷调用方式
- **快捷键**: 支持自定义快捷键调用
- **饼图菜单**: 圆形菜单快速选择（最多8个预设）
- **滚轮菜单**: 滚动选择预设列表
- **HID Macros**: 配合外部工具实现硬件快捷键

## 安装方法

### 方法一：自动安装（推荐）
1. 在After Effects中运行 `install.jsx`
2. 重启After Effects
3. 在菜单中找到：窗口 > AE FX Manager

### 方法二：手动安装
1. 复制 `src` 文件夹中的所有 `.jsx` 文件
2. 粘贴到AE脚本文件夹：
   - Windows: `C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\Scripts\ScriptUI Panels`
   - Mac: `/Applications/Adobe After Effects 2025/Scripts/ScriptUI Panels`
3. 重启After Effects

## 使用指南

### 保存预设
1. 在AE中选中带有特效的图层
2. 打开AE FX Manager面板
3. 点击"保存选中图层为预设"
4. 填写预设名称、描述和标签
5. 点击保存

### 应用预设
1. 选中目标图层
2. 在预设列表中找到需要的预设
3. 点击"应用到选中图层"

### 使用白板
1. 切换到"白板"标签页
2. 点击"新建白板"创建新的白板
3. 点击"添加预设到当前白板"
4. 选择要添加的预设
5. 在白板上点击图标即可应用

### 快捷调用

#### 饼图菜单
- 按 `F1`（或配置的快捷键）
- 显示圆形菜单，点击对应扇区应用预设

#### 滚轮菜单
- 按 `F2`（或配置的快捷键）
- 使用鼠标滚轮或上下键选择
- 按Enter确认

#### 快速搜索
- 按 `F3`（或配置的快捷键）
- 输入关键词搜索
- 输入编号应用

## 配合HID Macros使用

### 配置步骤
1. 打开AE FX Manager的"设置"标签页
2. 启用"HID Macros支持"
3. 点击"导出HID配置"
4. 在HID Macros中导入配置文件
5. 绑定硬件按键到对应的脚本命令

### 支持的命令
```
afterfx.exe -r "FXM_HotkeyHelper.jsx" -action pie_menu      # 显示饼图菜单
afterfx.exe -r "FXM_HotkeyHelper.jsx" -action wheel_menu    # 显示滚轮菜单
afterfx.exe -r "FXM_HotkeyHelper.jsx" -action search        # 快速搜索
afterfx.exe -r "FXM_HotkeyHelper.jsx" -action apply [ID]    # 应用指定预设
```

## 文件结构

```
AE_FX_Manager/
├── src/
│   ├── AE_FX_Manager.jsx      # 主程序
│   ├── FXM_PieMenu.jsx        # 饼图/滚轮菜单
│   └── FXM_HotkeyHelper.jsx   # 快捷键辅助
├── install.jsx                # 安装脚本
└── README.md                  # 说明文档

用户数据文件夹/
└── AE_FX_Manager/
    ├── Presets/               # 预设存储
    │   ├── [预设ID].json      # 预设配置
    │   └── [预设ID].ffx       # 特效数据
    ├── Boards/                # 白板存储
    │   └── [白板ID].json      # 白板配置
    ├── Icons/                 # 图标存储
    └── config.json            # 全局配置
```

## 快捷键配置

配置文件位置：
- Windows: `%USERPROFILE%\AE_FX_Manager\config.json`
- Mac: `~/AE_FX_Manager/config.json`

默认快捷键：
- `F1` - 显示饼图菜单
- `F2` - 显示滚轮菜单
- `F3` - 快速搜索
- `F4` - 应用最近使用的预设

## 注意事项

1. **AE版本**: 本插件专为After Effects 2025.3开发，其他版本可能不兼容
2. **管理员权限**: 自动安装可能需要管理员权限
3. **预设兼容性**: 某些第三方插件的预设可能无法正确保存
4. **备份建议**: 建议定期备份 `AE_FX_Manager` 文件夹

## 故障排除

### 面板不显示
- 检查脚本是否正确安装到ScriptUI Panels文件夹
- 重启After Effects
- 检查AE版本是否为2025.3

### 预设无法保存
- 检查用户数据文件夹是否有写入权限
- 确保选中的图层有特效

### 快捷键无效
- 检查是否有其他软件占用相同快捷键
- 在设置中重新配置快捷键
- 确保以管理员权限运行AE

## 更新日志

### v1.0.0 (2025-05-06)
- 初始版本发布
- 实现预设保存和搜索功能
- 实现白板系统
- 支持饼图菜单和滚轮菜单
- 支持HID Macros集成

## 技术支持

如有问题或建议，请通过以下方式联系：
- 提交Issue到项目仓库
- 发送邮件至技术支持

---

**AE FX Manager** - 让After Effects特效管理更高效！
