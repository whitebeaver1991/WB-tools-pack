#include "WheelOverlay.h"
#include "EffectData.h"
#include <commctrl.h>
#include <math.h>
#include <cwchar>

#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "user32.lib")

static const char* WHEEL_WND_CLASS = "WB_WheelOverlay";

static HWND g_wheel_hwnd = NULL;
static HWND g_wheel_parent = NULL;
static HINSTANCE g_wheel_hInst = NULL;

#define TIMER_WHEEL_CLOSE   2001
#define TIMER_WHEEL_UPDATE  2002

static int g_wheel_scroll_offset = 0;
static int g_wheel_highlight = -1;
static int g_wheel_total = 0;
static const PieEffect* g_wheel_effects = NULL;
static DWORD g_wheel_start = 0;

static void RenderWheelMenu(HDC hdc, int width, int height)
{
    HDC memDC = CreateCompatibleDC(hdc);
    HBITMAP bmp = CreateCompatibleBitmap(hdc, width, height);
    SelectObject(memDC, bmp);

    SetBkMode(memDC, TRANSPARENT);

    HBRUSH bgBrush = CreateSolidBrush(RGB(30, 30, 35));
    RECT bgRect = { 0, 0, width, height };
    FillRect(memDC, &bgRect, bgBrush);
    DeleteObject(bgBrush);

    HPEN borderPen = CreatePen(PS_SOLID, 1, RGB(60, 60, 65));
    HBRUSH noBrush = (HBRUSH)GetStockObject(NULL_BRUSH);
    SelectObject(memDC, borderPen);
    SelectObject(memDC, noBrush);
    RoundRect(memDC, 0, 0, width - 1, height - 1, 10, 10);
    DeleteObject(borderPen);

    HPEN linePen = CreatePen(PS_SOLID, 1, RGB(55, 55, 60));
    for (int v = 0; v < g_wheel_total; v++) {
        int x = v * WHEEL_ITEM_WIDTH;
        SelectObject(memDC, linePen);
        POINT pts[2] = { { x, 0 }, { x, height } };
        Polyline(memDC, pts, 2);
    }
    DeleteObject(linePen);

    int vis_start = g_wheel_scroll_offset;
    int vis_count = 5;
    if (vis_start + vis_count > g_wheel_total)
        vis_count = g_wheel_total - vis_start;
    if (vis_count < 0) vis_count = 0;

    int first_item_x = 0;
    for (int v = 0; v < vis_count; v++) {
        int idx = vis_start + v;
        if (idx >= g_wheel_total) break;

        int x = v * WHEEL_ITEM_WIDTH;

        if (idx == g_wheel_highlight) {
            HBRUSH hlBrush = CreateSolidBrush(RGB(50, 100, 200));
            RECT hlRect = { x, 0, x + WHEEL_ITEM_WIDTH, height };
            FillRect(memDC, &hlRect, hlBrush);
            DeleteObject(hlBrush);
        }

        SetTextColor(memDC, (idx == g_wheel_highlight) ? RGB(255, 255, 255) : RGB(200, 200, 200));
        HFONT font = CreateFontW(20, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
            DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
            ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
        HFONT oldFont = (HFONT)SelectObject(memDC, font);
        SetTextAlign(memDC, TA_CENTER | TA_BASELINE);
        int cx = x + WHEEL_ITEM_WIDTH / 2;
        const wchar_t* label = g_wheel_effects[idx].label;
        TextOutW(memDC, cx, height / 2 - 10, label, (int)wcslen(label));
        SelectObject(memDC, oldFont);
        DeleteObject(font);
    }

    wchar_t pos_text[32];
    swprintf_s(pos_text, L"%d / %d", g_wheel_highlight + 1, g_wheel_total);
    SetTextColor(memDC, RGB(120, 120, 130));
    HFONT infoFont = CreateFontW(12, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH, L"Microsoft YaHei");
    HFONT oldInfoFont = (HFONT)SelectObject(memDC, infoFont);
    SetTextAlign(memDC, TA_RIGHT | TA_BASELINE);
    TextOutW(memDC, width - 10, height - 18, pos_text, (int)wcslen(pos_text));
    SelectObject(memDC, oldInfoFont);
    DeleteObject(infoFont);

    BitBlt(hdc, 0, 0, width, height, memDC, 0, 0, SRCCOPY);

    DeleteObject(bmp);
    DeleteDC(memDC);
}

static LRESULT CALLBACK WheelOverlayProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    switch (msg) {

    case WM_CREATE:
        g_wheel_start = GetTickCount();
        SetTimer(hwnd, TIMER_WHEEL_CLOSE, WHEEL_TIMEOUT_MS, NULL);
        SetTimer(hwnd, TIMER_WHEEL_UPDATE, 30, NULL);
        return 0;

    case WM_TIMER:
        if (wParam == TIMER_WHEEL_CLOSE) {
            DestroyWindow(hwnd);
        }
        return 0;

    case WM_MOUSEMOVE: {
        POINT pt;
        GetCursorPos(&pt);
        ScreenToClient(hwnd, &pt);

        int col = pt.x / WHEEL_ITEM_WIDTH;
        if (col < 0) col = 0;
        if (col >= 5) col = 4;
        int actual_idx = g_wheel_scroll_offset + col;
        if (actual_idx >= g_wheel_total) {
            actual_idx = g_wheel_total - 1;
        }

        if (actual_idx != g_wheel_highlight) {
            g_wheel_highlight = actual_idx;
            InvalidateRect(hwnd, NULL, TRUE);
            KillTimer(hwnd, TIMER_WHEEL_CLOSE);
            SetTimer(hwnd, TIMER_WHEEL_CLOSE, WHEEL_TIMEOUT_MS, NULL);
            g_wheel_start = GetTickCount();
        }

        if (GetCapture() != hwnd)
            SetCapture(hwnd);
        break;
    }

    case WM_MOUSELEAVE:
        g_wheel_highlight = -1;
        ReleaseCapture();
        InvalidateRect(hwnd, NULL, TRUE);
        break;

    case WM_LBUTTONDOWN:
        if (g_wheel_highlight >= 0 && g_wheel_highlight < g_wheel_total) {
            ApplySelectedEffect(g_wheel_effects[g_wheel_highlight].matchName);
        }
        DestroyWindow(hwnd);
        return 0;

    case WM_MOUSEWHEEL: {
        int delta = GET_WHEEL_DELTA_WPARAM(wParam);
        if (delta < 0) {
            if (g_wheel_scroll_offset + 5 < g_wheel_total)
                g_wheel_scroll_offset++;
        } else {
            if (g_wheel_scroll_offset > 0)
                g_wheel_scroll_offset--;
        }
        InvalidateRect(hwnd, NULL, TRUE);
        KillTimer(hwnd, TIMER_WHEEL_CLOSE);
        SetTimer(hwnd, TIMER_WHEEL_CLOSE, WHEEL_TIMEOUT_MS, NULL);
        g_wheel_start = GetTickCount();
        return 0;
    }

    case WM_KEYDOWN:
        if (wParam == VK_ESCAPE) {
            DestroyWindow(hwnd);
        } else if (wParam == VK_LEFT) {
            if (g_wheel_scroll_offset > 0)
                g_wheel_scroll_offset--;
            InvalidateRect(hwnd, NULL, TRUE);
        } else if (wParam == VK_RIGHT) {
            if (g_wheel_scroll_offset + 5 < g_wheel_total)
                g_wheel_scroll_offset++;
            InvalidateRect(hwnd, NULL, TRUE);
        } else if (wParam == VK_RETURN || wParam == VK_SPACE) {
            int center = g_wheel_scroll_offset + 2;
            if (center < g_wheel_total) {
                ApplySelectedEffect(g_wheel_effects[center].matchName);
            }
            DestroyWindow(hwnd);
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

        RenderWheelMenu(memDC, w, h);

        BLENDFUNCTION blend = { AC_SRC_OVER, 0, 220, AC_SRC_ALPHA };
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
        g_wheel_hwnd = NULL;
        ReleaseCapture();
        KillTimer(hwnd, TIMER_WHEEL_CLOSE);
        KillTimer(hwnd, TIMER_WHEEL_UPDATE);
        return 0;
    }

    return DefWindowProc(hwnd, msg, wParam, lParam);
}

void RegisterWheelOverlayClass(HINSTANCE hInstance)
{
    g_wheel_hInst = hInstance;

    WNDCLASSEX wc = { 0 };
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WheelOverlayProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.lpszClassName = WHEEL_WND_CLASS;
    RegisterClassEx(&wc);
}

void ShowWheelOverlay(HWND parent_hwnd)
{
    if (g_wheel_hwnd) {
        DestroyWindow(g_wheel_hwnd);
        g_wheel_hwnd = NULL;
    }

    g_wheel_parent = parent_hwnd;

    int total = GetEffectList(&g_wheel_effects);
    g_wheel_total = total;
    g_wheel_scroll_offset = 0;
    g_wheel_highlight = total > 0 ? 0 : -1;
    g_wheel_start = GetTickCount();

    int w = 5 * WHEEL_ITEM_WIDTH;
    int h = WHEEL_BAR_HEIGHT;

    RECT aeRect;
    GetWindowRect(parent_hwnd, &aeRect);
    int aeW = aeRect.right - aeRect.left;
    int x = aeRect.left + (aeW - w) / 2;
    int y = aeRect.top + 40;

    g_wheel_hwnd = CreateWindowEx(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE | WS_EX_TOPMOST,
        WHEEL_WND_CLASS,
        "WB Wheel Menu",
        WS_POPUP,
        x, y, w, h,
        parent_hwnd, NULL, g_wheel_hInst, NULL);

    if (g_wheel_hwnd) {
        ShowWindow(g_wheel_hwnd, SW_SHOW);
        SetForegroundWindow(g_wheel_hwnd);
        SetFocus(g_wheel_hwnd);
    }
}

void DestroyWheelOverlay()
{
    if (g_wheel_hwnd) {
        DestroyWindow(g_wheel_hwnd);
        g_wheel_hwnd = NULL;
    }
}
