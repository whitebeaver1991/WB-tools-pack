#pragma warning(disable: 4819)
#include "..\WB_PieMenu.h"

// 5x4 numpad grid
// [NLck][  /  ][  *  ][  -  ]  row 0: / slot10 * slot11 - page
// [  7  ][  8  ][  9  ][  +  ]  row 1: 7=s0,8=s1,9=s2, + page
// [  4  ][  5  ][  6  ][BkSp]  row 2: 4=s3,5=s4,6=s5, BkSp=s12
// [  1  ][  2  ][  3  ][     ]  row 3: 1=s6,2=s7,3=s8, Enter empty
// [  0 (2 cols)   ][Del ][     ]  row 4: 0(wide)=s9, Del=s13, Enter(cont)

#define GRID_COLS 4
#define GRID_ROWS 5

enum GridCellType {
    CELL_EMPTY,
    CELL_SLOT
};

// col, row, colSpan, rowSpan, cellType, slotIndex
static const int gridDef[GRID_ROWS * GRID_COLS][6] = {
    {0,0,1,1, CELL_EMPTY,   -1},  // NumLock
    {1,0,1,1, CELL_SLOT,    10},  // / -> slot 10
    {2,0,1,1, CELL_SLOT,    11},  // * -> slot 11
    {3,0,1,1, CELL_SLOT,    -1},  // - -> page back
    // r1
    {0,1,1,1, CELL_SLOT,    0},
    {1,1,1,1, CELL_SLOT,    1},
    {2,1,1,1, CELL_SLOT,    2},
    {3,1,1,1, CELL_SLOT,    -1},  // + -> page forward
    // r2
    {0,2,1,1, CELL_SLOT,    3},
    {1,2,1,1, CELL_SLOT,    4},
    {2,2,1,1, CELL_SLOT,    5},
    {3,2,1,1, CELL_SLOT,    12},  // BkSp -> slot 12
    // r3
    {0,3,1,1, CELL_SLOT,    6},
    {1,3,1,1, CELL_SLOT,    7},
    {2,3,1,1, CELL_SLOT,    8},
    {3,3,1,2, CELL_EMPTY,   -1},  // Enter 2 rows reserved
    // r4
    {0,4,2,1, CELL_SLOT,    9},   // 0 wide
    {2,4,1,1, CELL_SLOT,    13},  // Del -> slot 13
};

void DrawQuickGrid(HDC hdc)
{
    int cellW = 72;
    int cellH = 58;
    int gap = 3;
    int cols = GRID_COLS, rows = GRID_ROWS;
    int totalW = cols * cellW + (cols - 1) * gap;
    int totalH = rows * cellH + (rows - 1) * gap;
    int ws = max(totalW, totalH) + 12;
    int startX = (ws - totalW) / 2;
    int startY = (ws - totalH) / 2;

    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    DrawBackgroundWithTransform(dc, ws);
    SetBkMode(dc, TRANSPARENT);

    HFONT font = CreateFontA(12, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT smallFont = CreateFontA(9, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    static const char *cellLabels[GRID_ROWS * GRID_COLS] = {
        "NL", "/", "*", "-",
        "7","8","9","+",
        "4","5","6","BkSp",
        "1","2","3","Ent",
        "0","Del","",""
    };

    int numCells = GRID_ROWS * GRID_COLS;
    for (int ci = 0; ci < numCells; ci++) {
        int cx = gridDef[ci][0], cy = gridDef[ci][1];
        int cw = gridDef[ci][2], ch = gridDef[ci][3];
        int ctype = gridDef[ci][4];
        int slot = gridDef[ci][5];

        int x = startX + cx * (cellW + gap);
        int y = startY + cy * (cellH + gap);
        int w = cellW * cw + (cw - 1) * gap;
        int h = cellH * ch + (ch - 1) * gap;

        if (ctype == CELL_SLOT && slot >= 0 && slot < g_itemCount) {
            COLORREF sc = g_slotBgColor[g_menuType][slot % 8];
            HBRUSH br = CreateSolidBrush((slot == g_hover) ? RGB(min(255,GetRValue(sc)+20),min(255,GetGValue(sc)+20),min(255,GetBValue(sc)+20)) : sc);
            FillRect(dc, &RECT{x,y,x+w,y+h}, br); DeleteObject(br);
            HPEN bp = CreatePen(PS_SOLID, 1, (slot == g_hover) ? RGB(255,255,255) : RGB(80,80,85));
            SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
            Rectangle(dc, x, y, x + w, y + h); DeleteObject(bp);

            HBITMAP ibmp = g_bitmaps[g_menuType][g_curPage][slot][0];
            if (ibmp) {
                BITMAP bm; GetObject(ibmp, sizeof(bm), &bm);
                int iconPad = 4;
                int iconSz = h - iconPad * 2 - 18;
                if (iconSz > w - iconPad * 2) iconSz = w - iconPad * 2;
                if (iconSz < 12) iconSz = 12;
                int ix = x + (w - iconSz) / 2;
                int iy = y + iconPad;
                HDC ic = CreateCompatibleDC(dc);
                HBITMAP ob = (HBITMAP)SelectObject(ic, ibmp);
                SetStretchBltMode(dc, HALFTONE);
                BLENDFUNCTION bf = {AC_SRC_OVER, 0, 255, AC_SRC_ALPHA};
                AlphaBlend(dc, ix, iy, iconSz, iconSz, ic, 0, 0, bm.bmWidth, bm.bmHeight, bf);
                SelectObject(ic, ob); DeleteDC(ic);
            }

            SetTextColor(dc, RGB(200,200,205));
            SetTextAlign(dc, TA_CENTER | TA_TOP);
            TextOutA(dc, x + w / 2, y + h - 16, g_names[g_menuType][g_curPage][slot], (int)strlen(g_names[g_menuType][g_curPage][slot]));
        } else {
            HBRUSH br = CreateSolidBrush(RGB(28,28,30));
            FillRect(dc, &RECT{x,y,x+w,y+h}, br); DeleteObject(br);
            HPEN bp = CreatePen(PS_SOLID, 1, RGB(55,55,58));
            SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
            Rectangle(dc, x, y, x + w, y + h); DeleteObject(bp);

            SelectObject(dc, smallFont);
            SetTextColor(dc, RGB(80,80,85));
            if (cellLabels[ci] && cellLabels[ci][0]) {
                RECT tr = {x, y, x + w, y + h};
                DrawTextA(dc, cellLabels[ci], -1, &tr, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
            }
            SelectObject(dc, font);
        }
    }

    // Page indicator
    char pageBuf[16]; _snprintf_s(pageBuf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    SetTextColor(dc, g_pageColor[g_menuType]); SetTextAlign(dc, TA_CENTER | TA_TOP);
    SelectObject(dc, smallFont);
    TextOutA(dc, ws / 2, startY + totalH + 4, pageBuf, (int)strlen(pageBuf));

    SelectObject(dc, of); DeleteObject(font); DeleteObject(smallFont);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

int HitTestQuickGrid(int mx, int my)
{
    int cellW = 72, cellH = 58, gap = 3;
    int cols = GRID_COLS, rows = GRID_ROWS;
    int totalW = cols * cellW + (cols - 1) * gap;
    int totalH = rows * cellH + (rows - 1) * gap;
    int ws = max(totalW, totalH) + 12;
    int startX = (ws - totalW) / 2;
    int startY = (ws - totalH) / 2;

    int numCells = GRID_ROWS * GRID_COLS;
    for (int ci = 0; ci < numCells; ci++) {
        if (gridDef[ci][4] != CELL_SLOT || gridDef[ci][5] < 0) continue;
        int cx = gridDef[ci][0], cy = gridDef[ci][1];
        int cw = gridDef[ci][2], ch = gridDef[ci][3];
        int slot = gridDef[ci][5];

        int x = startX + cx * (cellW + gap);
        int y = startY + cy * (cellH + gap);
        int w = cellW * cw + (cw - 1) * gap;
        int h = cellH * ch + (ch - 1) * gap;
        if (mx >= x && mx <= x + w && my >= y && my <= y + h && slot < g_itemCount) return slot;
    }
    return -1;
}

void DrawQuick(HDC hdc)
{
    if (g_quickStyle == 1) { DrawQuickGrid(hdc); return; }
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int qw = QW_BASE * g_menuScale[g_menuType] / 100;
    int qh = QH_BASE * g_menuScale[g_menuType] / 100;
    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    DrawBackgroundWithTransform(dc, ws);
    SetBkMode(dc, TRANSPARENT);

    int totalH = g_itemCount * qh + (g_itemCount - 1) * QUICK_GAP;
    int startY = (ws - totalH) / 2;

    HFONT font = CreateFontA(30, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    for (int i = 0; i < g_itemCount; i++) {
        int y = startY + i * (qh + QUICK_GAP);
        int x = (ws - qw) / 2;
        RECT r = {x, y, x + qw, y + qh};
        COLORREF sc = g_slotBgColor[g_menuType][i % 8];
        HBRUSH br = CreateSolidBrush((i == g_hover) ? RGB(min(255,GetRValue(sc)+20),min(255,GetGValue(sc)+20),min(255,GetBValue(sc)+20)) : sc);
        FillRect(dc, &r, br); DeleteObject(br);
        HPEN bp = CreatePen(PS_SOLID, 1, (i == g_hover) ? RGB(255,255,255) : RGB(80,80,85));
        SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
        Rectangle(dc, x, y, x + qw, y + qh); DeleteObject(bp);

        SetTextColor(dc, RGB(220,220,225));
        SetTextAlign(dc, TA_LEFT | TA_TOP);
        TextOutA(dc, x + 8, y + 8, g_names[g_menuType][g_curPage][i], (int)strlen(g_names[g_menuType][g_curPage][i]));
    }
    char pageBuf[16]; _snprintf_s(pageBuf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    SetTextColor(dc, g_pageColor[g_menuType]); SetTextAlign(dc, TA_CENTER | TA_TOP);
    TextOutA(dc, ws/2, startY + totalH + 12, pageBuf, (int)strlen(pageBuf));

    SelectObject(dc, of); DeleteObject(font);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

int HitTestQuick(int mx, int my)
{
    if (g_quickStyle == 1) return HitTestQuickGrid(mx, my);
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int qw = QW_BASE * g_menuScale[g_menuType] / 100;
    int qh = QH_BASE * g_menuScale[g_menuType] / 100;
    int totalH = g_itemCount * qh + (g_itemCount - 1) * QUICK_GAP;
    int startY = (ws - totalH) / 2;
    int x0 = (ws - qw) / 2;
    if (mx < x0 || mx > x0 + qw) return -1;
    for (int i = 0; i < g_itemCount; i++) {
        int y = startY + i * (qh + QUICK_GAP);
        if (my >= y && my <= y + qh) return i;
    }
    return -1;
}
