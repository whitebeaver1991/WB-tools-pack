#define WIN32_LEAN_AND_MEAN
#define _USE_MATH_DEFINES
#include <windows.h>
#include <stdio.h>
#include <math.h>
#include <commctrl.h>
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "comctl32.lib")

#define WIN_W         500
#define WIN_H         500
#define SECTOR_OUTER  200
#define DEAD_ZONE_R   32
#define HOTKEY_ID     1001
#define MAX_ITEMS     9
#define MAX_PAGES     3
#define SEARCH_H      30
#define SEARCH_W      280
#define LIST_H        180
#define ITEM_H        24

static HWND g_overlay = NULL, g_mainWnd = NULL;
static bool g_visible = false;
static int  g_hover = -1;
static int  g_curPage = 0;
static int  g_itemCount = 6;
static bool g_searchMode = false;
static wchar_t g_searchQuery[128] = {0};
static int  g_searchSel = 0;
static int  g_searchCount = 0;
static int  g_searchScroll = 0;

static double g_sectorStart[MAX_ITEMS], g_sectorEnd[MAX_ITEMS], g_sectorCenter[MAX_ITEMS];

// ─── Demo data: 30 items across 3 pages ───
static const wchar_t* g_items[3][MAX_ITEMS] = {
    { L"Glow", L"Drop Shadow", L"Gaussian Blur", L"Bevel Alpha", L"Bulge", L"Mosaic", L"Noise", L"Wave Warp", L"CC Light Burst" },
    { L"CC Particle", L"CC Sphere", L"CC Page Turn", L"Colorama", L"Curves", L"Levels", L"Lumetri", L"Tritone", L"Fill" },
    { L"Echo", L"Posterize", L"CC Glass", L"Lens Flare", L"Polar", L"Ripple", L"Smear", L"Twirl", L"Venetian Blinds" }
};

static const wchar_t* g_match[3][MAX_ITEMS] = {
    { L"ADBE Glow2", L"ADBE Drop Shadow", L"ADBE Gaussian Blur", L"ADBE Bevel Alpha", L"ADBE Bulge", L"ADBE Mosaic", L"ADBE Noise HLS", L"ADBE Wave Warp", L"CC Light Burst" },
    { L"CC Particle", L"CC Sphere", L"CC Page Turn", L"ADBE Colorama", L"ADBE Curves", L"ADBE Levels2", L"ADBE Lumetri", L"ADBE Tritone", L"ADBE Fill" },
    { L"ADBE Echo", L"ADBE Posterize", L"CC Glass", L"ADBE Lens Flare", L"ADBE Polar", L"ADBE Ripple", L"ADBE Smear", L"ADBE Twirl", L"ADBE Venetian Blinds" }
};

// ─── Search flattened list ───
typedef struct { const wchar_t *name, *match; int page, idx; } SearchItem;
static SearchItem g_searchCache[27];
static int g_searchCacheLen = 0;
static void BuildSearchCache() {
    if (g_searchCacheLen) return;
    for (int p = 0; p < 3; p++)
        for (int i = 0; i < MAX_ITEMS; i++) {
            int idx = p * MAX_ITEMS + i;
            g_searchCache[idx].name = g_items[p][i];
            g_searchCache[idx].match = g_match[p][i];
            g_searchCache[idx].page = p;
            g_searchCache[idx].idx = i;
        }
    g_searchCacheLen = 27;
}

static void InitSectors() {
    double step = 2 * M_PI / g_itemCount;
    for (int i = 0; i < MAX_ITEMS; i++) {
        g_sectorCenter[i] = i * step - M_PI / 2.0;
        g_sectorStart[i] = g_sectorCenter[i] - step / 2.0;
        g_sectorEnd[i]   = g_sectorCenter[i] + step / 2.0;
    }
}

static int HitTestSector(int mx, int my) {
    int dx = mx - WIN_W/2, dy = my - WIN_H/2;
    double dist = sqrt((double)(dx*dx + dy*dy));
    if (dist < DEAD_ZONE_R || dist > SECTOR_OUTER) return -1;
    double angle = atan2((double)dy, (double)dx);
    if (angle < -M_PI/2) angle += 2*M_PI;
    for (int i = 0; i < g_itemCount; i++) {
        double s = g_sectorStart[i], e = g_sectorEnd[i];
        if (s < -M_PI/2) { s += 2*M_PI; e += 2*M_PI; }
        if (angle >= s && angle < e) return i;
    }
    return -1;
}

// ─── Search ───
static void DoSearch() {
    if (!g_searchQuery[0]) { g_searchCount = 0; return; }
    g_searchCount = 0;
    for (int i = 0; i < g_searchCacheLen; i++) {
        BOOL match = FALSE;
        if (wcsstr(g_searchCache[i].name, g_searchQuery)) match = TRUE;
        if (!match && wcsstr(g_searchCache[i].match, g_searchQuery)) match = TRUE;
        if (match) {
            if (g_searchCount < 100) {
                g_searchCache[i].page = g_searchCache[i].page; // keep
                g_searchCache[i].idx = g_searchCache[i].idx;
                // swap to front using temp
                SearchItem t = g_searchCache[g_searchCount];
                g_searchCache[g_searchCount] = g_searchCache[i];
                g_searchCache[i] = t;
                g_searchCount++;
            }
        }
    }
    g_searchSel = 0; g_searchScroll = 0;
}

static void RenderSearchBox(HDC dc) {
    int cx = WIN_W/2, bx = cx - SEARCH_W/2, by = WIN_H/2 - LIST_H/2 - SEARCH_H - 10;

    // Search input background
    RECT sr = {bx, by, bx+SEARCH_W, by+SEARCH_H};
    HBRUSH sbr = CreateSolidBrush(RGB(30,30,30));
    FillRect(dc, &sr, sbr); DeleteObject(sbr);
    HPEN sp = CreatePen(PS_SOLID, 1, g_searchQuery[0] ? RGB(90,155,245) : RGB(60,60,60));
    SelectObject(dc, sp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    Rectangle(dc, sr.left, sr.top, sr.right, sr.bottom);
    DeleteObject(sp);

    SetBkMode(dc, TRANSPARENT);
    HFONT sf = CreateFontW(16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
    HFONT oldf = (HFONT)SelectObject(dc, sf);

    // Cursor + text
    wchar_t disp[128]; wcscpy_s(disp, g_searchQuery);
    if (!g_searchQuery[0]) wcscpy_s(disp, L"Search effects...");
    SetTextColor(dc, g_searchQuery[0] ? RGB(220,220,220) : RGB(80,80,80));
    RECT tr = {bx+8, by+2, bx+SEARCH_W-8, by+SEARCH_H-2};
    DrawTextW(dc, disp, -1, &tr, DT_LEFT | DT_VCENTER | DT_SINGLELINE);

    if (g_searchQuery[0]) {
        // blinking cursor
        int clen = (int)wcslen(g_searchQuery);
        SIZE sz; GetTextExtentPoint32W(dc, g_searchQuery, clen, &sz);
        int cx2 = bx + 8 + sz.cx;
        HPEN cp = CreatePen(PS_SOLID, 1, RGB(200,200,200));
        SelectObject(dc, cp);
        MoveToEx(dc, cx2, by+5, NULL); LineTo(dc, cx2, by+SEARCH_H-5);
        DeleteObject(cp);
    }

    // List background
    RECT lr = {bx, by+SEARCH_H+4, bx+SEARCH_W, by+SEARCH_H+4+LIST_H};
    HBRUSH lbr = CreateSolidBrush(RGB(22,22,22));
    FillRect(dc, &lr, lbr); DeleteObject(lbr);
    HPEN lp = CreatePen(PS_SOLID, 1, RGB(50,50,50));
    SelectObject(dc, lp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    Rectangle(dc, lr.left, lr.top, lr.right, lr.bottom);
    DeleteObject(lp);

    // Results
    int visible = LIST_H / ITEM_H;
    for (int i = g_searchScroll; i < g_searchCount && i < g_searchScroll + visible; i++) {
        int yi = lr.top + (i - g_searchScroll) * ITEM_H;
        RECT ir = {lr.left+1, yi, lr.right-1, yi+ITEM_H};
        if (i == g_searchSel) {
            HBRUSH hbr = CreateSolidBrush(RGB(40,60,100));
            FillRect(dc, &ir, hbr); DeleteObject(hbr);
        }
        SetTextColor(dc, (i == g_searchSel) ? RGB(255,255,255) : RGB(160,160,160));
        RECT nr = {ir.left+8, ir.top, ir.right-80, ir.bottom};
        DrawTextW(dc, g_searchCache[i].name, -1, &nr, DT_LEFT | DT_VCENTER | DT_SINGLELINE | DT_END_ELLIPSIS);
        SetTextColor(dc, RGB(80,80,80));
        RECT mr = {ir.right-80, ir.top, ir.right-4, ir.bottom};
        DrawTextW(dc, g_searchCache[i].match, -1, &mr, DT_RIGHT | DT_VCENTER | DT_SINGLELINE | DT_END_ELLIPSIS);
    }

    SelectObject(dc, oldf); DeleteObject(sf);
}

static void DrawPieMenu(HDC hdc) {
    RECT rc = {0, 0, WIN_W, WIN_H};
    HDC dc = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, WIN_W, WIN_H);
    HBITMAP old = (HBITMAP)SelectObject(dc, bmp);

    HBRUSH bgBr = CreateSolidBrush(RGB(0,0,0));
    FillRect(dc, &rc, bgBr); DeleteObject(bgBr);
    SetBkMode(dc, TRANSPARENT);
    HPEN np = CreatePen(PS_NULL, 0, 0);
    HBRUSH secBr = CreateSolidBrush(RGB(42, 42, 42));
    HBRUSH hovBr = CreateSolidBrush(RGB(60, 60, 60));

    for (int i = 0; i < g_itemCount; i++) {
        int sx = WIN_W/2 + (int)(SECTOR_OUTER * cos(g_sectorStart[i]));
        int sy = WIN_H/2 + (int)(SECTOR_OUTER * sin(g_sectorStart[i]));
        int ex = WIN_W/2 + (int)(SECTOR_OUTER * cos(g_sectorEnd[i]));
        int ey = WIN_H/2 + (int)(SECTOR_OUTER * sin(g_sectorEnd[i]));
        SelectObject(dc, np);
        SelectObject(dc, (i == g_hover) ? hovBr : secBr);
        Pie(dc, WIN_W/2 - SECTOR_OUTER, WIN_H/2 - SECTOR_OUTER,
            WIN_W/2 + SECTOR_OUTER, WIN_H/2 + SECTOR_OUTER, sx, sy, ex, ey);
        if (i == g_hover) {
            HPEN hp = CreatePen(PS_SOLID, 2, RGB(255,255,255));
            SelectObject(dc, hp); SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
            Pie(dc, WIN_W/2 - SECTOR_OUTER, WIN_H/2 - SECTOR_OUTER,
                WIN_W/2 + SECTOR_OUTER, WIN_H/2 + SECTOR_OUTER, sx, sy, ex, ey);
            DeleteObject(hp);
        }
    }

    SelectObject(dc, np);
    SelectObject(dc, GetStockObject(BLACK_BRUSH));
    Ellipse(dc, WIN_W/2 - DEAD_ZONE_R, WIN_H/2 - DEAD_ZONE_R,
            WIN_W/2 + DEAD_ZONE_R, WIN_H/2 + DEAD_ZONE_R);

    HPEN dp = CreatePen(PS_SOLID, 1, RGB(60,60,65));
    SelectObject(dc, dp);
    SelectObject(dc, GetStockObject(HOLLOW_BRUSH));
    for (int i = 0; i < g_itemCount; i++) {
        int x1 = WIN_W/2 + (int)(DEAD_ZONE_R * cos(g_sectorStart[i]));
        int y1 = WIN_H/2 + (int)(DEAD_ZONE_R * sin(g_sectorStart[i]));
        int x2 = WIN_W/2 + (int)(SECTOR_OUTER * cos(g_sectorStart[i]));
        int y2 = WIN_H/2 + (int)(SECTOR_OUTER * sin(g_sectorStart[i]));
        MoveToEx(dc, x1, y1, NULL); LineTo(dc, x2, y2);
    }
    DeleteObject(dp);

    HFONT font = CreateFontW(13, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
    HFONT of = (HFONT)SelectObject(dc, font);
    for (int i = 0; i < g_itemCount; i++) {
        double a = g_sectorCenter[i];
        int tr = SECTOR_OUTER - 32;
        int tx = WIN_W/2 + (int)(tr * cos(a)), ty = WIN_H/2 + (int)(tr * sin(a));
        SetTextColor(dc, (i == g_hover) ? RGB(255,255,255) : RGB(140,140,145));
        SetTextAlign(dc, TA_CENTER | TA_TOP);
        TextOutW(dc, tx, ty - 5, g_items[g_curPage][i], (int)wcslen(g_items[g_curPage][i]));
        // match name in smaller font
        HFONT sm = CreateFontW(9, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Consolas");
        SelectObject(dc, sm);
        SetTextColor(dc, (i == g_hover) ? RGB(180,180,180) : RGB(70,70,70));
        TextOutW(dc, tx, ty + 10, g_match[g_curPage][i], (int)wcslen(g_match[g_curPage][i]));
        SelectObject(dc, font); DeleteObject(sm);
    }

    wchar_t buf[64];
    swprintf_s(buf, L"Page %d/%d  |  DBLClick=Search  |  Esc=Close", g_curPage+1, 3);
    SetTextColor(dc, RGB(90,90,95));
    SetTextAlign(dc, TA_CENTER | TA_TOP);
    HFONT sm2 = CreateFontW(9, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
    SelectObject(dc, sm2);
    TextOutW(dc, WIN_W/2, WIN_H/2 + 12, buf, (int)wcslen(buf));
    SelectObject(dc, of); DeleteObject(sm2);

    SelectObject(dc, of); DeleteObject(font); DeleteObject(np);
    BitBlt(hdc, 0, 0, WIN_W, WIN_H, dc, 0, 0, SRCCOPY);
    SelectObject(dc, old); DeleteObject(bmp); DeleteDC(dc);
    DeleteObject(secBr); DeleteObject(hovBr);
}

static void ToggleOverlay() {
    g_visible = !g_visible;
    if (g_visible) {
        g_hover = -1; g_searchMode = false; g_searchQuery[0] = 0;
        g_searchCount = 0; g_searchScroll = 0;
        POINT pt; GetCursorPos(&pt);
        SetWindowPos(g_overlay, HWND_TOPMOST, pt.x - WIN_W/2, pt.y - WIN_H/2,
                     WIN_W, WIN_H, SWP_SHOWWINDOW);
        SetForegroundWindow(g_overlay);
        SetTimer(g_overlay, 1, 40, NULL);
        InvalidateRect(g_overlay, NULL, TRUE);
    } else {
        ShowWindow(g_overlay, SW_HIDE);
        KillTimer(g_overlay, 1);
    }
}

static void SelectItem(int page, int idx) {
    wchar_t msg[256];
    swprintf_s(msg, L"Selected: %s  [%s]", g_items[page][idx], g_match[page][idx]);
    SetWindowTextW(g_mainWnd, msg);
    g_visible = false; ShowWindow(g_overlay, SW_HIDE);
}

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_HOTKEY:
            if (wp == HOTKEY_ID) { ToggleOverlay(); return 0; }
            break;
        case WM_PAINT: {
            PAINTSTRUCT ps; HDC dc = BeginPaint(hwnd, &ps);
            HDC mem = CreateCompatibleDC(dc);
            HBITMAP bmp = CreateCompatibleBitmap(dc, WIN_W, WIN_H);
            HBITMAP old = (HBITMAP)SelectObject(mem, bmp);
            DrawPieMenu(mem);
            if (g_searchMode) RenderSearchBox(mem);
            BitBlt(dc, 0, 0, WIN_W, WIN_H, mem, 0, 0, SRCCOPY);
            SelectObject(mem, old); DeleteObject(bmp); DeleteDC(mem);
            EndPaint(hwnd, &ps);
            return 0;
        }
        case WM_TIMER: {
            POINT pt; GetCursorPos(&pt); ScreenToClient(hwnd, &pt);
            int h = HitTestSector(pt.x, pt.y);
            if (h != g_hover) { g_hover = h; InvalidateRect(hwnd, NULL, TRUE); }
            if (!g_searchMode && g_hover >= 0 && (GetAsyncKeyState(VK_LBUTTON) & 0x8000)) {
                SelectItem(g_curPage, g_hover);
                InvalidateRect(hwnd, NULL, TRUE);
            }
            return 0;
        }
        case WM_LBUTTONDBLCLK: {
            POINT pt; GetCursorPos(&pt); ScreenToClient(hwnd, &pt);
            int dx = pt.x - WIN_W/2, dy = pt.y - WIN_H/2;
            if (sqrt((double)(dx*dx+dy*dy)) < DEAD_ZONE_R) {
                g_searchMode = !g_searchMode;
                if (g_searchMode) { g_searchQuery[0] = 0; g_searchCount = 0; g_searchSel = 0; BuildSearchCache(); }
                InvalidateRect(hwnd, NULL, TRUE); return 0;
            }
            return 0;
        }
        case WM_KEYDOWN: {
            if (wp == VK_ESCAPE) {
                if (g_searchMode) { g_searchMode = false; InvalidateRect(hwnd, NULL, TRUE); }
                else { g_visible = false; ShowWindow(hwnd, SW_HIDE); KillTimer(hwnd, 1); }
                return 0;
            }
            if (wp == VK_RETURN && g_searchMode && g_searchCount > 0) {
                int i = g_searchCache[g_searchSel].page;
                int j = g_searchCache[g_searchSel].idx;
                SelectItem(i, j);
                return 0;
            }
            if (wp == VK_UP && g_searchMode) {
                if (g_searchSel > 0) g_searchSel--;
                if (g_searchSel < g_searchScroll) g_searchScroll--;
                InvalidateRect(hwnd, NULL, TRUE);
                return 0;
            }
            if (wp == VK_DOWN && g_searchMode) {
                if (g_searchSel < g_searchCount - 1) g_searchSel++;
                int vis = LIST_H / ITEM_H;
                if (g_searchSel >= g_searchScroll + vis) g_searchScroll++;
                InvalidateRect(hwnd, NULL, TRUE);
                return 0;
            }
            if (wp == VK_LEFT && !g_searchMode && g_curPage > 0) { g_curPage--; g_hover = -1; InvalidateRect(hwnd, NULL, TRUE); return 0; }
            if (wp == VK_RIGHT && !g_searchMode && g_curPage < 2) { g_curPage++; g_hover = -1; InvalidateRect(hwnd, NULL, TRUE); return 0; }
            return 0;
        }
        case WM_CHAR: {
            if (!g_searchMode) {
                if (wp >= 32) { g_searchMode = true; BuildSearchCache(); }
                else return 0;
            }
            if (wp == VK_BACK) {
                int len = (int)wcslen(g_searchQuery);
                if (len > 0) { g_searchQuery[len-1] = 0; DoSearch(); }
            } else if (wp >= 32 && wp < 256) {
                wchar_t c = (wchar_t)wp;
                int len = (int)wcslen(g_searchQuery);
                if (len < 120) { g_searchQuery[len] = c; g_searchQuery[len+1] = 0; DoSearch(); }
            }
            InvalidateRect(hwnd, NULL, TRUE);
            return 0;
        }
        case WM_MOUSEWHEEL: {
            if (g_searchMode) {
                int d = GET_WHEEL_DELTA_WPARAM(wp) / WHEEL_DELTA;
                g_searchScroll -= d;
                int vis = LIST_H / ITEM_H;
                if (g_searchScroll < 0) g_searchScroll = 0;
                if (g_searchScroll > g_searchCount - vis) g_searchScroll = g_searchCount - vis;
                if (g_searchScroll < 0) g_searchScroll = 0;
                InvalidateRect(hwnd, NULL, TRUE);
            }
            return 0;
        }
        case WM_ACTIVATE:
            if (wp == WA_INACTIVE && g_visible && !g_searchMode) {
                g_visible = false; ShowWindow(hwnd, SW_HIDE); KillTimer(hwnd, 1);
            }
            return 0;
        case WM_DESTROY: PostQuitMessage(0); return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    InitSectors(); BuildSearchCache();

    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW) };
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = NULL;
    wc.lpszClassName = L"WBPieMenuFullClass";
    RegisterClassExW(&wc);

    g_mainWnd = CreateWindowExW(0, L"WBPieMenuFullClass", L"WB Pie Menu GDI",
        WS_OVERLAPPEDWINDOW, 0, 0, 300, 100, NULL, NULL, hInst, NULL);

    g_overlay = CreateWindowExW(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        L"WBPieMenuFullClass", NULL,
        WS_POPUP, 0, 0, WIN_W, WIN_H, NULL, NULL, hInst, NULL);
    SetLayeredWindowAttributes(g_overlay, RGB(0,0,0), 200, LWA_ALPHA | LWA_COLORKEY);

    RegisterHotKey(g_mainWnd, HOTKEY_ID, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_SPACE);
    SetWindowTextW(g_mainWnd, L"WB Pie Menu GDI - Ctrl+Shift+Space | DblClick=Search");

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg); DispatchMessage(&msg);
    }
    UnregisterHotKey(g_mainWnd, HOTKEY_ID);
    return 0;
}
