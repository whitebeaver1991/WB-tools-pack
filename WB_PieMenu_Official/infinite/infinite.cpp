#include "..\WB_PieMenu.h"

void HSLtoRGB(double h, double s, double l, int &r, int &g, int &b)
{
    if (s == 0) { r = g = b = (int)(l * 255); return; }
    auto hue2rgb = [](double p, double q, double t) {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1.0/6) return p + (q - p) * 6 * t;
        if (t < 1.0/2) return q;
        if (t < 2.0/3) return p + (q - p) * (2.0/3 - t) * 6;
        return p;
    };
    double q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    double p = 2 * l - q;
    r = (int)(hue2rgb(p, q, h + 1.0/3) * 255);
    g = (int)(hue2rgb(p, q, h) * 255);
    b = (int)(hue2rgb(p, q, h - 1.0/3) * 255);
}

COLORREF AdjustSectorColor(COLORREF base, double sMul, double lMul)
{
    int r0 = GetRValue(base), g0 = GetGValue(base), b0 = GetBValue(base);
    double rn = r0 / 255.0, gn = g0 / 255.0, bn = b0 / 255.0;
    double mx = max(rn, max(gn, bn)), mn = min(rn, min(gn, bn));
    double h = 0, s = 0, l = (mx + mn) / 2;
    if (mx != mn) {
        double d = mx - mn;
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        if (mx == rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
        else if (mx == gn) h = ((bn - rn) / d + 2) / 6;
        else h = ((rn - gn) / d + 4) / 6;
    }
    s = max(0.0, min(1.0, s * sMul));
    l = max(0.03, min(0.75, l * lMul));
    int nr, ng, nb; HSLtoRGB(h, s, l, nr, ng, nb);
    return RGB(nr, ng, nb);
}

void DrawRingSector(HDC dc, int cx, int cy, int rInner, int rOuter, double a0, double a1, COLORREF fill)
{
    const int SEG = 48;
    double span = a1 - a0;
    if (span <= 0.001) return;
    int n = max(2, (int)(span / (2 * M_PI) * SEG));

    int total = 2 * (n + 1);
    POINT *pts = (POINT*)malloc(total * sizeof(POINT));
    int idx = 0;

    for (int i = 0; i <= n; i++) {
        double a = a0 + span * i / n;
        pts[idx].x = cx + (int)(rOuter * cos(a));
        pts[idx].y = cy + (int)(rOuter * sin(a));
        idx++;
    }
    for (int i = n; i >= 0; i--) {
        double a = a0 + span * i / n;
        pts[idx].x = cx + (int)(rInner * cos(a));
        pts[idx].y = cy + (int)(rInner * sin(a));
        idx++;
    }

    HBRUSH br = CreateSolidBrush(fill);
    HPEN pen = CreatePen(PS_SOLID, 0, RGB(0x33,0x33,0x33));
    SelectObject(dc, br);
    SelectObject(dc, pen);
    Polygon(dc, pts, total);
    DeleteObject(pen);
    DeleteObject(br);
    free(pts);
}

void DrawInfinite(HDC hdc)
{
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int ct = ws / 2;
    int r3 = (int)(0.85 * ct);
    if (r3 < 40) r3 = 40;
    int rd = g_infiniteRDead * r3 / 170;
    int r1 = g_infiniteR1 * r3 / 170;
    int r2 = g_infiniteR2 * r3 / 170;
    int n = g_infiniteSectors;
    double slice = 2 * M_PI / n;

    RECT rc = {0, 0, ws, ws};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, ws, ws);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);
    FillRect(dc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
    if (g_bgBitmap[g_menuType]) {
        BITMAP bm; GetObject(g_bgBitmap[g_menuType], sizeof(bm), &bm);
        HDC bgDc = CreateCompatibleDC(dc);
        HBITMAP bgOb = (HBITMAP)SelectObject(bgDc, g_bgBitmap[g_menuType]);
        SetStretchBltMode(dc, HALFTONE);
        StretchBlt(dc, 0, 0, ws, ws, bgDc, 0, 0, bm.bmWidth, bm.bmHeight, SRCCOPY);
        SelectObject(bgDc, bgOb); DeleteDC(bgDc);
    }

    HFONT font = CreateFontA(22, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    HFONT of = (HFONT)SelectObject(dc, font);

    g_hitAreaCount = 0;
    int slotIdx = 0;
    int r2sl = (g_infiniteSplitR2 < 0) ? 1 : 2;
    int r3sl = (g_infiniteSplitR3 < 2) ? 1 : g_infiniteSplitR3;
    int perSector = 1 + r2sl + r3sl;
    int r3subCount = (g_infiniteSplitR3 < 2) ? 1 : g_infiniteSplitR3;

    SelectObject(dc, GetStockObject(BLACK_BRUSH));
    SelectObject(dc, GetStockObject(NULL_PEN));
    Pie(dc, ct - r3, ct - r3, ct + r3, ct + r3, ct + r3, ct, ct + r3, ct);

    for (int s = 0; s < n; s++) {
        COLORREF base = g_infiniteSectorColors[s % 8];
        double a0 = -M_PI / 2 + s * slice;
        double a1 = a0 + slice;
        double midA = a0 + slice / 2;

        int sState = 0;
        if (g_infiniteHoverSlot >= 0) {
            int hs = g_hitAreas[g_infiniteHoverSlot].sector;
            sState = (hs == s) ? 2 : 1;
        } else if (g_infiniteHoverSector >= 0) {
            sState = (g_infiniteHoverSector == s) ? 2 : 1;
        }

        auto pickColor = [&](int isHover) -> COLORREF {
            if (isHover) return AdjustSectorColor(base, 1.8, 1.7);
            if (sState == 1) return AdjustSectorColor(base, 0.3, 0.4);
            if (sState == 2) return AdjustSectorColor(base, 1.3, 1.2);
            return AdjustSectorColor(base, 0.4, 0.5);
        };

        {
            COLORREF col = pickColor(g_infiniteHoverSlot == slotIdx);
            DrawRingSector(dc, ct, ct, rd, r1, a0, a1, col);
            if (g_hitAreaCount < 48) {
                g_hitAreas[g_hitAreaCount].sector = s; g_hitAreas[g_hitAreaCount].ring = 0;
                g_hitAreas[g_hitAreaCount].sub = 0; g_hitAreas[g_hitAreaCount].a0 = a0;
                g_hitAreas[g_hitAreaCount].a1 = a1; g_hitAreas[g_hitAreaCount].r0 = rd;
                g_hitAreas[g_hitAreaCount].r1 = r1;
            }
            slotIdx++; g_hitAreaCount++;
        }

        if (g_infiniteSplitR2 < 0) {
            COLORREF col = pickColor(g_infiniteHoverSlot == slotIdx);
            DrawRingSector(dc, ct, ct, r1, r2, a0, a1, col);
            if (g_hitAreaCount < 48) {
                g_hitAreas[g_hitAreaCount].sector = s; g_hitAreas[g_hitAreaCount].ring = 1;
                g_hitAreas[g_hitAreaCount].sub = 0; g_hitAreas[g_hitAreaCount].a0 = a0;
                g_hitAreas[g_hitAreaCount].a1 = a1; g_hitAreas[g_hitAreaCount].r0 = r1;
                g_hitAreas[g_hitAreaCount].r1 = r2;
            }
            slotIdx++; g_hitAreaCount++;
        } else if (g_infiniteSplitR2 == 0) {
            double ha = slice / 2;
            for (int su = 0; su < 2; su++) {
                double sa0 = a0 + ha * su, sa1 = a0 + ha * (su + 1);
                COLORREF col = pickColor(g_infiniteHoverSlot == slotIdx);
                DrawRingSector(dc, ct, ct, r1, r2, sa0, sa1, col);
                if (g_hitAreaCount < 48) {
                    g_hitAreas[g_hitAreaCount].sector = s; g_hitAreas[g_hitAreaCount].ring = 1;
                    g_hitAreas[g_hitAreaCount].sub = su; g_hitAreas[g_hitAreaCount].a0 = sa0;
                    g_hitAreas[g_hitAreaCount].a1 = sa1; g_hitAreas[g_hitAreaCount].r0 = r1;
                    g_hitAreas[g_hitAreaCount].r1 = r2;
                }
                slotIdx++; g_hitAreaCount++;
            }
            HPEN dp = CreatePen(PS_DASH, 1, RGB(0x55,0x55,0x55));
            SelectObject(dc, dp);
            MoveToEx(dc, ct + (int)(r1 * cos(midA)), ct + (int)(r1 * sin(midA)), NULL);
            LineTo(dc, ct + (int)(r2 * cos(midA)), ct + (int)(r2 * sin(midA)));
            DeleteObject(dp);
            SelectObject(dc, GetStockObject(NULL_PEN));
        } else {
            int mr = (r1 + r2) / 2;
            for (int su = 0; su < 2; su++) {
                int sr0 = (su == 0) ? r1 : mr, sr1 = (su == 0) ? mr : r2;
                COLORREF col = pickColor(g_infiniteHoverSlot == slotIdx);
                DrawRingSector(dc, ct, ct, sr0, sr1, a0, a1, col);
                if (g_hitAreaCount < 48) {
                    g_hitAreas[g_hitAreaCount].sector = s; g_hitAreas[g_hitAreaCount].ring = 1;
                    g_hitAreas[g_hitAreaCount].sub = su; g_hitAreas[g_hitAreaCount].a0 = a0;
                    g_hitAreas[g_hitAreaCount].a1 = a1; g_hitAreas[g_hitAreaCount].r0 = sr0;
                    g_hitAreas[g_hitAreaCount].r1 = sr1;
                }
                slotIdx++; g_hitAreaCount++;
            }
        }

        double sn = slice / ((g_infiniteSplitR3 < 2) ? 1 : g_infiniteSplitR3);
        for (int su = 0; su < r3subCount; su++) {
            double sa0 = a0 + sn * su, sa1 = a0 + sn * (su + 1);
            COLORREF col = pickColor(g_infiniteHoverSlot == slotIdx);
            DrawRingSector(dc, ct, ct, r2, r3, sa0, sa1, col);
            if (g_hitAreaCount < 48) {
                g_hitAreas[g_hitAreaCount].sector = s; g_hitAreas[g_hitAreaCount].ring = 2;
                g_hitAreas[g_hitAreaCount].sub = su; g_hitAreas[g_hitAreaCount].a0 = sa0;
                g_hitAreas[g_hitAreaCount].a1 = sa1; g_hitAreas[g_hitAreaCount].r0 = r2;
                g_hitAreas[g_hitAreaCount].r1 = r3;
            }
            slotIdx++; g_hitAreaCount++;
        }

        HPEN ep = CreatePen(PS_SOLID, 1, RGB(0x44,0x44,0x44));
        SelectObject(dc, ep);
        MoveToEx(dc, ct + (int)(rd * cos(a0)), ct + (int)(rd * sin(a0)), NULL);
        LineTo(dc, ct + (int)(r3 * cos(a0)), ct + (int)(r3 * sin(a0)));
        DeleteObject(ep);
    }

    DrawGuideLine(dc, ct, ct);

    HPEN cp = CreatePen(PS_SOLID, 1, RGB(0x44,0x44,0x44));
    SelectObject(dc, cp);
    SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    Ellipse(dc, ct - r1, ct - r1, ct + r1, ct + r1);
    Ellipse(dc, ct - r2, ct - r2, ct + r2, ct + r2);
    DeleteObject(cp);

    HPEN dzp = CreatePen(PS_SOLID, 1, RGB(0x55,0x55,0x55));
    SelectObject(dc, dzp);
    Ellipse(dc, ct - rd, ct - rd, ct + rd, ct + rd);
    DeleteObject(dzp);

    SetBkMode(dc, TRANSPARENT);
    SetTextColor(dc, RGB(0x88,0x88,0x88));
    SetTextAlign(dc, TA_CENTER | TA_TOP);
    char buf[64];
    _snprintf_s(buf, 32, _TRUNCATE, "%d/%d", g_curPage + 1, g_totalPages);
    TextOutA(dc, ct, ct + rd + 8, buf, (int)strlen(buf));

    SetTextColor(dc, RGB(0xCC, 0xCC, 0xCC));
    SetTextAlign(dc, TA_CENTER | TA_BASELINE);
    HFONT slotFont = CreateFontA(18, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE, DEFAULT_CHARSET,
        OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, "Microsoft YaHei");
    SelectObject(dc, slotFont);
    for (int si = 0; si < g_hitAreaCount && si < g_itemCount && si < MAX_ITEMS; si++) {
        HitArea &ha = g_hitAreas[si];
        double midA2 = (ha.a0 + ha.a1) / 2;
        if (ha.a0 > ha.a1) { midA2 = (ha.a0 + ha.a1 + 2 * M_PI) / 2; if (midA2 >= 2 * M_PI) midA2 -= 2 * M_PI; }
        int midR2 = (ha.r0 + ha.r1) / 2;
        int tx = ct + (int)(midR2 * cos(midA2));
        int ty = ct + (int)(midR2 * sin(midA2));
        const char *slotName = g_names[MENU_INFINITE][0][si];
        if (slotName && slotName[0]) {
            SetTextColor(dc, RGB(0xDD, 0xDD, 0xDD));
            TextOutA(dc, tx, ty - 3, slotName, (int)strlen(slotName));
        }
        HBITMAP slotBmp = g_bitmaps[MENU_INFINITE][0][si][0];
        if (slotBmp) {
            BITMAP bm; GetObject(slotBmp, sizeof(bm), &bm);
            int sz2 = g_imgSize[MENU_INFINITE][0][si] * 15 / 100;
            if (sz2 < 8) sz2 = 8;
            HDC ic = CreateCompatibleDC(dc);
            HBITMAP ob = (HBITMAP)SelectObject(ic, slotBmp);
            SetStretchBltMode(dc, HALFTONE);
            BLENDFUNCTION bf = {AC_SRC_OVER, 0, 170, AC_SRC_ALPHA};
            AlphaBlend(dc, tx - sz2/2, ty + 4, sz2, sz2, ic, 0, 0, bm.bmWidth, bm.bmHeight, bf);
            SelectObject(ic, ob); DeleteDC(ic);
        }
    }
    SelectObject(dc, of); DeleteObject(slotFont); DeleteObject(font);
    BitBlt(hdc, 0, 0, ws, ws, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
}

int HitTestInfinite(int mx, int my)
{
    int ws = WIN_SIZE_BASE * g_menuScale[g_menuType] / 100;
    int ct = ws / 2;
    int dx = mx - ct, dy = my - ct;
    int dist = (int)sqrt((double)(dx*dx + dy*dy));
    double angle = atan2((double)dy, (double)dx);
    if (angle < -M_PI/2) angle += 2 * M_PI;

    int deadZone = g_infiniteRDead * (int)(0.85 * ct) / 170;
    if (dist < deadZone) return -1;

    for (int i = 0; i < g_hitAreaCount; i++) {
        HitArea &a = g_hitAreas[i];
        if (dist >= a.r0 && dist <= a.r1 && angle >= a.a0 - 0.001 && angle <= a.a1 + 0.001)
            return i;
    }

    int n = g_infiniteSectors;
    double slice = 2 * M_PI / n;
    int r3 = (int)(0.85 * ct);
    for (int s = 0; s < n; s++) {
        double a0 = -M_PI / 2 + s * slice;
        double a1 = a0 + slice;
        if (angle >= a0 - 0.001 && angle <= a1 + 0.001 && dist > 0) {
            if (dist > r3 && g_infiniteSplitR3 > 1) {
                double sn = slice / g_infiniteSplitR3;
                double localAngle = angle - a0;
                int subIdx = (int)(localAngle / sn);
                if (subIdx < 0) subIdx = 0;
                if (subIdx >= g_infiniteSplitR3) subIdx = g_infiniteSplitR3 - 1;
                for (int i = 0; i < g_hitAreaCount; i++) {
                    if (g_hitAreas[i].sector == s && g_hitAreas[i].ring == 2 && g_hitAreas[i].sub == subIdx)
                        return i;
                }
            }
            int best = -1;
            for (int i = 0; i < g_hitAreaCount; i++) {
                if (g_hitAreas[i].sector == s) {
                    if (best < 0 || g_hitAreas[i].r1 > g_hitAreas[best].r1)
                        best = i;
                }
            }
            return best;
        }
    }

    return -1;
}
