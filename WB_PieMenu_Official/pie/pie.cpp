#include "..\WB_PieMenu.h"

void DrawPie(HDC hdc)
{
    if (!g_layoutInit) InitLayout();
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int ct = ws / 2;
    int so = SO_BASE * g_menuScale[g_menuType] / 100;
    int dz = DZ_BASE * g_menuScale[g_menuType] / 100;
    int rr = RR_BASE * g_menuScale[g_menuType] / 100;
    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    DrawBackgroundWithTransform(dc, ws);
    SetBkMode(dc, TRANSPARENT);
    HPEN np = CreatePen(PS_NULL, 0, 0);

    HDC sdc = CreateCompatibleDC(dc);
    HBITMAP sbmp = CreateCompatibleBitmap(dc, ws, ws);
    HBITMAP sob = (HBITMAP)SelectObject(sdc, sbmp);
    FillRect(sdc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    SelectObject(sdc, np);
    for (int i = 0; i < g_itemCount; i++) {
        int sx = ct + (int)(so * cos(g_sectorStart[i]));
        int sy = ct + (int)(so * sin(g_sectorStart[i]));
        int ex = ct + (int)(so * cos(g_sectorEnd[i]));
        int ey = ct + (int)(so * sin(g_sectorEnd[i]));
        COLORREF slotCol = g_slotBgColor[g_menuType][i % 8];
        int hr = min(255, GetRValue(slotCol) + 18);
        int hg = min(255, GetGValue(slotCol) + 18);
        int hb = min(255, GetBValue(slotCol) + 18);
        HBRUSH secBr = CreateSolidBrush((i == g_hover) ? RGB(hr,hg,hb) : slotCol);
        SelectObject(sdc, secBr);
        Pie(sdc, ct - so, ct - so, ct + so, ct + so, sx, sy, ex, ey);
        DeleteObject(secBr);
        if (i == g_hover) {
            HPEN hp = CreatePen(PS_SOLID, 2, RGB(255, 255, 255));
            SelectObject(sdc, hp); SelectObject(sdc, GetStockObject(HOLLOW_BRUSH));
            Pie(sdc, ct - so, ct - so, ct + so, ct + so, sx, sy, ex, ey);
            DeleteObject(hp);
        }
    }
    SelectObject(sdc, np); SelectObject(sdc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    Ellipse(sdc, ct - dz, ct - dz, ct + dz, ct + dz);
    BLENDFUNCTION sbf = {AC_SRC_OVER, 0, (BYTE)(g_bgAlpha[g_menuType] * 255 / 100), 0};
    AlphaBlend(dc, 0, 0, ws, ws, sdc, 0, 0, ws, ws, sbf);
    SelectObject(sdc, sob); DeleteDC(sdc); DeleteObject(sbmp);

    DrawGuideLine(dc, ct, ct);

    HPEN dp = CreatePen(PS_SOLID, 1, RGB(60,60,65));
    SelectObject(dc, dp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    for (int i = 0; i < g_itemCount; i++) {
        int x1 = ct + (int)(dz * cos(g_sectorStart[i]));
        int y1 = ct + (int)(dz * sin(g_sectorStart[i]));
        int x2 = ct + (int)(so * cos(g_sectorStart[i]));
        int y2 = ct + (int)(so * sin(g_sectorStart[i]));
        MoveToEx(dc, x1, y1, NULL); LineTo(dc, x2, y2);
    }
    DeleteObject(dp);

    bool anyBmp = false;
    for (int i = 0; i < 9; i++) if (g_bitmaps[g_menuType][g_curPage][i][0]) { anyBmp = true; break; }
    if (anyBmp) {
        for (int i = 0; i < g_itemCount; i++) {
            int sx = ct + (int)(so * cos(g_sectorStart[i]));
            int sy = ct + (int)(so * sin(g_sectorStart[i]));
            int ex = ct + (int)(so * cos(g_sectorEnd[i]));
            int ey = ct + (int)(so * sin(g_sectorEnd[i]));
            HRGN sec = CreateEllipticRgn(ct - so, ct - so, ct + so, ct + so);
            HRGN dzr = CreateEllipticRgn(ct - dz, ct - dz, ct + dz, ct + dz);
            CombineRgn(sec, sec, dzr, RGN_DIFF);
            POINT pts[3] = {{ct, ct}, {sx, sy}, {ex, ey}};
            HRGN tri = CreatePolygonRgn(pts, 3, WINDING);
            CombineRgn(sec, sec, tri, RGN_AND);
            DeleteObject(tri); DeleteObject(dzr);
            SelectClipRgn(dc, sec); DrawImageSector(dc, i); SelectClipRgn(dc, NULL); DeleteObject(sec);
        }
    }

    int fntSz = 15 * g_menuScale[g_menuType] / 100 * (g_textSize[g_menuType] + 50) / 100;
    if (fntSz < 8) fntSz = 8;
    HFONT font = CreateFontA(fntSz, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);
    for (int i = 0; i < g_itemCount; i++) {
        double a = g_sectorCenter[i];
        int tr = dz + (so - dz) * g_textDist[g_menuType] / 100;
        int tx = ct + (int)(tr * cos(a)), ty = ct + (int)(tr * sin(a));
        SetTextColor(dc, (i == g_hover) ? RGB(255,255,255) : RGB(140,140,145));
        SetTextAlign(dc, TA_CENTER | TA_TOP);
        TextOutA(dc, tx, ty - fntSz/2 - 2, g_names[g_menuType][g_curPage][i], (int)strlen(g_names[g_menuType][g_curPage][i]));
    }
    char pageBuf[16]; _snprintf_s(pageBuf, 16, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    SetTextColor(dc, g_pageColor[g_menuType]); SetTextAlign(dc, TA_CENTER | TA_TOP);
    TextOutA(dc, ct, ct + 10, pageBuf, (int)strlen(pageBuf));

    SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    HPEN rp = CreatePen(PS_SOLID, RING_STROKE, RGB(55,55,60));
    SelectObject(dc, rp);
    Ellipse(dc, ct - rr, ct - rr, ct + rr, ct + rr); DeleteObject(rp);

    LOGBRUSH lb = { BS_SOLID, RGB(200,200,205), 0 };
    HPEN ap = ExtCreatePen(PS_GEOMETRIC | PS_SOLID | PS_ENDCAP_ROUND, ARC_STROKE, &lb, 0, NULL);
    SelectObject(dc, ap);
    double as = g_arcAngleDeg - 360.0 / g_itemCount / 2.0;
    int asx = ct + (int)(rr * cos(as * M_PI / 180.0)), asy = ct + (int)(rr * sin(as * M_PI / 180.0));
    int aex = ct + (int)(rr * cos((as + 360.0 / g_itemCount) * M_PI / 180.0)), aey = ct + (int)(rr * sin((as + 360.0 / g_itemCount) * M_PI / 180.0));
    Arc(dc, ct - rr, ct - rr, ct + rr, ct + rr, aex, aey, asx, asy); DeleteObject(ap);

    SelectObject(dc, of); DeleteObject(font); DeleteObject(np);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}
