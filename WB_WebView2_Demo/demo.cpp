#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <wrl.h>
#include <WebView2.h>
#include <shellapi.h>
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "oleaut32.lib")
#pragma comment(lib, "shell32.lib")

using namespace Microsoft::WRL;

#define WIN_W 600
#define WIN_H 600
#define WM_TRAYICON (WM_APP + 1)

static HWND      g_overlay = NULL;   // the floating layered window
static HWND      g_trayWnd = NULL;   // hidden window for tray icon
static HHOOK     g_hook = NULL;
static bool      g_visible = false;
static bool      g_running = true;
static NOTIFYICONDATAW g_nid = {0};
static ComPtr<ICoreWebView2Controller> g_controller;
static ComPtr<ICoreWebView2>           g_webview;
static wchar_t   g_htmlPath[MAX_PATH] = {0};

static void ToggleMenu() {
    g_visible = !g_visible;
    if (g_visible) {
        POINT pt; GetCursorPos(&pt);
        int x = pt.x - WIN_W / 2, y = pt.y - WIN_H / 2;
        SetWindowPos(g_overlay, HWND_TOPMOST, x, y, WIN_W, WIN_H, SWP_SHOWWINDOW);
        SetFocus(g_overlay);
        SetForegroundWindow(g_overlay);
    } else {
        ShowWindow(g_overlay, SW_HIDE);
    }
}

// ─── Tray hidden window ───
static LRESULT CALLBACK TrayWndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_DESTROY: PostQuitMessage(0); return 0;
        case WM_TRAYICON:
            if (lp == WM_RBUTTONUP) {
                HMENU menu = CreatePopupMenu();
                AppendMenuW(menu, MF_STRING, 100, g_visible ? L"Hide Menu" : L"Show Menu");
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
            if (lp == WM_LBUTTONUP) { ToggleMenu(); return 0; }
            return 0;
        case WM_COMMAND:
            if (wp == 101) { g_running = false; PostQuitMessage(0); }
            return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

static void ShowTrayIcon() {
    g_nid.cbSize = sizeof(NOTIFYICONDATAW);
    g_nid.hWnd = g_trayWnd;
    g_nid.uID = 1;
    g_nid.uFlags = NIF_ICON | NIF_TIP | NIF_MESSAGE;
    g_nid.uCallbackMessage = WM_TRAYICON;
    g_nid.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wcscpy_s(g_nid.szTip, L"WB Pie Menu");
    Shell_NotifyIconW(NIM_ADD, &g_nid);
}

static void HideTrayIcon() {
    Shell_NotifyIconW(NIM_DELETE, &g_nid);
}

// ─── Overlay window (WS_EX_LAYERED | WS_EX_TRANSPARENT) ───
static LRESULT CALLBACK OverlayWndProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
    switch (msg) {
        case WM_ACTIVATE:
            if (wp == WA_INACTIVE && g_visible) {
                g_visible = false; ShowWindow(hwnd, SW_HIDE);
            }
            return 0;
    }
    return DefWindowProcW(hwnd, msg, wp, lp);
}

static HWND CreateOverlayWindow(HINSTANCE hInst) {
    WNDCLASSEXW wc = { sizeof(WNDCLASSEXW) };
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = OverlayWndProc;
    wc.hInstance = hInst;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = NULL;
    wc.lpszClassName = L"WBOverlayClass";
    RegisterClassExW(&wc);
    HWND hwnd = CreateWindowExW(
        WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST | WS_EX_TOOLWINDOW,
        L"WBOverlayClass", NULL, WS_POPUP, 0, 0, WIN_W, WIN_H, NULL, NULL, hInst, NULL);
    SetLayeredWindowAttributes(hwnd, RGB(0,0,0), 200, LWA_ALPHA | LWA_COLORKEY);
    return hwnd;
}

// ─── Global hotkey ───
static LRESULT CALLBACK KeyboardHook(int code, WPARAM w, LPARAM l) {
    if (code >= 0 && w == WM_KEYDOWN) {
        KBDLLHOOKSTRUCT *ks = (KBDLLHOOKSTRUCT*)l;
        if (ks->vkCode == VK_SPACE && (GetAsyncKeyState(VK_CONTROL) & 0x8000) && (GetAsyncKeyState(VK_SHIFT) & 0x8000)) {
            ToggleMenu(); return 1;
        }
    }
    return CallNextHookEx(NULL, code, w, l);
}

// ─── WebView2 ───
static HRESULT WebViewMessageReceived(ICoreWebView2 *wv, ICoreWebView2WebMessageReceivedEventArgs *args) {
    LPWSTR json; args->TryGetWebMessageAsString(&json);
    if (json) { wprintf(L"JS -> C++: %s\n", json); CoTaskMemFree(json); }
    return S_OK;
}

static HRESULT InitWebView(HWND hwnd) {
    LPWSTR ver = NULL;
    HRESULT hr = GetAvailableCoreWebView2BrowserVersionString(NULL, &ver);
    if (FAILED(hr) || !ver) {
        MessageBoxA(NULL, "WebView2 Runtime not found.", "Error", MB_OK);
        return E_FAIL;
    }
    CoTaskMemFree(ver);
    hr = CreateCoreWebView2EnvironmentWithOptions(nullptr, nullptr, nullptr,
        Callback<ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler>(
            [hwnd](HRESULT, ICoreWebView2Environment *env) -> HRESULT {
                return env->CreateCoreWebView2Controller(hwnd,
                    Callback<ICoreWebView2CreateCoreWebView2ControllerCompletedHandler>(
                        [hwnd](HRESULT, ICoreWebView2Controller *ctl) -> HRESULT {
                            g_controller = ctl;
                            g_controller->get_CoreWebView2(&g_webview);
                            RECT r; GetClientRect(hwnd, &r);
                            g_controller->put_Bounds(r);
                            ComPtr<ICoreWebView2Controller2> ctl2;
                            if (SUCCEEDED(g_controller.As(&ctl2))) {
                                COREWEBVIEW2_COLOR clr = {0,0,0,0};
                                ctl2->put_DefaultBackgroundColor(clr);
                            }
                            ComPtr<ICoreWebView2Settings> s;
                            g_webview->get_Settings(&s);
                            if (s) { s->put_AreDevToolsEnabled(FALSE); s->put_AreDefaultContextMenusEnabled(FALSE); s->put_IsScriptEnabled(TRUE); s->put_IsWebMessageEnabled(TRUE); }
                            g_webview->add_WebMessageReceived(Callback<ICoreWebView2WebMessageReceivedEventHandler>(WebViewMessageReceived).Get(), NULL);
                            wchar_t url[MAX_PATH]; swprintf_s(url, L"file:///%s", g_htmlPath);
                            g_webview->Navigate(url);
                            return S_OK;
                        }).Get());
            }).Get());
    return hr;
}

// ─── Entry ───
int WINAPI WinMain(HINSTANCE hInst, HINSTANCE, LPSTR, int) {
    GetModuleFileNameW(NULL, g_htmlPath, MAX_PATH);
    wchar_t *p = wcsrchr(g_htmlPath, L'\\');
    if (p) { *(p+1) = 0; wcscat_s(g_htmlPath, L"pie_ui.html"); }

    OleInitialize(NULL);

    // Hidden tray window
    WNDCLASSEXW twc = { sizeof(WNDCLASSEXW) };
    twc.lpfnWndProc = TrayWndProc;
    twc.hInstance = hInst;
    twc.lpszClassName = L"WBTrayClass";
    RegisterClassExW(&twc);
    g_trayWnd = CreateWindowExW(0, L"WBTrayClass", L"WBTray", WS_POPUP, 0,0,0,0, NULL, NULL, hInst, NULL);

    // Overlay layered window
    g_overlay = CreateOverlayWindow(hInst);

    ShowTrayIcon();

    HRESULT hr = InitWebView(g_overlay);
    if (FAILED(hr)) { HideTrayIcon(); DestroyWindow(g_overlay); DestroyWindow(g_trayWnd); OleUninitialize(); return 1; }

    g_hook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardHook, hInst, 0);
    MSG msg;
    while (g_running && GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg); DispatchMessage(&msg);
    }
    if (g_hook) UnhookWindowsHookEx(g_hook);
    HideTrayIcon();
    if (g_controller) g_controller->Close();
    OleUninitialize();
    return 0;
}
