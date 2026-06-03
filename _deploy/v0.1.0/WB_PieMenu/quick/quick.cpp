#include "..\WB_PieMenu.h"

void DrawQuick(HDC hdc)
{
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
