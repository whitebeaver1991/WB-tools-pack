#include "..\WB_PieMenu.h"

static int NumpadGridIndex(int pos)
{
    static const int gridToIndex[] = {6,7,8,3,4,5,0,1,2,9,10};
    if (pos >= 0 && pos <= 10) return gridToIndex[pos];
    return -1;
}

void DrawQuickGrid(HDC hdc)
{
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int pad = 14 * g_menuScale[g_menuType] / 100;
    int gap = 6 * g_menuScale[g_menuType] / 100;
    if (pad < 4) pad = 4; if (gap < 2) gap = 2;
    int cols = 3;
    int totalW = ws - pad * 2;
    int cellW = (totalW - gap * (cols - 1)) / cols;
    int cellH = cellW;
    int rows = 4;
    int totalH = rows * cellH + (rows - 1) * gap;
    int startX = pad;
    int startY = (ws - totalH) / 2;

    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    SetBkMode(dc, TRANSPARENT);

    // Grid positions for numpad keys 7,8,9,4,5,6,1,2,3,0(wide),.
    int gridPos[11][2] = {
        {0,0}, {1,0}, {2,0},  // row 0: 7,8,9
        {0,1}, {1,1}, {2,1},  // row 1: 4,5,6
        {0,2}, {1,2}, {2,2},  // row 2: 1,2,3
        {0,3}, {2,3}          // row 3: 0 (wide), . (decimal)
    };
    int wideCol[11] = {0,0,0, 0,0,0, 0,0,0, 2,0}; // 0 key spans 2 cols

    HFONT font = CreateFontA(18, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    for (int i = 0; i < g_itemCount && i < 11; i++) {
        int gx = gridPos[i][0], gy = gridPos[i][1];
        int span = (wideCol[i] > 1) ? 2 : 1;
        int x = startX + gx * (cellW + gap);
        int y = startY + gy * (cellH + gap);
        int w = cellW * span + (span - 1) * gap;
        RECT r = {x, y, x + w, y + cellH};

        HBRUSH br = CreateSolidBrush((i == g_hover) ? RGB(60,60,65) : g_palette[i % 9]);
        FillRect(dc, &r, br); DeleteObject(br);
        HPEN bp = CreatePen(PS_SOLID, 1, (i == g_hover) ? RGB(255,255,255) : RGB(80,80,85));
        SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
        Rectangle(dc, x, y, x + w, y + cellH); DeleteObject(bp);

        // Draw PNG icon if available
        HBITMAP ibmp = g_bitmaps[g_menuType][g_curPage][i][0];
        if (ibmp) {
            BITMAP bm; GetObject(ibmp, sizeof(bm), &bm);
            int iconPad = 6 * g_menuScale[g_menuType] / 100;
            if (iconPad < 3) iconPad = 3;
            int iconW = w - iconPad * 2;
            int iconH = cellH - iconPad * 2 - 22 * g_menuScale[g_menuType] / 100;
            if (iconW > iconH) iconW = iconH;
            if (iconW < 16) iconW = 16;
            int ix = x + (w - iconW) / 2;
            int iy = y + iconPad;
            HDC ic = CreateCompatibleDC(dc);
            HBITMAP ob = (HBITMAP)SelectObject(ic, ibmp);
            SetStretchBltMode(dc, HALFTONE);
            BLENDFUNCTION bf = {AC_SRC_OVER, 0, 255, AC_SRC_ALPHA};
            AlphaBlend(dc, ix, iy, iconW, iconW, ic, 0, 0, bm.bmWidth, bm.bmHeight, bf);
            SelectObject(ic, ob); DeleteDC(ic);
        }

        // Text label below icon
        SetTextColor(dc, RGB(200,200,205));
        SetTextAlign(dc, TA_CENTER | TA_TOP);
        int ty = y + cellH - 22 * g_menuScale[g_menuType] / 100;
        if (ty < y + cellH * 2 / 3) ty = y + cellH * 2 / 3;
        TextOutA(dc, x + w / 2, ty, g_names[g_menuType][g_curPage][i], (int)strlen(g_names[g_menuType][g_curPage][i]));
    }

    // Page indicator
    char pageBuf[16]; _snprintf_s(pageBuf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    SetTextColor(dc, g_pageColor[g_menuType]); SetTextAlign(dc, TA_CENTER | TA_TOP);
    TextOutA(dc, ws / 2, startY + totalH + 8, pageBuf, (int)strlen(pageBuf));

    // Legend: +/- for page turn
    SetTextColor(dc, RGB(100,100,105));
    SetTextAlign(dc, TA_LEFT | TA_TOP);
    TextOutA(dc, pad, startY + totalH + 8, "+/- page", 9);
    SetTextAlign(dc, TA_RIGHT | TA_TOP);
    TextOutA(dc, ws - pad, startY + totalH + 8, "numpad keys", 11);

    SelectObject(dc, of); DeleteObject(font);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

int HitTestQuickGrid(int mx, int my)
{
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int pad = 14 * g_menuScale[g_menuType] / 100;
    int gap = 6 * g_menuScale[g_menuType] / 100;
    if (pad < 4) pad = 4; if (gap < 2) gap = 2;
    int cols = 3;
    int totalW = ws - pad * 2;
    int cellW = (totalW - gap * (cols - 1)) / cols;
    int cellH = cellW;
    int rows = 4;
    int totalH = rows * cellH + (rows - 1) * gap;
    int startX = pad;
    int startY = (ws - totalH) / 2;

    int gridPos[11][2] = {
        {0,0}, {1,0}, {2,0},
        {0,1}, {1,1}, {2,1},
        {0,2}, {1,2}, {2,2},
        {0,3}, {2,3}
    };
    int wideCol[11] = {0,0,0, 0,0,0, 0,0,0, 2,0};

    for (int i = 0; i < g_itemCount && i < 11; i++) {
        int gx = gridPos[i][0], gy = gridPos[i][1];
        int span = (wideCol[i] > 1) ? 2 : 1;
        int x = startX + gx * (cellW + gap);
        int y = startY + gy * (cellH + gap);
        int w = cellW * span + (span - 1) * gap;
        if (mx >= x && mx <= x + w && my >= y && my <= y + cellH) return i;
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
    SetBkMode(dc, TRANSPARENT);

    int totalH = g_itemCount * qh + (g_itemCount - 1) * QUICK_GAP;
    int startY = (ws - totalH) / 2;

    HFONT font = CreateFontA(30, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    for (int i = 0; i < g_itemCount; i++) {
        int y = startY + i * (qh + QUICK_GAP);
        int x = (ws - qw) / 2;
        RECT r = {x, y, x + qw, y + qh};
        HBRUSH br = CreateSolidBrush((i == g_hover) ? RGB(60,60,65) : g_palette[i % 9]);
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
