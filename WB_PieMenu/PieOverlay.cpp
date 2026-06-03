#include "PieOverlay.h"
#include "EffectData.h"
#include <math.h>
#include <cwchar>
#include <commctrl.h>

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "user32.lib")

static const char* PIE_WND_CLASS = "WB_PieOverlay";

static HWND g_overlay_hwnd = NULL;
static HWND g_parent_hwnd = NULL;
static HINSTANCE g_hInst = NULL;

#define TIMER_AUTO_CLOSE    1001
#define TIMER_UPDATE_UI     1002

// Pie Menu 配置
#define PIE_CENTER_X        200
#define PIE_CENTER_Y        200
#define PIE_INNER_RADIUS    40
#define PIE_OUTER_RADIUS    160
#define PIE_DEAD_ZONE       30
#define PIE_SECTOR_COUNT    4
#define PIE_TIMEOUT_MS      3000
#define PIE_PAGE_COUNT      3

static int  g_current_page = 0;
static int  g_highlighted_sector = -1;
static DWORD g_start_time = 0;

static int GetSectorFromAngle(float angle_deg)
{
    if (angle_deg >= -135 && angle_deg < -45) return 0;
    if (angle_deg >= -45  && angle_deg < 45)  return 1;
    if (angle_deg >= 45   && angle_deg < 135) return 2;
    return 3;
}

static void DrawRoundRectPath(HDC hdc, int x, int y, int w, int h, int r)
{
    BeginPath(hdc);
    RoundRect(hdc, x, y, x + w, y + h, r, r);
    EndPath(hdc);
}

static void RenderPieMenu(HDC hdc, int width, int height)
{
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, width, height);
    SelectObject(memDC, bmp);

    SetBkMode(memDC, TRANSPARENT);
    SetStretchBltMode(memDC, HALFTONE);

    HBRUSH bgBrush = CreateSolidBrush(RGB(0, 0, 0));
    RECT bgRect = { 0, 0, width, height };
    FillRect(memDC, &bgRect, bgBrush);
    DeleteObject(bgBrush);

    const PieEffect* effects = NULL;
    int effect_count = GetEffectList(&effects);
    int page_start = g_current_page * PIE_SECTOR_COUNT;

    static const float sector_angles[4][2] = {
        { 315, 405 },
        { 45,  135 },
        { 135, 225 },
        { 225, 315 },
    };

    static const struct { int dx; int dy; } sector_label_pos[4] = {
        { 0,   -100 },
        { 100,   0  },
        { 0,    100 },
        { -100,  0  },
    };

    for (int i = 0; i < PIE_SECTOR_COUNT; i++) {
        int idx = page_start + i;
        if (idx >= effect_count) break;

        COLORREF fill_color = (i == g_highlighted_sector)
            ? RGB(64, 140, 255)
            : RGB(45, 45, 50);

        COLORREF text_color = (i == g_highlighted_sector)
            ? RGB(255, 255, 255)
            : RGB(200, 200, 200);

        HBRUSH sectorBrush = CreateSolidBrush(fill_color);
        HPEN sectorPen = CreatePen(PS_SOLID, 2,
            (i == g_highlighted_sector) ? RGB(100, 180, 255) : RGB(80, 80, 85));

        SelectObject(memDC, sectorBrush);
        SelectObject(memDC, sectorPen);

        int start_deg = (int)sector_angles[i][0];
        int end_deg   = (int)sector_angles[i][1];
        Pie(memDC,
            PIE_CENTER_X - PIE_OUTER_RADIUS,
            PIE_CENTER_Y - PIE_OUTER_RADIUS,
            PIE_CENTER_X + PIE_OUTER_RADIUS,
            PIE_CENTER_Y + PIE_OUTER_RADIUS,
            PIE_CENTER_X + (int)(PIE_OUTER_RADIUS * cos(start_deg * 3.14159f / 180)),
            PIE_CENTER_Y - (int)(PIE_OUTER_RADIUS * sin(start_deg * 3.14159f / 180)),
            PIE_CENTER_X + (int)(PIE_OUTER_RADIUS * cos(end_deg * 3.14159f / 180)),
            PIE_CENTER_Y - (int)(PIE_OUTER_RADIUS * sin(end_deg * 3.14159f / 180)));

        HBRUSH centerBrush = CreateSolidBrush(RGB(20, 20, 25));
        SelectObject(memDC, centerBrush);
        HPEN centerPen = CreatePen(PS_NULL, 0, 0);
        SelectObject(memDC, centerPen);
        Ellipse(memDC,
            PIE_CENTER_X - PIE_INNER_RADIUS,
            PIE_CENTER_Y - PIE_INNER_RADIUS,
            PIE_CENTER_X + PIE_INNER_RADIUS,
            PIE_CENTER_Y + PIE_INNER_RADIUS);
        DeleteObject(centerBrush);
        DeleteObject(centerPen);

        SetTextColor(memDC, text_color);
        HFONT font = CreateFontW(16, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
        HFONT oldFont = (HFONT)SelectObject(memDC, font);

        const wchar_t* label = effects[idx].label;
        int tx = PIE_CENTER_X + sector_label_pos[i].dx;
        int ty = PIE_CENTER_Y + sector_label_pos[i].dy;
        UINT align = TA_CENTER | TA_BASELINE;
        if (i == 0) align = TA_CENTER | TA_BASELINE;
        else if (i == 1) align = TA_LEFT | TA_BASELINE;
        else if (i == 2) align = TA_CENTER | TA_BASELINE;
        else align = TA_RIGHT | TA_BASELINE;
        SetTextAlign(memDC, align);
        TextOutW(memDC, tx, ty, label, (int)wcslen(label));

        SelectObject(memDC, oldFont);
        DeleteObject(font);
        DeleteObject(sectorBrush);
        DeleteObject(sectorPen);
    }

    HBRUSH centerFill = CreateSolidBrush(RGB(30, 30, 35));
    HPEN cPent = CreatePen(PS_SOLID, 2, RGB(100, 100, 110));
    SelectObject(memDC, centerFill);
    SelectObject(memDC, cPent);
    Ellipse(memDC,
        PIE_CENTER_X - PIE_INNER_RADIUS,
        PIE_CENTER_Y - PIE_INNER_RADIUS,
        PIE_CENTER_X + PIE_INNER_RADIUS,
        PIE_CENTER_Y + PIE_INNER_RADIUS);
    DeleteObject(centerFill);
    DeleteObject(cPent);

    SetTextColor(memDC, RGB(180, 180, 190));
    HFONT centerFont = CreateFontW(18, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
    HFONT oldCenterFont = (HFONT)SelectObject(memDC, centerFont);
    SetTextAlign(memDC, TA_CENTER | TA_BASELINE);
    TextOutW(memDC, PIE_CENTER_X, PIE_CENTER_Y - 6, L"WB", 2);
    SelectObject(memDC, oldCenterFont);
    DeleteObject(centerFont);

    wchar_t page_text[32];
    swprintf_s(page_text, L"\u2014 %d / %d \u2014", g_current_page + 1, PIE_PAGE_COUNT);
    SetTextColor(memDC, RGB(140, 140, 150));
    HFONT pageFont = CreateFontW(14, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
    HFONT oldPageFont = (HFONT)SelectObject(memDC, pageFont);
    SetTextAlign(memDC, TA_CENTER | TA_BASELINE);
    TextOutW(memDC, PIE_CENTER_X + 210, PIE_CENTER_Y + 185, page_text, (int)wcslen(page_text));
    SelectObject(memDC, oldPageFont);
    DeleteObject(pageFont);

    BitBlt(hdc, 0, 0, width, height, memDC, 0, 0, SRCCOPY);

    DeleteObject(bmp);
    DeleteDC(memDC);
}

static LRESULT CALLBACK PieOverlayProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    switch (msg) {

    case WM_CREATE:
        g_start_time = GetTickCount();
        SetTimer(hwnd, TIMER_AUTO_CLOSE, PIE_TIMEOUT_MS, NULL);
        SetTimer(hwnd, TIMER_UPDATE_UI, 30, NULL);
        return 0;

    case WM_TIMER:
        if (wParam == TIMER_AUTO_CLOSE) {
            ShowWindow(hwnd, SW_HIDE);
            DestroyWindow(hwnd);
            g_overlay_hwnd = NULL;
        }
        return 0;

    case WM_MOUSEMOVE: {
        POINT pt;
        GetCursorPos(&pt);
        ScreenToClient(hwnd, &pt);

        float dx = (float)(pt.x - PIE_CENTER_X);
        float dy = (float)(pt.y - PIE_CENTER_Y);

        float dist = sqrtf(dx * dx + dy * dy);
        if (dist < PIE_DEAD_ZONE) {
            g_highlighted_sector = -1;
            InvalidateRect(hwnd, NULL, TRUE);
            KillTimer(hwnd, TIMER_AUTO_CLOSE);
            SetTimer(hwnd, TIMER_AUTO_CLOSE, PIE_TIMEOUT_MS, NULL);
            g_start_time = GetTickCount();
            break;
        }

        float angle_deg = atan2f(dy, dx) * 180.0f / 3.14159f;
        int sector = GetSectorFromAngle(angle_deg);

        if (sector != g_highlighted_sector) {
            g_highlighted_sector = sector;
            InvalidateRect(hwnd, NULL, TRUE);
            KillTimer(hwnd, TIMER_AUTO_CLOSE);
            SetTimer(hwnd, TIMER_AUTO_CLOSE, PIE_TIMEOUT_MS, NULL);
            g_start_time = GetTickCount();
        }

        if (GetCapture() != hwnd)
            SetCapture(hwnd);
        break;
    }

    case WM_MOUSELEAVE:
        g_highlighted_sector = -1;
        ReleaseCapture();
        InvalidateRect(hwnd, NULL, TRUE);
        break;

    case WM_LBUTTONDOWN: {
        if (g_highlighted_sector >= 0) {
            const PieEffect* effects = NULL;
            int effect_count = GetEffectList(&effects);
            int idx = g_current_page * PIE_SECTOR_COUNT + g_highlighted_sector;
            if (idx < effect_count) {
                ApplySelectedEffect(effects[idx].matchName);
            }
        }
        ShowWindow(hwnd, SW_HIDE);
        DestroyWindow(hwnd);
        g_overlay_hwnd = NULL;
        return 0;
    }

    case WM_MOUSEWHEEL: {
        int delta = GET_WHEEL_DELTA_WPARAM(wParam);
        if (delta > 0 && g_current_page > 0)
            g_current_page--;
        else if (delta < 0 && g_current_page < PIE_PAGE_COUNT - 1)
            g_current_page++;
        InvalidateRect(hwnd, NULL, TRUE);
        KillTimer(hwnd, TIMER_AUTO_CLOSE);
        SetTimer(hwnd, TIMER_AUTO_CLOSE, PIE_TIMEOUT_MS, NULL);
        g_start_time = GetTickCount();
        return 0;
    }

    case WM_KEYDOWN:
        if (wParam == VK_ESCAPE) {
            ShowWindow(hwnd, SW_HIDE);
            DestroyWindow(hwnd);
            g_overlay_hwnd = NULL;
        }
        return 0;

    case WM_PAINT: {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);

        RECT client;
        GetClientRect(hwnd, &client);
        int w = client.right - client.left;
        int h = client.bottom - client.top;

        HDC memDC = CreateCompatibleDC(hdc);
        BITMAPV5HEADER bi = { 0 };
        bi.bV5Size = sizeof(BITMAPV5HEADER);
        bi.bV5Width = w;
        bi.bV5Height = h;
        bi.bV5Planes = 1;
        bi.bV5BitCount = 32;
        bi.bV5Compression = BI_BITFIELDS;
        bi.bV5RedMask = 0x00FF0000;
        bi.bV5GreenMask = 0x0000FF00;
        bi.bV5BlueMask = 0x000000FF;
        bi.bV5AlphaMask = 0xFF000000;

        void* bits = NULL;
        HBITMAP bmp = CreateDIBSection(memDC, (BITMAPINFO*)&bi, DIB_RGB_COLORS, &bits, NULL, 0);
        HBITMAP oldBmp = (HBITMAP)SelectObject(memDC, bmp);

        memset(bits, 0, w * h * 4);

        RenderPieMenu(memDC, w, h);

        BLENDFUNCTION blend = { AC_SRC_OVER, 0, 200, AC_SRC_ALPHA };
        POINT srcPos = { 0, 0 };
        SIZE size = { w, h };
        UpdateLayeredWindow(hwnd, hdc, NULL, &size, memDC, &srcPos, 0, &blend, ULW_ALPHA);

        SelectObject(memDC, oldBmp);
        DeleteObject(bmp);
        DeleteDC(memDC);

        EndPaint(hwnd, &ps);
        return 0;
    }

    case WM_DESTROY:
        g_overlay_hwnd = NULL;
        ReleaseCapture();
        KillTimer(hwnd, TIMER_AUTO_CLOSE);
        KillTimer(hwnd, TIMER_UPDATE_UI);
        return 0;
    }

    return DefWindowProc(hwnd, msg, wParam, lParam);
}

void RegisterPieOverlayClass(HINSTANCE hInstance)
{
    g_hInst = hInstance;

    WNDCLASSEX wc = { 0 };
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = PieOverlayProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.lpszClassName = PIE_WND_CLASS;
    RegisterClassEx(&wc);
}

void ShowPieOverlay(HWND parent_hwnd)
{
    if (g_overlay_hwnd) {
        DestroyWindow(g_overlay_hwnd);
        g_overlay_hwnd = NULL;
    }

    g_parent_hwnd = parent_hwnd;
    g_current_page = 0;
    g_highlighted_sector = -1;
    g_start_time = GetTickCount();

    RECT aeRect;
    GetWindowRect(parent_hwnd, &aeRect);
    int w = aeRect.right - aeRect.left;
    int h = aeRect.bottom - aeRect.top;

    g_overlay_hwnd = CreateWindowEx(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOPMOST,
        PIE_WND_CLASS,
        "WB Pie Menu",
        WS_POPUP,
        aeRect.left, aeRect.top, w, h,
        parent_hwnd, NULL, g_hInst, NULL);

    if (g_overlay_hwnd) {
        ShowWindow(g_overlay_hwnd, SW_SHOW);
        SetForegroundWindow(g_overlay_hwnd);
        SetFocus(g_overlay_hwnd);
    }
}

void DestroyPieOverlay()
{
    if (g_overlay_hwnd) {
        DestroyWindow(g_overlay_hwnd);
        g_overlay_hwnd = NULL;
    }
}
