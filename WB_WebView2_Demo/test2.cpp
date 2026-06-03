#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "gdi32.lib")

#define WIN_W 400
#define WIN_H 400
#define HOTKEY_ID 1001

static HWND g_overlay = NULL;
static bool g_visible = false;

static void ToggleOverlay() {
    g_visible = !g_visible;
    if (g_visible) {
        POINT pt; GetCursorPos(&pt);
        int x = pt.x - WIN_W / 2, y = pt.y - WIN_H / 2;
        SetWindowPos(g_overlay, HWND_TOPMOST, x, y, WIN_W, WIN_H, SWP_SHOWWINDOW);
        SetForegroundWindow(g_overlay);
    } else {
        ShowWindow(g_overlay, SW_HIDE);
    }
}

static LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_HOTKEY:
            if (wp == HOTKEY_ID) { ToggleOverlay(); return 0; }
            break;
        case WM_PAINT: {
            PAINTSTRUCT ps; HDC dc = BeginPaint(hwnd, &ps);
            RECT r; GetClientRect(hwnd, &r);
            HBRUSH br = CreateSolidBrush(RGB(22, 22, 22));
            FillRect(dc, &r, br); DeleteObject(br);
            SetTextColor(dc, RGB(255,255,255));
            SetBkMode(dc, TRANSPARENT);
            DrawTextW(dc, L"Ctrl+Shift+Space works?", -1, &r, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
            EndPaint(hwnd, &ps); return 0;
        }
        case WM_ACTIVATE:
            if (wp == WA_INACTIVE && g_visible) { g_visible = false; ShowWindow(hwnd, SW_HIDE); }
            return 0;
        case WM_DESTROY: PostQuitMessage(0); return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW) };
    wc.lpfnWndProc = WndProc;
    wc.hInstance = hInst;
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName = L"TestOverlayClass";
    RegisterClassExW(&wc);

    // Hidden main window (to receive hotkey messages)
    HWND mainWnd = CreateWindowExW(0, L"TestOverlayClass", L"WB Pie Test",
        WS_OVERLAPPEDWINDOW, 0, 0, 300, 200, NULL, NULL, hInst, NULL);

    // Overlay popup (starts hidden)
    g_overlay = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        L"TestOverlayClass", NULL,
        WS_POPUP, 0, 0, WIN_W, WIN_H, NULL, NULL, hInst, NULL);

    // Register Ctrl+Shift+Space
    RegisterHotKey(mainWnd, HOTKEY_ID, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_SPACE);

    // Also register Ctrl+Shift+F1 as fallback
    RegisterHotKey(mainWnd, HOTKEY_ID + 1, MOD_CONTROL | MOD_SHIFT | MOD_NOREPEAT, VK_F1);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg); DispatchMessage(&msg);
    }

    UnregisterHotKey(mainWnd, HOTKEY_ID);
    UnregisterHotKey(mainWnd, HOTKEY_ID + 1);
    return 0;
}
