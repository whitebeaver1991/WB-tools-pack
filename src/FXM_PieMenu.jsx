/*
 * AE FX Manager - Pie Menu 模块
 * 圆形菜单快速调用预设
 */

#target aftereffects

// 圆形菜单类
var PieMenu = function(items, callback) {
    this.items = items || [];
    this.callback = callback;
    this.window = null;
    this.centerX = 0;
    this.centerY = 0;
    this.radius = 120;
    this.itemRadius = 40;
};

PieMenu.prototype = {
    // 显示菜单
    show: function(x, y) {
        this.centerX = x || 400;
        this.centerY = y || 300;
        
        var win = new Window("palette", "", [this.centerX - this.radius - 50, this.centerY - this.radius - 50, 
                                              this.centerX + this.radius + 50, this.centerY + this.radius + 50]);
        win.opacity = 0.95;
        
        // 绘制圆形菜单
        var self = this;
        win.onDraw = function() {
            var g = this.graphics;
            
            // 绘制背景圆
            g.newPath();
            g.ellipsePath(self.centerX - this.bounds.x, self.centerY - this.bounds.y, self.radius, self.radius);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.2, 0.2, 0.2, 0.95]));
            
            // 绘制中心圆
            g.newPath();
            g.ellipsePath(self.centerX - this.bounds.x, self.centerY - this.bounds.y, 30, 30);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, [0.4, 0.4, 0.4, 1.0]));
            
            // 绘制菜单项
            var angleStep = 2 * Math.PI / self.items.length;
            for (var i = 0; i < self.items.length; i++) {
                var angle = i * angleStep - Math.PI / 2;
                var itemX = self.centerX + Math.cos(angle) * (self.radius - self.itemRadius) - this.bounds.x;
                var itemY = self.centerY + Math.sin(angle) * (self.radius - self.itemRadius) - this.bounds.y;
                
                // 绘制项目圆
                g.newPath();
                g.ellipsePath(itemX, itemY, self.itemRadius, self.itemRadius);
                
                var color = self.items[i].color || [0.3, 0.6, 1.0];
                g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, color.concat([1.0])));
                
                // 绘制文字
                g.drawString(self.items[i].name.substring(0, 2), 
                    g.newFont("Arial", 14),
                    itemX - 10, itemY - 8);
            }
        };
        
        // 鼠标点击处理
        win.addEventListener("mousedown", function(event) {
            var clickX = event.clientX;
            var clickY = event.clientY;
            
            // 检查是否点击了中心（取消）
            var distToCenter = Math.sqrt(Math.pow(clickX - self.centerX, 2) + Math.pow(clickY - self.centerY, 2));
            if (distToCenter < 30) {
                win.close();
                return;
            }
            
            // 检查点击了哪个项目
            var angleStep = 2 * Math.PI / self.items.length;
            for (var i = 0; i < self.items.length; i++) {
                var angle = i * angleStep - Math.PI / 2;
                var itemX = self.centerX + Math.cos(angle) * (self.radius - self.itemRadius);
                var itemY = self.centerY + Math.sin(angle) * (self.radius - self.itemRadius);
                
                var dist = Math.sqrt(Math.pow(clickX - itemX, 2) + Math.pow(clickY - itemY, 2));
                if (dist < self.itemRadius) {
                    if (self.callback) {
                        self.callback(self.items[i]);
                    }
                    win.close();
                    return;
                }
            }
        });
        
        // ESC关闭
        win.addEventListener("keydown", function(event) {
            if (event.keyName === "Escape") {
                win.close();
            }
        });
        
        this.window = win;
        win.show();
    },
    
    // 关闭菜单
    close: function() {
        if (this.window) {
            this.window.close();
        }
    }
};

// 滚轮菜单类
var WheelMenu = function(items, callback) {
    this.items = items || [];
    this.callback = callback;
    this.window = null;
    this.currentIndex = 0;
    this.visibleCount = 7;
};

WheelMenu.prototype = {
    show: function() {
        var win = new Window("palette", "滚轮菜单", undefined, {
            closeButton: false
        });
        win.preferredSize = [300, 400];
        win.orientation = "column";
        win.alignChildren = ["fill", "fill"];
        
        var self = this;
        
        // 标题
        var title = win.add("statictext", undefined, "滚轮选择预设");
        title.justify = "center";
        title.graphics.font = title.graphics.newFont("Arial", 16);
        
        // 项目列表
        var listGroup = win.add("group");
        listGroup.orientation = "column";
        listGroup.alignChildren = ["fill", "center"];
        listGroup.preferredSize = [280, 300];
        
        var itemButtons = [];
        
        var updateDisplay = function() {
            // 清除旧按钮
            for (var i = listGroup.children.length - 1; i >= 0; i--) {
                listGroup.remove(listGroup.children[i]);
            }
            itemButtons = [];
            
            // 计算显示范围
            var start = Math.max(0, self.currentIndex - Math.floor(self.visibleCount / 2));
            var end = Math.min(self.items.length, start + self.visibleCount);
            
            for (var i = start; i < end; i++) {
                var btn = listGroup.add("button", undefined, self.items[i].name);
                btn.preferredSize = [260, 40];
                
                if (i === self.currentIndex) {
                    btn.graphics.backgroundColor = btn.graphics.newBrush(
                        btn.graphics.BrushType.SOLID_COLOR, [0.3, 0.6, 1.0]
                    );
                }
                
                btn.itemIndex = i;
                btn.onClick = function() {
                    if (self.callback) {
                        self.callback(self.items[this.itemIndex]);
                    }
                    win.close();
                };
                
                itemButtons.push(btn);
            }
            
            win.layout.layout(true);
        };
        
        // 滚轮事件
        win.addEventListener("mousewheel", function(event) {
            if (event.deltaY > 0) {
                self.currentIndex = Math.min(self.items.length - 1, self.currentIndex + 1);
            } else {
                self.currentIndex = Math.max(0, self.currentIndex - 1);
            }
            updateDisplay();
        });
        
        // 键盘导航
        win.addEventListener("keydown", function(event) {
            if (event.keyName === "Down") {
                self.currentIndex = Math.min(self.items.length - 1, self.currentIndex + 1);
                updateDisplay();
            } else if (event.keyName === "Up") {
                self.currentIndex = Math.max(0, self.currentIndex - 1);
                updateDisplay();
            } else if (event.keyName === "Enter") {
                if (self.callback && self.currentIndex >= 0 && self.currentIndex < self.items.length) {
                    self.callback(self.items[self.currentIndex]);
                }
                win.close();
            } else if (event.keyName === "Escape") {
                win.close();
            }
        });
        
        // 控制按钮
        var btnGroup = win.add("group");
        btnGroup.orientation = "row";
        btnGroup.alignChildren = ["center", "center"];
        
        var upBtn = btnGroup.add("button", undefined, "▲");
        var downBtn = btnGroup.add("button", undefined, "▼");
        var okBtn = btnGroup.add("button", undefined, "确定");
        var cancelBtn = btnGroup.add("button", undefined, "取消");
        
        upBtn.onClick = function() {
            self.currentIndex = Math.max(0, self.currentIndex - 1);
            updateDisplay();
        };
        
        downBtn.onClick = function() {
            self.currentIndex = Math.min(self.items.length - 1, self.currentIndex + 1);
            updateDisplay();
        };
        
        okBtn.onClick = function() {
            if (self.callback && self.currentIndex >= 0 && self.currentIndex < self.items.length) {
                self.callback(self.items[self.currentIndex]);
            }
            win.close();
        };
        
        cancelBtn.onClick = function() {
            win.close();
        };
        
        this.window = win;
        updateDisplay();
        win.center();
        win.show();
    },
    
    close: function() {
        if (this.window) {
            this.window.close();
        }
    }
};

// 导出模块
if (typeof module !== 'undefined') {
    module.exports = {
        PieMenu: PieMenu,
        WheelMenu: WheelMenu
    };
}
