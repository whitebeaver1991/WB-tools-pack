#include "..\WB_PieMenu.h"

static int g_wheelSlots[4];

void DrawWheel(HDC hdc)
{
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int ct = ws / 2;
    int wa = WA_BASE * g_menuScale[g_menuType] / 100;
    int wbw = WH_BASE * g_menuScale[g_menuType] / 100;
    int wbh = WH_BASE * g_menuScale[g_menuType] / 100;
    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    DrawBackgroundWithTransform(dc, ws);
    SetBkMode(dc, TRANSPARENT);

    HFONT font = CreateFontA(30, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    struct { int cx, cy; int x, y; } arms[4] = {
        {ct, ct - wa, ct - wbw/2, ct - wa - wbh/2},
        {ct, ct + wa, ct - wbw/2, ct + wa - wbh/2},
        {ct - wa, ct, ct - wa - wbh/2, ct - wbw/2},
        {ct + wa, ct, ct + wa - wbh/2, ct - wbw/2}
    };

    g_wheelSlots[0] = g_hover == 0 ? 0 : (g_hover == 1 ? 1 : -1);
    g_wheelSlots[1] = g_hover == 2 ? 0 : (g_hover == 3 ? 1 : -1);
    g_wheelSlots[2] = g_hover == 4 ? 0 : (g_hover == 5 ? 1 : -1);
    g_wheelSlots[3] = g_hover == 6 ? 0 : (g_hover == 7 ? 1 : -1);

    int slotIdx = 0;
    for (int a = 0; a < 4; a++) {
        for (int side = 0; side < 2; side++, slotIdx++) {
            bool hover = (g_hover == slotIdx);
            int bw = wbw, bh = wbh;
            int bx, by;
            if (a < 2) {
                bx = arms[a].x;
                by = arms[a].y + (side == 0 ? -bh - WHEEL_GAP : 0);
            } else {
                bx = arms[a].x + (side == 0 ? -bw - WHEEL_GAP : 0);
                by = arms[a].y;
            }
            RECT r = {bx, by, bx + bw, by + bh};
            COLORREF wsc = g_slotBgColor[g_menuType][slotIdx % 8];
            HBRUSH br = CreateSolidBrush(hover ? RGB(min(255,GetRValue(wsc)+20),min(255,GetGValue(wsc)+20),min(255,GetBValue(wsc)+20)) : wsc);
            FillRect(dc, &r, br); DeleteObject(br);
            HPEN bp = CreatePen(PS_SOLID, 1, hover ? RGB(255,255,255) : RGB(70,70,75));
            SelectObject(dc, bp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
            Rectangle(dc, bx, by, bx + bw, by + bh); DeleteObject(bp);

            int nameIdx = a * 2 + side;
            if (g_names[g_menuType][g_curPage][nameIdx][0]) {
                SetTextColor(dc, hover ? RGB(255,255,255) : RGB(180,180,185));
                RECT tr = {bx + 4, by + 2, bx + bw - 4, by + bh - 2};
                DrawTextA(dc, g_names[g_menuType][g_curPage][nameIdx], -1, &tr, DT_CENTER | DT_VCENTER | DT_SINGLELINE | DT_NOPREFIX);
            }
        }
    }

    HPEN cp = CreatePen(PS_SOLID, 3, RGB(100,100,105));
    SelectObject(dc, cp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    Ellipse(dc, ct - 15, ct - 15, ct + 15, ct + 15);
    DeleteObject(cp);

    SetTextColor(dc, g_pageColor[g_menuType]);
    SetTextAlign(dc, TA_CENTER | TA_TOP);
    char buf[16]; _snprintf_s(buf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    TextOutA(dc, ct, ct + 20, buf, (int)strlen(buf));

    SelectObject(dc, of); DeleteObject(font);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

int HitTestWheel(int mx, int my)
{
    int ct = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100 / 2;
    int wa = WA_BASE * g_menuScale[g_menuType] / 100;
    int wbw = WH_BASE * g_menuScale[g_menuType] / 100;
    int wbh = WH_BASE * g_menuScale[g_menuType] / 100;
    struct { int cx, cy; int x, y; } arms[4] = {
        {ct, ct - wa, ct - wbw/2, ct - wa - wbh},
        {ct, ct + wa, ct - wbw/2, ct + wa},
        {ct - wa, ct, ct - wa - wbh, ct - wbw/2},
        {ct + wa, ct, ct + wa, ct - wbw/2}
    };
    int slot = 0;
    for (int a = 0; a < 4; a++) {
        for (int side = 0; side < 2; side++, slot++) {
            int bw = wbw, bh = wbh;
            int bx, by;
            if (a < 2) {
                bx = arms[a].x; by = arms[a].y + (side == 0 ? -bh - WHEEL_GAP : 0);
            } else {
                bx = arms[a].x + (side == 0 ? -bw - WHEEL_GAP : 0); by = arms[a].y;
            }
            if (mx >= bx && mx <= bx + bw && my >= by && my <= by + bh) return slot;
        }
    }
    return -1;
}
