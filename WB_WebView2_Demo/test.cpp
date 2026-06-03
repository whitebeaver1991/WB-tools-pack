#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#pragma comment(lib, "shell32.lib")

#define WIN_W 400
#define WIN_H 400
#define WM_TRAYICON (WM_APP + 1)

static HWND g_overlay = NULL;
static HWND g_trayWnd = NULL;
static bool g_visible = false;
static bool g_running = true;
static NOTIFYICONDATAW g_nid = {0};

static void ToggleMenu() {
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

static LRESULT CALLBACK TrayWndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_DESTROY: PostQuitMessage(0); return 0;
        case WM_TRAYICON:
            if (lp == WM_LBUTTONUP || lp == WM_RBUTTONUP) {
                HMENU menu = CreatePopupMenu();
                AppendMenuW(menu, MF_STRING, 100, g_visible ? L"Hide" : L"Show");
                AppendMenuW(menu, MF_SEPARATOR, 0, NULL);
                AppendMenuW(menu, MF_STRING, 101, L"Exit");
                POINT pt; GetCursorPos(&pt);
                SetForegroundWindow(hwnd);
                int cmd = TrackPopupMenu(menu, TPM_RETURNCMD | TPM_NONOTIFY, pt.x, pt.y, 0, hwnd, NULL);
                DestroyMenu(menu);
                if (cmd == 100) ToggleMenu();
                else if (cmd == 101) { g_running = false; PostQuitMessage(0); }
                return 0;
            }
            return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

// ─── Overlay: simple red rectangle ───
static LRESULT CALLBACK OverlayWndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC dc = BeginPaint(hwnd, &ps);
            RECT r; GetClientRect(hwnd, &r);
            HBRUSH br = CreateSolidBrush(RGB(200, 50, 50));
            FillRect(dc, &r, br);
            DeleteObject(br);
            // Text
            SetTextColor(dc, RGB(255,255,255));
            SetBkMode(dc, TRANSPARENT);
            DrawTextW(dc, L"Pie Menu Overlay", -1, &r, DT_CENTER | DT_VCENTER | DT_SINGLELINE);
            EndPaint(hwnd, &ps);
            return 0;
        }
        case WM_ACTIVATE:
            if (wp == WA_INACTIVE && g_visible) {
                g_visible = false; ShowWindow(hwnd, SW_HIDE);
            }
            return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    // Tray window
    WNDCLASSEXW twc = { sizeof(WNDCLASSEXW) };
    twc.lpfnWndProc = TrayWndProc;
    twc.hInstance = hInst;
    twc.lpszClassName = L"WBTrayClass";
    RegisterClassExW(&twc);
    g_trayWnd = CreateWindowExW(0, L"WBTrayClass", L"WBTray", WS_POPUP, 0,0,0,0, NULL, NULL, hInst, NULL);

    // Overlay window (no transparency, simple popup)
    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW) };
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = OverlayWndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
    wc.lpszClassName = L"WBOverlayClass";
    RegisterClassExW(&wc);
    g_overlay = CreateWindowExW(
        WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        L"WBOverlayClass", L"WB Pie Menu",
        WS_POPUP, 0, 0, WIN_W, WIN_H, NULL, NULL, hInst, NULL);

    // Tray icon
    g_nid.cbSize = sizeof(NOTIFYICONDATAW);
    g_nid.hWnd = g_trayWnd;
    g_nid.uID = 1;
    g_nid.uFlags = NIF_ICON | NIF_TIP | NIF_MESSAGE;
    g_nid.uCallbackMessage = WM_TRAYICON;
    g_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wcscpy_s(g_nid.szTip, L"WB Pie Menu (TEST)");
    Shell_NotifyIconW(NIM_ADD, &g_nid);

    MSG msg;
    while (g_running && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg); DispatchMessage(&msg);
    }
    Shell_NotifyIconW(NIM_DELETE, &g_nid);
    return 0;
}
