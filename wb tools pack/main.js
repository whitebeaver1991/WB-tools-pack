var csInterface = new CSInterface();

// ==================== Tooltip 风格的弹出菜单管理 ====================
var PopupManager = {
  activeOverlay: null,
  escHandler: null,

  show: function(html, className) {
    this.close();
    var overlay = document.createElement('div');
    overlay.className = 'popup-overlay' + (className ? ' ' + className : '');
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    this.activeOverlay = overlay;
    return overlay;
  },

  close: function() {
    if (this.activeOverlay) {
      this.activeOverlay.remove();
      this.activeOverlay = null;
    }
  }
};

// ==================== Toast 通知 ====================
function showToast(message, type) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function() { toast.remove(); }, 2000);
}

// ==================== 与 AE 通信 ====================
function aeCall(command, param, callback) {
  var script = 'cepDispatch("' + command + '"';
  if (param !== undefined && param !== null) {
    var safeParam = String(param).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    script += ', "' + safeParam + '"';
  }
  script += ')';

  csInterface.evalScript(script, function(result) {
    try {
      var data = JSON.parse(result);
      if (callback) callback(data);
    } catch(e) {
      if (callback) callback({error: 'JSON parse error: ' + e.toString()});
    }
  });
}

// ==================== 预设数据缓存 ====================
var AppState = {
  presets: [],
  boards: [],
  currentBoardIndex: -1,
  currentTab: 'presets'
};

// ==================== Pie Menu (Blender 风格方向菜单) ====================
// 基于鼠标移动方向高亮扇形，支持横向滚轮翻页，3秒无操作自动关闭
var pieMenuTimer = null;
var pieMenuActive = false;
var pieMenuKeyHandler = null;

function showPieMenu() {
  aeCall('getPresets', null, function(presets) {
    if (!presets || presets.length === 0) {
      showToast('没有可用预设', 'info');
      return;
    }
    renderPieMenu(presets);
  });
}

function renderPieMenu(allItems) {
  closePieMenu();

  var totalPages = Math.max(1, Math.ceil(allItems.length / 4));
  var currentPage = 0;
  var highlightedSector = -1;
  var directionSymbols = ['▲', '▶', '▼', '◀'];

  function getPageItems(page) {
    var start = page * 4;
    return allItems.slice(start, Math.min(start + 4, allItems.length));
  }

  function buildSectors(page) {
    var items = getPageItems(page);
    var html = '';
    for (var i = 0; i < 4; i++) {
      var item = items[i];
      var disabledStyle = item ? '' : 'opacity:0.15;cursor:default;';
      html += '<div class="pie-sector pie-sector-' + i + '" data-sector="' + i +
        '" style="' + disabledStyle + '">' +
        '<div class="pie-sector-direction">' + directionSymbols[i] + '</div>' +
        '<div class="pie-sector-label">' + (item ? escapeHtml(item.name) : '—') + '</div>' +
        '</div>';
    }
    return html;
  }

  function rebuildPage(page) {
    highlightedSector = -1;
    var circle = document.querySelector('.pie-overlay .pie-circle');
    if (!circle) return;
    circle.innerHTML = buildSectors(page) + '<div class="pie-center">AE FX<br>Page ' + (page + 1) + '</div>';
    var indicator = document.querySelector('.pie-overlay .pie-page-indicator');
    if (indicator) indicator.textContent = (page + 1) + ' / ' + totalPages;
    resetPieTimer();
  }

  // Build overlay
  var overlay = document.createElement('div');
  overlay.className = 'pie-overlay';
  overlay.innerHTML =
    '<div class="pie-container" id="pieContainer">' +
      '<div class="pie-circle">' + buildSectors(0) + '<div class="pie-center">AE FX<br>Page 1</div></div>' +
      '<div class="pie-page-indicator">1 / ' + totalPages + '</div>' +
      '<div class="pie-hint">移动鼠标选择方向 · 点击确认 · 滚轮翻页 · Esc关闭</div>' +
    '</div>';

  document.body.appendChild(overlay);
  pieMenuActive = true;

  // === 鼠标方向检测（Blender 风格） ===
  overlay.addEventListener('mousemove', function(e) {
    if (!pieMenuActive) return;
    var container = document.getElementById('pieContainer');
    if (!container) return;

    var rect = container.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = e.clientX - cx;
    var dy = e.clientY - cy;

    // 死区：鼠标在圆心附近时不选中
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) {
      if (highlightedSector !== -1) {
        highlightedSector = -1;
        document.querySelectorAll('.pie-overlay .pie-sector').forEach(function(s) {
          s.classList.remove('highlighted');
        });
      }
      return;
    }

    // 计算角度并确定扇区
    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    var sector;
    if (angle >= 45 && angle < 135) sector = 0;       // 上
    else if (angle >= -45 && angle < 45) sector = 1;   // 右
    else if (angle >= -135 && angle < -45) sector = 2;  // 下
    else sector = 3;                                     // 左

    if (sector !== highlightedSector) {
      highlightedSector = sector;
      document.querySelectorAll('.pie-overlay .pie-sector').forEach(function(s, i) {
        s.classList.toggle('highlighted', i === sector);
      });
      resetPieTimer();
    }
  });

  // === 点击确认 ===
  overlay.addEventListener('click', function(e) {
    if (!pieMenuActive || highlightedSector < 0) return;
    var items = getPageItems(currentPage);
    if (highlightedSector < items.length) {
      doPieConfirm(items[highlightedSector]);
    }
  });

  // === 横向滚轮翻页 ===
  overlay.addEventListener('wheel', function(e) {
    if (!pieMenuActive) return;
    if (e.deltaX !== 0) {
      e.preventDefault();
      if (e.deltaX > 0 && currentPage < totalPages - 1) {
        currentPage++;
        rebuildPage(currentPage);
      } else if (e.deltaX < 0 && currentPage > 0) {
        currentPage--;
        rebuildPage(currentPage);
      }
    }
  }, {passive: false});

  // === 键盘 ===
  pieMenuKeyHandler = function(e) {
    if (!pieMenuActive) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closePieMenu();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedSector >= 0) {
        var items = getPageItems(currentPage);
        if (highlightedSector < items.length) {
          doPieConfirm(items[highlightedSector]);
        }
      }
    }
  };
  document.addEventListener('keydown', pieMenuKeyHandler);

  // === 3秒自动关闭计时器 ===
  function resetPieTimer() {
    if (!pieMenuActive) return;
    if (pieMenuTimer) clearTimeout(pieMenuTimer);
    pieMenuTimer = setTimeout(function() {
      if (pieMenuActive) closePieMenu();
    }, 3000);
  }

  resetPieTimer();
}

function closePieMenu() {
  pieMenuActive = false;
  if (pieMenuTimer) {
    clearTimeout(pieMenuTimer);
    pieMenuTimer = null;
  }
  if (pieMenuKeyHandler) {
    document.removeEventListener('keydown', pieMenuKeyHandler);
    pieMenuKeyHandler = null;
  }
  document.querySelectorAll('.pie-overlay').forEach(function(el) { el.remove(); });
  removeFloatingBarHighlight();
}

function doPieConfirm(item) {
  closePieMenu();
  aeCall('applyPreset', item.id, function(result) {
    if (result && result.success) {
      showToast('已应用: ' + (result.name || item.name), 'success');
    } else {
      showToast((result && result.error) || '应用失败', 'error');
    }
  });
}

// ==================== Wheel Menu (滚轮列表) ====================
function showWheelMenu() {
  aeCall('getPresets', null, function(presets) {
    if (!presets || presets.length === 0) {
      showToast('没有可用预设', 'error');
      return;
    }
    renderWheelMenu(presets);
  });
}

function renderWheelMenu(allItems) {
  var highlightedIndex = 0;

  function render() {
    var itemsHtml = '';
    for (var i = 0; i < allItems.length; i++) {
      itemsHtml += '<div class="wheel-item' + (i === highlightedIndex ? ' highlighted' : '') + '" data-index="' + i + '">' +
        '<span class="index">' + (i + 1) + '</span>' +
        '<span class="name">' + escapeHtml(allItems[i].name) + '</span>' +
        '</div>';
    }

    PopupManager.show(
      '<div class="wheel-container">' +
      '<div class="wheel-header">滚轮菜单 <span style="font-size:11px;color:#999;">共 ' + allItems.length + ' 项</span></div>' +
      '<div class="wheel-list">' + itemsHtml + '</div>' +
      '<div class="wheel-footer">↑↓ 滚动 · Enter 选择 · Esc 取消</div>' +
      '</div>',
      'wheel-overlay'
    );

    var list = document.querySelector('.wheel-list');
    if (list) {
      list.querySelectorAll('.wheel-item').forEach(function(el) {
        el.onclick = function() {
          var idx = parseInt(this.dataset.index);
          PopupManager.close();
          aeCall('applyPreset', allItems[idx].id, function(result) {
            if (result && result.success) {
              showToast('已应用: ' + (result.name || allItems[idx].name), 'success');
            } else {
              showToast((result && result.error) || '应用失败', 'error');
            }
          });
          removeFloatingBarHighlight();
        };
      });
    }

    document.addEventListener('keydown', wheelKeyHandler);
    PopupManager.escHandler = function() {
      document.removeEventListener('keydown', wheelKeyHandler);
      PopupManager.close();
      removeFloatingBarHighlight();
    };

    document.querySelector('.wheel-overlay').onclick = function(e) {
      if (e.target === this) PopupManager.escHandler();
    };
  }

  function wheelKeyHandler(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (highlightedIndex < allItems.length - 1) highlightedIndex++;
      else highlightedIndex = 0;
      render();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (highlightedIndex > 0) highlightedIndex--;
      else highlightedIndex = allItems.length - 1;
      render();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      PopupManager.close();
      aeCall('applyPreset', allItems[highlightedIndex].id, function(result) {
        if (result && result.success) {
          showToast('已应用: ' + (result.name || allItems[highlightedIndex].name), 'success');
        } else {
          showToast((result && result.error) || '应用失败', 'error');
        }
      });
      removeFloatingBarHighlight();
    } else if (e.key === 'Escape') {
      PopupManager.escHandler();
    }
  }

  render();
}

// ==================== Quick Menu (快速搜索) ====================
function showQuickMenu() {
  aeCall('getPresets', null, function(presets) {
    if (!presets || presets.length === 0) {
      showToast('没有可用预设', 'error');
      return;
    }
    renderQuickMenu(presets);
  });
}

function renderQuickMenu(allItems) {
  var filtered = allItems;
  var highlightedIndex = 0;
  var searchValue = '';

  function render() {
    var resultsHtml = '';
    if (filtered.length === 0) {
      resultsHtml = '<div class="quick-empty">没有匹配的预设</div>';
    } else {
      for (var i = 0; i < filtered.length; i++) {
        resultsHtml += '<div class="quick-result-item' + (i === highlightedIndex ? ' highlighted' : '') + '" data-index="' + i + '">' +
          '<div class="name">' + escapeHtml(filtered[i].name) + '</div>' +
          '<div class="desc">' + (filtered[i].description || '') + '</div>' +
          '</div>';
      }
    }

    PopupManager.show(
      '<div class="quick-container">' +
      '<div class="quick-input-wrap"><input type="text" id="quickInput" placeholder="搜索预设..." value="' + escapeHtml(searchValue) + '"></div>' +
      '<div class="quick-results">' + resultsHtml + '</div>' +
      '<div class="quick-footer">↑↓ 选择 · Enter 确认 · Esc 取消</div>' +
      '</div>',
      'quick-overlay'
    );

    var input = document.getElementById('quickInput');
    if (input) {
      input.focus();
      input.selectionStart = input.selectionEnd = input.value.length;
      input.oninput = function() {
        searchValue = this.value;
        if (searchValue.trim()) {
          var kw = searchValue.toLowerCase().trim();
          filtered = allItems.filter(function(p) {
            return p.name.toLowerCase().indexOf(kw) >= 0 ||
              (p.description && p.description.toLowerCase().indexOf(kw) >= 0) ||
              (p.tags && p.tags.some(function(t) { return t.toLowerCase().indexOf(kw) >= 0; }));
          });
        } else {
          filtered = allItems;
        }
        highlightedIndex = 0;
        render();
        var newInput = document.getElementById('quickInput');
        if (newInput) {
          newInput.focus();
          newInput.selectionStart = newInput.selectionEnd = newInput.value.length;
        }
      };
    }

    var resultsDiv = document.querySelector('.quick-results');
    if (resultsDiv) {
      resultsDiv.querySelectorAll('.quick-result-item').forEach(function(el) {
        el.onclick = function() {
          var idx = parseInt(this.dataset.index);
          PopupManager.close();
          aeCall('applyPreset', filtered[idx].id, function(result) {
            if (result && result.success) {
              showToast('已应用: ' + (result.name || filtered[idx].name), 'success');
            } else {
              showToast((result && result.error) || '应用失败', 'error');
            }
          });
          removeFloatingBarHighlight();
        };
      });
    }

    document.addEventListener('keydown', quickKeyHandler);
    PopupManager.escHandler = function() {
      document.removeEventListener('keydown', quickKeyHandler);
      PopupManager.close();
      removeFloatingBarHighlight();
    };

    document.querySelector('.quick-overlay').onclick = function(e) {
      if (e.target === this) PopupManager.escHandler();
    };
  }

  function quickKeyHandler(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (highlightedIndex < filtered.length - 1) highlightedIndex++;
      render();
      var items = document.querySelectorAll('.quick-result-item');
      if (items[highlightedIndex]) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      var input = document.getElementById('quickInput');
      if (input) { input.focus(); input.selectionStart = input.selectionEnd = input.value.length; }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (highlightedIndex > 0) highlightedIndex--;
      render();
      var items = document.querySelectorAll('.quick-result-item');
      if (items[highlightedIndex]) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      var input = document.getElementById('quickInput');
      if (input) { input.focus(); input.selectionStart = input.selectionEnd = input.value.length; }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && highlightedIndex < filtered.length) {
        PopupManager.close();
        aeCall('applyPreset', filtered[highlightedIndex].id, function(result) {
          if (result && result.success) {
            showToast('已应用: ' + (result.name || filtered[highlightedIndex].name), 'success');
          } else {
            showToast((result && result.error) || '应用失败', 'error');
          }
        });
        removeFloatingBarHighlight();
      }
    } else if (e.key === 'Escape') {
      PopupManager.escHandler();
    }
  }

  render();
}

// ==================== 浮动栏 (ToolTip 风格) ====================
var floatingBar = null;

function ensureFloatingBar() {
  if (floatingBar) return;

  var header = document.createElement('div');
  header.className = 'floating-bar-header';
  header.textContent = '⚡ 快捷菜单';

  var btnRow = document.createElement('div');
  btnRow.className = 'floating-bar-row';

  var pieBtn = document.createElement('button');
  pieBtn.className = 'bar-btn';
  pieBtn.innerHTML = '<span>●</span> Pie <span class="shortcut">Ctrl+Shift+1</span>';
  pieBtn.onclick = function() { showPieMenu(); };
  pieBtn.title = '方向菜单 (Ctrl+Shift+1)';

  var wheelBtn = document.createElement('button');
  wheelBtn.className = 'bar-btn';
  wheelBtn.innerHTML = '<span>◆</span> Wheel <span class="shortcut">Ctrl+Shift+2</span>';
  wheelBtn.onclick = function() { showWheelMenu(); };
  wheelBtn.title = '滚轮菜单 (Ctrl+Shift+2)';

  var quickBtn = document.createElement('button');
  quickBtn.className = 'bar-btn';
  quickBtn.innerHTML = '<span>◈</span> Quick <span class="shortcut">Ctrl+Shift+3</span>';
  quickBtn.onclick = function() { showQuickMenu(); };
  quickBtn.title = '搜索菜单 (Ctrl+Shift+3)';

  btnRow.appendChild(pieBtn);
  btnRow.appendChild(wheelBtn);
  btnRow.appendChild(quickBtn);

  var ahkNote = document.createElement('div');
  ahkNote.className = 'floating-bar-hint';
  ahkNote.textContent = '全局快捷键需配合 AHK 脚本使用';

  floatingBar = document.createElement('div');
  floatingBar.className = 'floating-bar';
  floatingBar.appendChild(header);
  floatingBar.appendChild(btnRow);
  floatingBar.appendChild(ahkNote);

  document.body.appendChild(floatingBar);
}

// ==================== 快捷键（面板 + 窗口两层监听） ====================
function handleKeydown(e) {
  if (e.ctrlKey && e.shiftKey) {
    var key = e.key;
    var code = e.code;
    if (key === '1' || code === 'Digit1') { showPieMenu(); e.preventDefault(); }
    else if (key === '2' || code === 'Digit2') { showWheelMenu(); e.preventDefault(); }
    else if (key === '3' || code === 'Digit3') { showQuickMenu(); e.preventDefault(); }
  }
}
document.addEventListener('keydown', handleKeydown);
window.addEventListener('keydown', handleKeydown);

function removeFloatingBarHighlight() {}

// ==================== 主面板 UI ====================
function loadMainUI() {
  loadPresets();
  loadBoards();
}

function loadPresets() {
  aeCall('getPresets', null, function(presets) {
    AppState.presets = presets || [];
    renderPresets(AppState.presets);
  });
}

function renderPresets(presets) {
  var grid = document.getElementById('presetGrid');
  if (!grid) return;

  if (presets.length === 0) {
    grid.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#666;font-size:13px;">' +
      '暂无预设<br><br>' +
      '<button class="btn primary" onclick="createTestPresets()">生成测试预设</button>' +
      '</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < presets.length; i++) {
    var p = presets[i];
    html += '<div class="preset-item" data-id="' + p.id + '" onclick="applyPresetFromGrid(\'' + p.id + '\',\'' + escapeHtml(p.name) + '\')">' +
      '<span class="icon">🎨</span>' +
      '<div class="name">' + escapeHtml(p.name) + '</div>' +
      '<div class="desc">' + (p.description || '') + '</div>' +
      '</div>';
  }
  grid.innerHTML = html;
}

function applyPresetFromGrid(id, name) {
  aeCall('applyPreset', id, function(result) {
    if (result && result.success) {
      showToast('已应用: ' + name, 'success');
    } else {
      showToast((result && result.error) || '应用失败', 'error');
    }
  });
}

function createTestPresets() {
  aeCall('createTestPresets', null, function(result) {
    if (result && result.count) {
      showToast('已生成 ' + result.count + ' 个测试预设', 'success');
      loadPresets();
    }
  });
}

function searchPresets() {
  var keyword = document.getElementById('searchInput').value;
  var clearBtn = document.querySelector('.search-bar .clear-btn');
  if (keyword.trim()) {
    clearBtn.classList.add('visible');
    aeCall('searchPresets', keyword, function(results) {
      renderPresets(results || []);
    });
  } else {
    clearBtn.classList.remove('visible');
    loadPresets();
  }
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  document.querySelector('.search-bar .clear-btn').classList.remove('visible');
  loadPresets();
}

function savePreset() {
  var name = prompt('请输入预设名称:', '我的预设');
  if (!name) return;
  aeCall('saveLayerAsPreset', '|||' + name + '||', function(result) {
    if (result && result.success) {
      showToast('预设已保存: ' + name, 'success');
      loadPresets();
    } else {
      showToast((result && result.error) || '保存失败', 'error');
    }
  });
}

// ==================== 白板 UI ====================
function loadBoards() {
  aeCall('getBoards', null, function(boards) {
    AppState.boards = boards || [];
    renderBoardTabs();
    if (AppState.boards.length > 0) {
      if (AppState.currentBoardIndex < 0) AppState.currentBoardIndex = 0;
      if (AppState.currentBoardIndex >= AppState.boards.length) AppState.currentBoardIndex = 0;
      renderBoardContent(AppState.boards[AppState.currentBoardIndex]);
    } else {
      var content = document.getElementById('boardContent');
      if (content) {
        content.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#666;font-size:13px;">暂无白板，点击"新建白板"开始</div>';
      }
    }
  });
}

function renderBoardTabs() {
  var tabsDiv = document.getElementById('boardTabs');
  if (!tabsDiv) return;

  var html = '';
  for (var i = 0; i < AppState.boards.length; i++) {
    html += '<div class="board-tab' + (i === AppState.currentBoardIndex ? ' active' : '') + '" data-index="' + i + '">' +
      escapeHtml(AppState.boards[i].name) +
      '<span style="margin-left:6px;font-size:10px;color:#666;">' + (AppState.boards[i].items ? AppState.boards[i].items.length : 0) + '</span>' +
      '</div>';
  }
  tabsDiv.innerHTML = html;

  tabsDiv.querySelectorAll('.board-tab').forEach(function(el) {
    el.onclick = function() {
      AppState.currentBoardIndex = parseInt(this.dataset.index);
      renderBoardTabs();
      renderBoardContent(AppState.boards[AppState.currentBoardIndex]);
    };
  });
}

function createBoard() {
  var name = prompt('请输入白板名称:', '新白板');
  if (!name) return;
  aeCall('createBoard', name, function(result) {
    if (result && result.success) {
      showToast('白板已创建', 'success');
      loadBoards();
    }
  });
}

function deleteCurrentBoard() {
  if (AppState.currentBoardIndex < 0 || !AppState.boards[AppState.currentBoardIndex]) return;
  var board = AppState.boards[AppState.currentBoardIndex];
  if (!confirm('确定删除白板 "' + board.name + '" 吗？')) return;
  aeCall('deleteBoard', board.id, function(result) {
    if (result && result.success) {
      showToast('白板已删除', 'success');
      AppState.currentBoardIndex = -1;
      loadBoards();
    }
  });
}

function renderBoardContent(board) {
  var content = document.getElementById('boardContent');
  if (!content || !board) return;

  if (!board.items || board.items.length === 0) {
    content.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#666;font-size:13px;">白板为空，在预设标签中选择预设添加到白板</div>';
    return;
  }

  var presetIds = board.items.map(function(item) { return item.presetId; });
  var fullPresets = AppState.presets;
  var boardPresets = fullPresets.filter(function(p) { return presetIds.indexOf(p.id) >= 0; });

  var html = '<div class="preset-grid">';
  for (var i = 0; i < boardPresets.length; i++) {
    var p = boardPresets[i];
    var boardItem = board.items.filter(function(item) { return item.presetId === p.id; })[0];
    html += '<div class="preset-item" data-id="' + p.id + '" onclick="applyPresetFromGrid(\'' + escapeHtml(p.id) + '\',\'' + escapeHtml(p.name) + '\')">' +
      '<span class="icon">🎨</span>' +
      '<div class="name">' + escapeHtml(p.name) + '</div>' +
      '<div style="font-size:10px;color:#dc3545;margin-top:4px;cursor:pointer;" onclick="event.stopPropagation();removeFromBoard(\'' + board.id + '\',\'' + p.id + '\')">✕ 移除</div>' +
      '</div>';
  }
  html += '</div>';
  content.innerHTML = html;
}

function removeFromBoard(boardId, presetId) {
  aeCall('removePresetFromBoard', boardId + '|||' + presetId, function(result) {
    if (result && result.success) {
      showToast('已从白板移除', 'info');
      AppState.boards = AppState.boards.map(function(b) {
        if (b.id === boardId) return result.board;
        return b;
      });
      renderBoardContent(result.board);
      renderBoardTabs();
    }
  });
}

// ==================== 标签切换 ====================
function switchTab(tabName) {
  AppState.currentTab = tabName;

  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.tab-panel').forEach(function(panel) {
    panel.classList.remove('active');
  });

  var tabBtn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
  if (tabBtn) tabBtn.classList.add('active');

  var panel = document.getElementById('panel' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
  if (panel) panel.classList.add('active');

  if (tabName === 'presets') loadPresets();
  else if (tabName === 'boards') loadBoards();
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==================== 面板初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  csInterface.registerKeyEventsInterest(["Ctrl+Shift+1", "Ctrl+Shift+2", "Ctrl+Shift+3"]);
  loadMainUI();
  ensureFloatingBar();
  showToast('wb tools pack 已加载，点击浮动按钮或 Ctrl+Shift+1/2/3', 'info');
});
